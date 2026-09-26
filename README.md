# Voice AI

A speak-to-it, it-speaks-back voice assistant app powered by [Sarvam AI](https://www.sarvam.ai) — multilingual across Indian languages.

## How it works

Tap the mic, speak, tap again to stop. The app then:

1. **Sarvam STT** (`saarika:v2.5`) transcribes your speech, auto-detecting language
2. **Sarvam chat** (`sarvam-105b-conversations`) generates a reply in the same language
3. **Sarvam TTS** (`bulbul:v3`, "shubh" voice) speaks the reply aloud

Transcripts stay visible on screen as chat bubbles.

## Stack

- **Expo / React Native** (SDK 54) — iOS, Android, and web from one codebase
- **expo-audio** for mic recording and playback
- **Sarvam AI** speech-to-text, chat completions, and text-to-speech APIs

## Getting started

1. Install Node.js 20.19+ (or 22.x).
2. `npm install` — if versions drift, run `npx expo install --fix`.
3. `cp .env.example .env` and add your Sarvam API key from <https://dashboard.sarvam.ai>.
4. `npm start`, then scan the QR code with Expo Go or press `a`/`i` for an emulator/simulator.
5. Grant microphone permission when prompted.

> Note: `EXPO_PUBLIC_*` vars are bundled into the app — fine for local dev, but proxy Sarvam through a backend before shipping to production.

## Roadmap

- [x] Voice loop: mic → STT → LLM → TTS → spoken reply
- [x] On-screen transcript of the conversation
- [ ] Barge-in (tap to interrupt playback)
- [ ] Streaming STT/TTS for lower latency
- [ ] Backend proxy so the API key never ships in the app bundle
- [ ] Conversation persistence
