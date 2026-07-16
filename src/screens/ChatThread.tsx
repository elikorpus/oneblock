import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Send } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { BackBar } from '../components/BackBar';
import { PersonLink } from '../components/PersonLink';
import { AppStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'ChatThread'>;

export function ChatThreadScreen({ route, navigation }: Props) {
  const { askId } = route.params;
  const { asks, sendChatMessage, communityName, myProfileId } = useAppState();
  const ask = asks.find((a) => a.id === askId)!;
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = () => {
    if (!text.trim()) return;
    sendChatMessage(ask.id, text.trim());
    setText('');
  };

  const goToAuthorProfile = () => {
    if (ask.authorId === myProfileId) navigation.navigate('Profile');
    else navigation.navigate('PersonProfile', { personId: ask.authorId });
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <BackBar
        title={ask.who}
        onBack={() => navigation.goBack()}
        onTitlePress={goToAuthorProfile}
        right={
          <PersonLink personId={ask.authorId}>
            <Avatar initials={ask.initials} bg={ask.bg} size={30} tilt={-3} />
          </PersonLink>
        }
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        <Text style={styles.kind}>{ask.kind}{communityName ? ` · ${communityName}` : ''}</Text>
        {ask.messages.map((m, i) => (
          <View key={i} style={[styles.row, { justifyContent: m.from === 'you' ? 'flex-end' : 'flex-start' }]}>
            <View
              style={[
                styles.bubble,
                { backgroundColor: m.from === 'you' ? theme.colors.grass : theme.colors.card, borderWidth: m.from === 'you' ? 0 : theme.border.width },
              ]}
            >
              <Text style={{ color: m.from === 'you' ? '#fff' : theme.colors.ink, fontSize: 14, lineHeight: 14 * 1.4 }}>{m.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          placeholder="Message…"
          placeholderTextColor={theme.colors.inkSoft}
          style={styles.input}
        />
        <Pressable onPress={send} style={styles.sendBtn}>
          <Send size={17} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.paper },
  messages: { padding: 16 },
  kind: { fontSize: 11, fontFamily: theme.font.bodyBold, color: theme.colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 10 },
  bubble: { borderColor: theme.colors.line, borderRadius: 16, maxWidth: '80%', paddingVertical: 10, paddingHorizontal: 14 },
  inputRow: { borderTopWidth: theme.border.width, borderTopColor: theme.colors.line, backgroundColor: theme.colors.card, padding: 12, flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: theme.border.width,
    borderColor: theme.colors.line,
    borderRadius: 999,
    fontSize: 14,
    color: theme.colors.ink,
    backgroundColor: theme.colors.paper,
    fontFamily: theme.font.bodyRegular,
  },
  sendBtn: { backgroundColor: theme.colors.grass, borderRadius: 999, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
});
