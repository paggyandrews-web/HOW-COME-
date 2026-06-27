# Cornerstone – Setup & Deployment Guide

## What you need (all free)

1. A [GitHub account](https://github.com) — to store your code
2. A [Firebase account](https://firebase.google.com) — for login & database
3. A [Vercel account](https://vercel.com) — to host your website

---

## Step 1 — Set up Firebase

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it `cornerstone-psc` → Continue
3. Disable Google Analytics (not needed) → **Create project**
4. In the left menu, click **Authentication** → **Get started** → Enable **Email/Password**
5. In the left menu, click **Firestore Database** → **Create database** → choose **Production mode** → pick a region (e.g., `asia-south1`) → **Done**

### Get your Firebase config:
6. Click the ⚙️ gear icon → **Project settings**
7. Scroll down to **"Your apps"** → click the `</>` (Web) icon
8. Name it `cornerstone-web` → **Register app**
9. Copy the `firebaseConfig` object — it looks like:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "cornerstone-psc.firebaseapp.com",
  projectId: "cornerstone-psc",
  storageBucket: "cornerstone-psc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

10. Open the file `src/firebase/config.js` in this folder and **replace** the placeholder values with your actual values.

### Set Firestore security rules:
11. In Firebase Console → **Firestore** → **Rules** tab → paste this and **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Step 2 — Upload code to GitHub

1. Go to https://github.com → click **"New repository"**
2. Name it `cornerstone-app` → **Create repository**
3. Follow the instructions to upload this folder (or use GitHub Desktop if you prefer)

---

## Step 3 — Deploy on Vercel

1. Go to https://vercel.com → Sign up with your GitHub account
2. Click **"Add New Project"** → select your `cornerstone-app` repository
3. Vercel will auto-detect it as a Vite project
4. Click **Deploy** — your site will be live in ~2 minutes!
5. Vercel gives you a free URL like `cornerstone-app-xyz.vercel.app`

---

## That's it! 🎉

Your Cornerstone app is now live. Share the Vercel URL with candidates.

---

## What's included in v1

- ✅ 1,108 English grammar questions from 86 PSC papers (2023–2026)
- ✅ Practice mode (no timer, explanation slot ready)
- ✅ Timed quiz (60s per question)
- ✅ Filter by paper, year, medium
- ✅ Exam countdown with pin feature (up to 5 exams)
- ✅ 3 themes: Light, Dark, Paper
- ✅ User registration with district selection
- ✅ Firebase Auth + Firestore

## Coming next (Phase 2)

- Answer keys for all 1,108 questions
- Explanations for each question
- Chapter/topic-wise filtering
- District leaderboard
- Android app
