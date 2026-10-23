// Nohast central station UI (spec §16–22). Shows services, state, Nahast config.
import { useEffect, useState } from 'react';
import { useGame } from '../../systems/GameContext';
import { apiGet, apiPost } from '../../api/client';
import { NOHAST_STATION, GAME_LIMITS } from '../../../../shared/constants';
import type { NohastState } from '../../../../shared/types';

export function NohastScreen() {
  const { toast, setView, refresh } = useGame();
  const [state, setState] = useState<NohastState | null>(null);
  const [cfg, setCfg] = useState<any>(null);

  useEffect(() => {
    apiGet<any>('/api/stations/nohast/state').then((d) => { setState(d.state); setCfg(d.state.config); }).catch((e) => toast(e.message, 'error'));
  }, [toast]);

  const respawn = async () => {
    try { await apiPost('/api/stations/nohast/respawn', {}); toast(`Hồi sinh tại Nohast. Phí ${GAME_LIMITS.RESPAWN_FEE_CREDITS} CR.`, 'success'); refresh(); }
    catch (e: any) { toast(e.message, 'error'); }
  };

  return (
    <div className="panel scroll" style={{ height: '100%', padding: 16 }}>
      <div className="title glow-text">Trạm trung tâm Nohast</div>
      <div className="subtitle mt">GM — Tổng cục Quản lí Ngân hà (Nohast là trạm, không phải tên GM — spec §16)</div>
      <p className="mt" style={{ color: 'var(--c-dim)', maxWidth: 640, lineHeight: 1.6 }}>
        Nohast là trung tâm dịch vụ, thông tin và giao tiếp. Không phải phe NPC thông thường, không thể chiếm giữ đơn giản (spec §16–18).
        Một liên minh đủ mạnh có thể mở chiến dịch tấn công — kiến trúc dữ liệu đã sẵn sàng, chiến dịch chi tiết triển khai sau MVP (spec §49).
      </p>
      <div className="grid mt" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {NOHAST_STATION.services.map((s) => (
          <div key={s} className="panel" style={{ padding: 12, fontSize: 12 }}>
            <b>{s}</b>
            {s === 'market' && <button className="mt" style={{ width: '100%' }} onClick={() => setView('market')}>Mở chợ</button>}
            {s === 'shipyard' && <button className="mt" style={{ width: '100%' }} onClick={() => setView('ship')}>Xưởng tàu</button>}
            {s === 'respawn' && <button className="mt" style={{ width: '100%' }} onClick={respawn}>Hồi sinh ({GAME_LIMITS.RESPAWN_FEE_CREDITS} CR)</button>}
            {s === 'chat_lobby' && <button className="mt" style={{ width: '100%' }} onClick={() => setView('chat')}>Sảnh chat</button>}
          </div>
        ))}
      </div>
      <div className="panel mt" style={{ padding: 16, maxWidth: 640 }}>
        <div className="subtitle">Trạng thái Nohast &amp; Nahast-Rules (spec §19–22)</div>
        {state && (
          <div className="mt" style={{ fontSize: 13, lineHeight: 1.8 }}>
            <div>Kiểm soát: <b style={{ color: state.control === 'gm' ? 'var(--c-cyan)' : 'var(--c-gold)' }}>{state.control}</b></div>
            {state.nahastDischarge && <div style={{ color: 'var(--c-danger)' }}>
              ⚠ Nahast-Rules đang xả năng lượng (bắt đầu {new Date(state.nahastDischarge.startedAt).toLocaleTimeString('vi-VN')}, hoàn tất {new Date(state.nahastDischarge.completesAt).toLocaleTimeString('vi-VN')}). Không thể dừng giữa chừng (spec §20).
            </div>}
          </div>
        )}
        <p className="mt" style={{ fontSize: 11, color: 'var(--c-dim)' }}>
          Tất cả ngưỡng kích hoạt, thời lượng xả năng lượng, ETA tăng viện đều là <b>giá trị tạm thời</b> (TEMPORARY) để code chạy thử, chưa phải cốt truyện xác nhận (spec §22).
          Ngưỡng chiếm giữ: {cfg?.OCCUPATION_TRIGGER_RATIO} · Thời lượng xả: {Math.round((cfg?.DISCHARGE_DURATION_MS || 0) / 60000)} phút · Tăng viện sau: {Math.round((cfg?.REINFORCEMENT_ETA_MS || 0) / 60000)} phút.
        </p>
      </div>
    </div>
  );
}
