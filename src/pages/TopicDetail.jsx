import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import questions from '../data/questions.json'
import SignupGate from '../components/SignupGate'
import PracticeSet, { PAPER_BY_ID, paperTime } from '../components/PracticeSet'
import { useAuth } from '../contexts/AuthContext'
import { topicFromSlug, isDeletedByPsc } from '../data/topics'

export default function TopicDetail() {
  const { slug } = useParams()
  const topic = topicFromSlug(slug)
  const { user } = useAuth()

  // Every usable question in this topic, newest exam first.
  const pool = useMemo(() => {
    if (!topic) return []
    return questions
      .filter(q => q.topic === topic.name && !isDeletedByPsc(q))
      .sort((a, b) => paperTime(b.paperId) - paperTime(a.paperId) || (a.questionNumber || 0) - (b.questionNumber || 0))
  }, [topic])

  if (!topic) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-sm mb-3" style={{ color: 'var(--text2)' }}>This topic doesn't exist.</p>
        <Link to="/topics" style={{ color: 'var(--accent)' }}>See all topics</Link>
      </div>
    )
  }

  if (!user) {
    return (
      <SignupGate
        title="Sign up to practice by topic"
        subtitle="Grammar and vocabulary questions grouped by the official PSC syllabus need an account."
      />
    )
  }

  return (
    <PracticeSet
      pool={pool}
      backTo="/topics"
      backLabel="All topics"
      exitLabel={`Back to ${topic.name}`}
      title={
        <h1 className="display text-2xl flex items-center gap-2">
          <span style={{ fontSize: '0.8em' }} aria-hidden="true">{topic.emoji}</span>
          {topic.name}
        </h1>
      }
      subtitle={`${pool.length} past PSC questions in this topic`}
      rowMeta={q => {
        const paper = PAPER_BY_ID[q.paperId]
        return `${paper?.paperCode || q.paperId}${q.questionNumber ? ` Q${q.questionNumber}` : ''}${paper?.post ? ` — ${paper.post}` : ''}`
      }}
    />
  )
}
