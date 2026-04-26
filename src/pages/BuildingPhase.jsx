import { MaintenancePhase } from './MaintenancePhase'

export function BuildingPhase() {
  return (
    <MaintenancePhase
      phaseId="building"
      title="Building Phase"
      intro="This page will host implementation workflows once the schedule enters the Building window."
      meta="Execution lane: under maintenance"
    />
  )
}
