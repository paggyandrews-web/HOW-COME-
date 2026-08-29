import { useState, useEffect, useMemo, useCallback } from 'react'
import { useResults } from './useResults'
import { DEFAULT_REVISION_GAPS, nextRevisionGap } from '../utils/revisionSchedule'

/**
 * Per-paper practice status, derived entirely from existing quiz results
 * (no new storage/schema). For every paper:
 *   - status: 'not-started' | 'in-progress' | 'completed'
 *   - attempted / total: unique questions answered at least once vs paper size
 *   - score: % correct on the most recent attempt of each question (once completed)
 *   - lastAttemptDate: ISO date of the most recent attempt touching this paper
 *   - revisionsDone: how many distinct days this paper was practiced again
 *     AFTER it was first fully completed — i.e. which revision stage you're on
 *   - dueForRevision: completed AND lastAttemptDate is old enough for the
 *     current stage's gap (see revisionGaps)
 *
 * revisionGaps is the user-configurable 3-stage schedule, and revisionEnabled
 * is the master on/off switch for the whole feature (Profile → Settings →
 * Revision schedule, see utils/revisionSchedule.js) — callers pass the
 * current preferences in; default to DEFAULT_REVISION_GAPS / enabled for any
 * caller that doesn't. When disabled, revisionsDone stays 0 and
 * dueForRevision stays false for every paper — the tracking work is skipped
 * entirely rather than computed and hidden.
 */
export function usePaperProgress(papers, questions, revisionGaps = DEFAULT_REVISION_GAPS, revisionEnabled = true) {
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
        revisionsDone: 0,
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

      // Walk every past quiz session in order to find, per paper, the date it
      // was FIRST fully completed, then count the distinct days it was
      // practiced again after that — that count is "which revision stage
      // you're on", used below to pick the right gap out of revisionGaps.
      // Skipped entirely when the feature is switched off — no point paying
      // for a computation whose result is never read.
      const revisionDaysByPaper = {} // paperId -> Set of 'YYYY-MM-DD' seen after completion
      if (revisionEnabled) {
        const seenByPaper = {} // paperId -> Set of question ids seen so far
        const firstCompletionDate = {} // paperId -> date string
        sorted.forEach(r => {
          const day = (r.date || '').slice(0, 10)
          const touchedToday = new Set()
          ;(r.answers || []).forEach(({ id }) => {
            const paperId = id && paperIdByQuestionId[id]
            if (!paperId) return
            if (!seenByPaper[paperId]) seenByPaper[paperId] = new Set()
            seenByPaper[paperId].add(id)
            touchedToday.add(paperId)
            if (!firstCompletionDate[paperId] &&
                totalByPaper[paperId] &&
                seenByPaper[paperId].size >= totalByPaper[paperId]) {
              firstCompletionDate[paperId] = r.date
            }
          })
          touchedToday.forEach(paperId => {
            if (firstCompletionDate[paperId] && r.date > firstCompletionDate[paperId]) {
              if (!revisionDaysByPaper[paperId]) revisionDaysByPaper[paperId] = new Set()
              revisionDaysByPaper[paperId].add(day)
            }
          })
        })
      }

      const now = Date.now()
      Object.entries(map).forEach(([paperId, entry]) => {
        if (entry.attempted === 0) {
          entry.status = 'not-started'
        } else if (entry.total > 0 && entry.attempted >= entry.total) {
          entry.status = 'completed'
          entry.score = Math.round((entry.correct / entry.attempted) * 100)
          if (revisionEnabled) {
            entry.revisionsDone = revisionDaysByPaper[paperId]?.size || 0
            if (entry.lastAttemptDate) {
              const days = (now - new Date(entry.lastAttemptDate).getTime()) / 86400000
              entry.dueForRevision = days >= nextRevisionGap(revisionGaps, entry.revisionsDone)
            }
          }
        } else {
          entry.status = 'in-progress'
        }
      })
    }

    return map
  }, [results, papers, totalByPaper, paperIdByQuestionId, revisionGaps, revisionEnabled])

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
