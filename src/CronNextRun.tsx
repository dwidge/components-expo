import React from "react";

import { StyledText } from "@dwidge/components-rnw";
import { useCronNextRun } from "./useCronNextRun.js";

export interface CronNextRunProps {
  cron?: string | null;
}

export const CronNextRun: React.FC<CronNextRunProps> = ({ cron }) => {
  const { nextRunDate, timeUntilNextRun } = useCronNextRun(cron);

  if (!nextRunDate) {
    return null;
  }

  return (
    <StyledText>
      {nextRunDate.toLocaleString()}
      {timeUntilNextRun && ` (${timeUntilNextRun})`}
    </StyledText>
  );
};
