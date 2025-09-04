/**
 * Apply an offset (in seconds) to a cron string.
 *
 * @param cron - The original cron expression.
 * @param offsetSeconds - Number of seconds to offset by (can be negative).
 * @returns The offset cron expression.
 */
export function applyCronOffset(cron: string, offsetSeconds: number): string {
  const parts = cron.trim().split(" ");
  if (parts.length < 5) return cron;

  let [minuteStr, hourStr, dayOfMonth, month, dayOfWeek] = parts;

  // Do not modify complex cron expressions with ranges, steps, or lists, or wildcards for time
  if (
    [minuteStr, hourStr, dayOfMonth, dayOfWeek].some(
      (p) => p.includes(",") || p.includes("-") || p.includes("/"),
    ) ||
    minuteStr === "*" ||
    hourStr === "*"
  ) {
    return cron;
  }

  const minute = parseInt(minuteStr, 10);
  const hour = parseInt(hourStr, 10);

  if (isNaN(minute) || isNaN(hour)) return cron;

  const totalSeconds = hour * 3600 + minute * 60 + offsetSeconds;

  const daysOffset = Math.floor(totalSeconds / 86400);

  const normalizedSeconds = ((totalSeconds % 86400) + 86400) % 86400;

  const newHour = Math.floor(normalizedSeconds / 3600);
  const newMinute = Math.floor((normalizedSeconds % 3600) / 60);

  minuteStr = newMinute.toString();
  hourStr = newHour.toString();

  if (daysOffset !== 0) {
    if (dayOfWeek !== "*") {
      const dow = parseInt(dayOfWeek, 10);
      if (isNaN(dow)) return cron;
      // Note: This is a simple arithmetic shift and doesn't account for cron semantics fully.
      dayOfWeek = String((dow + (daysOffset % 7) + 7) % 7);
    } else if (dayOfMonth !== "*") {
      const dom = parseInt(dayOfMonth, 10);
      if (isNaN(dom)) return cron;
      const newDom = dom + daysOffset;
      if (newDom < 1 || newDom > 31) {
        // Cannot handle month boundaries, return original
        return cron;
      }
      dayOfMonth = String(newDom);
    }
  }

  return [minuteStr, hourStr, dayOfMonth, month, dayOfWeek].join(" ");
}
