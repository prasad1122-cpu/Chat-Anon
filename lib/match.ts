import { db } from './firebase';
import {
  doc, setDoc, deleteDoc, serverTimestamp, collection, query, getDocs, runTransaction
} from 'firebase/firestore';

export type Prefs = {
  gender?: 'male' | 'female' | 'other';
  want?: 'any' | 'male' | 'female' | 'other';
};

// Enter queue and try to pair optimistically without Cloud Functions (best-effort demo)
export async function enterQueueAndPair(uid: string, prefs: Prefs) {
  const myRef = doc(db, 'queue', uid);
  await setDoc(myRef, { uid, ...prefs, createdAt: serverTimestamp() });

  // Try to find a partner: naive scan. For production, move to Cloud Functions with indexed queries.
  const q = query(collection(db, 'queue'));
  const candidates = await getDocs(q);

  let partner: any = null;
  candidates.forEach((snap) => {
    const d = snap.data();
    if (d.uid !== uid) {
      const ok = compatible(prefs, d);
      if (ok && !partner) partner = d;
    }
  });

  if (!partner) return { status: 'waiting' as const };

  // Create match with a transaction so only one side succeeds
  const a = uid;
  const b = partner.uid as string;
  const matchId = [a, b].sort().join('_');
  const matchRef = doc(db, 'matches', matchId);

  await runTransaction(db, async (tx) => {
    const matchSnap = await tx.get(matchRef);
    if (matchSnap.exists()) return;

    // delete both from queue
    tx.delete(doc(db, 'queue', a));
    tx.delete(doc(db, 'queue', b));

    // create match
    tx.set(matchRef, {
      userA: a,
      userB: b,
      createdAt: Date.now(),
      active: true
    });
  });

  return { status: 'matched' as const, matchId };
}

export async function leaveQueue(uid: string) {
  await deleteDoc(doc(db, 'queue', uid));
}

function compatible(a: Prefs, b: Prefs) {
  const wantsA = a.want ?? 'any';
  const wantsB = b.want ?? 'any';
  const genderA = a.gender ?? 'other';
  const genderB = b.gender ?? 'other';

  const aOk = (wantsA === 'any') || (wantsA === genderB);
  const bOk = (wantsB === 'any') || (wantsB === genderA);
  return aOk && bOk;
}
