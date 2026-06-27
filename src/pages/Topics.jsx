import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.json'

const TOPIC_EMOJI = {
  'ACTIVE AND PASSIVE VOICE': '🔄',
  'AGREEMENT OF SUBJECT AND VERB': '🤝',
  'ANTONYMS': '↔️',
  'ARTICLES': '📰',
  'CONDITIONALS': '🔀',
  'CONJUNCTIONS': '🔗',
  'CORRECTION OF SENTENCES': '✏️',
  'CORRELATIVE CONJUNCTIONS': '🔗',
  'DEGREES OF COMPARISON': '📊',
  'DIFFERENT PARTS OF SPEECH': '🏷️',
  'ERROR IDENTIFICATION': '🔍',
  'EXPANSION OF COMMON ABBREVIATIONS': '🔤',
  'FOREIGN WORDS AND PHRASES': '🌍',
  'GENDER': '⚧️',
  'GERUNDS AND INFINITIVES': '📝',
  'IDIOMS AND PHRASES': '💬',
  'KINDS OF SENTENCES': '📋',
  'ONE WORD SUBSTITUTES': '💡',
  'ONE WORD SUBSTITUTION': '💡',
  'PHRASAL VERBS': '🔧',
  'PREPOSITIONS': '📍',
  'PRONOUNS': '👤',
  'QUESTION TAGS': '❓',
  'SINGULAR & PLURAL, COLLECTIVE NOUNS': '👥',
  'SPELLING TEST': '🔡',
  'SYNONYMS': '🟰',
  'TENSES': '⏰',
  'TYPES OF SENTENCES': '📋',
  'VOCABULARY': '📚',
  'WORD FORMATION (PREFIX/SUFFIX)': '🧩',
}

export default function Topics() {
  const topicStats = useMemo(() => {
    const map = {}
    questions.forEach(q => {
      const t = q.topic || 'Other'
      if (!map[t]) map[t] = 0
      map[t]++
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-1">Practice by Topic</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
        {topicStats.length} topics · {questions.length} questions across all papers
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {topicStats.map(([topic, count]) => (
          <div key={topic} className="card rounded-xl p-4 flex flex-col gap-3">
            <div>
              <div className="text-lg mb-1">{TOPIC_EMOJI[topic] || '📌'}</div>
              <div className="font-semibold text-sm leading-snug">{topic}</div>
              <div className="text-xs mt-1.5" style={{ color: 'var(--text2)' }}>
                {count} question{count !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/quiz?topic=${encodeURIComponent(topic)}&mode=practice`}
                className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                Practice
              </Link>
              <Link
                to={`/quiz?topic=${encodeURIComponent(topic)}&mode=timed`}
                className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                Timed
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
