import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatHM24, formatISODate, parseHM24, parseISODate } from '../lib/dateTimeFormat';
import { theme } from '../theme';

export type DateTimeFieldProps = {
  label: string;
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
};

const inputStyle: React.CSSProperties = {
  // Safari renders date/time inputs with OS-native chrome by default, which can
  // ignore width/max-width entirely. Resetting appearance forces it to respect
  // our box sizing instead of its own preferred (wider) native control size.
  WebkitAppearance: 'none',
  appearance: 'none',
  fontFamily: theme.font.bodyRegular,
  fontSize: 15,
  // Native date/time inputs can size their internal shadow-DOM segments using a
  // different implicit height when empty vs. when a value is set, making the box
  // change height as you fill it in, and can render slightly taller than a plain
  // text input even with the same line-height. Pinning an explicit height (same
  // value as Input.tsx) keeps the box a fixed size that matches other fields.
  lineHeight: '22px',
  height: 45,
  color: theme.colors.ink,
  padding: '10px 12px',
  borderRadius: theme.radius.md,
  border: `1.5px solid ${theme.colors.line}`,
  backgroundColor: theme.colors.card,
  outline: 'none',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  display: 'block',
};

/** The browser's own native date/time picker — same guarantee as the native version (an
 * <input type="date"/"time"> physically can't hold a malformed value). */
export function DateTimeField({ label, mode, value, onChange }: DateTimeFieldProps) {
  const stringValue = value ? (mode === 'date' ? formatISODate(value) : formatHM24(value)) : '';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputClip}>
        <input
          type={mode}
          value={stringValue}
          onChange={(e) => {
            const raw = e.target.value;
            if (!raw) return;
            onChange(mode === 'date' ? parseISODate(raw) : parseHM24(raw, value ?? new Date()));
          }}
          style={inputStyle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, width: '100%', minWidth: 0 },
  // Hard visual guarantee: even if Safari's native date/time control still wants
  // to render wider than the box we gave it, it physically can't spill past this.
  inputClip: { width: '100%', minWidth: 0, overflow: 'hidden', borderRadius: theme.radius.md },
  label: {
    fontFamily: theme.font.bodyBold,
    fontSize: 11,
    letterSpacing: theme.label.tracking,
    textTransform: 'uppercase',
    color: theme.colors.inkSoft,
    marginBottom: 4,
  },
});
