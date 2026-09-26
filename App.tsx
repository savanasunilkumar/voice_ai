import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import {
  ChatMessage,
  sendChat,
  speechToText,
  textToSpeech,
} from "./src/sarvam";

type Msg = ChatMessage & { id: string };
type Phase = "idle" | "recording" | "thinking" | "speaking";

const SYSTEM_PROMPT: ChatMessage = {
  role: "system",
  content:
    "You are a helpful voice assistant. Reply briefly in the same language as the user.",
};

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Tap the mic and speak",
  recording: "Listening… tap to stop",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

let nextId = 0;
const makeId = () => `msg-${nextId++}`;

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    extension: ".wav",
    sampleRate: 16000,
    numberOfChannels: 1,
    web: { mimeType: "audio/webm" },
  });
  const player = useAudioPlayer();
  const historyRef = useRef<ChatMessage[]>([SYSTEM_PROMPT]);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) setPhase("idle");
    });
    return () => sub.remove();
  }, [player]);

  async function startRecording() {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setError("Microphone permission denied");
      return;
    }
    setError(null);
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase("recording");
  }

  async function stopAndRespond() {
    setPhase("thinking");
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) {
      setPhase("idle");
      return;
    }
    try {
      // On web the uri is a blob: URL — Sarvam needs a Blob in FormData there.
      const sttInput =
        Platform.OS === "web"
          ? { blob: await (await fetch(uri)).blob() }
          : { uri };
      const { transcript, languageCode } = await speechToText(sttInput);
      if (!transcript.trim()) {
        setError("Didn't catch that — try again");
        setPhase("idle");
        return;
      }
      setMessages((m) => [
        ...m,
        { id: makeId(), role: "user", content: transcript },
      ]);
      historyRef.current.push({ role: "user", content: transcript });

      const reply = await sendChat(historyRef.current);
      historyRef.current.push({ role: "assistant", content: reply });
      setMessages((m) => [
        ...m,
        { id: makeId(), role: "assistant", content: reply },
      ]);

      const wav = await textToSpeech(reply, languageCode);
      setPhase("speaking");
      await playBase64Wav(wav);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("idle");
    }
  }

  async function playBase64Wav(base64: string) {
    let uri: string;
    if (Platform.OS === "web") {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      uri = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
    } else {
      uri = `${FileSystem.cacheDirectory}reply-${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    player.replace({ uri });
    player.play();
  }

  function onMicPress() {
    if (phase === "recording") {
      stopAndRespond();
    } else if (phase === "idle") {
      startRecording();
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
            Speak in English, Hindi, Tamil, Telugu — Sarvam understands.
          </Text>
        }
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.footer}>
        <Text style={styles.phaseLabel}>{PHASE_LABEL[phase]}</Text>
        <Pressable
          style={[
            styles.mic,
            phase === "recording" && styles.micActive,
            (phase === "thinking" || phase === "speaking") &&
              styles.micDisabled,
          ]}
          onPress={onMicPress}
          disabled={phase === "thinking" || phase === "speaking"}
        >
          <Text style={styles.micIcon}>
            {phase === "recording" ? "■" : "🎙"}
          </Text>
        </Pressable>
      </View>
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
  error: { color: "#c00", textAlign: "center", paddingHorizontal: 16 },
  footer: { alignItems: "center", paddingVertical: 20 },
  phaseLabel: { color: "#666", marginBottom: 12, fontSize: 14 },
  mic: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#128c7e",
    alignItems: "center",
    justifyContent: "center",
  },
  micActive: { backgroundColor: "#d32f2f" },
  micDisabled: { opacity: 0.5 },
  micIcon: { color: "#fff", fontSize: 28 },
});
