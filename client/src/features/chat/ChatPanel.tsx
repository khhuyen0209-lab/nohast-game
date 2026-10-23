// Chat: region/global/nohast channels via WebSocket (spec §33). Rate-limited server-side.
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../systems/GameContext';
import { wsClient } from '../../systems/WSClient';
import { apiGet } from '../../api/client';
import type { ChatChannel, ChatMessage } from '../../../../shared/types';

const CHANNELS: { id: ChatChannel; label: string }[] = [
  { id: 'region', label: 'Khu vực' },
  { id: 'global', label: 'Toàn vũ trụ' },
  { id: 'nohast', label: 'Nohast' },
];

export function ChatPanel() {
  const { chat, presence, profile } = useGame();
  const [channel, setChannel] = useState<ChatChannel>('region');
  const [text, setText] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiGet<any>(`/api/world/chat/${channel}?regionId=sol-inner`).then((d) => setHistory(d.messages)).catch(() => {});
  }, [channel]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat, history]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    wsClient.sendChat(channel, text.trim());
    setText('');
  };

  const visible = [...history, ...chat].filter((m) => m.channel === channel).slice(-100);

  return (
    <div style={{ height: '100%', display: 'flex', gap: 10, minHeight: 0 }}>
      <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="flex" style={{ padding: 10, borderBottom: '1px solid var(--c-border)' }}>
          {CHANNELS.map((c) => <button key={c.id} onClick={() => setChannel(c.id)} style={{ borderColor: channel === c.id ? 'var(--c-blue)' : undefined }}>{c.label}</button>)}
        </div>
        <div className="scroll" style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visible.map((m, i) => (
            <div key={m.id + i} style={{ fontSize: 13 }}>
              <span style={{ color: m.fromUid === profile?.uid ? 'var(--c-gold)' : 'var(--c-blue)', fontWeight: 600 }}>{m.fromName}</span>
              <span style={{ color: 'var(--c-dim)', fontSize: 10, marginLeft: 6 }}>{new Date(m.createdAt).toLocaleTimeString('vi-VN')}</span>
              <div style={{ color: 'var(--c-text)', marginLeft: 4 }}>{m.text}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form className="flex" style={{ padding: 10, borderTop: '1px solid var(--c-border)' }} onSubmit={send}>
          <input placeholder="Nhắn tin… (giới hạn tốc độ ở server)" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
          <button className="primary" type="submit">Gửi</button>
        </form>
      </div>
      <div className="panel scroll" style={{ width: 180, padding: 12, flexShrink: 0 }}>
        <div className="subtitle mb">Trực tuyến ({presence.length})</div>
        {presence.map((p) => (
          <div key={p.uid} style={{ fontSize: 12, padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: p.online ? '#55e0c0' : '#555', display: 'inline-block' }} />
            {p.commanderName}
          </div>
        ))}
      </div>
    </div>
  );
}
