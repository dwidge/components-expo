import { useRegionCode, useTimeZone } from "@dwidge/hooks-expo";
import { formatDate } from "@dwidge/utils-js";

export const useFormatDate = (date?: Date | string | number | null) =>
  formatDate(date, useTimeZone(), useRegionCode());
