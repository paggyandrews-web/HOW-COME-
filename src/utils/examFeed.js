// ── Exam calendar feed ─────────────────────────────────────────────────
//
// The calendar shown in the app = exams.json (bundled with the app)
//                                 + rows from the Google Sheet (live).
//
// The sheet is how new PSC exam programmes get added without touching code.
// A sheet row with the same id as an exams.json entry replaces it, so a
// postponed / cancelled exam already in exams.json can be corrected from the
// sheet too.
//
// The last good copy of the sheet is kept in localStorage, so the calendar
// still works offline and appears instantly on the next open. If the sheet
// can't be reached, the app quietly falls back to that copy (or exams.json).

import { useEffect, useState } from 'react'
import bundled from '../data/exams.json'
import { EXAM_SHEET_CSV_URL } from '../data/examSheet'

const CACHE_KEY = 'hc-exam-sheet-v1'

// ── CSV parsing ────────────────────────────────────────────────────────
// Handles quoted fields, commas and line breaks inside quotes, and "" escapes
// — which is exactly what Google Sheets produces.
export function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

// Sheet headings can be written in plain words ("Exam Date", "Post Name",
// "Category No.") — they're matched loosely, ignoring case and punctuation.
const HEADER_MAP = {
  id: 'id',
  sl: 'slNo', slno: 'slNo', serialno: 'slNo',
  date: 'date', examdate: 'date', testdate: 'date',
  time: 'time', examtime: 'time',
  catno: 'catNo', cat: 'catNo', category: 'catNo', categoryno: 'catNo',
  categorynumber: 'catNo', categorycode: 'catNo',
  name: 'name', post: 'name', postname: 'name', nameofpost: 'name',
  dept: 'dept', department: 'dept',
  scope: 'scope', district: 'scope',
  mode: 'mode', exammode: 'mode',
  admitcardfrom: 'admissionFrom', admissionfrom: 'admissionFrom',
  admissionticketfrom: 'admissionFrom', admitcard: 'admissionFrom', hallticketfrom: 'admissionFrom',
  confirmby: 'confirmBy', confirmationby: 'confirmBy', confirmationlastdate: 'confirmBy',
  confirmationdate: 'confirmBy', lastdatetoconfirm: 'confirmBy', confirmbefore: 'confirmBy',
  confirmtime: 'confirmTime',
  candidates: 'candidates', totalcandidates: 'candidates', noofcandidates: 'candidates',
  medium: 'medium',
  duration: 'duration',
  cancelled: 'cancelled', canceled: 'cancelled', cancel: 'cancelled',
  cancellednote: 'cancelledNote', cancelnote: 'cancelledNote', cancelreason: 'cancelledNote',
  cancelledreason: 'cancelledNote',
}

const normHeader = h => h.toLowerCase().replace(/[^a-z]/g, '')

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
const pad = n => String(n).padStart(2, '0')

// Accepts 2026-11-14, 14/11/2026, 14-11-2026, 14.11.2026 and 14-Nov-2026.
// Numeric dates are always read DAY first (Indian / PSC style).
export function parseDate(raw) {
  const s = (raw || '').trim()
  if (!s) return null
  let y, m, d, r
  if ((r = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/))) { y = +r[1]; m = +r[2]; d = +r[3] }
  else if ((r = s.match(/^(\d{1,2})[-/.\s](\d{1,2})[-/.\s](\d{2}|\d{4})$/))) { d = +r[1]; m = +r[2]; y = +r[3] }
  else if ((r = s.match(/^(\d{1,2})[-/.\s]*([a-z]{3})[a-z]*[-/.,\s]*(\d{2}|\d{4})$/i))) {
    d = +r[1]; m = MONTHS[r[2].toLowerCase()]; y = +r[3]
  } else return null
  if (y < 100) y += 2000
  if (!m || m > 12 || d < 1 || d > 31) return null
  return `${y}-${pad(m)}-${pad(d)}`
}

