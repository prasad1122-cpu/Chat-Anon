'use client';
import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, serverTimestamp, onSnapshot, query, orderBy
} from 'firebase/firestore';

function time(t?: any) {
  if (!t) return '';
  const d = t.toDate ? t.toDate() : new Date(t);
  return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

export default function Chat({ matchId, uid }: { matchId: string, uid: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const msgsRef = collection(db, 'matches', matchId, 'messages');
    const q = query(msgsRef, orderBy('ts', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setMessages(arr);
      setTimeout(() => listRef.current?.scrollTo(0, listRef.current!.scrollHeight), 0);
    });
    return () => unsub();
  }, [matchId]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const msgsRef = collection(db, 'matches', matchId, 'messages');
    await addDoc(msgsRef, { from: uid, text: trimmed, ts: serverTimestamp() });
    setText('');
  }

  return (
    <div className="card">
      <div className="chat" ref={listRef}>
        {messages.map(m => (
          <div key={m.id} className={`msg ${m.from === uid ? 'mine' : ''}`}>
            <div className="bubble">
              <div>{m.text}</div>
              <div className="meta">{m.from === uid ? 'You' : 'Partner'} · {time(m.ts)}</div>
            </div>
          </div>
        ))}
        {messages.length === 0 && <div className="label">Say hi 👋</div>}
      </div>

      <div className="footer">
        <input
          className="input"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <button className="btn" onClick={send}>Send</button>
      </div>
    </div>
  );
}
