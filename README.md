# Voice AI

A ChatGPT-style mobile app powered by [Sarvam AI](https://www.sarvam.ai) — multilingual chat (and eventually voice) across Indian languages.

## Stack

- **Expo / React Native** (SDK 54) — iOS, Android, and web from one codebase
- **Sarvam AI** chat completions API (`sarvam-105b-conversations` model), OpenAI-style interface

## Getting started

1. Install Node.js 20.19+ (or 22.x).
2. `npm install` — if versions drift, run `npx expo install --fix`.
3. `cp .env.example .env` and add your Sarvam API key from <https://dashboard.sarvam.ai>.
4. `npm start`, then scan the QR code with Expo Go or press `a`/`i` for an emulator/simulator.

## Roadmap

- [x] Basic chat UI wired to Sarvam chat completions
- [ ] Speech-to-text input (Sarvam Saarika STT)
- [ ] Text-to-speech replies (Sarvam Bulbul TTS)
- [ ] Backend proxy so the API key never ships in the app bundle
- [ ] Conversation persistence
