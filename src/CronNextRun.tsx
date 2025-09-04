import React from "react";

import { StyledText } from "@dwidge/components-rnw";
import { useCronNextRun } from "./useCronNextRun.js";
import { useFormatDate } from "./useFormatDate.js";

export interface CronNextRunProps {
  cron?: string | null;
}

export const CronNextRun: React.FC<CronNextRunProps> = ({ cron }) => {
  const { nextRunDate, timeUntilNextRun } = useCronNextRun(cron);
  const formatDate = useFormatDate(nextRunDate);

  if (!nextRunDate) {
    return null;
  }

  return (
    <StyledText>
      {formatDate}
      {timeUntilNextRun && ` (${timeUntilNextRun})`}
    </StyledText>
  );
};
