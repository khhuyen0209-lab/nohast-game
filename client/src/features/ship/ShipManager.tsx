// Ship manager + module assembly (spec §11). Server validates slots/power/cost.
import { useEffect, useState } from 'react';
import { useGame } from '../../systems/GameContext';
import { apiGet, apiPost } from '../../api/client';
import { MODULE_CATALOG, getModule, HULL_EXTRAS } from '../../../../shared/game-data/modules';
import type { ModuleSlot, ShipModuleDef } from '../../../../shared/types';

const SLOTS: ModuleSlot[] = ['engine', 'reactor', 'weapon', 'shield', 'cargo', 'sensor', 'mining', 'lab', 'habitat', 'computer'];

export function ShipManager() {
  const { ships, wallet, refresh, toast } = useGame();
  const [catalog, setCatalog] = useState<ShipModuleDef[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ModuleSlot>('engine');
  const [busy, setBusy] = useState(false);
  const ship = ships[0];

  useEffect(() => { apiGet<any>('/api/ships/catalog/modules').then((d) => setCatalog(d.modules)).catch(() => setCatalog(MODULE_CATALOG)); }, []);

  const install = async (def: ShipModuleDef) => {
    if (!ship) return;
    setBusy(true);
    try { await apiPost(`/api/ships/${ship.id}/modules`, { slot: selectedSlot, moduleDefId: def.id }); toast(`Đã lắp ${def.name}.`, 'success'); refresh(); }
    catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  if (!ship) return <div className="panel" style={{ padding: 20 }}>Chưa có tàu.</div>;
  const hull = getModule(ship.hullDefId);
  const allowed = HULL_EXTRAS[ship.hullDefId]?.allowedSlots || SLOTS;
  const candidates = catalog.filter((m) => m.slot === selectedSlot);

  return (
    <div style={{ height: '100%', display: 'flex', gap: 10, minHeight: 0 }}>
      <div className="panel scroll" style={{ width: 300, padding: 14, flexShrink: 0 }}>
        <div className="title">{ship.name}</div>
        <div className="subtitle mt">{hull?.name} · {ship.status}</div>
        <div className="grid mt" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="stat"><span className="label">Thân</span><span className="value">{Math.round(ship.hullHp)}/{ship.maxHullHp}</span></div>
          <div className="stat"><span className="label">Nhiên liệu</span><span className="value">{Math.round(ship.fuel)}/{ship.maxFuel}</span></div>
        </div>
        <div className="subtitle mt mb">Module đã lắp</div>
        {SLOTS.filter((s) => ship.modules[s]).map((s) => {
          const inst = ship.modules[s]!;
          const def = getModule(inst.defId);
          return <div key={s} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
            <span className="tag">{s}</span> <b>{def?.name}</b> <span style={{ color: 'var(--c-dim)' }}>HP {inst.hp}/{def?.durability}</span>
          </div>;
        })}
      </div>
      <div className="panel scroll" style={{ flex: 1, padding: 14, minWidth: 0 }}>
        <div className="title" style={{ fontSize: 15 }}>Lắp ráp module</div>
        <p style={{ fontSize: 11, color: 'var(--c-dim)', marginTop: 4 }}>Chọn khe cắm, sau đó chọn module. Server kiểm tra công suất, khối lượng, giá và giới hạn (spec §5, §11). Bạn có {wallet?.credits.toLocaleString()} CR.</p>
        <div className="flex mt mb" style={{ flexWrap: 'wrap' }}>
          {allowed.map((s) => <button key={s} onClick={() => setSelectedSlot(s)} style={{ borderColor: selectedSlot === s ? 'var(--c-blue)' : undefined }}>{s}</button>)}
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {candidates.map((m) => (
            <div key={m.id} className="panel" style={{ padding: 12 }}>
              <b style={{ fontSize: 13 }}>{m.name}</b>
              <div style={{ fontSize: 11, color: 'var(--c-dim)', marginTop: 4 }}>{m.description}</div>
              <div style={{ fontSize: 11, marginTop: 6 }}>
                {m.powerDraw !== 0 && <div>Công suất: {m.powerDraw < 0 ? `+${-m.powerDraw} MW` : `-${m.powerDraw} MW`}</div>}
                <div>Khối lượng: {m.mass} t · Độ bền: {m.durability}</div>
                <div style={{ color: 'var(--c-gold)' }}>Giá: {m.cost.toLocaleString()} CR</div>
              </div>
              <button className="primary mt" style={{ width: '100%' }} disabled={busy || (wallet?.credits || 0) < m.cost} onClick={() => install(m)}>Mua & lắp</button>
            </div>
          ))}
          {candidates.length === 0 && <div style={{ color: 'var(--c-dim)', fontSize: 12 }}>Không có module nào cho khe này trên thân tàu hiện tại.</div>}
        </div>
      </div>
    </div>
  );
}
