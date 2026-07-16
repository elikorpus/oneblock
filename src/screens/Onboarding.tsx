import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowRight, MapPin, Trash2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Input } from '../components/Input';
import { INTEREST_GROUPS, TENURE } from '../data/constants';
import { FamilyMember, House } from '../data/types';
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const CONFETTI_EMOJIS = ['🎉', '👋', '🌮', '🐶', '🎾', '☕', '📚', '🌱', '🏡', '✨', '🎈', '🌻', '🍕', '⚽', '🎨', '🐾'];
const CONFETTI_COUNT = 28;
const TOTAL_STEPS = 5;

type ConfettiSpec = {
  emoji: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
  sway: number;
  rotateDir: 1 | -1;
};

function makeConfettiSpecs(): ConfettiSpec[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
    left: 1 + Math.random() * 96,
    size: 14 + Math.random() * 18,
    duration: 3000 + Math.random() * 2400,
    delay: Math.random() * 3200,
    sway: 12 + Math.random() * 26,
    rotateDir: Math.random() > 0.5 ? 1 : -1,
  }));
}

function Dots({ step }: { step: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i).map((i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { width: i === step ? 22 : 8, backgroundColor: i <= step ? theme.colors.grass : theme.colors.line },
          ]}
        />
      ))}
    </View>
  );
}

