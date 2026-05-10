export const DEFAULT_ROLE_SLOTS = {
  Programming: 4,
  Researching: 2,
  Presentation: 2,
  Writing: 2,
}

export const SETUP_META_DOC_ID = 'setup-phase'
export const SETUP_SYSTEM_COLLECTION = '_system'

export function normalizeRoleSlots(value) {
  const source = value && typeof value === 'object' ? value : {}

  return Object.fromEntries(
    Object.entries(DEFAULT_ROLE_SLOTS).map(([roleName, capacity]) => [
      roleName,
      Math.max(0, Number(source[roleName] ?? capacity)),
    ]),
  )
}
