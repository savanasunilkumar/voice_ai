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

- Empty state shows "Ask anything — try Hindi, Tamil, Telugu, or English." with a "Type a message…" input and "Send" button.
- With no `EXPO_PUBLIC_SARVAM_API_KEY`, sending a message renders an assistant bubble "Error: Missing EXPO_PUBLIC_SARVAM_API_KEY — copy .env.example to .env and add your Sarvam key." — this is a PASS, it proves the send path works.
- Expo may warn `react-native@0.81.4 - expected version: 0.81.5`; web still works.

## Devin Secrets Needed

- `EXPO_PUBLIC_SARVAM_API_KEY` (from https://dashboard.sarvam.ai) — only needed to test real Sarvam replies; put it in `/home/ubuntu/repos/voice_ai/.env`.
