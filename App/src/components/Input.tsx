import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '../theme';

export type InputProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
} & Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'secureTextEntry' | 'autoComplete' | 'textContentType'>;

/** Labeled text field — uppercase eyebrow label + card-bordered input, per Input.jsx. */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  autoComplete,
  textContentType,
}: InputProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inkSoft}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        autoComplete={autoComplete}
        textContentType={textContentType}
        style={styles.input}
      />
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
  },
  input: {
    marginTop: 4,
    backgroundColor: theme.colors.card,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    height: 45,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.ink,
    fontFamily: theme.font.bodyRegular,
  },
});
