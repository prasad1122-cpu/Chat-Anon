// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBfqLCAQz1vhhPEcbR448uztb5waPw4IBI',
  authDomain: 'anon-f7811.firebaseapp.com',
  projectId: 'anon-f7811',
  storageBucket: 'anon-f7811.appspot.com',
  messagingSenderId: '455237287448',
  appId: '1:455237287448:web:c7ae04f2242ec5e7340d6d',
  measurementId: 'G-KQ0W1T5R99',
};

// Initialize once
export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper to ensure anonymous sign-in
export async function ensureAnonSignIn(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  await signInAnonymously(auth);
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) { unsub(); resolve(u); }
    });
  });
}
