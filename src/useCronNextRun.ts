import cronParser from "cron-parser";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useMemo, useState } from "react";

export const useCronNextRun = (
  cron?: string | null,
  refresh = 10000,
): {
  nextRunDate: Date | null;
  timeUntilNextRun: string | null;
} => {
  const parsedResult = useMemo(() => {
    if (!cron) {
      return { nextRunDate: null, error: null };
    }
    try {
      const interval = cronParser.parse(cron);
      const nextDate = interval.next().toDate();
      return { nextRunDate: nextDate, error: null };
    } catch (error) {
      return { nextRunDate: null, error: "Invalid cron" };
    }
  }, [cron]);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, refresh);

    return () => clearInterval(intervalId);
  }, []);

  const { nextRunDate, timeUntilNextRun } = useMemo(() => {
    if (parsedResult.error) {
      throw new Error("useCronNextRunE1: Invalid cron", {
        cause: parsedResult.error,
      });
    }

    if (!parsedResult.nextRunDate) {
      return { nextRunDate: null, timeUntilNextRun: null };
    }

    const { nextRunDate } = parsedResult;

    const distance = formatDistanceToNow(nextRunDate, { addSuffix: true });
    return { nextRunDate, timeUntilNextRun: distance };
  }, [parsedResult, now]);

  return { nextRunDate, timeUntilNextRun };
};
