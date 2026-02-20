/**
 * Native-aware date and datetime picker fields.
 *
 * DateTimePickerField  — for non-all-day events (date + time)
 * DatePickerField      — for all-day events (date only)
 *
 * Web:     delegates to WebDateTimePicker / <input type="date">
 * Android: chains a date dialog then a time dialog
 * iOS:     shows a bottom-sheet modal with an inline picker
 */
import { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";
import {
  WebDateTimePicker,
  dateTimeToPickerValues,
  pickerValuesToDateTimeString,
} from "./WebDateTimePicker";

const pad = (n: number) => String(n).padStart(2, "0");

function toLocalDateTimeString(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTimeDisplay(str: string): string {
  if (!str) return "Select date & time";
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateDisplay(str: string): string {
  if (!str) return "Select date";
  // Append noon to avoid day-off errors from timezone shift
  const d = new Date(str.length === 10 ? str + "T12:00:00" : str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// DateTimePickerField
// ---------------------------------------------------------------------------
interface DateTimePickerFieldProps {
  value: string; // YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
}

export function DateTimePickerField({ value, onChange }: DateTimePickerFieldProps) {
  const colors = useThemeColors();

  // Android: chain date → time dialogs
  const [androidMode, setAndroidMode] = useState<"none" | "date" | "time">("none");
  const [tempDate, setTempDate] = useState(new Date());

  // iOS: bottom-sheet modal with inline datetime picker
  const [iosVisible, setIosVisible] = useState(false);
  const [iosTemp, setIosTemp] = useState(new Date());

  const styles = useMemo(() => makeStyles(colors), [colors]);

  // ---- Web ----------------------------------------------------------------
  if (Platform.OS === "web") {
    const v = dateTimeToPickerValues(value);
    return (
      <WebDateTimePicker
        dateValue={v.date}
        hourValue={v.hour}
        minuteValue={v.minute}
        onDateChange={(d) => onChange(pickerValuesToDateTimeString(d, v.hour, v.minute))}
        onHourChange={(h) => onChange(pickerValuesToDateTimeString(v.date, h, v.minute))}
        onMinuteChange={(m) => onChange(pickerValuesToDateTimeString(v.date, v.hour, m))}
      />
    );
  }

  const currentDate = value ? new Date(value) : new Date();

  // ---- Android ------------------------------------------------------------
  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === "dismissed") {
      setAndroidMode("none");
      return;
    }
    if (androidMode === "date") {
      const d = selected ?? tempDate;
      setTempDate(d);
      setAndroidMode("time");
    } else {
      const d = selected ?? tempDate;
      const final = new Date(tempDate);
      final.setHours(d.getHours(), d.getMinutes(), 0, 0);
      onChange(toLocalDateTimeString(final));
      setAndroidMode("none");
    }
  };

  if (Platform.OS === "android") {
    return (
      <>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => {
            setTempDate(currentDate);
            setAndroidMode("date");
          }}
        >
          <Text style={styles.buttonText}>{formatDateTimeDisplay(value)}</Text>
        </Pressable>
        {androidMode !== "none" && (
          <DateTimePicker
            value={tempDate}
            mode={androidMode === "date" ? "date" : "time"}
            is24Hour={false}
            onChange={handleAndroidChange}
          />
        )}
      </>
    );
  }

  // ---- iOS ----------------------------------------------------------------
  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => {
          setIosTemp(currentDate);
          setIosVisible(true);
        }}
      >
        <Text style={styles.buttonText}>{formatDateTimeDisplay(value)}</Text>
      </Pressable>
      <Modal visible={iosVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Pressable
              style={styles.doneButton}
              onPress={() => {
                onChange(toLocalDateTimeString(iosTemp));
                setIosVisible(false);
              }}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
            <DateTimePicker
              value={iosTemp}
              mode="datetime"
              display="inline"
              onChange={(_, d) => d && setIosTemp(d)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// DatePickerField
// ---------------------------------------------------------------------------
interface DatePickerFieldProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

export function DatePickerField({ value, onChange }: DatePickerFieldProps) {
  const colors = useThemeColors();
  const [show, setShow] = useState(false);
  const [iosTemp, setIosTemp] = useState(new Date());

  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Parse date-only strings without timezone shift
  const currentDate = value
    ? new Date(value.length === 10 ? value + "T12:00:00" : value)
    : new Date();

  // ---- Web ----------------------------------------------------------------
  if (Platform.OS === "web") {
    const webStyle: React.CSSProperties = {
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "solid",
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
      width: "100%",
      boxSizing: "border-box",
      fontFamily: "inherit",
    };
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={webStyle}
      />
    );
  }

  // ---- Android ------------------------------------------------------------
  if (Platform.OS === "android") {
    return (
      <>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => setShow(true)}
        >
          <Text style={styles.buttonText}>{formatDateDisplay(value)}</Text>
        </Pressable>
        {show && (
          <DateTimePicker
            value={currentDate}
            mode="date"
            onChange={(event, selected) => {
              setShow(false);
              if (event.type === "set" && selected) {
                onChange(toLocalDateString(selected));
              }
            }}
          />
        )}
      </>
    );
  }

  // ---- iOS ----------------------------------------------------------------
  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => {
          setIosTemp(currentDate);
          setShow(true);
        }}
      >
        <Text style={styles.buttonText}>{formatDateDisplay(value)}</Text>
      </Pressable>
      <Modal visible={show} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Pressable
              style={styles.doneButton}
              onPress={() => {
                onChange(toLocalDateString(iosTemp));
                setShow(false);
              }}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
            <DateTimePicker
              value={iosTemp}
              mode="date"
              display="inline"
              onChange={(_, d) => d && setIosTemp(d)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared styles factory
// ---------------------------------------------------------------------------
function makeStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    button: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
    },
    pressed: { opacity: 0.7 },
    buttonText: { fontSize: 16, color: colors.text },
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: spacing.lg,
    },
    doneButton: {
      alignSelf: "flex-end",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    doneText: { fontSize: 16, fontWeight: "600", color: colors.primary },
  });
}
