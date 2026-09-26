export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const BASE_URL = "https://api.sarvam.ai";

function apiKey(): string {
  const key = process.env.EXPO_PUBLIC_SARVAM_API_KEY;
  if (!key) {
    throw new Error(
      "Missing EXPO_PUBLIC_SARVAM_API_KEY — copy .env.example to .env and add your Sarvam key."
    );
  }
  return key;
}

export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey(),
    },
    body: JSON.stringify({
      model:
        process.env.EXPO_PUBLIC_SARVAM_MODEL ?? "sarvam-105b-conversations",
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`Sarvam chat ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Unexpected Sarvam response shape");
  }
  return content;
}

/** Transcribe an audio clip. Pass a Blob on web or a file URI on native. */
export async function speechToText(input: {
  blob?: Blob;
  uri?: string;
}): Promise<{ transcript: string; languageCode?: string }> {
  const form = new FormData();
  if (input.blob) {
    form.append("file", input.blob, "audio.webm");
  } else if (input.uri) {
    // React Native FormData file part
    form.append("file", {
      uri: input.uri,
      name: "audio.wav",
      type: "audio/wav",
    } as unknown as Blob);
  } else {
    throw new Error("speechToText needs a blob or uri");
  }
  form.append("model", "saarika:v2.5");
  form.append("language_code", "unknown");

  const res = await fetch(`${BASE_URL}/speech-to-text`, {
    method: "POST",
    headers: { "api-subscription-key": apiKey() },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Sarvam STT ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (typeof json?.transcript !== "string") {
    throw new Error("Unexpected Sarvam STT response shape");
  }
  return { transcript: json.transcript, languageCode: json.language_code };
}

/** Synthesize speech; resolves to base64-encoded WAV audio. */
export async function textToSpeech(
  text: string,
  languageCode = "en-IN"
): Promise<string> {
  const res = await fetch(`${BASE_URL}/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey(),
    },
    body: JSON.stringify({
      text: text.slice(0, 2500),
      target_language_code: languageCode,
      model: "bulbul:v3",
      speaker: "shubh",
    }),
  });

  if (!res.ok) {
    throw new Error(`Sarvam TTS ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  const audio = json?.audios?.[0];
  if (typeof audio !== "string") {
    throw new Error("Unexpected Sarvam TTS response shape");
  }
  return audio;
}
