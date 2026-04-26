export function PhasePanel({
  phaseId,
  title,
  intro,
  meta,
  children,
}) {
  return (
    <section className={`phase-panel phase-panel--${phaseId}`}>
      <div className="phase-panel__header">
        <div>
          <p className="eyebrow">Phase Page</p>
          <h2>{title}</h2>
        </div>
        <p className="phase-panel__meta">{meta}</p>
      </div>

      <p className="phase-panel__intro">{intro}</p>
      {children}
    </section>
  )
}
