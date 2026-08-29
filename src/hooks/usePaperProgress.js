import { useState, useEffect, useMemo, useCallback } from 'react'
import { useResults } from './useResults'
import { DEFAULT_REVISION_DAYS } from '../utils/revisionDays'

/**
 * Per-paper practice status, derived entirely from existing quiz results
 * (no new storage/schema). For every paper:
 *   - status: 'not-started' | 'in-progress' | 'completed'
 *   - attempted / total: unique questions answered at least once vs paper size
 *   - score: % correct on the most recent attempt of each question (once completed)
 *   - lastAttemptDate: ISO date of the most recent attempt touching this paper
 *   - dueForRevision: completed AND lastAttemptDate is revisionDays+ days old
 *
 * revisionDays is user-configurable (Profile → Settings → Revision reminder,
 * see utils/revisionDays.js) — callers pass the current preference in;
 * defaults to DEFAULT_REVISION_DAYS for any caller that doesn't.
 */
export function usePaperProgress(papers, questions, revisionDays = DEFAULT_REVISION_DAYS) {
  const { getAllResults } = useResults()
  const [results, setResults] = useState(null) // null = still loading
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    getAllResults().then(r => { if (!cancelled) setResults(r) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  const paperIdByQuestionId = useMemo(() => {
    const map = {}
    questions.forEach(q => { map[q.id] = q.paperId })
    return map
  }, [questions])

  const totalByPaper = useMemo(() => {
    const map = {}
    questions.forEach(q => { map[q.paperId] = (map[q.paperId] || 0) + 1 })
    return map
  }, [questions])

  const progress = useMemo(() => {
    const map = {}
    papers.forEach(p => {
      map[p.id] = {
        total: totalByPaper[p.id] || 0,
        attempted: 0,
        correct: 0,
        score: null,
        lastAttemptDate: null,
        status: 'not-started',
        dueForRevision: false,
      }
    })

    if (results && results.length) {
      // Most recent outcome per question id (mirrors useResults.getMistakeIds logic).
      const lastOutcome = {}
      const sorted = [...results].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      sorted.forEach(r => {
        (r.answers || []).forEach(({ id, correct }) => {
          if (id) lastOutcome[id] = { correct, date: r.date || '' }
        })
      })

      Object.entries(lastOutcome).forEach(([qid, { correct, date }]) => {
        const paperId = paperIdByQuestionId[qid]
        const entry = paperId && map[paperId]
        if (!entry) return
        entry.attempted += 1
        if (correct) entry.correct += 1
        if (!entry.lastAttemptDate || date > entry.lastAttemptDate) entry.lastAttemptDate = date
      })

      const now = Date.now()
      Object.values(map).forEach(entry => {
        if (entry.attempted === 0) {
          entry.status = 'not-started'
        } else if (entry.total > 0 && entry.attempted >= entry.total) {
          entry.status = 'completed'
          entry.score = Math.round((entry.correct / entry.attempted) * 100)
          if (entry.lastAttemptDate) {
            const days = (now - new Date(entry.lastAttemptDate).getTime()) / 86400000
            entry.dueForRevision = days >= revisionDays
          }
        } else {
          entry.status = 'in-progress'
        }
      })
    }

    return map
  }, [results, papers, totalByPaper, paperIdByQuestionId, revisionDays])

  const summary = useMemo(() => {
    const vals = Object.values(progress)
    return {
      total: vals.length,
      notStarted: vals.filter(v => v.status === 'not-started').length,
      inProgress: vals.filter(v => v.status === 'in-progress').length,
      completed: vals.filter(v => v.status === 'completed').length,
      dueForRevision: vals.filter(v => v.dueForRevision).length,
    }
  }, [progress])

  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  return { progress, loading: results === null, summary, refresh }
}
