export const MONITORED_ROLES = ['hermano'] as const

export type MonitoredRole = (typeof MONITORED_ROLES)[number]

export const isMonitoredRole = (rol?: string | null): rol is MonitoredRole =>
  Boolean(rol && MONITORED_ROLES.includes(rol as MonitoredRole))

export const getRoleLabel = (rol?: string | null) => {
  switch (rol) {
    case 'tutor':
      return 'Tutor / Apoderado'
    case 'hermano':
      return 'Hermano / Hermana'
    default:
      return rol || 'Sin rol'
  }
}
