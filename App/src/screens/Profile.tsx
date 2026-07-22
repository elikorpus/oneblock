import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, Check, ChevronRight, LogOut, Pencil, Plus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { BackBar } from '../components/BackBar';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { ImageCropper } from '../components/ImageCropper';
import { Input } from '../components/Input';
import { PillTag } from '../components/PillTag';
import { SectionLabel } from '../components/SectionLabel';
import { INTEREST_GROUPS, TENURE } from '../data/constants';
import { FamilyMember } from '../data/types';
import { formatDateLong, parseISODate } from '../lib/dateTimeFormat';
import { supabase } from '../lib/supabase';
import { pickImage, uploadProfilePhoto } from '../lib/uploadImage';
import { AppStackParamList } from '../navigation/types';
import { Profile as ProfileType, useAppState } from '../state/AppStateContext';
import { theme } from '../theme';
import { notify } from '../lib/alert';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { profile, setProfile, updateAvatarUrl, myProfileId, logout, isBoardMember, session } = useAppState();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileType>(profile);
  const [addingFam, setAddingFam] = useState(false);
  const [fam, setFam] = useState<{ name: string; relation: FamilyMember['relation']; age: string; petType: string }>({
    name: '',
    relation: 'Kid',
    age: '',
    petType: '',
  });
  const [cropperUri, setCropperUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const changePhoto = async () => {
    const uri = await pickImage();
    if (!uri) return;
    setCropperUri(uri);
  };

  const finishPhotoCrop = async (croppedUri: string) => {
    setCropperUri(null);
    if (!myProfileId) return;
    setUploadingPhoto(true);
    const url = await uploadProfilePhoto(myProfileId, croppedUri);
    setUploadingPhoto(false);
    if (!url) {
      notify("Couldn't upload photo", 'Something went wrong uploading this photo. Try again.');
      return;
    }
    await updateAvatarUrl(url);
  };

  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const changeEmail = async () => {
    const trimmed = newEmail.trim();
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setEmailMsg('Enter a valid email.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setEmailMsg(error ? error.message : 'Check your new email for a confirmation link to finish the change.');
    if (!error) setNewEmail('');
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordMsg(error ? error.message : 'Password updated.');
    if (!error) {
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const v = editing ? draft : profile;
  const checks = [
    !!v.firstName,
    !!v.age,
    !!v.profession,
    !!v.street,
    !!v.bio,
    !!v.yearsIn,
    v.family.length > 0,
    v.interests.length >= 3,
  ];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };
  const save = () => {
    setProfile(draft);
    setEditing(false);
    setAddingFam(false);
  };
  const addFam = () => {
    if (!fam.name.trim()) return;
    setDraft((d) => ({
      ...d,
      family: [
        ...d.family,
        { name: fam.name, relation: fam.relation, age: fam.age, petType: fam.relation === 'Pet' ? fam.petType : undefined },
      ],
    }));
    setFam({ name: '', relation: 'Kid', age: '', petType: '' });
    setAddingFam(false);
  };
  const removeFam = (i: number) => setDraft((d) => ({ ...d, family: d.family.filter((_, idx) => idx !== i) }));
  const toggleInterest = (i: string) =>
    setDraft((d) => ({ ...d, interests: d.interests.includes(i) ? d.interests.filter((x) => x !== i) : [...d.interests, i] }));

  return (
    <View style={styles.screen}>
      <BackBar
        title="Your profile"
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={editing ? save : startEdit} style={styles.editBtn}>
            {editing ? <Check size={13} color={theme.colors.grass} /> : <Pencil size={13} color={theme.colors.grass} />}
            <Text style={styles.editText}>{editing ? 'Save' : 'Edit'}</Text>
          </Pressable>
        }
      />

      <ImageCropper uri={cropperUri} aspect={[1, 1]} onCancel={() => setCropperUri(null)} onDone={finishPhotoCrop} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headRow}>
          <Pressable onPress={changePhoto} disabled={uploadingPhoto} style={styles.avatarWrap}>
            <Avatar initials={(v.firstName[0] ?? 'E') + (v.lastName[0] ?? 'L')} bg={theme.colors.sky} photoUrl={v.avatarUrl} size={64} tilt={-4} />
            <View style={styles.avatarEditBadge}>
              <Camera size={13} color="#fff" />
            </View>
          </Pressable>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {v.firstName} {v.lastName}
              </Text>
              {isBoardMember && <PillTag tone="marigold">🏛 HOA Board</PillTag>}
            </View>
            <Text style={styles.meta}>
              {v.street} · here {v.yearsIn.toLowerCase()}
            </Text>
            <Text style={styles.profession}>{v.profession}</Text>
          </View>
        </View>

        {pct < 100 && (
          <View style={styles.strengthCard}>
            <View style={styles.strengthRow}>
              <Text style={styles.strengthLabel}>Profile strength</Text>
              <Text style={styles.strengthPct}>{pct}%</Text>
            </View>
            <View style={styles.strengthTrack}>
              <View style={[styles.strengthFill, { width: `${pct}%`, backgroundColor: theme.colors.marigold }]} />
            </View>
            <Text style={styles.strengthNote}>A complete profile is how matches and neighbors find you.</Text>
          </View>
        )}

        {editing ? (
          <Card style={{ marginBottom: 20 }}>
            <View style={styles.rowGap}>
              <View style={{ flex: 1 }}>
                <Input label="First name" value={draft.firstName} onChangeText={(t) => setDraft({ ...draft, firstName: t })} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Last name" value={draft.lastName} onChangeText={(t) => setDraft({ ...draft, lastName: t })} />
              </View>
            </View>
            <Input label="Age" value={draft.age} onChangeText={(t) => setDraft({ ...draft, age: t })} keyboardType="number-pad" />
            <Input label="What you do" value={draft.profession} onChangeText={(t) => setDraft({ ...draft, profession: t })} />
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.fieldLabel}>Time in the neighborhood</Text>
              <View style={styles.chipWrap}>
                {TENURE.map((t) => (
                  <Chip key={t} active={draft.yearsIn === t} onPress={() => setDraft({ ...draft, yearsIn: t })}>
                    {t}
                  </Chip>
                ))}
              </View>
            </View>
            <Input label="Street address" value={draft.street} onChangeText={(t) => setDraft({ ...draft, street: t })} />
            <Input label="Bio" value={draft.bio} onChangeText={(t) => setDraft({ ...draft, bio: t })} />

            <View style={styles.privacyRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.privacyLabel}>Private profile</Text>
                <Text style={styles.privacyNote}>
                  Neighbors will only see your name and shared interests — your address, contact info, bio, and
                  household stay hidden, even from the HOA board.
                </Text>
              </View>
              <Switch
                value={draft.isPrivate}
                onValueChange={(v) => setDraft({ ...draft, isPrivate: v })}
                trackColor={{ false: theme.colors.line, true: theme.colors.grass }}
                thumbColor="#fff"
              />
            </View>
          </Card>
        ) : null}

        {editing && (
          <Card style={{ marginBottom: 20 }}>
            <SectionLabel>Account</SectionLabel>
            <Input label="Email" value={newEmail} onChangeText={setNewEmail} placeholder={session?.user.email ?? 'you@example.com'} keyboardType="email-address" autoCapitalize="none" />
            {!!emailMsg && <Text style={styles.accountMsg}>{emailMsg}</Text>}
            <Pressable onPress={changeEmail} style={styles.accountBtn}>
              <Text style={styles.accountBtnText}>Change email</Text>
            </Pressable>

            <View style={{ height: 16 }} />

            <Input label="New password" value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" secureTextEntry />
            <Input label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" secureTextEntry />
            {!!passwordMsg && <Text style={styles.accountMsg}>{passwordMsg}</Text>}
            <Pressable onPress={changePassword} style={styles.accountBtn}>
              <Text style={styles.accountBtnText}>Change password</Text>
            </Pressable>
          </Card>
        )}

        {!editing && (
          <Card style={{ marginBottom: 20 }}>
            {[
              ['Age', v.age],
              ['Birthday', v.birthday ? formatDateLong(parseISODate(v.birthday)) : ''],
              ['What you do', v.profession],
              ['Time here', v.yearsIn],
              ['Address', v.street],
              ['Bio', v.bio],
              ['Private profile', v.isPrivate ? 'On 🔒' : 'Off'],
            ].map(([k, val], i, arr) => (
              <View key={k} style={[styles.staticRow, i < arr.length - 1 && styles.rowBorder]}>
                <Text style={styles.staticKey}>{k}</Text>
                <Text style={styles.staticVal}>{val}</Text>
              </View>
            ))}
          </Card>
        )}

        <SectionLabel>Your household</SectionLabel>
        <Card style={{ marginBottom: 20 }}>
          {v.family.length === 0 && <Text style={styles.householdNote}>Add family so neighbors know who belongs to your house.</Text>}
          {v.family.map((f, i) => (
            <View key={i} style={[styles.famRow, i < v.family.length - 1 && styles.rowBorder]}>
              <Avatar
                initials={f.name[0] || '?'}
                bg={f.relation === 'Kid' ? theme.colors.marigoldSoft : f.relation === 'Pet' ? theme.colors.peach : theme.colors.sky}
                size={34}
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
              {editing && (
                <Pressable onPress={() => removeFam(i)} hitSlop={8}>
                  <Trash2 size={15} color={theme.colors.inkSoft} />
                </Pressable>
              )}
            </View>
          ))}
          {editing &&
            (addingFam ? (
              <View style={{ paddingTop: 12 }}>
                <Input label="Name" value={fam.name} onChangeText={(t) => setFam({ ...fam, name: t })} placeholder="e.g. Theo" />
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
                    onChangeText={(t) => setFam({ ...fam, petType: t })}
                    placeholder="Dog, cat, fish…"
                  />
                )}
                <Input
                  label="Age (optional)"
                  value={fam.age}
                  onChangeText={(t) => setFam({ ...fam, age: t })}
                  placeholder="e.g. 6"
                  keyboardType="number-pad"
                />
                <View style={styles.rowGap}>
                  <Pressable onPress={addFam} style={styles.addToHouseholdBtn}>
                    <Text style={styles.addToHouseholdText}>Add to household</Text>
                  </Pressable>
                  <Pressable onPress={() => setAddingFam(false)} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setAddingFam(true)} style={styles.addFamRow}>
                <Plus size={14} color={theme.colors.grass} />
                <Text style={styles.addFamText}>Add family member</Text>
              </Pressable>
            ))}
        </Card>

        <SectionLabel>Your interests</SectionLabel>
        {editing ? (
          <View style={{ marginBottom: 24 }}>
            {INTEREST_GROUPS.map((group) => (
              <View key={group.category} style={{ marginBottom: 12 }}>
                <Text style={styles.interestGroupLabel}>{group.category}</Text>
                <View style={styles.chipWrap}>
                  {group.items.map((i) => (
                    <Chip key={i} active={draft.interests.includes(i)} onPress={() => toggleInterest(i)}>
                      {i}
                    </Chip>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.chipWrap, { marginBottom: 24 }]}>
            {v.interests.map((i) => (
              <Chip key={i} active>
                {i}
              </Chip>
            ))}
          </View>
        )}

        {editing ? (
          <Pressable onPress={save} style={styles.saveBtn}>
            <Check size={16} color="#fff" />
            <Text style={styles.saveBtnText}>Save profile</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={() => navigation.navigate('Sell')} style={styles.sellBtn}>
              <Text style={{ fontSize: 24 }}>🏡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.sellTitle}>Sell</Text>
                <Text style={styles.sellSub}>Your home value, certified realtors, and neighborhood scores</Text>
              </View>
              <ChevronRight size={18} color={theme.colors.paper} />
            </Pressable>
            <Pressable onPress={logout} style={styles.logoutBtn}>
              <LogOut size={15} color={theme.colors.red} />
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { fontSize: 12, fontFamily: theme.font.bodyBold, color: theme.colors.grass },
  content: { padding: 20 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatarWrap: { position: 'relative' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.ink,
    borderWidth: 2,
    borderColor: theme.colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontFamily: theme.font.displaySemibold, fontSize: 22, color: theme.colors.ink },
  meta: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold },
  profession: { fontSize: 12.5, color: theme.colors.ink, fontFamily: theme.font.bodySemibold },
  helped: { fontSize: 12, color: theme.colors.grassDeep, fontFamily: theme.font.bodyBold, marginTop: 2 },
  strengthCard: { backgroundColor: theme.colors.card, borderWidth: theme.border.width, borderColor: theme.colors.line, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 20 },
  strengthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  strengthLabel: { fontSize: 12, fontFamily: theme.font.bodyBold, color: theme.colors.ink, flex: 1, paddingRight: 8 },
  strengthPct: { fontFamily: theme.font.displayBold, fontSize: 15, color: theme.colors.grassDeep },
  strengthTrack: { backgroundColor: theme.colors.paper, borderWidth: 1, borderColor: theme.colors.line, borderRadius: 999, height: 8, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 999 },
  strengthNote: { fontSize: 11.5, color: theme.colors.inkSoft, fontFamily: theme.font.bodySemibold, marginTop: 6 },
  rowGap: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 11, fontFamily: theme.font.bodyBold, color: theme.colors.inkSoft, letterSpacing: theme.label.tracking, textTransform: 'uppercase' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  interestGroupLabel: {
    fontSize: 11,
    fontFamily: theme.font.bodyBold,
    color: theme.colors.inkSoft,
    letterSpacing: theme.label.tracking,
    textTransform: 'uppercase',
  },
  staticRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: theme.border.width, borderBottomColor: theme.colors.line },
  staticKey: { fontSize: 13, fontFamily: theme.font.bodyBold, color: theme.colors.inkSoft },
  staticVal: { fontSize: 13.5, fontFamily: theme.font.bodySemibold, color: theme.colors.ink, textAlign: 'right', paddingLeft: 16, flexShrink: 1 },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: theme.border.width,
    borderTopColor: theme.colors.line,
  },
  privacyLabel: { fontSize: 14, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  privacyNote: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular, marginTop: 3, lineHeight: 12 * 1.4 },
  householdNote: { fontSize: 13, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  famRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  famName: { fontSize: 14, fontFamily: theme.font.bodyBold, color: theme.colors.ink },
  famMeta: { fontSize: 12, color: theme.colors.inkSoft, fontFamily: theme.font.bodyRegular },
  addToHouseholdBtn: { flex: 1, paddingVertical: 10, backgroundColor: theme.colors.ink, borderRadius: 12, alignItems: 'center' },
  addToHouseholdText: { color: theme.colors.paper, fontFamily: theme.font.bodyBold, fontSize: 13 },
  cancelBtn: { paddingHorizontal: 16, justifyContent: 'center', borderWidth: theme.border.width, borderColor: theme.colors.line, borderRadius: 12 },
  cancelText: { fontFamily: theme.font.bodyBold, fontSize: 13, color: theme.colors.ink },
  addFamRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 12 },
  addFamText: { color: theme.colors.grass, fontFamily: theme.font.bodyBold, fontSize: 13.5 },
  saveBtn: { width: '100%', paddingVertical: 14, borderRadius: 16, backgroundColor: theme.colors.grass, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontFamily: theme.font.bodyBold, fontSize: 15 },
  sellBtn: { width: '100%', backgroundColor: theme.colors.ink, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellTitle: { color: theme.colors.paper, fontFamily: theme.font.displaySemibold, fontSize: 17 },
  sellSub: { color: theme.colors.onInkSoft, fontSize: 12.5, fontFamily: theme.font.bodyMedium },
  logoutBtn: { width: '100%', marginTop: 16, paddingVertical: 13, borderRadius: 14, borderWidth: theme.border.width, borderColor: theme.colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: theme.colors.red, fontFamily: theme.font.bodyBold, fontSize: 14 },
  accountMsg: { fontSize: 12, color: theme.colors.grassDeep, fontFamily: theme.font.bodySemibold, marginBottom: 8 },
  accountBtn: { paddingVertical: 10, borderRadius: 12, backgroundColor: theme.colors.ink, alignItems: 'center' },
  accountBtnText: { color: theme.colors.paper, fontFamily: theme.font.bodyBold, fontSize: 13.5 },
});
