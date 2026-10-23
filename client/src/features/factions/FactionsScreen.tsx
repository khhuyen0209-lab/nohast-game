import { useEffect, useState } from 'react';
import { publicGet } from '../../api/client';
import type { Faction } from '../../../../shared/types';

export function FactionsScreen() {
  const [factions, setFactions] = useState<Faction[]>([]);
  useEffect(() => { publicGet<any>('/api/world/factions').then((d) => setFactions(d.factions)).catch(() => {}); }, []);
  return (
    <div className="panel scroll" style={{ height: '100%', padding: 16 }}>
      <div className="title">Phe phái &amp; liên minh</div>
      <p className="mt" style={{ fontSize: 12, color: 'var(--c-dim)' }}>MVP: đọc thông tin phe. Gia nhập / thành lập liên minh / chiến tranh triển khai sau (spec §28–30, §49). Phe NPC chịu giới hạn kinh tế, hậu cần, nhân lực — không tự sinh tài nguyên vô hạn (spec §24, §28).</p>
      <div className="grid mt" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {factions.map((f) => (
          <div key={f.id} className="panel" style={{ padding: 16 }}>
            <b style={{ fontSize: 15 }}>{f.name}</b> {f.isNPC && <span className="tag">NPC</span>}
            <p style={{ fontSize: 12, color: 'var(--c-dim)', marginTop: 6, lineHeight: 1.5 }}>{f.description}</p>
            <div style={{ fontSize: 11, marginTop: 8 }}>Uy tín mặc định: {f.reputation}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
