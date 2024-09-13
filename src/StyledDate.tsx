// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import React from "react";
import { StyledText, StyledTextProps } from "@dwidge/components-rnw";
import { useRegionCode, useTimeZone } from "@dwidge/hooks-expo";
import { formatDate } from "@dwidge/utils-js";

export const StyledDate = ({
  date,
  children,
  ...props
}: {
  date?: Date | string | number | null;
  children?: Date | string | number | null;
} & Omit<StyledTextProps, "children">) => (
  <StyledText {...props}>
    {formatDate(date ?? children, useTimeZone(), useRegionCode())}
  </StyledText>
);
