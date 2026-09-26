---
name: testing-expo-web
description: How to install Node and run/test this Expo React Native app in Chrome on a headless Linux box (Expo web is the fastest end-to-end path).
---

# Testing the Voice AI Expo app

This repo is a bare Expo SDK 54 app (no web deps committed). On a fresh box without Node:

## Setup

1. Install Node 22.x — NodeSource works with passwordless sudo:
   `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -n bash && sudo -n apt-get install -y nodejs`
   (`apt-cache policy nodejs` shows no candidate on this box's default repos, so distro apt alone won't work.)
2. `npm install` (~25s, 625 packages; audit warnings are normal Expo dep-tree noise).
3. Install web deps: `npx expo install react-dom react-native-web @expo/metro-runtime`
4. **Required fix**: `npx expo install babel-preset-expo` — `babel.config.js` references this preset but it is not in `package.json`; without it web bundling fails with `Cannot find module 'babel-preset-expo'`.
5. Start the dev server in the background WITHOUT piping to `head`/`tail` — SIGPIPE kills Metro after the pipe's line quota. Use:
   `CI=1 nohup npx expo start --port 8081 > /tmp/expo.log 2>&1 &`
   Then poll `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/` for 200.
6. Sanity-check bundling without a browser:
   `curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/node_modules/expo/AppEntry.bundle?platform=web&dev=true&hot=false&lazy=true"` → expect 200 (first bundle takes ~3s).
7. Open `/home/ubuntu/.local/bin/google-chrome --start-maximized http://localhost:8081` (DISPLAY=:0). Chrome for Testing is installed at that path.

## Expected behavior

- Voice-first UI: empty state "Speak in English, Hindi, Tamil, Telugu — Sarvam understands.", status label "Tap the mic and speak", and a 🎙 mic button (turns red ■ while recording).
- Phase cycle on mic tap: idle → recording ("Listening… tap to stop") → thinking → speaking → idle.
- With no `EXPO_PUBLIC_SARVAM_API_KEY`, the error path shows the error text in red above the footer — proves the pipeline wiring.
- Web recordings are `audio/webm` blobs uploaded to Sarvam STT (`saarika:v2.5`); TTS uses `bulbul:v3` speaker "shubh".

## Testing the voice flow on a headless box (no real mic)

Chrome can fake a microphone from a WAV file — this exercises the full mic → STT → chat → TTS pipeline for real:

1. Convert a speech wav to 16kHz mono PCM:
   `ffmpeg -i input.wav -ar 16000 -ac 1 -c:a pcm_s16le /tmp/fake_mic.wav`
2. Relaunch Chrome with these flags (keep `--remote-debugging-port=29229`, `--user-data-dir=/home/ubuntu/.browser_data_dir`, and the other Devin args so computer tools keep working — capture the running cmdline via `tr '\0' ' ' </proc/<pid>/cmdline` and append):
   `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream --use-file-for-fake-audio-capture=/tmp/fake_mic.wav --autoplay-policy=no-user-gesture-required`
   - `--use-fake-ui-for-media-stream` auto-grants mic permission (expo-audio's requestRecordingPermissionsAsync).
   - `--autoplay-policy=no-user-gesture-required` prevents the TTS `<audio>` playback from being blocked.
   - The fake mic **loops the wav** for the whole recording duration — a 1.5s clip recorded for 3.5s transcribes as ~15 repetitions of the sentence. Record briefly (≤2s) if you want a clean transcript.
3. Kill ALL chrome instances first and verify the surviving window's pid (`xdotool getwindowpid <winid>`) belongs to the flagged chrome — stale flagless instances otherwise leave duplicate windows that grab clicks.
4. `.env` changes require restarting `expo start` — EXPO_PUBLIC_* vars are baked into the bundle at build time.

## Devin Secrets Needed

- `EXPO_PUBLIC_SARVAM_API_KEY` (from https://dashboard.sarvam.ai) — needed for real STT/chat/TTS; put it in `/home/ubuntu/repos/voice_ai/.env` and restart Expo.
