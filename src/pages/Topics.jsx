import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.json'

// Official Kerala PSC English Syllabus — in order
const GRAMMAR_TOPICS = [
  { name: 'Types of Sentences',       emoji: '📋' },
  { name: 'Parts of Speech',          emoji: '🏷️' },
  { name: 'Subject-Verb Agreement',   emoji: '🤝' },
  { name: 'Articles',                 emoji: '📰' },
  { name: 'Auxiliary Verbs',          emoji: '⚙️' },
  { name: 'Question Tags',            emoji: '❓' },
  { name: 'Infinitive and Gerunds',   emoji: '📝' },
  { name: 'Tenses',                   emoji: '⏰' },
  { name: 'Conditionals',             emoji: '🔀' },
  { name: 'Prepositions',             emoji: '📍' },
  { name: 'Correlatives',             emoji: '🔗' },
  { name: 'Direct and Indirect Speech', emoji: '💬' },
  { name: 'Active and Passive Voice', emoji: '🔄' },
  { name: 'Correction of Sentences',  emoji: '✏️' },
  { name: 'Degrees of Comparison',    emoji: '📊' },
]

const VOCABULARY_TOPICS = [
  { name: 'Singular and Plural',        emoji: '👥' },
  { name: 'Word Formation',             emoji: '🧩' },
  { name: 'Compound Words',             emoji: '🔤' },
  { name: 'Synonyms',                   emoji: '🟰' },
  { name: 'Antonyms',                   emoji: '↔️' },
  { name: 'Phrasal Verbs',              emoji: '🔧' },
  { name: 'Foreign Words and Phrases',  emoji: '🌍' },
  { name: 'One Word Substitutes',       emoji: '💡' },
  { name: 'Words Often Confused',       emoji: '🤔' },
  { name: 'Spelling',                   emoji: '🔡' },
  { name: 'Idioms',                     emoji: '🗣️' },
  { name: 'Abbreviations',              emoji: '🔠' },
]

function TopicCard({ topic, count }) {
  return (
    <div className="card rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg shrink-0">{topic.emoji}</span>
        <span className="font-semibold text-sm leading-snug flex-1 truncate">{topic.name}</span>
        <span
          className="shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
          style={{ width: 26, height: 26, background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          {count}
        </span>
      </div>
      <div className="flex gap-2">
        <Link
          to={'/quiz?topic=' + encodeURIComponent(topic.name) + '&mode=practice'}
          className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)', touchAction: 'manipulation' }}
        >
          Practice
        </Link>
        <Link
          to={'/quiz?topic=' + encodeURIComponent(topic.name) + '&mode=timed'}
          className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', touchAction: 'manipulation' }}
        >
          Timed
        </Link>
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle, color }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="px-3 py-1 rounded-full text-xs font-bold shrink-0"
        style={{ background: color, color: 'white' }}
      >
        {title}
      </div>
      <div className="text-xs shrink-0" style={{ color: 'var(--text2)' }}>{subtitle}</div>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

export default function Topics() {
  const countMap = useMemo(() => {
    const map = {}
    questions.forEach(function(q) {
      if (q.topic) map[q.topic] = (map[q.topic] || 0) + 1
    })
    return map
  }, [])

  const grammarTotal = GRAMMAR_TOPICS.reduce(function(s, t) { return s + (countMap[t.name] || 0) }, 0)
  const vocabTotal   = VOCABULARY_TOPICS.reduce(function(s, t) { return s + (countMap[t.name] || 0) }, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-1">Practice by Topic</h1>
      <p className="text-sm mb-7" style={{ color: 'var(--text2)' }}>
        27 topics · {questions.length} questions · Official Kerala PSC English Syllabus
      </p>

      <div className="mb-8">
        <SectionHeader
          title="I. English Grammar"
          subtitle={'15 topics · ' + grammarTotal + ' questions'}
          color="#1a9d8e"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GRAMMAR_TOPICS.map(function(topic) {
            return (
              <TopicCard
                key={topic.name}
                topic={topic}
                count={countMap[topic.name] || 0}
              />
            )
          })}
        </div>
      </div>

      <div>
        <SectionHeader
          title="II. Vocabulary"
          subtitle={'12 topics · ' + vocabTotal + ' questions'}
          color="#7c3aed"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {VOCABULARY_TOPICS.map(function(topic) {
            return (
              <TopicCard
                key={topic.name}
                topic={topic}
                count={countMap[topic.name] || 0}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
