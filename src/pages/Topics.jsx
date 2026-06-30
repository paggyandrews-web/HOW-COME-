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
  const barPct = Math.min(100, Math.round((count / 25) * 100))
  return (
    <div className="card rounded-xl p-4 flex flex-col gap-3">
      <div>
        <div className="text-xl mb-1">{topic.emoji}</div>
        <div className="font-semibold text-sm leading-snug mb-1.5">{topic.name}</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-full h-1.5" style={{ background: 'var(--bg2)' }}>
            <div
              className="h-1.5 rounded-full"
              style={{ width: barPct + '%', background: 'var(--accent)', transition: 'width 0.4s ease' }}
            />
          </div>
          <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--accent)', minWidth: 28 }}>
            {count}
          </span>
        </div>
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
