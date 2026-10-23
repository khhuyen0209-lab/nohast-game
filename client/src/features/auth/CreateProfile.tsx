import { useState } from 'react';
import { useGame } from '../../systems/GameContext';
import { GAME_LIMITS } from '../../../../shared/constants';

export function CreateProfile() {
  const { createProfile, toast, user, logout } = useGame();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { toast('Tên chỉ huy tối thiểu 2 ký tự.', 'error'); return; }
    setBusy(true);
    try { await createProfile(name.trim()); } catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="panel" style={{ width: 420, maxWidth: '100%', padding: 28 }}>
        <h2 className="title glow-text">Tạo danh tính chỉ huy</h2>
        <p className="mt" style={{ color: 'var(--c-dim)', lineHeight: 1.6 }}>
          Tài khoản: <code>{user?.email}</code>. Sau khi tạo, bạn nhận được:
        </p>
        <ul className="mt" style={{ color: 'var(--c-dim)', paddingLeft: 20, lineHeight: 1.8, fontSize: 13 }}>
          <li>1 tàu trinh sát khởi đầu (module cơ bản)</li>
          <li>{GAME_LIMITS.STARTER_CREDITS.toLocaleString()} tín dụng + {GAME_LIMITS.STARTER_FUEL} nhiên liệu</li>
          <li>Neo tại trạm trung tâm Nohast (khu vực an toàn)</li>
        </ul>
        <form className="grid mt" onSubmit={submit} style={{ gridTemplateColumns: '1fr auto', gap: 10 }}>
          <input placeholder="Tên chỉ huy" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
          <button className="primary" type="submit" disabled={busy}>{busy ? '…' : 'Bắt đầu'}</button>
        </form>
        <button className="mt danger" onClick={logout} style={{ fontSize: 12 }}>Đổi tài khoản</button>
      </div>
    </div>
  );
}
