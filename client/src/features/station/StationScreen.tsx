// Personal station (max 1, server-enforced). Build + respawn bay upgrade.
import { useState } from 'react';
import { useGame } from '../../systems/GameContext';
import { apiPost } from '../../api/client';
import { GAME_LIMITS } from '../../../../shared/constants';

const BUILD_COST = 50000;
const RESPAWN_BAY_COST = 30000;

export function StationScreen() {
  const { stations, wallet, refresh, toast } = useGame();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const station = stations[0];

  const build = async () => {
    setBusy(true);
    try { await apiPost('/api/stations/build', { name }); toast('Trạm cá nhân đã được xây dựng.', 'success'); refresh(); }
    catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const upgradeBay = async () => {
    if (!station) return;
    setBusy(true);
    try { await apiPost(`/api/stations/${station.id}/respawn-bay`, {}); toast('Buồng nhân bản đã lắp đặt. Hồi sinh tại trạm được giảm phí.', 'success'); refresh(); }
    catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="panel scroll" style={{ height: '100%', padding: 16 }}>
      <div className="title">Trạm không gian cá nhân</div>
      <div className="subtitle mt">Giới hạn: {GAME_LIMITS.MAX_STATIONS_PER_PLAYER} trạm / người chơi (xác thực server — spec §10)</div>
      {!station ? (
        <div className="panel mt" style={{ padding: 20, maxWidth: 420 }}>
          <p style={{ color: 'var(--c-dim)' }}>Bạn chưa có trạm. Xây trạm đầu tiên với {BUILD_COST.toLocaleString()} CR. Bạn có {wallet?.credits.toLocaleString()} CR.</p>
          <div className="flex mt">
            <input placeholder="Tên trạm" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            <button className="primary" disabled={busy || (wallet?.credits || 0) < BUILD_COST} onClick={build}>Xây trạm</button>
          </div>
        </div>
      ) : (
        <div className="grid mt" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          <div className="panel" style={{ padding: 16 }}>
            <div className="subtitle">Tên</div><div className="value" style={{ fontSize: 18 }}>{station.name}</div>
            <div className="stat mt"><span className="label">Cấp</span><span className="value">{station.level}</span></div>
            <div className="stat mt"><span className="label">HP</span><span className="value">{station.hp}/{station.maxHp}</span></div>
          </div>
          <div className="panel" style={{ padding: 16 }}>
            <div className="subtitle">Buồng hồi sinh (spec §15)</div>
            <p className="mt" style={{ fontSize: 12, color: 'var(--c-dim)' }}>
              {station.hasRespawnBay ? 'Đã lắp đặt — hồi sinh tại trạm miễn phí (cần năng lượng).' : 'Chưa có. Lắp đặt với ' + RESPAWN_BAY_COST.toLocaleString() + ' CR để giảm/miễn phí hồi sinh.'}
            </p>
            {!station.hasRespawnBay && <button className="primary mt" disabled={busy || (wallet?.credits || 0) < RESPAWN_BAY_COST} onClick={upgradeBay}>Lắp buồng nhân bản</button>}
          </div>
          <div className="panel" style={{ padding: 16 }}>
            <div className="subtitle">Lưu trữ</div>
            <p className="mt" style={{ fontSize: 12, color: 'var(--c-dim)' }}>Kho lưu trữ trạm. Phí lưu trữ được tính theo thời gian (spec §17).</p>
            <div style={{ fontSize: 12, marginTop: 8 }}>Đã trả phí đến: {new Date(station.storageFeePaidUntil).toLocaleString('vi-VN')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
