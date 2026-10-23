import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../systems/GameContext';
import { SpaceScene } from '../../game/SpaceScene';
import { apiPost } from '../../api/client';
import { STARTER_REGION, getBody } from '../../../../shared/game-data/world';
import type { CelestialBody } from '../../../../shared/types';

export function CockpitScreen() {
  const { ships, profile, refresh, toast } = useGame();
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SpaceScene | null>(null);
  const [selected, setSelected] = useState<CelestialBody | null>(null);
  const [busy, setBusy] = useState(false);
  const ship = ships[0];

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new SpaceScene(mountRef.current, profile?.performanceMode || 'medium');
    sceneRef.current = scene;
    const onResize = () => scene.resize();
    window.addEventListener('resize', onResize);
    const iv = setInterval(() => refresh(), 10000);
    return () => { window.removeEventListener('resize', onResize); clearInterval(iv); scene.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { sceneRef.current?.setShip(ship); }, [ship]);

  const warp = async () => {
    if (!selected || !ship) return;
    setBusy(true);
    try { await apiPost(`/api/ships/${ship.id}/warp`, { toBodyId: selected.id }); toast(`Đang dịch chuyển đến ${selected.name}…`, 'success'); refresh(); }
    catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const mine = async () => {
    if (!ship) return;
    setBusy(true);
    try { await apiPost(`/api/ships/${ship.id}/mining/start`, {}); toast('Bắt đầu khai thác…', 'success'); refresh(); }
    catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const stop = async () => {
    if (!ship) return;
    try { await apiPost(`/api/ships/${ship.id}/stop`, {}); refresh(); } catch (e: any) { toast(e.message, 'error'); }
  };

  const warpProgress = ship?.position.warp
    ? Math.min(100, ((Date.now() - ship.position.warp.startedAt) / (ship.position.warp.arrivesAt - ship.position.warp.startedAt)) * 100)
    : 0;

  return (
    <div style={{ height: '100%', display: 'flex', gap: 10, minHeight: 0 }}>
      <div className="panel" style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden' }}>
        <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 11, color: 'var(--c-dim)' }}>
          Khu vực: {STARTER_REGION.name} · tàu: {ship?.name} · trạng thái: <b style={{ color: 'var(--c-blue)' }}>{ship?.status}</b>
        </div>
        {ship?.position.warp && (
          <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
            <div className="subtitle">Đang dịch chuyển… {Math.round(warpProgress)}%</div>
            <div className="bar mt"><div style={{ width: `${warpProgress}%` }} /></div>
          </div>
        )}
      </div>
      <div className="panel scroll" style={{ width: 280, padding: 12, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="subtitle">Tàu vũ trụ</div>
        {ship && (
          <>
            <div className="stat"><span className="label">Thân tàu</span><div className="bar"><div style={{ width: `${(ship.hullHp / ship.maxHullHp) * 100}%` }} /></div><span style={{ fontSize: 11, color: 'var(--c-dim)' }}>{Math.round(ship.hullHp)}/{ship.maxHullHp}</span></div>
            <div className="stat"><span className="label">Khiên</span><div className="bar"><div style={{ width: `${Math.min(100, (ship.shieldHp / 100) * 100)}%`, background: 'var(--c-purple)' }} /></div></div>
            <div className="stat"><span className="label">Nhiên liệu</span><div className="bar"><div style={{ width: `${(ship.fuel / ship.maxFuel) * 100}%`, background: 'var(--c-gold)' }} /></div><span style={{ fontSize: 11, color: 'var(--c-dim)' }}>{Math.round(ship.fuel)}/{ship.maxFuel}</span></div>
            <div className="stat"><span className="label">Hàng hóa</span>
              {Object.entries(ship.cargo).filter(([, v]) => (v || 0) > 0).map(([k, v]) => (
                <div key={k} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}><span>{k}</span><b>{v}</b></div>
              ))}
              {Object.values(ship.cargo).every((v) => !v) && <span style={{ fontSize: 11, color: 'var(--c-dim)' }}>Kho trống</span>}
            </div>
          </>
        )}
        <div className="subtitle mt">Thiên thể trong khu vực</div>
        {STARTER_REGION.bodies.map((b) => (
          <button key={b.id} onClick={() => { setSelected(b); sceneRef.current?.focusBody(b.id); }}
            style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, borderColor: selected?.id === b.id ? 'var(--c-gold)' : undefined }}>
            <span className={`tag ${b.realAstronomy ? 'real' : 'fiction'}`}>{b.realAstronomy ? 'thực' : 'hư cấu'}</span> {b.name}
          </button>
        ))}
        {selected && (
          <div className="panel mt" style={{ padding: 10 }}>
            <div className="title" style={{ fontSize: 14 }}>{selected.name}</div>
            <p style={{ fontSize: 11, color: 'var(--c-dim)', marginTop: 4 }}>{selected.description}</p>
            {selected.resources && <div style={{ fontSize: 11, marginTop: 4 }}>Tài nguyên: {Object.keys(selected.resources).join(', ')}</div>}
            <div className="flex mt" style={{ flexWrap: 'wrap' }}>
              <button className="primary" onClick={warp} disabled={busy || ship?.status === 'warping'}>Dịch chuyển</button>
              {selected.resources && <button onClick={mine} disabled={busy}>Khai thác</button>}
              {ship?.status === 'mining' && <button className="danger" onClick={stop}>Dừng</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
