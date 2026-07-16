import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { theme } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 3 && password.length >= 6;

  const signIn = async () => {
    if (!canSubmit || loading) return;
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (signInError) setError(signInError.message);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>🏡</Text>
            </View>
            <Text style={styles.wordmark}>
              oneblock<Text style={{ color: theme.colors.grass }}>.</Text>
            </Text>
            <Text style={styles.title}>Welcome back{'\n'}to the street.</Text>
            <Text style={styles.body}>
              One private, verified place for the people who actually live on your street. No strangers, no ads
              from across town.
            </Text>
          </View>
          <View style={styles.actions}>
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
              autoComplete="password"
              textContentType="password"
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button onPress={signIn} disabled={!canSubmit} loading={loading} style={{ marginTop: 4 }}>
              Sign in
            </Button>
            <Pressable onPress={() => navigation.navigate('Onboarding')} style={styles.newHereRow}>
              <Text style={styles.newHereText}>
                New here? <Text style={{ color: theme.colors.grass, fontFamily: theme.font.bodyBold }}>Create an account</Text>
              </Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('RealtorSignup')} style={styles.realtorRow}>
              <Text style={styles.realtorText}>Realtor? Sign up here</Text>
            </Pressable>
            <View style={styles.footerRow}>
              <MapPin size={13} color={theme.colors.grass} />
              <Text style={styles.footerText}>Every neighbor is verified before joining</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  hero: { paddingHorizontal: 28, paddingTop: 36, paddingBottom: 12 },
  badge: {
    width: 84,
    height: 84,
    backgroundColor: theme.colors.grass,
    borderWidth: theme.border.avatar,
    borderColor: theme.colors.ink,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
    marginBottom: 26,
    ...theme.hardShadow('lg'),
  },
  badgeEmoji: { fontSize: 40 },
  wordmark: { fontFamily: theme.font.displayBold, fontSize: 26, color: theme.colors.ink, marginBottom: 6 },
  title: {
    fontFamily: theme.font.displaySemibold,
    fontSize: 30,
    color: theme.colors.ink,
    lineHeight: 30 * theme.lineHeightMultiplier.tight,
  },
  body: {
    color: theme.colors.inkSoft,
    fontSize: 15,
    lineHeight: 15 * theme.lineHeightMultiplier.relaxed,
    marginTop: 14,
    fontFamily: theme.font.bodyRegular,
  },
  actions: { paddingHorizontal: 28, paddingBottom: 34, paddingTop: 8, gap: 4 },
  error: { color: theme.colors.red, fontSize: 12.5, fontFamily: theme.font.bodySemibold, marginBottom: 8 },
  newHereRow: { alignItems: 'center', marginTop: 14, marginBottom: 8 },
  newHereText: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold },
  realtorRow: { alignItems: 'center', marginBottom: 8 },
  realtorText: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, textDecorationLine: 'underline' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  footerText: { fontSize: 12.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold },
});
