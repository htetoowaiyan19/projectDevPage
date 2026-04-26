import { phases } from '../data/phases'

const MYANMAR_OFFSET_MS = (6 * 60 + 30) * 60 * 1000

function getMyanmarUtcMs(year, month, day) {
  return Date.UTC(year, month - 1, day) - MYANMAR_OFFSET_MS
}

const phaseWindows = [
  {
    id: 'preparation',
    startMs: getMyanmarUtcMs(2026, 4, 20),
    endMs: getMyanmarUtcMs(2026, 5, 1),
    windowLabel: '20 Apr 2026 - 30 Apr 2026',
  },
  {
    id: 'voting',
    startMs: getMyanmarUtcMs(2026, 5, 1),
    endMs: getMyanmarUtcMs(2026, 5, 11),
    windowLabel: '1 May 2026 - 10 May 2026',
  },
  {
    id: 'setup',
    startMs: getMyanmarUtcMs(2026, 5, 11),
    endMs: getMyanmarUtcMs(2026, 5, 21),
    windowLabel: '11 May 2026 - 20 May 2026',
  },
  {
    id: 'building',
    startMs: getMyanmarUtcMs(2026, 5, 21),
    endMs: getMyanmarUtcMs(2026, 9, 18),
    windowLabel: '21 May 2026 - 17 Sep 2026',
  },
  {
    id: 'checkup',
    startMs: getMyanmarUtcMs(2026, 9, 18),
    endMs: getMyanmarUtcMs(2026, 11, 18),
    windowLabel: '18 Sep 2026 - 17 Nov 2026',
  },
]

const phaseMap = new Map(phases.map((phase) => [phase.id, phase]))
const phaseWindowMap = new Map(phaseWindows.map((phase) => [phase.id, phase]))

export function getPhaseById(phaseId) {
  return phaseMap.get(phaseId) ?? phases[0]
}

export function getPhaseWindow(phaseId) {
  return phaseWindowMap.get(phaseId) ?? null
}

export function getPhaseEndMs(phaseId) {
  return getPhaseWindow(phaseId)?.endMs ?? null
}

export function getCurrentPhaseByTime(nowMs) {
  const activeWindow =
    phaseWindows.find((phase) => nowMs >= phase.startMs && nowMs < phase.endMs) ??
    (nowMs < phaseWindows[0].startMs ? phaseWindows[0] : phaseWindows[phaseWindows.length - 1])

  return {
    ...getPhaseById(activeWindow.id),
    windowLabel: activeWindow.windowLabel,
  }
}

export function getDefaultPhasePath(nowMs) {
  return getCurrentPhaseByTime(nowMs).path
}

export function getMyanmarTimeLabel(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Yangon',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date)
}

export function formatPhaseCountdown(remainingMs) {
  if (remainingMs <= 0) {
    return 'Ended'
  }

  const totalSeconds = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}
