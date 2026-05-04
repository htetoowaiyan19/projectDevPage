import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CenterDialog } from '../components/CenterDialog'
import { PhasePanel } from '../components/PhasePanel'
import { useFirebaseClock } from '../hooks/useFirebaseClock'
import { useMembers } from '../hooks/useMembers'
import { useProjects } from '../hooks/useProjects'
import { castManagerVote, claimRole, finalizeManagerVoteIfNeeded } from '../services/members'
import { formatPhaseCountdown } from '../utils/phaseSchedule'
import { getManagerVoteDeadlineMs } from '../utils/setupPhase'

const PROJECT_PLACEMENTS = [
  { sourceIndex: 2, label: '3rd Place', toneClassName: 'setup-podium__card--bronze setup-podium__card--left' },
  { sourceIndex: 0, label: 'Primary Project', toneClassName: 'setup-podium__card--gold setup-podium__card--center' },
  { sourceIndex: 1, label: 'Backup Project', toneClassName: 'setup-podium__card--silver setup-podium__card--right' },
]

export function SetupPhase({ currentUser, onUserUpdate }) {
  const { projects, isLoading: isLoadingProjects, error: projectsError } = useProjects()
  const { members, setupMeta, isLoading: isLoadingMembers, error: membersError } = useMembers()
  const { now } = useFirebaseClock()
  const [managerFeedback, setManagerFeedback] = useState('')
  const [roleFeedback, setRoleFeedback] = useState('')
  const [isSubmittingManagerVote, setIsSubmittingManagerVote] = useState(false)
  const [isSubmittingRole, setIsSubmittingRole] = useState(false)
  const [dialog, setDialog] = useState(null)
  const hasTriedFinalizingRef = useRef(false)

  const topProjects = useMemo(
    () =>
      [...projects]
        .sort((left, right) => right.voteScore - left.voteScore || right.voteCount - left.voteCount)
        .slice(0, 3),
    [projects],
  )
  const bannerProjects = useMemo(
    () =>
      PROJECT_PLACEMENTS.map((placement) => {
        const project = topProjects[placement.sourceIndex]

        if (!project) {
          return null
        }

        return {
          ...placement,
          project,
        }
      }).filter(Boolean),
    [topProjects],
  )
  const managerCandidates = useMemo(
    () => members.filter((member) => !member.isLeader),
    [members],
  )
  const managerWinner = useMemo(
    () =>
      members.find((member) => member.isManager || member.id === setupMeta.managerWinnerId) ?? null,
    [members, setupMeta.managerWinnerId],
  )
  const liveManagerLeader = useMemo(() => {
    if (!managerCandidates.length) {
      return null
    }

    return [...managerCandidates].sort((left, right) => {
      const voteGap = right.managerVoteCount - left.managerVoteCount

      if (voteGap !== 0) {
        return voteGap
      }

      return left.name.localeCompare(right.name)
    })[0]
  }, [managerCandidates])

  const managerVoteDeadlineMs = getManagerVoteDeadlineMs()
  const isManagerVoteClosed = now ? now.getTime() >= managerVoteDeadlineMs : false
  const managerVoteStatus = now
    ? isManagerVoteClosed
      ? 'Fund manager vote closed on 13 May 2026'
      : `Fund manager vote ends in ${formatPhaseCountdown(managerVoteDeadlineMs - now.getTime())}`
    : 'Syncing fund manager deadline...'

  useEffect(() => {
    if (
      !now ||
      isLoadingMembers ||
      isLoadingProjects ||
      hasTriedFinalizingRef.current ||
      !isManagerVoteClosed
    ) {
      return
    }

    if (setupMeta.isManagerVoteFinalized || managerWinner) {
      hasTriedFinalizingRef.current = true
      return
    }

    let isMounted = true

    async function finalizeVote() {
      try {
        await finalizeManagerVoteIfNeeded()
      } catch (error) {
        if (isMounted) {
          setManagerFeedback(
            error instanceof Error
              ? error.message
              : 'Unable to finalize the fund manager vote.',
          )
        }
      } finally {
        if (isMounted) {
          hasTriedFinalizingRef.current = true
        }
      }
    }

    finalizeVote()

    return () => {
      isMounted = false
    }
  }, [
    isLoadingMembers,
    isLoadingProjects,
    isManagerVoteClosed,
    managerWinner,
    now,
    setupMeta.isManagerVoteFinalized,
  ])

  async function submitManagerVote(candidateId) {
    if (!currentUser || currentUser.hasManagerVoted || isSubmittingManagerVote) {
      return
    }

    setIsSubmittingManagerVote(true)
    setManagerFeedback('')

    try {
      const result = await castManagerVote({
        memberId: currentUser.id,
        candidateId,
      })

      onUserUpdate((previousUser) => ({
        ...previousUser,
        hasManagerVoted: true,
        votedManagerId: candidateId,
      }))
      setManagerFeedback(`Fund manager vote submitted for ${result.candidateName}.`)
    } catch (error) {
      setManagerFeedback(
        error instanceof Error ? error.message : 'Unable to submit the fund manager vote.',
      )
    } finally {
      setIsSubmittingManagerVote(false)
    }
  }

  async function submitRole(role) {
    if (!currentUser || isSubmittingRole) {
      return
    }

    setIsSubmittingRole(true)
    setRoleFeedback('')

    try {
      const result = await claimRole({ memberId: currentUser.id, role })

      onUserUpdate((previousUser) => ({
        ...previousUser,
        role,
      }))
      setRoleFeedback(`${result.role} locked in. Remaining slots: ${result.remainingSlots}.`)
    } catch (error) {
      setRoleFeedback(
        error instanceof Error ? error.message : 'Unable to save your role selection.',
      )
    } finally {
      setIsSubmittingRole(false)
    }
  }

  function handleManagerVote(candidate) {
    if (!currentUser || currentUser.hasManagerVoted || isSubmittingManagerVote || isManagerVoteClosed) {
      return
    }

    if (candidate.id === currentUser.id) {
      setDialog({ type: 'self-manager' })
      return
    }

    setDialog({ type: 'manager-vote', candidate })
  }

  function handleRoleSelect(roleName, remainingSlots) {
    if (!currentUser || isSubmittingRole || remainingSlots <= 0) {
      return
    }

    setDialog({ type: 'role-select', roleName })
  }

  const pageMeta = [].join(' | ')

  return (
    <PhasePanel
      phaseId="setup"
      title="Setup Phase"
      intro="Confirm the winning project lane, vote for the fund manager, lock team roles, and keep the class roster visible in one responsive space."
      meta={pageMeta}
    >
      <div className="phase-toolbar">
        <div className="phase-toolbar__pill">{managerVoteStatus}</div>
        <div className="phase-toolbar__pill">
          {currentUser?.hasManagerVoted ? 'Manager vote: locked' : 'Manager vote: ready'}
        </div>
        <div className="phase-toolbar__pill">
          {currentUser?.role ? `Role: ${currentUser.role}` : 'Role: unassigned'}
        </div>
      </div>

      {projectsError || membersError ? (
        <p className="phase-feedback phase-feedback--error">{projectsError || membersError}</p>
      ) : null}

        <section className="setup-podium">
          <div className="setup-section__header">
            <div>
              <p className="eyebrow">Project Results</p>
              <h3>Top voted projects</h3>
            </div>
            <p></p>
          </div>

        {isLoadingProjects ? (
          <div className="placeholder-block">
            <p>Loading ranked projects from Firebase...</p>
          </div>
        ) : bannerProjects.length ? (
          <div className="setup-podium__banner">
            {bannerProjects.map(({ project, label, toneClassName }) => {
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}?context=setup`}
                  className={`setup-podium__card setup-podium__card--interactive ${toneClassName}`}
                >
                  {label ? <span className="setup-podium__badge">{label}</span> : null}
                  <h4>{project.title || 'Untitled project'}</h4>
                  <p className="setup-podium__owner">Owner: {project.name || 'Unknown member'}</p>
                  <p className="setup-podium__score">{project.voteScore.toFixed(2)} points</p>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="placeholder-block">
            <p>No voted projects are available yet.</p>
          </div>
        )}
      </section>

      <div className="setup-sections">
        <section className="setup-card">
          <div className="setup-section__header">
            <div>
              <p className="eyebrow">Fund Manager Selection</p>
              <h3>Fund Manager</h3>
            </div>
          </div>

          <div className="setup-countdown">
            <span className="setup-countdown__label">Manager selection countdown</span>
            <strong>{managerVoteStatus}</strong>
          </div>

          {managerFeedback ? <p className="phase-feedback">{managerFeedback}</p> : null}

          {currentUser?.canManageProjects ? (
            <div className="setup-result">
              <span className="setup-result__label">Admin result panel</span>
              <strong>
                {managerWinner?.name || liveManagerLeader?.name || setupMeta.managerWinnerName || 'No votes yet'}
              </strong>
              <p>
                {isManagerVoteClosed
                  ? 'Final winner is locked in after the vote closed.'
                  : `Live leader with ${liveManagerLeader?.managerVoteCount ?? 0} vote${(liveManagerLeader?.managerVoteCount ?? 0) === 1 ? '' : 's'}.`}
              </p>
            </div>
          ) : (
            <div className="setup-result setup-result--muted">
              <span className="setup-result__label">Result access</span>
              <strong>Admin only</strong>
              <p>Members only see candidate names and can cast one manager vote.</p>
            </div>
          )}

          {isLoadingMembers ? (
            <div className="placeholder-block">
              <p>Loading members for fund manager voting...</p>
            </div>
          ) : (
            <div className="setup-compact-grid">
              {managerCandidates.map((member) => (
                <article key={member.id} className="setup-member-card">
                  <div className="setup-member-card__top">
                    <div>
                      <h4>{member.name || 'Unnamed member'}</h4>
                      <p>{member.rollNumber || 'No roll number found'}</p>
                    </div>
                  </div>
                  {currentUser?.canManageProjects ? (
                    <div className="setup-member-card__meta">
                      <span className="setup-tag">Votes {member.managerVoteCount}</span>
                      {liveManagerLeader?.id === member.id ? (
                        <span className="setup-tag setup-tag--accent">Current winner</span>
                      ) : null}
                      {managerWinner?.id === member.id && isManagerVoteClosed ? (
                        <span className="setup-tag setup-tag--accent">Final winner</span>
                      ) : null}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="vote-card__button"
                    disabled={
                      currentUser?.hasManagerVoted ||
                      isSubmittingManagerVote ||
                      isManagerVoteClosed
                    }
                    onClick={() => handleManagerVote(member)}
                  >
                    Vote
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="setup-card">
          <div className="setup-section__header">
            <div>
              <p className="eyebrow">Role Selection</p>
              <h3>Role Selection</h3>
            </div>
            <p>Leadership and manager titles are separate from the actual working role.</p>
          </div>

          {roleFeedback ? <p className="phase-feedback">{roleFeedback}</p> : null}

          <div className="setup-role-grid">
            {Object.entries(setupMeta.roleSlots).map(([roleName, remainingSlots]) => (
              <article key={roleName} className="setup-role-card">
                <div>
                  <span className="setup-role-card__count">{remainingSlots}</span>
                  <h4>{roleName}</h4>
                  <p>
                    {remainingSlots > 0
                      ? `${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} remaining`
                      : 'Role is full'}
                  </p>
                </div>
                <button
                  type="button"
                  className="vote-card__button"
                  disabled={
                    isSubmittingRole ||
                    remainingSlots <= 0 ||
                    (Boolean(currentUser?.role) && currentUser.role !== roleName)
                  }
                  onClick={() => handleRoleSelect(roleName, remainingSlots)}
                >
                  {currentUser?.role === roleName ? 'Selected' : 'Choose role'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="setup-card setup-card--wide">
          <div className="setup-section__header">
            <div>
              <p className="eyebrow">Member List</p>
              <h3>Team roster</h3>
            </div>
          </div>

          {isLoadingMembers ? (
            <div className="placeholder-block">
              <p>Loading team roster...</p>
            </div>
          ) : (
            <div className="setup-roster">
              {members.map((member) => (
                <article key={member.id} className="setup-roster__item">
                  <div className="setup-roster__identity">
                    <h4>{member.name || 'Unnamed member'}</h4>
                    <p>{member.rollNumber || 'Roll number unavailable'}</p>
                  </div>
                  <div className="setup-roster__badges">
                    {member.isLeader ? <span className="setup-tag setup-tag--leader">Leader</span> : null}
                    {member.isManager ? <span className="setup-tag setup-tag--accent">Manager</span> : null}
                    <span className="setup-tag">{member.role || 'Role pending'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <CenterDialog
        open={Boolean(dialog)}
        title={
          dialog?.type === 'self-manager'
            ? 'Cannot vote'
            : dialog?.type === 'manager-vote'
              ? 'Confirm fund manager vote'
              : 'Confirm role selection'
        }
        message={
          dialog?.type === 'self-manager'
            ? 'You cannot vote yourself.'
            : dialog?.type === 'manager-vote'
              ? `Confirm ${dialog.candidate?.name || 'this member'} as the fund manager? This vote cannot be changed.`
              : `Choose ${dialog?.roleName || 'this role'} for Setup? This role selection will be saved to the database.`
        }
        showCancel={dialog?.type === 'manager-vote' || dialog?.type === 'role-select'}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          if (dialog?.type === 'manager-vote' && dialog.candidate?.id) {
            const candidateId = dialog.candidate.id
            setDialog(null)
            await submitManagerVote(candidateId)
            return
          }

          if (dialog?.type === 'role-select' && dialog.roleName) {
            const roleName = dialog.roleName
            setDialog(null)
            await submitRole(roleName)
            return
          }

          setDialog(null)
        }}
      />
    </PhasePanel>
  )
}
