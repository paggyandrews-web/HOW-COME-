import { useAuth } from '../contexts/AuthContext'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

const STORAGE_KEY = 'cs-quiz-results'

export function useResults() {
  const { user } = useAuth()

  async function saveResult(questions, answers, mode) {
    const answerData = questions.map((q, i) => ({
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
    // Registered users: try Firestore first (most complete)
    if (user) {
      try {
        const snap = await getDocs(collection(db, 'results', user.uid, 'quizzes'))
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

  return { saveResult, getAllResults, getTopicStats }
}
