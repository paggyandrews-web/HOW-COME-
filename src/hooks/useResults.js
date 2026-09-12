import { useAuth } from '../contexts/AuthContext'
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase/config'

const STORAGE_KEY = 'cs-quiz-results'
const RESULTS_LIMIT = 50 // only read the most recent N quizzes (keeps Firestore reads bounded as history grows)
const MISTAKES_LIMIT = 50 // retry pool holds only the N most recently missed questions

export function useResults() {
  const { user } = useAuth()

  async function saveResult(questions, answers, mode) {
    const answerData = questions.map((q, i) => ({
      id: q.id,
      topic: q.topic || 'General',
      correct: answers[i] === q.correctAnswer,
    }))

    const result = {
      date: new Date().toISOString(),
      mode,
      total: questions.length,
      score: answerData.filter(a => a.correct).length,
      answers: answerData,
    }

    // Always save to localStorage (works for both guest and registered)
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      existing.push(result)
      if (existing.length > 300) existing.splice(0, existing.length - 300)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    } catch (e) {
      console.error('localStorage save failed', e)
    }

    // Also save to Firestore if logged in (permanent, cross-device)
    if (user) {
      try {
        await addDoc(collection(db, 'results', user.uid, 'quizzes'), result)
      } catch (e) {
        console.error('Firestore save failed', e)
      }
    }
  }

  async function getAllResults() {
    // localStorage is always read first — saveResult writes here
    // synchronously, before the (unawaited) Firestore write even starts, so
    // it's never behind. It's the fallback for guests, and for registered
    // users it's also the safety net against a real race: finishing a quiz
    // and immediately navigating back to a papers list calls saveResult
    // (fire-and-forget) and then reads results right away, often before the
    // Firestore addDoc() has round-tripped. Trusting Firestore alone in that
    // window used to make a just-completed paper flash back to "not
    // started"/"in progress" until the write eventually landed.
    let local = []
    try {
      local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch (e) {
      local = []
    }

    if (!user) return local

    // Registered users: merge in Firestore (most recent RESULTS_LIMIT
    // quizzes, for cross-device history) rather than trusting it
    // exclusively. Dedupe on `date` — saveResult stamps one ISO timestamp
    // per result and writes that same object to both stores, so it's a
    // reliable key.
    try {
      const q = query(
        collection(db, 'results', user.uid, 'quizzes'),
        orderBy('date', 'desc'),
        limit(RESULTS_LIMIT)
      )
      const snap = await getDocs(q)
      const byDate = new Map()
      snap.docs.forEach(d => {
        const data = d.data()
        if (data?.date) byDate.set(data.date, data)
      })
      local.forEach(r => {
        if (r?.date && !byDate.has(r.date)) byDate.set(r.date, r)
      })
      return [...byDate.values()]
    } catch (e) {
      console.error('Firestore read failed', e)
      return local
    }
  }

  function getTopicStats(results) {
    const stats = {}
    results.forEach(result => {
      result.answers.forEach(({ topic, correct }) => {
        if (!stats[topic]) stats[topic] = { correct: 0, total: 0 }
        stats[topic].total++
        if (correct) stats[topic].correct++
      })
    })
    return Object.entries(stats)
      .map(([topic, { correct, total }]) => ({
        topic,
        correct,
        total,
        pct: Math.round((correct / total) * 100),
      }))
      .sort((a, b) => a.pct - b.pct) // weakest first
  }

  // Question IDs whose MOST RECENT attempt was wrong, sorted most-recently-
  // missed first. Answering a question correctly later still removes it from
  // the list. Pass { cap: MISTAKES_LIMIT } to get the bounded retry pool
  // (default — the cap stops it growing without bound, so old mistakes don't
  // crowd out what you just got wrong); pass { cap: null } for the full,
  // uncapped list so the UI can show how many are waiting behind the cap.
  function getMistakeIds(results, { cap = MISTAKES_LIMIT } = {}) {
    const lastOutcome = {}
    const sorted = [...results].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    sorted.forEach(result => {
      (result.answers || []).forEach(({ id, correct }) => {
        if (id) lastOutcome[id] = { correct, date: result.date || '' }
      })
    })
    const allWrong = Object.entries(lastOutcome)
      .filter(([, v]) => !v.correct)
      .sort((a, b) => b[1].date.localeCompare(a[1].date)) // most recently missed first
      .map(([id]) => id)
    return cap ? allWrong.slice(0, cap) : allWrong
  }

  return { saveResult, getAllResults, getTopicStats, getMistakeIds }
}
