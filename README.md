# Anonymous Chat — 100% Free MVP (no credit card)

This is a **text-only anonymous chat** MVP using **Next.js + Firebase (Spark)**.  
- ✅ No credit card required (Vercel Hobby + Firebase Spark)  
- ✅ Anonymous sign-in (no email required)  
- ✅ Simple, safe matching queue (no Cloud Functions needed)  
- ⚠️ Calls are **not** included here (TURN servers cost). We'll add P2P later.

## Stack
- Next.js (App Router)
- Firebase Web SDK (Auth, Firestore)

## Run locally
```bash
npm install
cp .env.example .env.local   # paste your Firebase web app config
npm run dev
```

## Deploy free
- Push to GitHub, import into **Vercel** (Hobby).  
- Create a **Firebase** project (Spark).  
- Create a Web App, copy config into `.env.local`.

## Firestore Security Rules (paste in Firebase console > Firestore > Rules)
See `firestore.rules` in this repo.

## How it works
- Users **sign in anonymously** (no email/phone).
- Click **Join Queue** → app tries to pair you with someone already waiting.
- When paired, a **match document** is created and both users read/write messages to `messages` subcollection.
- Leave chat to end the match; messages are ephemeral (auto-delete code can be added later).

## Why no calls right now?
WebRTC calls require STUN/TURN. Free STUN is fine, but **TURN (reliable relaying)** is needed for many networks and is **not free**. To stay 100% free, we launch text-only first.

---

© 2025-08-21
