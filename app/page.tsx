'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ensureAnonSignIn, auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { enterQueueAndPair, leaveQueue, Prefs } from '@/lib/match';
import Chat from '@/components/Chat';
import { doc, onSnapshot } from 'firebase/firestore';
import { ensureProfile, getDisplayName } from '@/lib/user';

type S = 'idle' | 'searching' | 'connected';

export default function Page() {
  const [uid, setUid] = useState<string | null>(null);
  const [status, setStatus] = useState<S>('idle');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>({ want: 'any' });
  const [hint, setHint] = useState<string>('');
  const [myName, setMyName] = useState<string>('Anonymous');
  const [partnerName, setPartnerName] = useState<string>('Partner');
  const unsubSessionRef = useRef<() => void>();

  useEffect(() => {
    ensureAnonSignIn().then(async (u) => {
      setUid(u.uid);
      const name = await ensureProfile(u.uid);
      setMyName(name);
      // start watching my session doc
      if (unsubSessionRef.current) unsubSessionRef.current();
      unsubSessionRef.current = onSnapshot(doc(db, 'sessions', u.uid), async (snap) => {
        const data = snap.data() as any;
        if (data?.matchId) {
          setMatchId(data.matchId);
          setStatus('connected');
          setHint('');
          // derive partner uid from matchId
          const [a, b] = data.matchId.split('_');
          const other = (a === u.uid) ? b : a;
          const theirName = await getDisplayName(other);
          setPartnerName(theirName);
        } else {
          // not matched
          if (status !== 'searching') setStatus('idle');
          setMatchId(null);
        }
      });
    });
    return () => { if (unsubSessionRef.current) unsubSessionRef.current(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusDot = useMemo(() => {
    if (status === 'connected') return <span className="dot ok" />;
    if (status === 'searching') return <span className="dot wait" />;
    return <span className="dot idle" />;
  }, [status]);

  async function findPartner() {
    if (!uid) return;
    setStatus('searching');
    setHint('Open another incognito window and tap “Find Partner” there to test.');
    await enterQueueAndPair(uid, prefs);
    // no need to poll — the session listener will flip to connected when paired
  }

  async function stopSearchingOrDisconnect() {
    if (!uid) return;
    await leaveQueue(uid);
    setStatus('idle');
    setMatchId(null);
    setHint('');
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo" />
          <div>
            <div className="title">Anon Chat</div>
            <div className="sub">Fast, anonymous 1:1 text chat (free)</div>
          </div>
        </div>
        <div className="sub">{myName} · {uid?.slice(0,6)}…</div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <span className="status">
            {statusDot}{status === 'connected' ? 'Connected' : status === 'searching' ? 'Searching' : 'Idle'}
          </span>

          <span className="label">Preference:</span>
          <select
            className="select"
            value={prefs.want ?? 'any'}
            onChange={(e) => setPrefs(p => ({ ...p, want: e.target.value as any }))}
          >
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          {status !== 'connected' ? (
            <>
              <button className="btn" onClick={findPartner}>Find Partner</button>
              <button className="btn ghost" onClick={stopSearchingOrDisconnect}>Stop Searching</button>
            </>
          ) : (
            <button className="btn ghost" onClick={stopSearchingOrDisconnect}>Disconnect</button>
          )}
        </div>

        {hint && <div className="label">{hint}</div>}

        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn ghost" onClick={() => signOut(auth)}>Sign out</button>
        </div>
      </div>

      {matchId && uid && (
        <div className="panel chatWrap">
          <Chat matchId={matchId} uid={uid} partnerName={partnerName} />
        </div>
      )}
    </div>
  );
}
