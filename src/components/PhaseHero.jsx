export function PhaseHero({ activePhase, currentUser, phaseCountdownLabel, onLogout }) {
  return (
    <section className="phase-hero">
      <p className="eyebrow">Group Project</p>
      <div className="phase-hero__content">
        <div>
          <h1>Technological University Hmawbi</h1>
          <p className="phase-hero__lede">
             Dashboard for our group project. This is not serious, but I hope we can work together to form the best group and make the best project for our class.
          </p>

          {currentUser ? (
            <div className="phase-hero__identity" aria-label="Signed in user">
              <div className="phase-hero__identity-copy">
                <span className="phase-hero__identity-label">Signed in</span>
                <strong>{currentUser.name || 'Unnamed student'}</strong>
                <span>{currentUser.rollNumber}</span>
              </div>
              <button type="button" className="phase-hero__logout" onClick={onLogout}>
                Log out
              </button>
            </div>
          ) : null}
        </div>

        <aside className="phase-hero__status" aria-label="Current phase status">
          <span className="phase-hero__status-label">Current phase</span>
          <strong>{activePhase.label}</strong>
          <p className="phase-hero__status-copy">{activePhase.tagline}</p>
          <div className="phase-hero__status-meta">
            <span>{activePhase.windowLabel}</span>
            <span>Phase ends in {phaseCountdownLabel}</span>
          </div>
        </aside>
      </div>
    </section>
  )
}
