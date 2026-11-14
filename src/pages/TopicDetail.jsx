import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import questions from '../data/questions.json'
import SignupGate from '../components/SignupGate'
import PracticeSet, { paperTime } from '../components/PracticeSet'
import SubtopicList from '../components/SubtopicList'
import { useAuth } from '../contexts/AuthContext'
import { topicFromSlug, subtopicsOf, subtopicFromSlug, isDeletedByPsc } from '../data/topics'

export default function TopicDetail() {
  const { slug, sub } = useParams()
  const topic = topicFromSlug(slug)
  const subtopic = topic && sub ? subtopicFromSlug(topic.name, sub) : null
  const { user } = useAuth()

  // Every usable question in this topic, newest exam first.
  const topicPool = useMemo(() => {
    if (!topic) return []
    return questions
      .filter(q => q.topic === topic.name && !isDeletedByPsc(q))
      .sort((a, b) => paperTime(b.paperId) - paperTime(a.paperId) || (a.questionNumber || 0) - (b.questionNumber || 0))
  }, [topic])

  const pool = useMemo(
    () => (subtopic ? topicPool.filter(q => q.subtopic === subtopic) : topicPool),
    [topicPool, subtopic]
  )

  if (!topic || (sub && !subtopic)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-sm mb-3" style={{ color: 'var(--text2)' }}>
          {topic ? "This subtopic doesn't exist." : "This topic doesn't exist."}
        </p>
        <Link to={topic ? '/topics/' + slug : '/topics'} style={{ color: 'var(--accent)' }}>
          {topic ? `See all of ${topic.name}` : 'See all topics'}
        </Link>
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

  if (subtopic) {
    return (
      <PracticeSet
        key={sub}
        pool={pool}
        backTo={'/topics/' + slug}
        backLabel={topic.name}
        exitLabel={`Back to ${subtopic}`}
        title={
          <>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
              <span aria-hidden="true">{topic.emoji}</span>{topic.name}
            </p>
            <h1 className="display text-2xl">{subtopic}</h1>
          </>
        }
        subtitle={`${pool.length} past PSC ${pool.length === 1 ? 'question' : 'questions'} in this subtopic`}
      />
    )
  }

  const subs = subtopicsOf(topic.name)

  return (
    <PracticeSet
      key="all"
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
      footer={subs.length ? outcomes => <SubtopicList slug={slug} subs={subs} pool={pool} outcomes={outcomes} /> : undefined}
    />
  )
}
