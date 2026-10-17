import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import questions from '../data/questions.json'
import SignupGate from '../components/SignupGate'
import PracticeSet, { PAPER_BY_ID } from '../components/PracticeSet'
import { useAuth } from '../contexts/AuthContext'

export default function PaperDetail() {
  const { paperId } = useParams()
  const paper = PAPER_BY_ID[paperId]
  const { user } = useAuth()

  // The paper's questions in exam order. PSC-deleted ones stay in, exactly
  // like practicing the paper from the Quiz page.
  const pool = useMemo(() =>
    questions
      .filter(q => q.paperId === paperId)
      .sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0)),
  [paperId])

  if (!paper) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-sm mb-3" style={{ color: 'var(--text2)' }}>This paper isn't in the app.</p>
        <Link to="/papers" style={{ color: 'var(--accent)' }}>See all papers</Link>
      </div>
    )
  }

  if (!user) {
    return (
      <SignupGate
        title="Sign up to browse previous question papers"
        subtitle="Every archived PSC paper, topic-wise breakdown and progress tracker needs an account."
      />
    )
  }

  return (
    <PracticeSet
      pool={pool}
      backTo="/papers"
      backLabel="All papers"
      exitLabel="Back to this paper"
      wholeSet="Practice the whole paper in order"
      title={<h1 className="display" style={{ fontSize: '1.6rem', lineHeight: 1.1 }}>{paper.post}</h1>}
      subtitle={`${paper.paperCode}${paper.date ? `, held on ${paper.date}` : ''} — ${pool.length} English questions`}
      rowMeta={q => `Q${q.questionNumber || ''}${q.topic ? ` — ${q.topic}` : ''}`}
    />
  )
}
