export const DEFAULT_ROLE_SLOTS = {
  Programming: 4,
  Researching: 2,
  Presentation: 2,
  Writing: 2,
}

export const SETUP_META_DOC_ID = 'setup-phase'
export const SETUP_SYSTEM_COLLECTION = '_system'
export const MANAGER_VOTE_DEADLINE_ISO = '2026-05-13T23:59:59+06:30'

export function getManagerVoteDeadlineMs() {
  return new Date(MANAGER_VOTE_DEADLINE_ISO).getTime()
}

export function normalizeRoleSlots(value) {
  const source = value && typeof value === 'object' ? value : {}

  return Object.fromEntries(
    Object.entries(DEFAULT_ROLE_SLOTS).map(([roleName, capacity]) => [
      roleName,
      Math.max(0, Number(source[roleName] ?? capacity)),
    ]),
  )
}
