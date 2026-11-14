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

// Subtopics — finer groups inside the bigger topics (from the Grammar Atoms series).
// Every question in one of these topics carries a matching `subtopic` field in
// questions.json. Keep names in sync: the psc-malayalam-explanation skill tags new
// questions by picking one of these exact names. Topics not listed here stay flat.
export const SUBTOPICS = {
  "Types of Sentences": [
    "Kinds of Sentences",
    "Simple, Compound & Complex",
    "Sentence Conversion",
    "Rearranging Sentences",
  ],
  "Parts of Speech": [
    "Identify the Part of Speech",
    "Collective Nouns",
    "Gender of Nouns",
    "Pronouns",
    "Adjectives & Adverbs",
    "Conjunctions & Linkers",
  ],
  "Subject-Verb Agreement": [
    "Basic Agreement",
    "And, Amounts & Number of",
    "Neither…Nor / Either…Or",
    "As well as / Along with",
    "Each, Every, None & One of",
    "Collective & Uncountable Nouns",
  ],
  "Articles": [
    "A / An",
    "The & Zero Article",
  ],
  "Auxiliary Verbs": [
    "Be, Do & Have",
    "Modals: Can, May, Will, Should",
    "Must, Need & Dare",
    "Had Better, Would Rather & Used to",
  ],
  "Question Tags": [
    "Basic Positive & Negative Tags",
    "Negative Words (seldom, hardly, few)",
    "Everyone, Somebody & Nobody",
    "Imperatives & Let's",
    "I am, I think & Special Cases",
  ],
  "Infinitive and Gerunds": [
    "Gerunds (verb + -ing)",
    "To-Infinitive",
    "Bare Infinitive",
  ],
  "Tenses": [
    "Present Tenses",
    "Present Perfect & Since / For",
    "Past Tenses",
    "Past Perfect",
    "Future Tenses",
    "Verb Forms",
  ],
  "Conditionals": [
    "First Conditional",
    "Second Conditional",
    "Third Conditional",
    "Inverted, Unless & Wish",
  ],
  "Prepositions": [
    "Time (At / On / In, Since / For)",
    "Place, Movement & Transport",
    "Adjective + Preposition",
    "Verb + Preposition",
    "Special Cases (to not than, no preposition)",
    "Other Prepositions",
  ],
  "Correlatives": [
    "Either…Or, Not only…but also, Both…and",
    "No sooner / Hardly / Scarcely",
    "Other Pairs (whether, lest, so…that)",
  ],
  "Direct and Indirect Speech": [
    "Statements",
    "Questions",
    "Commands & Requests",
    "Exclamations & Wishes",
  ],
  "Active and Passive Voice": [
    "Simple Tenses",
    "Continuous Tenses",
    "Perfect Tenses",
    "Modals & Future",
    "Questions in Passive",
    "Imperatives (Let…be)",
  ],
  "Correction of Sentences": [
    "Spot the Error",
    "Choose the Correct Sentence",
    "Rearranging & Rewriting",
    "Punctuation & Capitals",
  ],
  "Degrees of Comparison": [
    "Comparative & Superlative Forms",
    "Degree Transformation",
    "Special Comparatives (elder, further, superior)",
  ],
  "Singular and Plural": [
    "Irregular & Uncountable Plurals",
    "Latin & Greek Plurals",
    "Compound Noun Plurals",
    "Collective Nouns & Gender",
  ],
  "Word Formation": [
    "Noun, Adjective & Verb Forms",
    "Prefixes",
    "Gender Words",
    "Other Word Types",
  ],
  "Phrasal Verbs": [
    "PUT Family",
    "CALL Family",
    "TAKE & LOOK Family",
    "RUN, GET, TURN, GIVE & BRING",
    "COME, GO, MAKE & BREAK",
    "Other Phrasal Verbs",
  ],
}

export const subtopicsOf = topicName => SUBTOPICS[topicName] || []

export const subtopicFromSlug = (topicName, slug) =>
  subtopicsOf(topicName).find(s => topicSlug(s) === slug) || null

// PSC-deleted/cancelled questions carry "(~~deleted by psc~~)" in their text.
// They never belong in a topic practice pool.
export function isDeletedByPsc(q) {
  return typeof q.questionText === 'string' && /deleted by psc/i.test(q.questionText)
}
