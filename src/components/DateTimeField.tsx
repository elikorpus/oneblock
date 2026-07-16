import RNDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDateLong, formatTime12h } from '../lib/dateTimeFormat';
import { theme } from '../theme';

export type DateTimeFieldProps = {
  label: string;
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
};

/** Real native date/time picker — the value is always a well-formed Date, so unlike a free-text
 * input there's no way to submit an invalid date or time. Android's picker is a system dialog
 * opened imperatively; iOS's renders inline as a tappable "compact" control. */
export function DateTimeField({ label, mode, value, onChange, placeholder }: DateTimeFieldProps) {
  const current = value ?? new Date();
  const format = mode === 'date' ? formatDateLong : formatTime12h;
  const fallback = mode === 'date' ? 'Choose a date' : 'Choose a time';

  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: current,
      mode,
      onValueChange: (_event, date) => {
        if (date) onChange(date);
      },
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'android' ? (
        <Pressable onPress={openAndroidPicker} style={styles.input}>
          <Text style={[styles.valueText, !value && styles.placeholder]}>{value ? format(value) : (placeholder ?? fallback)}</Text>
        </Pressable>
      ) : (
        <View style={styles.iosWrap}>
          <RNDateTimePicker value={current} mode={mode} display="compact" onValueChange={(_event, date) => date && onChange(date)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    fontFamily: theme.font.bodyBold,
    fontSize: 11,
    letterSpacing: theme.label.tracking,
    textTransform: 'uppercase',
    color: theme.colors.inkSoft,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  valueText: { fontSize: 15, color: theme.colors.ink, fontFamily: theme.font.bodyRegular },
  placeholder: { color: theme.colors.inkSoft },
  iosWrap: { alignItems: 'flex-start' },
});
