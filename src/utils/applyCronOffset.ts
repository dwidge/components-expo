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

  let minute: number | string = parts[0];
  let hour: number | string = parts[1];

  if (minute === "*" || hour === "*") return cron;

  minute = parseInt(parts[0], 10);
  hour = parseInt(parts[1], 10);

  if (isNaN(minute) || isNaN(hour)) return cron;

  const totalSeconds = hour * 3600 + minute * 60 + offsetSeconds;
  const normalized = ((totalSeconds % 86400) + 86400) % 86400; // wrap within 24h

  const newHour = Math.floor(normalized / 3600);
  const newMinute = Math.floor((normalized % 3600) / 60);

  return [newMinute.toString(), newHour.toString(), ...parts.slice(2)].join(
    " ",
  );
}
