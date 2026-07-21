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
    // Registered users: try Firestore first (most recent RESULTS_LIMIT quizzes)
    if (user) {
      try {
        const q = query(
          collection(db, 'results', user.uid, 'quizzes'),
          orderBy('date', 'desc'),
          limit(RESULTS_LIMIT)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          return snap.docs.map(d => d.data())
        }
      } catch (e) {
        console.error('Firestore read failed', e)
      }
    }

    // Guests (or fallback): localStorage
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch (e) {
      return []
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

  // Question IDs whose MOST RECENT attempt was wrong, capped at the
  // MISTAKES_LIMIT most recently missed. Answering a question correctly later
  // still removes it from the list; the cap only stops the retry pool growing
  // without bound, so old mistakes don't crowd out what you just got wrong.
  function getMistakeIds(results) {
    const lastOutcome = {}
    const sorted = [...results].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    sorted.forEach(result => {
      (result.answers || []).forEach(({ id, correct }) => {
        if (id) lastOutcome[id] = { correct, date: result.date || '' }
      })
    })
    return Object.entries(lastOutcome)
      .filter(([, v]) => !v.correct)
      .sort((a, b) => b[1].date.localeCompare(a[1].date)) // most recently missed first
      .slice(0, MISTAKES_LIMIT)
      .map(([id]) => id)
  }

  return { saveResult, getAllResults, getTopicStats, getMistakeIds }
}
