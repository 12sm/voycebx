# VoyceBx

A mobile-first web app that lets patients speak in their own voice after surgery.

Type a message. Hear it spoken back in your cloned voice. Show it to the people around you.

---

## The Problem

Thousands of patients undergo laryngectomies, thyroidectomies, and radical neck dissections each year. Many lose the ability to speak — temporarily or permanently. The tools currently available give them a generic synthetic voice that strips away everything that made their voice theirs: the regional accent, the emotional warmth, the way their family recognizes them across a crowded room.

This is not just a communication problem. It is a psychological one. The loss of voice is one of the most disorienting aspects of surgical recovery — and the standard of care has not kept pace with what the technology now makes possible.

## What VoyceBx Does

Before surgery, a patient records a short voice sample — as little as 30 seconds of clear speech. VoyceBx clones that voice using [ElevenLabs](https://elevenlabs.io) and stores the voice model on their device. After surgery, they open the app on their phone, type what they want to say, and hear it spoken back in their own voice.

No app store. No login. No complicated setup. Just a URL they can bookmark.

The transcript stays on screen so the people they're talking to can read along. Common phrases — *I need water*, *I am in pain*, *Please call my family* — are one tap away. Every spoken entry can be replayed instantly.

## Clinical Context

VoyceBx is being developed in alignment with a patient-centered clinical program proposed at [Mass Eye and Ear](https://www.masseyeandear.org/) (Harvard Medical School affiliate) — one of the premier institutions in the world for laryngological care.

The clinical vision has three phases:

**Phase I — Acoustic Fidelity**
Capture voice samples from pre-surgical patients and evaluate how closely the AI-generated clone matches the original. Success target: ≥90% clinician-rated vocal likeness, validated by a panel of laryngologists and speech-language pathologists using a blind "Vocal Turing Test."

**Phase II — Psychological Impact**
A randomized controlled trial comparing patient outcomes between those using VoyceBx (their own cloned voice) and those using standard AAC tools (generic synthetic voices). Primary endpoints: Voice-Related Quality of Life (V-RQOL) and Voice Handicap Index (VHI-10). Secondary endpoints: anxiety and depression scores at 30, 60, and 90 days post-op.

**Phase III — Communication Velocity**
Real-world testing of how quickly patients can communicate critical needs using VoyceBx versus whiteboards or non-cloned apps. Qualitative interviews with family members on the emotional resonance of hearing their loved one's voice during recovery.

The long-term vision — **Vocal Continuity as a standard of care** — means that while the anatomy changes, the acoustic identity does not. A parent can still say *I love you* in the voice their children know.

## How It Works

VoyceBx calls the ElevenLabs API directly from the browser. Your API key and voice ID are stored in `localStorage` on your device — nothing is sent to any server other than ElevenLabs.

```
Record voice sample
    → ElevenLabs Instant Voice Clone (POST /v1/voices/add)
    → voice_id stored in localStorage

Type text
    → ElevenLabs TTS (POST /v1/text-to-speech/{voice_id})
    → audio plays immediately in cloned voice
```

## Setup

You need an [ElevenLabs account](https://elevenlabs.io) and an API key. The free tier supports voice cloning and TTS.

**Run locally:**
```bash
npm install
npm run dev
```

**Deploy to Netlify:**
- Build command: `npm run build`
- Publish directory: `dist`

Once deployed, the app is just a URL. Bookmark it on your phone. Add it to your home screen. No installation required.

## Features

- **Voice cloning** — record in-app or upload a sample; clone via ElevenLabs in seconds
- **Speak screen** — type anything, hear it in your voice, transcript stays on screen
- **Favorites** — one-tap access to common phrases; fully customizable
- **Replay** — tap any past utterance to hear it again
- **Persistent transcript** — stays across sessions; clear anytime
- **Mobile-first** — large tap targets, safe-area aware, works at bedside
- **No backend** — entirely client-side; nothing stored except on your device

## Stack

Vite + vanilla JavaScript. No framework dependencies. Deploys as a static site.

## Status

Active development. Core voice cloning and TTS loop is complete. Roadmap includes:

- [ ] Vocal Vault — archive meaningful messages for family, preserved in the patient's voice
- [ ] Offline TTS cache — replay recent phrases without a network connection
- [ ] Clinical onboarding mode — guided setup designed for integration into pre-surgical workflow
- [ ] PWA manifest — full add-to-home-screen support with offline shell

## License

MIT
