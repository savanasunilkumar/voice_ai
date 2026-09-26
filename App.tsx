import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ChatMessage, sendChat } from "./src/sarvam";

type Msg = ChatMessage & { id: string };

const SYSTEM_PROMPT: ChatMessage = {
  role: "system",
  content:
    "You are a helpful multilingual voice assistant. Reply in the same language as the user.",
};

let nextId = 0;
const makeId = () => `msg-${nextId++}`;

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function onSend() {
    const text = input.trim();
    if (!text || sending) return;
    const userMsg: Msg = { id: makeId(), role: "user", content: text };
    const history = [SYSTEM_PROMPT, ...messages, userMsg];
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const reply = await sendChat(history);
      setMessages((m) => [
        ...m,
        { id: makeId(), role: "assistant", content: reply },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: makeId(),
          role: "assistant",
          content: `Error: ${e instanceof Error ? e.message : String(e)}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" ? styles.user : styles.assistant,
            ]}
          >
            <Text style={styles.bubbleText}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Ask anything — try Hindi, Tamil, Telugu, or English.
          </Text>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            editable={!sending}
            onSubmitEditing={onSend}
          />
          <Pressable
            style={[styles.send, sending && styles.sendDisabled]}
            onPress={onSend}
            disabled={sending}
          >
            <Text style={styles.sendText}>{sending ? "…" : "Send"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  list: { padding: 12, flexGrow: 1 },
  empty: { textAlign: "center", color: "#888", marginTop: 40 },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
  },
  user: { alignSelf: "flex-end", backgroundColor: "#dcf8c6" },
  assistant: { alignSelf: "flex-start", backgroundColor: "#f0f0f0" },
  bubbleText: { fontSize: 16 },
  inputRow: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
  },
  send: {
    marginLeft: 8,
    backgroundColor: "#128c7e",
    borderRadius: 20,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: "#fff", fontSize: 16 },
});