function ConfettiPiece({ spec }: { spec: ConfettiSpec }) {
  const progress = useRef(new Animated.Value(0)).current;
  const { height } = Dimensions.get('window');
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: spec.duration,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [progress, spec.delay, spec.duration]);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: `${spec.left}%`,
        top: -24,
        fontSize: spec.size,
        opacity: progress.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.85] }) },
          {
            translateX: progress.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [0, spec.sway, 0, -spec.sway, 0],
            }),
          },
          {
            rotate: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${360 * spec.rotateDir}deg`],
            }),
          },
        ],
      }}
    >
      {spec.emoji}
    </Animated.Text>
  );
}

export function OnboardingScreen({ navigation }: Props) {
  const { completeSignup, listOpenHouses } = useAppState();
  const [step, setStep] = useState(0);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [openHouses, setOpenHouses] = useState<House[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [about, setAbout] = useState({
    firstName: '',
    lastName: '',
    age: '',
    profession: '',
    yearsIn: 'Just moved in',
    bio: '',
  });
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [fam, setFam] = useState<{ name: string; relation: FamilyMember['relation']; age: string; petType: string }>({
    name: '',
    relation: 'Kid',
    age: '',
    petType: '',
  });
  const [addingFam, setAddingFam] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState('');
  const confettiSpecs = useMemo(() => makeConfettiSpecs(), []);

  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const codeOk = code.trim().length >= 4 && emailOk && password.length >= 6;
  const aboutOk = about.firstName.trim().length > 0;

  const joinStep = async () => {
    if (!codeOk || checkingCode) return;
    setCheckingCode(true);
    setCodeError('');
    const { data, error } = await supabase.rpc('validate_signup_key', { key: code.trim() });
    if (error || !data || data.length === 0) {
      setCheckingCode(false);
      setCodeError("That code doesn't match a OneBlock community yet.");
      return;
    }
    const houses = await listOpenHouses(code.trim());
    setCheckingCode(false);
    if (houses.length === 0) {
      setCodeError('Every address in this community has already been claimed.');
      return;
    }
    setOpenHouses(houses);
    setStep(1);
  };

  const addFam = () => {
    if (!fam.name.trim()) return;
    setFamily((f) => [
      ...f,
      { name: fam.name, relation: fam.relation, age: fam.age, petType: fam.relation === 'Pet' ? fam.petType : undefined },
    ]);
    setFam({ name: '', relation: 'Kid', age: '', petType: '' });
    setAddingFam(false);
  };

  const finish = async () => {
    if (finishing || !selectedHouseId) return;
    setFinishing(true);
    setFinishError('');
    try {
      await completeSignup({
        email: email.trim(),
        password,
        signupKey: code.trim(),
        firstName: about.firstName || 'Neighbor',
        lastName: about.lastName,
        age: about.age,
        houseId: selectedHouseId,
        profession: about.profession,
        yearsIn: about.yearsIn,
        bio: about.bio,
        interests: picked,
        family,
      });
    } catch (e) {
      setFinishError(e instanceof Error ? e.message : 'Something went wrong finishing signup.');
      setFinishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step < TOTAL_STEPS && (
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.wordmark}>
                oneblock<Text style={{ color: theme.colors.grass }}>.</Text>
              </Text>
              <Pressable onPress={() => (step === 0 ? navigation.goBack() : setStep(step - 1))}>
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            </View>
            <Text style={styles.stepText}>
              Step {step + 1} of {TOTAL_STEPS}
            </Text>
            <Dots step={step} />
          </View>
        )}

        {step === 0 && (
          <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.h1}>Got your{'\n'}join code?</Text>
            <Text style={styles.lead}>
              It's on your welcome card or from a neighbor. Codes keep your community just for the people who live
              here.
            </Text>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              placeholder="CYP-BEND-24"
              placeholderTextColor={theme.colors.inkSoft}
              autoCapitalize="characters"
              style={[styles.codeInput, { borderColor: codeOk ? theme.colors.grass : theme.colors.line }]}
            />
            <View style={styles.hintRow}>
              <MapPin size={14} color={theme.colors.grass} />
              <Text style={styles.hintText}>We'll confirm your code before you continue</Text>
            </View>
            <View style={{ marginTop: 20 }}>
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
                placeholder="At least 6 characters"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                textContentType="newPassword"
              />
            </View>
            {!!codeError && <Text style={styles.errorText}>{codeError}</Text>}
            <View style={{ marginTop: 12, marginBottom: 24 }}>
              <Button
                disabled={!codeOk}
                loading={checkingCode}
                onPress={joinStep}
                trailing={<ArrowRight size={18} color={codeOk ? '#fff' : theme.colors.inkSoft} />}
              >
                Join with this code
              </Button>
            </View>
          </ScrollView>
        )}

        {step === 1 && (
          <ScrollView contentContainerStyle={[styles.stepContent, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.h1Sm}>Which house{'\n'}is yours?</Text>
            <Text style={styles.lead}>Only real, unclaimed addresses in this community show up here.</Text>
            <View style={{ marginTop: 16 }}>
              {openHouses.map((h) => {
                const active = selectedHouseId === h.id;
                return (
                  <Pressable
                    key={h.id}
                    onPress={() => setSelectedHouseId(h.id)}
                    style={[styles.houseRow, active && { borderColor: theme.colors.grass, backgroundColor: theme.colors.grassPale }]}
                  >
                    <MapPin size={16} color={active ? theme.colors.grassDeep : theme.colors.inkSoft} />
                    <Text style={[styles.houseText, active && { color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold }]}>{h.address}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ marginTop: 'auto', paddingTop: 16 }}>
              <Button
                disabled={!selectedHouseId}
                onPress={() => setStep(2)}
                trailing={<ArrowRight size={18} color={selectedHouseId ? '#fff' : theme.colors.inkSoft} />}
              >
                Next
              </Button>
            </View>
          </ScrollView>
        )}

        {step === 2 && (
          <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.h1Sm}>Tell the street{'\n'}about you.</Text>
            <Text style={styles.lead}>
              This becomes your Yellow Pages entry — how neighbors know who you are and what you do.
            </Text>
            <View style={styles.rowGap}>
              <View style={{ flex: 1 }}>
                <Input label="First name" value={about.firstName} onChangeText={(v) => setAbout({ ...about, firstName: v })} placeholder="Ella" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Last name" value={about.lastName} onChangeText={(v) => setAbout({ ...about, lastName: v })} placeholder="Lane" />
              </View>
            </View>
            <View style={styles.rowGap}>
              <View style={{ width: 96 }}>
                <Input label="Age" value={about.age} onChangeText={(v) => setAbout({ ...about, age: v })} placeholder="34" keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="What you do" value={about.profession} onChangeText={(v) => setAbout({ ...about, profession: v })} placeholder="Artist · brand founder" />
              </View>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.fieldLabel}>How long in the neighborhood?</Text>
              <View style={styles.chipWrap}>
                {TENURE.map((t) => (
                  <Chip key={t} active={about.yearsIn === t} onPress={() => setAbout({ ...about, yearsIn: t })}>
                    {t}
                  </Chip>
                ))}
              </View>
            </View>
            <Input label="Bio (one good line)" value={about.bio} onChangeText={(v) => setAbout({ ...about, bio: v })} placeholder="Chronic borrower of folding tables." />
            <View style={{ marginTop: 8 }}>
              <Button disabled={!aboutOk} onPress={() => setStep(3)} trailing={<ArrowRight size={18} color={aboutOk ? '#fff' : theme.colors.inkSoft} />}>
                Next
              </Button>
            </View>
          </ScrollView>
        )}

        {step === 3 && (
          <ScrollView contentContainerStyle={[styles.stepContent, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.h1Sm}>Who's in{'\n'}your house?</Text>
            <Text style={styles.lead}>
              Spouse, kids, the dog — so neighbors know who belongs to your porch. Optional, always editable.
            </Text>
            {family.map((f, i) => (
              <View key={i} style={styles.famRow}>
                <Avatar
                  initials={f.name[0] || '?'}
                  bg={f.relation === 'Kid' ? theme.colors.marigoldSoft : f.relation === 'Pet' ? theme.colors.peach : theme.colors.sky}
                  size={32}
                  tilt={3}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.famName}>{f.name}</Text>
                  <Text style={styles.famMeta}>
                    {f.relation}
                    {f.petType ? ` · ${f.petType}` : ''}
                    {f.age ? ` · ${f.age}` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => setFamily((fs) => fs.filter((_, idx) => idx !== i))} hitSlop={8}>
                  <Trash2 size={14} color={theme.colors.inkSoft} />
                </Pressable>
              </View>
            ))}
            {addingFam ? (
              <View style={styles.famCard}>
                <Input label="Name" value={fam.name} onChangeText={(v) => setFam({ ...fam, name: v })} placeholder="e.g. Theo" />
                <View style={[styles.chipWrap, { marginBottom: 12 }]}>
                  {(['Spouse', 'Kid', 'Pet'] as const).map((r) => (
                    <Chip key={r} active={fam.relation === r} onPress={() => setFam({ ...fam, relation: r })}>
                      {r}
                    </Chip>
                  ))}
                </View>
                {fam.relation === 'Pet' && (
                  <Input
                    label="Pet type"
                    value={fam.petType}
                    onChangeText={(v) => setFam({ ...fam, petType: v })}
                    placeholder="Dog, cat, fish…"
                  />
                )}
                <Input
                  label="Age (optional)"
                  value={fam.age}
                  onChangeText={(v) => setFam({ ...fam, age: v })}
                  placeholder="e.g. 6"
                  keyboardType="number-pad"
                />
                <View style={styles.rowGap}>
                  <View style={{ flex: 1 }}>
                    <Button variant="dark" size="md" onPress={addFam}>
                      Add
                    </Button>
                  </View>
                  <Button variant="outline" size="md" block={false} onPress={() => setAddingFam(false)} style={{ paddingHorizontal: 16 }}>
                    Cancel
                  </Button>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setAddingFam(true)} style={styles.addFamBtn}>
                <Text style={styles.addFamText}>+ Add family member</Text>
              </Pressable>
            )}
            <View style={{ marginTop: 'auto', paddingTop: 16 }}>
              <Button onPress={() => setStep(4)} trailing={<ArrowRight size={18} color="#fff" />}>
                {family.length > 0 ? 'Next' : 'Skip for now'}
              </Button>
            </View>
          </ScrollView>
        )}

        {step === 4 && (
          <ScrollView contentContainerStyle={[styles.stepContent, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.h1Sm}>What are{'\n'}you into?</Text>
            <Text style={styles.lead}>Powers Neighbor Match. Only shown to matched neighbors.</Text>
            {INTEREST_GROUPS.map((group) => (
              <View key={group.category} style={{ marginTop: 16 }}>
                <Text style={styles.interestGroupLabel}>{group.category}</Text>
                <View style={styles.chipWrap}>
                  {group.items.map((i) => (
                    <Chip
                      key={i}
                      active={picked.includes(i)}
                      onPress={() => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
                    >
                      {i}
                    </Chip>
                  ))}
                </View>
              </View>
            ))}
            <View style={{ marginTop: 'auto', paddingTop: 24 }}>
              <Text style={styles.pickedCount}>{picked.length} selected</Text>
              <Button
                variant="dark"
                onPress={() => {
                  Keyboard.dismiss();
                  setStep(5);
                }}
              >
                Finish
              </Button>
            </View>
          </ScrollView>
        )}

        {step === 5 && (
          <View style={styles.confettiScreen}>
            {confettiSpecs.map((spec, i) => (
              <ConfettiPiece key={i} spec={spec} />
            ))}
            <View style={styles.confettiCenter}>
              <View style={styles.confettiBadge}>
                <Text style={{ fontSize: 40 }}>🏡</Text>
              </View>
              <Text style={styles.confettiTitle}>
                You're in,{'\n'}
                {about.firstName || 'neighbor'}.
              </Text>
              <Text style={styles.confettiBody}>
                One last step — we're setting up your spot on the street.
              </Text>
              {!!finishError && <Text style={[styles.errorText, { marginTop: 12 }]}>{finishError}</Text>}
            </View>
            <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
              <Button onPress={finish} loading={finishing}>
                Open OneBlock
              </Button>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { fontFamily: theme.font.displayBold, fontSize: 22, color: theme.colors.ink },
  backText: { fontSize: 13, fontFamily: theme.font.bodyBold, color: theme.colors.inkSoft },
  stepText: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, marginTop: 6 },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dot: { height: 8, borderRadius: theme.radius.pill },
  stepContent: { paddingHorizontal: 24, paddingBottom: 16 },
  h1: {
    fontFamily: theme.font.displaySemibold,
    fontSize: 32,
    color: theme.colors.ink,
    lineHeight: 32 * theme.lineHeightMultiplier.snug,
    marginTop: 12,
  },
  h1Sm: {
    fontFamily: theme.font.displaySemibold,
    fontSize: 30,
    color: theme.colors.ink,
    lineHeight: 30 * theme.lineHeightMultiplier.snug,
  },
  lead: { color: theme.colors.inkSoft, fontSize: 14.5, lineHeight: 14.5 * theme.lineHeightMultiplier.relaxed, marginTop: 12, fontFamily: theme.font.bodyRegular },
  codeInput: {
    width: '100%',
    marginTop: 32,
    paddingVertical: 16,
    paddingHorizontal: 20,
    textAlign: 'center',
    fontFamily: theme.font.displaySemibold,
    fontSize: 26,
    letterSpacing: 2,
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderRadius: 18,
    color: theme.colors.ink,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, justifyContent: 'center' },
  hintText: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold },
  houseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.card,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  houseText: { fontSize: 15, fontFamily: theme.font.bodySemibold, color: theme.colors.ink },
  errorText: { fontSize: 12.5, color: theme.colors.red, fontFamily: theme.font.bodySemibold, textAlign: 'center' },
  rowGap: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 11, fontFamily: theme.font.bodyBold, color: theme.colors.inkSoft, letterSpacing: theme.label.tracking, textTransform: 'uppercase' },
  interestGroupLabel: {
    fontSize: 11,
    fontFamily: theme.font.bodyBold,
    color: theme.colors.inkSoft,
    letterSpacing: theme.label.tracking,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  famRow: {
    backgroundColor: theme.colors.card,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  famName: { fontSize: 14, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  famMeta: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  famCard: {
    backgroundColor: theme.colors.card,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  addFamBtn: {
    width: '100%',
    paddingVertical: 12,
    borderWidth: theme.border.width,
    borderStyle: 'dashed',
    borderColor: theme.colors.grass,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  addFamText: { color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold, fontSize: 14 },
  pickedCount: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, marginBottom: 12, textAlign: 'center' },
  confettiScreen: { flex: 1, overflow: 'hidden' },
  confettiCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  confettiBadge: {
    width: 84,
    height: 84,
    backgroundColor: theme.colors.grass,
    borderWidth: theme.border.avatar,
    borderColor: theme.colors.ink,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
    marginBottom: 24,
    ...theme.hardShadow('lg'),
  },
  confettiTitle: {
    fontFamily: theme.font.displayBold,
    fontSize: 36,
    color: theme.colors.ink,
    lineHeight: 36 * theme.lineHeightMultiplier.tight,
    textAlign: 'center',
  },
  confettiBody: {
    color: theme.colors.inkSoft,
    fontSize: 15,
    fontFamily: theme.font.bodyMedium,
    lineHeight: 15 * theme.lineHeightMultiplier.relaxed,
    marginTop: 12,
    textAlign: 'center',
  },
});
