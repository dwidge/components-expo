import { StyledText } from "@dwidge/components-rnw";
import React from "react";
import { getReadableFromCron } from "./getReadableFromCron.js";

export const StyledCronText: React.FC<
  React.ComponentProps<typeof StyledText> & { cron?: string | null }
> = ({ cron, ...props }) => (
  <StyledText {...props}>
    {cron ? (getReadableFromCron(cron) ?? "") : ""}
  </StyledText>
);