// Accepts 07:00, 7:00, 7.00 AM, 1:30 PM, 13:30.
export function parseTime(raw) {
  const s = (raw || '').trim().toLowerCase()
  if (!s) return null
  const r = s.match(/^(\d{1,2})(?:[:.](\d{2}))?(?:[:.]\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?$/)
  if (!r) return null
  let h = +r[1]; const min = +(r[2] || 0)
  const ap = r[3] ? r[3][0] : null
  if (ap === 'p' && h < 12) h += 12
  if (ap === 'a' && h === 12) h = 0
  if (h > 23 || min > 59) return null
  return `${pad(h)}:${pad(min)}`
}

function normMode(raw) {
  const m = (raw || '').trim()
  const l = m.toLowerCase().replace(/\s+/g, ' ')
  if (l === 'omr') return 'OMR'
  if (l === 'online') return 'Online'
  if (/^(online|omr) ?(\/|or) ?(online|omr)$/.test(l)) return 'Online / OMR'
  return m
}

const slug = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const isYes = s => /^(y|yes|true|1|cancelled|canceled|x|✓|✔)$/i.test((s || '').trim())

// Turns the sheet's CSV text into exam objects in the same shape as exams.json.
// Rows with no valid date, no post name, or a first cell starting with "#"
// (example / note rows) are skipped.
export function sheetToExams(csvText) {
  const rows = parseCSV(csvText.replace(/^﻿/, ''))
  const headerIdx = rows.findIndex(r => r.some(c => HEADER_MAP[normHeader(c)] === 'date'))
  if (headerIdx === -1) return []
  const fields = rows[headerIdx].map(h => HEADER_MAP[normHeader(h)] || null)

  const out = []
  const seen = new Map()
  const perMonth = {}

  for (const r of rows.slice(headerIdx + 1)) {
    if (!r.length || (r[0] || '').trim().startsWith('#')) continue
    const raw = {}
    fields.forEach((f, i) => { if (f && r[i] != null && r[i].trim() !== '') raw[f] = r[i].trim() })

    const date = parseDate(raw.date)
    if (!date || !raw.name) continue

    const e = {
      catNo: raw.catNo || '',
      name: raw.name,
      dept: raw.dept || '',
      scope: raw.scope || 'Statewide',
      date,
      mode: normMode(raw.mode),
    }
    const time = parseTime(raw.time); if (time) e.time = time
    const adm = parseDate(raw.admissionFrom); if (adm) e.admissionFrom = adm
    const cb = parseDate(raw.confirmBy); if (cb) e.confirmBy = cb
    const ct = parseTime(raw.confirmTime); if (ct) e.confirmTime = ct
    else if (cb) e.confirmTime = '23:59'
    const cand = parseInt((raw.candidates || '').replace(/[^\d]/g, ''), 10)
    if (cand > 0) e.candidates = cand
    if (raw.medium) e.medium = raw.medium
    if (raw.duration) e.duration = raw.duration
    if (isYes(raw.cancelled)) {
      e.cancelled = true
      if (raw.cancelledNote) e.cancelledNote = raw.cancelledNote
    }

    const month = date.slice(0, 7)
    perMonth[month] = (perMonth[month] || 0) + 1
    const sl = parseInt(raw.slNo, 10)
    e.slNo = sl > 0 ? sl : perMonth[month]

    // A stable id lets students' saved (bookmarked) exams survive sheet edits.
    let id = raw.id || `s-${date}-${slug(e.catNo) || 'na'}-${slug(e.scope)}`
    const n = seen.get(id) || 0
    seen.set(id, n + 1)
    if (n) id = `${id}-${n + 1}`
    e.id = id

    out.push(e)
  }
  return out
}

function merge(sheetRows) {
  if (!sheetRows || !sheetRows.length) return bundled
  const byId = new Map(sheetRows.map(e => [e.id, e]))
  const merged = bundled.map(e => byId.get(e.id) || e)
  const bundledIds = new Set(bundled.map(e => e.id))
  sheetRows.forEach(e => { if (!bundledIds.has(e.id)) merged.push(e) })
  return merged
}

// ── Shared store (one fetch per app session, shared by every page) ─────
function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    return c && Array.isArray(c.rows) && c.url === EXAM_SHEET_CSV_URL ? c.rows : null
  } catch { return null }
}

const cached = EXAM_SHEET_CSV_URL ? readCache() : null
let state = {
  exams: merge(cached),
  // "ready" = safe to treat the list as complete (e.g. to clean up saved ids
  // that no longer exist). False only while a first-ever sheet load is pending.
  ready: !EXAM_SHEET_CSV_URL || !!cached,
}
const listeners = new Set()
let started = false

function setState(next) {
  state = next
  listeners.forEach(fn => fn(state))
}

function startFetch() {
  if (started || !EXAM_SHEET_CSV_URL) return
  started = true
  const sep = EXAM_SHEET_CSV_URL.includes('?') ? '&' : '?'
  fetch(`${EXAM_SHEET_CSV_URL}${sep}_=${Date.now()}`, { cache: 'no-store' })
    .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.text() })
    .then(text => {
      // A login / error page instead of CSV means the sheet isn't published.
      if (/^\s*</.test(text)) throw new Error('Sheet is not published as CSV')
      const rows = sheetToExams(text)
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ url: EXAM_SHEET_CSV_URL, at: Date.now(), rows })) } catch {}
      setState({ exams: merge(rows), ready: true })
    })
    .catch(err => {
      console.warn('[exam sheet] could not load, using saved copy:', err.message)
      // Keep whatever we already show. Not "ready" if we never had sheet data,
      // so saved exams from the sheet are not wrongly removed while offline.
      setState({ ...state })
    })
}

export function useExams() {
  const [s, setS] = useState(state)
  useEffect(() => {
    listeners.add(setS)
    setS(state)
    startFetch()
    return () => listeners.delete(setS)
  }, [])
  return s
}
