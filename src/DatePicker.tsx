import { StyledText, StyledView } from "@dwidge/components-rnw";
import {
  AsyncState,
  getActionValueSync,
  OptionalState,
} from "@dwidge/hooks-react";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { Dispatch, SetStateAction, useState } from "react";
import {
  Button,
  Modal,
  Platform,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface DatePickerProps {
  value: OptionalState<Date | null> | AsyncState<Date | null>;
  style?: StyleProp<ViewStyle>;
}

/**
 * DatePicker Component for Expo web/native using native picker and web input with OptionalState.
 *
 * @param {DatePickerProps} props - The component props.
 * @returns {React.JSX.Element} The DatePicker component.
 */
export const DatePicker = ({
  value: [dateValue, setDateValue],
  style,
}: DatePickerProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState<Date | null>(dateValue ?? null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const onValueChange = (newDate: Date | null) => {
    if (setDateValue) {
      setDateValue(newDate);
    }
  };

  const onChangeNative = (event: any, selectedDate: Date | undefined) => {
    setIsPickerVisible(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const showPicker = () => {
    setIsPickerVisible(true);
  };

  const hidePicker = () => {
    setIsPickerVisible(false);
  };

  const confirmDate = () => {
    if (date) {
      onValueChange(date);
    }
    setModalVisible(false);
    hidePicker();
  };

  const cancelDate = () => {
    setModalVisible(false);
    setDate(dateValue ?? null);
    hidePicker();
  };

  const openModal = () => {
    setModalVisible(true);
    setDate(dateValue || new Date());
  };

  const handleWebInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const textValue = event.target.value;
    if (textValue) {
      const parsedDate = parseDateFromInput(textValue);
      setDate(parsedDate);
    } else {
      setDate(null);
    }
  };

  return (
    <View style={style}>
      <TouchableOpacity onPress={openModal}>
        <StyledText outline pad center>
          {dateValue ? formatDateDisplay(dateValue) : "Select Date"}
        </StyledText>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <StyledView flex middle pad gap background>
          <StyledText center bold>
            Select Date
          </StyledText>

          {Platform.OS !== "web" ? (
            <>
              <TouchableOpacity onPress={showPicker}>
                <StyledText center pad outline>
                  {date ? formatDateDisplay(date) : "Pick Date"}
                </StyledText>
              </TouchableOpacity>

              {isPickerVisible && (
                <DateTimePicker
                  value={date || new Date()}
                  mode="date"
                  display="default"
                  onChange={onChangeNative}
                />
              )}
            </>
          ) : (
            <input
              type="date"
              value={date ? formatDateForInput(date) : ""}
              onChange={handleWebInputChange}
              style={{ borderWidth: 1, padding: 10 }}
            />
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            <Button title="Cancel" onPress={cancelDate} />
            <Button title="Confirm" onPress={confirmDate} />
          </View>
        </StyledView>
      </Modal>
    </View>
  );
};

interface TimePickerProps {
  value: OptionalState<Date | null> | AsyncState<Date | null>;
  style?: StyleProp<ViewStyle>;
}

/**
 * TimePicker Component for Expo web/native using native picker and web input with OptionalState.
 *
 * @param {TimePickerProps} props - The component props.
 * @returns {React.JSX.Element} The TimePicker component.
 */
export const TimePicker = ({
  value: [timeValue, setTimeValue],
  style,
}: TimePickerProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [time, setTime] = useState<Date | null>(timeValue ?? null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const onValueChange = (newTime: Date | null) => {
    if (setTimeValue) {
      setTimeValue(newTime);
    }
  };

  const onChangeNative = (event: any, selectedTime: Date | undefined) => {
    setIsPickerVisible(Platform.OS === "ios");
    if (selectedTime) {
      setTime(selectedTime);
    }
  };
  const showPicker = () => {
    setIsPickerVisible(true);
  };
  const hidePicker = () => {
    setIsPickerVisible(false);
  };

  const confirmTime = () => {
    if (time) {
      onValueChange(time);
    }
    setModalVisible(false);
    hidePicker();
  };

  const cancelTime = () => {
    setModalVisible(false);
    setTime(timeValue ?? null);
    hidePicker();
  };

  const openModal = () => {
    setModalVisible(true);
    setTime(timeValue || new Date());
  };

  const handleWebInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const textValue = event.target.value;
    if (textValue) {
      const parsedTime = parseTimeFromInput(textValue, timeValue ?? null);
      setTime(parsedTime);
    } else {
      setTime(null);
    }
  };

  return (
    <View style={style}>
      <TouchableOpacity onPress={openModal}>
        <StyledText outline pad center>
          {timeValue ? formatTimeDisplay(timeValue) : "Select Time"}
        </StyledText>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <StyledView flex middle pad gap background>
          <StyledText center bold>
            Select Time
          </StyledText>

          {Platform.OS !== "web" ? (
            <>
              <TouchableOpacity onPress={showPicker}>
                <StyledText center pad outline>
                  {time ? formatTimeDisplay(time) : "Pick Time"}
                </StyledText>
              </TouchableOpacity>
              {isPickerVisible && (
                <DateTimePicker
                  value={time || new Date()}
                  mode="time"
                  display="default"
                  onChange={onChangeNative}
                />
              )}
            </>
          ) : (
            <input
              type="time"
              value={time ? formatTimeForInput(time) : ""}
              onChange={handleWebInputChange}
              style={{ borderWidth: 1, padding: 10 }}
            />
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            <Button title="Cancel" onPress={cancelTime} />
            <Button title="Confirm" onPress={confirmTime} />
          </View>
        </StyledView>
      </Modal>
    </View>
  );
};

export type DateRange = { startDate: Date | null; endDate: Date | null };

interface DateRangePickerProps {
  value: OptionalState<DateRange | null> | AsyncState<DateRange | null>;
  style?: StyleProp<ViewStyle>;
}

/**
 * DateRangePicker Component for Expo web/native with OptionalState.
 *
 * @param {DateRangePickerProps} props - The component props.
 * @returns {React.JSX.Element} The DateRangePicker component.
 */
export const DateRangePicker = ({
  value: [dateRangeValue, setDateRangeValue],
  style,
}: DateRangePickerProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [internalDateRange, setInternalDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>(dateRangeValue ?? { startDate: null, endDate: null });

  const setInternalStartDate: Dispatch<SetStateAction<Date | null>> = (
    newStartDate,
  ) => (
    setInternalDateRange((prev) => ({
      ...prev,
      startDate: getActionValueSync(newStartDate, null),
    })),
    newStartDate
  );

  const setInternalEndDate: Dispatch<SetStateAction<Date | null>> = (
    newEndDate,
  ) => (
    setInternalDateRange((prev) => ({
      ...prev,
      endDate: getActionValueSync(newEndDate, null),
    })),
    newEndDate
  );

  const confirmRange = () => {
    if (setDateRangeValue) {
      setDateRangeValue(internalDateRange);
    }
    setModalVisible(false);
  };

  const cancelRange = () => {
    setModalVisible(false);
  };

  const openModal = () => {
    setModalVisible(true);
    setInternalDateRange(
      dateRangeValue || { startDate: new Date(), endDate: new Date() },
    );
  };

  const getDisplayValue = () => {
    const startDateValue = internalDateRange.startDate;
    const endDateValue = internalDateRange.endDate;
    if (startDateValue && endDateValue) {
      return `${formatDateDisplay(startDateValue)} - ${formatDateDisplay(endDateValue)}`;
    } else if (startDateValue) {
      return `Start Date: ${formatDateDisplay(startDateValue)}`;
    } else if (endDateValue) {
      return `End Date: ${formatDateDisplay(endDateValue)}`;
    } else {
      return "Select Date Range";
    }
  };

  return (
    <View style={style}>
      <TouchableOpacity onPress={openModal}>
        <StyledText outline pad center>
          {getDisplayValue()}
        </StyledText>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <StyledView flex middle pad gap background>
          <StyledText center bold>
            Select Date Range
          </StyledText>
          <DatePicker
            value={[internalDateRange.startDate, setInternalStartDate]}
          />
          <DatePicker value={[internalDateRange.endDate, setInternalEndDate]} />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            <Button title="Cancel" onPress={cancelRange} />
            <Button title="Confirm" onPress={confirmRange} />
          </View>
        </StyledView>
      </Modal>
    </View>
  );
};

export const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString();
};

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateFromInput = (text: string): Date | null => {
  const parts = text.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day);
    }
  }
  return null;
};

export const formatTimeDisplay = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatTimeForInput = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const parseTimeFromInput = (
  text: string,
  currentDate: Date | null,
): Date | null => {
  const parts = text.split(":");
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (
      !isNaN(hours) &&
      !isNaN(minutes) &&
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59
    ) {
      let newDate = currentDate ? new Date(currentDate) : new Date();
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      return newDate;
    }
  }
  return null;
};
