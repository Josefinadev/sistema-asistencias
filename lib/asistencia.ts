const RESET_HOUR = 11

const getResetReference = (now: Date) => {
  const reference = new Date(now)
  reference.setHours(RESET_HOUR, 0, 0, 0)

  if (now.getHours() < RESET_HOUR) {
    reference.setDate(reference.getDate() - 1)
  }

  return reference
}

export const getAttendanceCycleStart = (now: Date = new Date()) => getResetReference(now)

export const getNextAttendanceReset = (now: Date = new Date()) => {
  const nextReset = getResetReference(now)
  nextReset.setDate(nextReset.getDate() + 1)
  return nextReset
}

export const isAttendanceInCurrentCycle = (value?: string | null, now: Date = new Date()) => {
  if (!value) return false

  const attendanceDate = new Date(value)
  if (Number.isNaN(attendanceDate.getTime())) return false

  return attendanceDate >= getAttendanceCycleStart(now)
}
