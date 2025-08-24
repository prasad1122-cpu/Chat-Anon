// lib/user.ts
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { randomAnonName } from './names';

export async function ensureProfile(uid: string) {
  const db = getFirestore();
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists() || !snap.data()?.displayName) {
    const displayName = randomAnonName(uid);
    await setDoc(ref, { uid, displayName, createdAt: serverTimestamp() }, { merge: true });
    return displayName;
  }
  return snap.data()!.displayName as string;
}

export async function getDisplayName(uid: string) {
  const db = getFirestore();
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data()!.displayName as string) : 'Anonymous';
}
