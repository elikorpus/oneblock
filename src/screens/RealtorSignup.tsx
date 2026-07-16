import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AuthStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'RealtorSignup'>;

export function RealtorSignupScreen({ navigation }: Props) {
  const { realtorSignup } = useAppState();
  const [signupKey, setSignupKey] = useState('');
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const canSubmit = signupKey.trim().length > 0 && name.trim().length > 0 && emailOk && password.length >= 6;

  const submit = async () => {
    if (!canSubmit || loading) return;
    setError('');
    setLoading(true);
    try {
      await realtorSignup({ email: email.trim(), password, signupKey: signupKey.trim(), name: name.trim(), tag: tag.trim(), phone: phone.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong — check your realtor code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.wordmark}>
              oneblock<Text style={{ color: theme.colors.grass }}>.</Text> for realtors
            </Text>
            <Text style={styles.title}>See every community's{'\n'}OneBlock score.</Text>
            <Text style={styles.body}>Realtor accounts are separate from resident accounts — you'll see a scoreboard across every community, not one neighborhood's feed.</Text>
          </View>
          <View style={styles.actions}>
            <Input label="Realtor code" value={signupKey} onChangeText={setSignupKey} placeholder="From your OneBlock contact" autoCapitalize="characters" />
            <Input label="Full name" value={name} onChangeText={setName} placeholder="e.g. Lena Ward" />
            <Input label="Brokerage / tag" value={tag} onChangeText={setTag} placeholder="e.g. Ward Realty Group" />
            <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="(555) 555-1234" keyboardType="phone-pad" />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button onPress={submit} disabled={!canSubmit} loading={loading} style={{ marginTop: 4 }}>
              Create realtor account
            </Button>
            <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
              <Text style={styles.backText}>Back to sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  hero: { paddingHorizontal: 28, paddingTop: 36, paddingBottom: 12 },
  wordmark: { fontFamily: theme.font.displayBold, fontSize: 20, color: theme.colors.ink, marginBottom: 18 },
  title: {
    fontFamily: theme.font.displaySemibold,
    fontSize: 27,
    color: theme.colors.ink,
    lineHeight: 27 * theme.lineHeightMultiplier.tight,
  },
  body: {
    color: theme.colors.inkSoft,
    fontSize: 14,
    lineHeight: 14 * theme.lineHeightMultiplier.relaxed,
    marginTop: 12,
    fontFamily: theme.font.bodyRegular,
  },
  actions: { paddingHorizontal: 28, paddingBottom: 34, paddingTop: 12, gap: 4 },
  error: { color: theme.colors.red, fontSize: 12.5, fontFamily: theme.font.bodySemibold, marginBottom: 8 },
  backRow: { alignItems: 'center', marginTop: 16 },
  backText: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold },
});
