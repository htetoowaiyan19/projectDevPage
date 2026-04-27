import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CenterDialog } from '../components/CenterDialog'
import { PhasePanel } from '../components/PhasePanel'
import { VoteCard } from '../components/VoteCard'
import { useProjects } from '../hooks/useProjects'
import { castVote } from '../services/projects'

export function VotingPhase({ currentUser, onUserUpdate }) {
  const { projects, isLoading, error } = useProjects()
  const [voteMessage, setVoteMessage] = useState('')
  const [isSubmittingVote, setIsSubmittingVote] = useState(false)
  const [voteDialog, setVoteDialog] = useState(null)

  const leadingProject = useMemo(
    () =>
      [...projects].sort(
        (left, right) => right.voteScore - left.voteScore || right.voteCount - left.voteCount,
      )[0] ?? null,
    [projects],
  )

  async function submitVote(projectId) {
    if (!currentUser || currentUser.hasVoted || isSubmittingVote) {
      return
    }

    setIsSubmittingVote(true)
    setVoteMessage('')

    try {
      const result = await castVote({ memberId: currentUser.id, projectId })

      onUserUpdate((previousUser) => ({
        ...previousUser,
        hasVoted: true,
      }))
      setVoteMessage(
        `Vote submitted. ${result.votePoint.toFixed(2)} x ${result.multiplier.toFixed(2)} = ${result.addedScore.toFixed(2)} points.`,
      )
    } catch (nextError) {
      setVoteMessage(
        nextError instanceof Error ? nextError.message : 'Unable to submit your vote.',
      )
    } finally {
      setIsSubmittingVote(false)
    }
  }

  function handleVote(projectId) {
    if (!currentUser || currentUser.hasVoted || isSubmittingVote) {
      return
    }

    if (currentUser.submittedProjectId && currentUser.submittedProjectId === projectId) {
      setVoteDialog({ type: 'own-project' })
      return
    }

    setVoteDialog({ type: 'confirm-vote', projectId })
  }

  return (
    <PhasePanel
      phaseId="voting"
      title="Voting Phase"
      intro="Browse live projects, inspect the full proposal when you need more detail, and cast one weighted vote based on your personal vote points."
      meta={`Member vote points: ${Number(currentUser.votePoint ?? 1).toFixed(2)}`}
    >
      <div className="phase-toolbar">
        <div className="phase-toolbar__pill">
          {currentUser.hasVoted ? 'Vote status: locked' : 'Vote status: ready'}
        </div>
        {currentUser.canManageProjects && leadingProject ? (
          <div className="phase-toolbar__pill">
            Current leader: {leadingProject.title} ({leadingProject.voteScore.toFixed(2)})
          </div>
        ) : null}
        {currentUser.canManageProjects ? (
          <Link to="/admin" className="phase-toolbar__pill phase-toolbar__pill--action">
            Open admin panel
          </Link>
        ) : null}
      </div>

      {voteMessage ? <p className="phase-feedback">{voteMessage}</p> : null}
      {error ? <p className="phase-feedback phase-feedback--error">{error}</p> : null}

      {isLoading ? (
        <div className="placeholder-block">
          <p>Loading voting projects from Firebase...</p>
        </div>
      ) : null}

      {!isLoading && !projects.length ? (
        <div className="placeholder-block">
          <p>No projects are available for voting yet. An admin can add them from the admin panel.</p>
        </div>
      ) : null}

      {!isLoading && projects.length ? (
        <div className="vote-grid">
          {projects.map((project) => {
            return (
              <VoteCard
                key={project.id}
                {...project}
                showScores={currentUser.canManageProjects}
                canVote={!currentUser.hasVoted && !isSubmittingVote}
                hasVoted={currentUser.hasVoted}
                onVote={handleVote}
              />
            )
          })}
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
          if (voteDialog?.type === 'confirm-vote' && voteDialog.projectId) {
            const projectId = voteDialog.projectId
            setVoteDialog(null)
            await submitVote(projectId)
            return
          }

          setVoteDialog(null)
        }}
      />
    </PhasePanel>
  )
}
