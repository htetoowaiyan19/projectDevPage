import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CenterDialog } from '../components/CenterDialog'
import { castVote } from '../services/projects'
import { useProjects } from '../hooks/useProjects'

export function ProjectDetailPage({ currentUser, onUserUpdate }) {
  const { projectId } = useParams()
  const { projects, isLoading, error } = useProjects()
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [voteDialog, setVoteDialog] = useState(null)

  const project = useMemo(
    () => projects.find((entry) => entry.id === projectId) ?? null,
    [projectId, projects],
  )

  if (!isLoading && !project && !error) {
    return <Navigate to="/voting" replace />
  }

  async function submitVote() {
    if (!project || currentUser.hasVoted || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await castVote({ memberId: currentUser.id, projectId: project.id })

      onUserUpdate((previousUser) => ({
        ...previousUser,
        hasVoted: true,
      }))
      setMessage(
        `Vote submitted. ${result.votePoint.toFixed(2)} x ${result.multiplier.toFixed(2)} = ${result.addedScore.toFixed(2)} points.`,
      )
    } catch (nextError) {
      setMessage(
        nextError instanceof Error ? nextError.message : 'Unable to submit your vote.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleVote() {
    if (!project || currentUser.hasVoted || isSubmitting) {
      return
    }

    if (currentUser.submittedProjectId && currentUser.submittedProjectId === project.id) {
      setVoteDialog({ type: 'own-project' })
      return
    }

    setVoteDialog({ type: 'confirm-vote' })
  }

  return (
    <section className="project-detail">
      <div className="project-detail__head">
        <div>
          <p className="eyebrow">Project Detail</p>
          <h2>{project?.title ?? 'Loading project...'}</h2>
        </div>
        <Link to="/voting" className="phase-toolbar__admin-link">
          Back to voting
        </Link>
      </div>

      {error ? <p className="phase-feedback phase-feedback--error">{error}</p> : null}
      {message ? <p className="phase-feedback">{message}</p> : null}

      {project ? (
        <div className="project-detail__grid">
          <article className="project-detail__card">
            <span className="vote-card__category">{project.projectType}</span>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
          </article>

          <article className="project-detail__card">
            <h4>Requirements</h4>
            <p>{project.requirements}</p>
          </article>

          <article className="project-detail__card">
            <h4>Solution</h4>
            <p>{project.solution}</p>
          </article>

          <article className="project-detail__card">
            <h4>Voting maths</h4>
            <p>Point multiplier: {project.pointMultiplier.toFixed(2)}</p>
            {currentUser.canManageProjects ? (
              <>
                <p>Total score: {project.voteScore.toFixed(2)}</p>
                <p>Total voters: {project.voteCount}</p>
              </>
            ) : null}
            <button
              type="button"
              className="vote-card__button"
              onClick={handleVote}
              disabled={currentUser.hasVoted || isSubmitting}
            >
              {currentUser.hasVoted ? 'Vote locked' : 'Vote for this project'}
            </button>
          </article>
        </div>
      ) : null}
      <CenterDialog
        open={Boolean(voteDialog)}
        title={
          voteDialog?.type === 'own-project' ? 'Cannot vote this project' : 'Confirm vote'
        }
        message={
          voteDialog?.type === 'own-project'
            ? "You can't vote for your own project :P"
            : "Are you sure? Once you've confirmed, the vote cannot be changed."
        }
        showCancel={voteDialog?.type === 'confirm-vote'}
        confirmLabel="OK"
        cancelLabel="Cancel"
        onClose={() => setVoteDialog(null)}
        onConfirm={async () => {
          if (voteDialog?.type === 'confirm-vote') {
            setVoteDialog(null)
            await submitVote()
            return
          }

          setVoteDialog(null)
        }}
      />
    </section>
  )
}
