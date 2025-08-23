'use client';
import { useEffect, useState } from 'react';
import { ensureAnonSignIn, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { enterQueueAndPair, leaveQueue, Prefs } from '@/lib/match';
import Chat from '@/components/Chat';

export default function Page() {
  const [uid, setUid] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle'|'waiting'|'matched'>('idle');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>({ want: 'any' });
  const [hint, setHint] = useState<string>('');

  useEffect(() => { ensureAnonSignIn().then(u => setUid(u.uid)); }, []);

  // Poll for a partner while waiting
  async function join() {
    if (!uid) return;
    setStatus('waiting');
    setHint('Open another incognito window and click Join there too.');
    const res = await enterQueueAndPair(uid, prefs);
    if (res.status === 'matched') {
      setMatchId(res.matchId!); setStatus('matched'); setHint('');
      return;
    }
    const start = Date.now();
    const poll = async () => {
      if (!uid || status !== 'waiting') return;
      const r = await enterQueueAndPair(uid, prefs);
      if (r.status === 'matched') {
        setMatchId(r.matchId!); setStatus('matched'); setHint(''); return;
      }
      // Show a soft hint after 10s
      if (Date.now() - start > 10000) setHint('Still waiting… be sure you joined from a second window (Incognito).');
      setTimeout(poll, 2500);
    };
    setTimeout(poll, 2500);
  }

  async function leave() {
    if (!uid) return;
    await leaveQueue(uid);
    setStatus('idle'); setMatchId(null); setHint('');
  }

  return (
    <div className="container">
      <h1 className="hero">Anonymous Chat (Free MVP)</h1>
      <p className="sub">Sign-in is anonymous. Text-only chat so it stays 100% free (no credit card).</p>

      <div className="card" style={{marginBottom: 18}}>
        <div className="row" style={{marginBottom: 10}}>
          <span className="status">
            <span style={{width:8,height:8,borderRadius:999,background: status==='matched' ? '#22c55e' : '#60a5fa', display:'inline-block'}} />
            {status === 'matched' ? 'Matched' : status === 'waiting' ? 'Waiting…' : 'Idle'}
          </span>

          <span className="label">Want:</span>
          <select
            className="select"
            value={prefs.want ?? 'any'}
            onChange={(e) => setPrefs(prev => ({...prev, want: e.target.value as any}))}
          >
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          {status !== 'matched' ? (
            <>
              <button className="btn" onClick={join}>Join Queue</button>
              <button className="btn ghost" onClick={leave}>Leave Queue</button>
            </>
          ) : (
            <button className="btn ghost" onClick={() => { setStatus('idle'); setMatchId(null); }}>End Chat</button>
          )}
        </div>

        {hint && <div className="label">{hint}</div>}

        <div className="row" style={{marginTop: 8}}>
          <button className="btn ghost" onClick={() => signOut(auth)}>Sign out</button>
          <span className="label">uid: {uid}</span>
        </div>
      </div>

      {matchId && uid && <Chat matchId={matchId} uid={uid} />}
    </div>
  );
}
