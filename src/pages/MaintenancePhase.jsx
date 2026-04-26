import { PhasePanel } from '../components/PhasePanel'

export function MaintenancePhase({ phaseId, title, intro, meta }) {
  return (
    <PhasePanel phaseId={phaseId} title={title} intro={intro} meta={meta}>
      <div className="placeholder-block">
        <p>This phase is currently under maintenance. The page structure is ready for future work.</p>
      </div>
    </PhasePanel>
  )
}
