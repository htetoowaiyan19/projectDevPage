import { NavLink } from 'react-router-dom'

export function PhaseTimeline({ phases, currentPhaseId, canAccessPhase }) {
  const accessibleCount = Math.max(
    1,
    phases.findIndex((phase) => phase.id === currentPhaseId) + 1,
  )

  return (
    <nav className="phase-timeline" aria-label="Project phases">
      <div
        className="phase-timeline__track"
        style={{ '--timeline-progress': `${(accessibleCount / phases.length) * 100}%` }}
        aria-hidden="true"
      />
      {phases.map((phase, index) => {
        const isCurrent = phase.id === currentPhaseId
        const isAccessible = canAccessPhase(phase)

        if (!isAccessible) {
          return (
            <div key={phase.id} className="phase-timeline__item phase-timeline__item--disabled">
              <span className="phase-timeline__index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="phase-timeline__dot" aria-hidden="true" />
              <span className="phase-timeline__text">
                <strong>{phase.label}</strong>
                <small>Locked until this phase becomes active</small>
              </span>
            </div>
          )
        }

        return (
          <NavLink
            key={phase.id}
            to={phase.path}
            className={({ isActive }) =>
              `phase-timeline__item ${isActive ? 'is-active' : ''}`
            }
          >
            <span className="phase-timeline__index">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="phase-timeline__dot" aria-hidden="true" />
            <span className="phase-timeline__text">
              <strong>{phase.label}</strong>
              <small>{isCurrent ? 'Current checkpoint' : phase.tagline}</small>
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
