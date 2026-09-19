export type AvailabilityRule = {
  weekdays: number[];
  startTime: string;
  endTime: string;
  slotIntervalMinutes: number;
};

export function dayBounds(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function atTime(day: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hours, minutes));
}

export function slotStarts(
  rule: AvailabilityRule,
  date: string,
  durationMinutes: number,
  occupied: Array<{ scheduledStart: Date; scheduledEnd: Date }>,
  now = new Date(),
) {
  const { start: day } = dayBounds(date);
  if (!rule.weekdays.includes(day.getUTCDay()) || rule.slotIntervalMinutes < 1 || rule.endTime <= rule.startTime) return [];
  const opens = atTime(day, rule.startTime);
  const closes = atTime(day, rule.endTime);
  const slots: Date[] = [];
  for (let candidate = opens; candidate.getTime() + durationMinutes * 60_000 <= closes.getTime(); candidate = new Date(candidate.getTime() + rule.slotIntervalMinutes * 60_000)) {
    const candidateEnd = new Date(candidate.getTime() + durationMinutes * 60_000);
    const conflicts = occupied.some(({ scheduledStart, scheduledEnd }) => candidate < scheduledEnd && candidateEnd > scheduledStart);
    if (candidate >= now && !conflicts) slots.push(candidate);
  }
  return slots;
}
