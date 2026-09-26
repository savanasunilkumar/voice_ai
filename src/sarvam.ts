export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const SARVAM_API_URL = "https://api.sarvam.ai/v1/chat/completions";

export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_SARVAM_API_KEY — copy .env.example to .env and add your Sarvam key."
    );
  }

  const res = await fetch(SARVAM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      model: process.env.EXPO_PUBLIC_SARVAM_MODEL ?? "sarvam-m",
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sarvam API ${res.status}: ${body}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Unexpected Sarvam response shape");
  }
  return content;
}
