// lib/match.ts
import {
  getFirestore, doc, setDoc, serverTimestamp, runTransaction, collection
} from 'firebase/firestore';

export type Prefs = { want: 'any' | 'male' | 'female' | 'other' };

function matchIdFor(a: string, b: string) {
  return [a, b].sort().join('_');
}

/** Pair using a single ticket doc; write sessions for BOTH users. */
export async function enterQueueAndPair(uid: string, prefs: Prefs) {
  const db = getFirestore();

  // best-effort: record I’m searching (optional)
  await setDoc(doc(db, 'queue', uid), {
    uid,
    want: prefs?.want ?? 'any',
    enqueuedAt: Date.now(),
  }, { merge: true });

  const res = await runTransaction(db, async (tx) => {
    const ticketRef = doc(db, 'tickets', 'open');
    const tSnap = await tx.get(ticketRef);

    if (!tSnap.exists() || !tSnap.data()?.holder) {
      // No holder -> become the holder
      tx.set(ticketRef, { holder: uid, want: prefs?.want ?? 'any', at: Date.now() });
      // also clear my session
      tx.set(doc(db, 'sessions', uid), { matchId: null, status: 'waiting', updatedAt: Date.now() });
      return { status: 'waiting' as const };
    }

    const holder = tSnap.data().holder as string;
    if (holder === uid) {
      // I’m already the holder -> still waiting
      tx.set(doc(db, 'sessions', uid), { matchId: null, status: 'waiting', updatedAt: Date.now() }, { merge: true });
      return { status: 'waiting' as const };
    }

    // Pair holder <-> me
    const id = matchIdFor(holder, uid);
    const matchRef = doc(db, 'matches', id);

    tx.set(matchRef, {
      id,
      userA: holder,
      userB: uid,
      startedAt: serverTimestamp(),
    });

    // Seed a system message so both immediately see something
    const firstMsgRef = doc(collection(db, 'matches', id, 'messages'));
    tx.set(firstMsgRef, {
      from: 'system',
      text: 'You are now connected. Say hi 👋',
      createdAt: Date.now(),
      ts: serverTimestamp(),
    });

    // Set sessions for BOTH users
    tx.set(doc(db, 'sessions', holder), { matchId: id, status: 'matched', updatedAt: Date.now() });
    tx.set(doc(db, 'sessions', uid),    { matchId: id, status: 'matched', updatedAt: Date.now() });

    // release ticket
    tx.delete(ticketRef);

    return { status: 'matched' as const, matchId: id };
  });

  return res;
}

export async function leaveQueue(uid: string) {
  const db = getFirestore();
  // Release ticket if I hold it
  await setDoc(doc(db, 'tickets', 'open'), { holder: null }, { merge: true });
  // Clear my session
  await setDoc(doc(db, 'sessions', uid), { matchId: null, status: 'idle', updatedAt: Date.now() }, { merge: true });
}
