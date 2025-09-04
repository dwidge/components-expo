import { AsyncDispatch, AsyncState } from "@dwidge/hooks-react";
import { useMemo } from "react";
import { applyCronOffset } from "./utils/applyCronOffset.js";

/**
 * React hook that maps a cron expression to an offset cron expression.
 *
 * @param cronTuple - A tuple containing the source cron string and an optional setter.
 * @param offsetSeconds - Number of seconds to offset the cron expression by.
 * @returns A tuple containing the offset cron string and an optional setter.
 */
export function useOffsetCron(
  cronTuple: AsyncState<string | null>,
  offsetSeconds: number,
): AsyncState<string | null> {
  const [cron, setCron] = cronTuple;

  const offsetCron = useMemo(
    () => (cron ? applyCronOffset(cron, offsetSeconds) : cron),
    [cron, offsetSeconds],
  );

  const setOffsetCron = useMemo<AsyncDispatch<string | null> | undefined>(
    () =>
      setCron
        ? async (newOffsetCron) => {
            const resolved = await (typeof newOffsetCron === "function"
              ? newOffsetCron(offsetCron ?? null)
              : newOffsetCron);
            const originalCron =
              resolved === null
                ? null
                : applyCronOffset(resolved, -offsetSeconds);
            return setCron(originalCron);
          }
        : undefined,
    [setCron, offsetSeconds, offsetCron],
  );

  return [offsetCron, setOffsetCron];
}
