import React, { SetStateAction, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";

import { StyledButton, StyledText, StyledView } from "@dwidge/components-rnw";
import { AsyncState } from "@dwidge/hooks-react";
import { Picker } from "@react-native-picker/picker";
import { DatePicker, TimePicker } from "./DatePicker";
import { StyledCronText } from "./StyledCronText";

type Frequency = "daily" | "weekly" | "monthly" | "yearly" | "custom";

interface SelectedMonthDay {
  month: number;
  day: number;
}

const generateCron = (
  frequency: Frequency,
  selectedDaysOfWeek: number[],
  selectedDayOfMonth: Date | null,
  selectedMonthDay: SelectedMonthDay | null,
  time: Date | null,
): string => {
  const effectiveTime = time || new Date();
  const minute = effectiveTime.getMinutes();
  const hour = effectiveTime.getHours();

  const defaultDayOfWeek = "0";
  const defaultDayOfMonth = "1";
  const defaultMonth = "1";
  const defaultDayOfYear = "1";

  switch (frequency) {
    case "daily":
      return `${minute} ${hour} * * *`;
    case "weekly":
      const daysOfWeek =
        selectedDaysOfWeek.length > 0
          ? selectedDaysOfWeek.sort().join(",")
          : defaultDayOfWeek;
      return `${minute} ${hour} * * ${daysOfWeek}`;
    case "monthly":
      const dayOfMonth = selectedDayOfMonth
        ? selectedDayOfMonth.getDate()
        : defaultDayOfMonth;
      return `${minute} ${hour} ${dayOfMonth} * *`;
    case "yearly":
      const month = selectedMonthDay ? selectedMonthDay.month : defaultMonth;
      const day = selectedMonthDay ? selectedMonthDay.day : defaultDayOfYear;
      return `${minute} ${hour} ${day} ${month} *`;
    case "custom":
      return "* * * * *";
    default:
      return "* * * * *";
  }
};

interface ParsedCron {
  frequency: Frequency;
  time: Date | null;
  daysOfWeek: number[];
  dayOfMonth: Date | null;
  monthDay: SelectedMonthDay | null;
}

const parseCronString = (cronString: string | null): ParsedCron => {
  let parsedFrequency: Frequency = "daily";
  let parsedTime: Date | null = new Date();
  let parsedDaysOfWeek: number[] = [];
  let parsedDayOfMonth: Date | null = null;
  let parsedMonthDay: SelectedMonthDay | null = null;

  if (cronString) {
    const parts = cronString.split(" ");
    if (parts.length === 5) {
      const [minute, hour, dom, month, dow] = parts;

      const newTime = new Date();
      const parsedHour = parseInt(hour, 10);
      const parsedMinute = parseInt(minute, 10);

      if (!isNaN(parsedHour) && !isNaN(parsedMinute)) {
        newTime.setHours(parsedHour);
        newTime.setMinutes(parsedMinute);
        parsedTime = newTime;
      } else {
        parsedTime = null;
      }

      const isDomWildcard = dom === "*";
      const isMonthWildcard = month === "*";
      const isDowWildcard = dow === "*";

      if (isDomWildcard && isMonthWildcard && isDowWildcard) {
        parsedFrequency = "daily";
      } else if (isDomWildcard && isMonthWildcard && !isDowWildcard) {
        parsedFrequency = "weekly";
        parsedDaysOfWeek = dow.split(",").map(Number);
      } else if (!isDomWildcard && isMonthWildcard && isDowWildcard) {
        parsedFrequency = "monthly";
        const day = parseInt(dom, 10);
        if (!isNaN(day)) {
          parsedDayOfMonth = new Date(2000, 0, day);
        }
      } else if (!isDomWildcard && !isMonthWildcard && isDowWildcard) {
        parsedFrequency = "yearly";
        const d = parseInt(dom, 10);
        const m = parseInt(month, 10);
        if (!isNaN(d) && !isNaN(m)) {
          parsedMonthDay = { day: d, month: m };
        }
      } else {
        parsedFrequency = "custom";
      }
    } else {
      parsedFrequency = "custom";
    }
  } else {
    parsedFrequency = "daily";
    parsedTime = new Date();
  }

  return {
    frequency: parsedFrequency,
    time: parsedTime,
    daysOfWeek: parsedDaysOfWeek,
    dayOfMonth: parsedDayOfMonth,
    monthDay: parsedMonthDay,
  };
};

export interface CronIntervalPickerProps {
  value: AsyncState<string | null>;
}

export const CronIntervalPicker: React.FC<CronIntervalPickerProps> = ({
  value: [parentValue, setParentValue],
}) => {
  const isReadonly = setParentValue === undefined;

  const parsedCron = useMemo(
    () => parseCronString(parentValue ?? null),
    [parentValue],
  );

  const {
    frequency: derivedFrequency,
    time: derivedTime,
    daysOfWeek: derivedDaysOfWeek,
    dayOfMonth: derivedDayOfMonth,
    monthDay: derivedMonthDay,
  } = parsedCron;

  const emitNewCron = useCallback(
    (
      newFreq: Frequency = derivedFrequency,
      newSelectedDaysOfWeek: number[] = derivedDaysOfWeek,
      newSelectedDayOfMonth: Date | null = derivedDayOfMonth,
      newSelectedMonthDay: SelectedMonthDay | null = derivedMonthDay,
      newSelectedTime: Date | null = derivedTime,
    ) => {
      if (setParentValue) {
        const cronString = generateCron(
          newFreq,
          newSelectedDaysOfWeek,
          newSelectedDayOfMonth,
          newSelectedMonthDay,
          newSelectedTime,
        );
        setParentValue(cronString);
      }
    },
    [
      setParentValue,
      derivedFrequency,
      derivedDaysOfWeek,
      derivedDayOfMonth,
      derivedMonthDay,
      derivedTime,
    ],
  );

  const handleFrequencyChange = useCallback(
    (newFreq: Frequency) => {
      emitNewCron(newFreq);
    },
    [emitNewCron],
  );

  const handleTimeChange = useCallback(
    (newValue: SetStateAction<Date | null>) => {
      const resolvedTime =
        typeof newValue === "function"
          ? (newValue as (prev: Date | null) => Date | null)(derivedTime)
          : newValue;
      emitNewCron(undefined, undefined, undefined, undefined, resolvedTime);
    },
    [emitNewCron, derivedTime],
  );

  const handleDayOfMonthChange = useCallback(
    (newValue: SetStateAction<Date | null>) => {
      const resolvedDate =
        typeof newValue === "function"
          ? (newValue as (prev: Date | null) => Date | null)(derivedDayOfMonth)
          : newValue;
      emitNewCron(undefined, undefined, resolvedDate);
    },
    [emitNewCron, derivedDayOfMonth],
  );

  const handleDayOfWeekToggle = useCallback(
    (dayIndex: number) => {
      const newDays = derivedDaysOfWeek.includes(dayIndex)
        ? derivedDaysOfWeek.filter((d) => d !== dayIndex)
        : [...derivedDaysOfWeek, dayIndex].sort();
      emitNewCron(undefined, newDays);
    },
    [derivedDaysOfWeek, emitNewCron],
  );

  const yearlyDatePickerValue = useMemo(() => {
    return derivedMonthDay
      ? new Date(2000, derivedMonthDay.month - 1, derivedMonthDay.day)
      : null;
  }, [derivedMonthDay]);

  const handleYearlyDatePickerChange = useCallback(
    (newValue: SetStateAction<Date | null>) => {
      const resolvedDate =
        typeof newValue === "function"
          ? (newValue as (prev: Date | null) => Date | null)(
              yearlyDatePickerValue,
            )
          : newValue;

      let newSelectedMonthDay: SelectedMonthDay | null = null;
      if (resolvedDate) {
        newSelectedMonthDay = {
          month: resolvedDate.getMonth() + 1,
          day: resolvedDate.getDate(),
        };
      }
      emitNewCron(undefined, undefined, undefined, newSelectedMonthDay);
    },
    [emitNewCron, yearlyDatePickerValue],
  );

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <StyledView gap>
      <StyledText style={styles.label}>Frequency:</StyledText>
      <Picker<Frequency>
        selectedValue={derivedFrequency}
        onValueChange={isReadonly ? undefined : handleFrequencyChange}
        enabled={!isReadonly}
        style={styles.picker}
        itemStyle={styles.pickerItem}
      >
        <Picker.Item label="Daily" value="daily" />
        <Picker.Item label="Weekly" value="weekly" />
        <Picker.Item label="Monthly" value="monthly" />
        <Picker.Item label="Yearly" value="yearly" />
      </Picker>

      {(derivedFrequency === "daily" ||
        derivedFrequency === "weekly" ||
        derivedFrequency === "monthly" ||
        derivedFrequency === "yearly") && (
        <StyledView style={styles.section}>
          <StyledText style={styles.label}>Time:</StyledText>
          <TimePicker
            value={[derivedTime, isReadonly ? undefined : handleTimeChange]}
          />
        </StyledView>
      )}

      {derivedFrequency === "weekly" && (
        <StyledView style={styles.section}>
          <StyledText style={styles.label}>Days of Week:</StyledText>
          <StyledView style={styles.daysContainer}>
            {days.map((day, index) => (
              <StyledButton
                key={day}
                style={styles.dayButton}
                type={derivedDaysOfWeek.includes(index) ? "solid" : "outline"}
                onPress={
                  isReadonly ? undefined : () => handleDayOfWeekToggle(index)
                }
                disabled={isReadonly}
              >
                <StyledText style={styles.dayButtonText}>{day}</StyledText>
              </StyledButton>
            ))}
          </StyledView>
        </StyledView>
      )}

      {derivedFrequency === "monthly" && (
        <StyledView style={styles.section}>
          <StyledText style={styles.label}>Day of Month:</StyledText>
          <DatePicker
            value={[
              derivedDayOfMonth,
              isReadonly ? undefined : handleDayOfMonthChange,
            ]}
          />
        </StyledView>
      )}

      {derivedFrequency === "yearly" && (
        <StyledView style={styles.section}>
          <StyledText style={styles.label}>Month and Day:</StyledText>
          <DatePicker
            value={[
              yearlyDatePickerValue,
              isReadonly ? undefined : handleYearlyDatePickerChange,
            ]}
          />
        </StyledView>
      )}

      <StyledView row space>
        <StyledCronText style={styles.cronOutput} cron={parentValue} />
        <StyledText gray>{parentValue || "N/A"}</StyledText>
      </StyledView>
    </StyledView>
  );
};

const styles = StyleSheet.create({
  container: {},
  label: {},
  picker: {},
  pickerItem: {},
  section: {},
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  dayButton: {},
  dayButtonText: {},
  cronOutput: {},
});
