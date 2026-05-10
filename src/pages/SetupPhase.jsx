import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CenterDialog } from '../components/CenterDialog'
import { PhasePanel } from '../components/PhasePanel'
import { useMembers } from '../hooks/useMembers'
import { useProjects } from '../hooks/useProjects'
import { claimRole } from '../services/members'

const PROJECT_PLACEMENTS = [
  { sourceIndex: 2, label: '3rd Place', toneClassName: 'setup-podium__card--bronze setup-podium__card--left' },
  { sourceIndex: 0, label: 'Primary Project', toneClassName: 'setup-podium__card--gold setup-podium__card--center' },
  { sourceIndex: 1, label: 'Backup Project', toneClassName: 'setup-podium__card--silver setup-podium__card--right' },
]

export function SetupPhase({ currentUser, onUserUpdate }) {
  const { projects, isLoading: isLoadingProjects, error: projectsError } = useProjects()
  const { members, setupMeta, isLoading: isLoadingMembers, error: membersError } = useMembers()
  const [roleFeedback, setRoleFeedback] = useState('')
  const [isSubmittingRole, setIsSubmittingRole] = useState(false)
  const [dialog, setDialog] = useState(null)

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
      intro="Confirm the winning project lane, lock team roles, and keep the class roster visible in one responsive space."
      meta={pageMeta}
    >
      <div className="phase-toolbar">
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
              <p className="eyebrow">Role Selection</p>
              <h3>Role Selection</h3>
            </div>
            <p>Leadership titles are separate from the actual working role.</p>
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
        title="Confirm role selection"
        message={
          `Choose ${dialog?.roleName || 'this role'} for Setup? This role selection will be saved to the database.`
        }
        showCancel={dialog?.type === 'role-select'}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onClose={() => setDialog(null)}
        onConfirm={async () => {
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
