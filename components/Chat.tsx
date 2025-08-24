'use client';
import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, serverTimestamp, onSnapshot, query, orderBy
} from 'firebase/firestore';

type Msg = { id:string; from:string; text:string; createdAt:number; ts?:any };

function fmtTime(t?: any) {
  if (!t) return '';
  const d = t?.toDate ? t.toDate() : new Date(t);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// very small emoji palette
const EMOJI = ['😀','😂','😍','🥳','😎','🤝','👍','🙏','🔥','💙','🚀','🌟','🎯','✨','💬'];

function renderContent(text: string) {
  const isImg = /^(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp))(?:\?\S*)?$/i.test(text.trim());
  if (isImg) {
    return <a href={text} target="_blank" rel="noreferrer"><img src={text} alt="img" style={{maxWidth:320,borderRadius:10}}/></a>;
  }
  const isUrl = /^https?:\/\/\S+$/i.test(text.trim());
  if (isUrl) return <a href={text} target="_blank" rel="noreferrer">{text}</a>;
  return <span>{text}</span>;
}

export default function Chat({ matchId, uid, partnerName }: { matchId: string; uid: string; partnerName?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const qy = query(collection(db, 'matches', matchId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(qy, (snap) => {
      const arr: Msg[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setMessages(arr);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }));
    });
    return () => unsub();
  }, [matchId]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    await addDoc(collection(db, 'matches', matchId, 'messages'), {
      from: uid,
      text: trimmed,
      createdAt: Date.now(),
      ts: serverTimestamp(),
    });
    setText('');
    setShowEmoji(false);
  }

  return (
    <>
      <div className="row" style={{justifyContent:'space-between', margin:'6px 2px 0'}}>
        <div className="label">Connected with <strong>{partnerName ?? 'Partner'}</strong></div>
        <div className="label">{messages.length} messages</div>
      </div>

      <div className="chat" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.from === uid ? 'mine' : ''}`}>
            <div className="bubble">
              <div>{renderContent(m.text)}</div>
              <div className="meta">{m.from === uid ? 'You' : (partnerName ?? 'Partner')} · {fmtTime(m.ts)}</div>
            </div>
          </div>
        ))}
        {messages.length === 0 && <div className="label">Say hi 👋</div>}
      </div>

      <div className="footer">
        <button className="btn ghost" onClick={() => setShowEmoji(v=>!v)}>😊</button>
        {showEmoji && (
          <div className="panel" style={{position:'absolute', bottom:72, maxWidth:320, padding:8, display:'flex', flexWrap:'wrap', gap:8}}>
            {EMOJI.map(e => <button key={e} className="btn ghost" onClick={()=>setText(t=>t+e)}>{e}</button>)}
          </div>
        )}
        <input
          className="input inputGrow"
          placeholder="Type a message… (links & .gif will render)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <button className="btn" onClick={send} disabled={!text.trim()}>Send</button>
      </div>
    </>
  );
}
