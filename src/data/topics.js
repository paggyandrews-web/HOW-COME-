// Official Kerala PSC English Syllabus — in order. Shared by the Topics list
// and the per-topic practice page (/topics/:slug).
export const GRAMMAR_TOPICS = [
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

export const VOCABULARY_TOPICS = [
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

export const ALL_TOPICS = [...GRAMMAR_TOPICS, ...VOCABULARY_TOPICS]

export const topicSlug = name =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const topicFromSlug = slug => ALL_TOPICS.find(t => topicSlug(t.name) === slug) || null

// PSC-deleted/cancelled questions carry "(~~deleted by psc~~)" in their text.
// They never belong in a topic practice pool.
export function isDeletedByPsc(q) {
  return typeof q.questionText === 'string' && /deleted by psc/i.test(q.questionText)
}
