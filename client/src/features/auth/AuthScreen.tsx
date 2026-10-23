import { useState } from 'react';
import { useGame } from '../../systems/GameContext';
import { FirebaseError } from 'firebase/app';

export function AuthScreen() {
  const { login, register, toast } = useGame();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.length < 6) { toast('Mật khẩu tối thiểu 6 ký tự.', 'error'); return; }
    setBusy(true);
    try {
      if (mode === 'login') await login(email, pass); else await register(email, pass);
    } catch (err: any) {
      const code = (err as FirebaseError)?.code || '';
      const msg = code === 'auth/invalid-credential' ? 'Sai email hoặc mật khẩu.'
        : code === 'auth/email-already-in-use' ? 'Email đã được đăng ký.'
        : code === 'auth/weak-password' ? 'Mật khẩu quá yếu.'
        : err.message || 'Lỗi xác thực.';
      toast(msg, 'error');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="panel" style={{ width: 380, maxWidth: '100%', padding: 28 }}>
        <h1 className="title glow-text" style={{ fontSize: 26 }}>NOHAST</h1>
        <div className="subtitle mt">Galaxy Sandbox — MVP</div>
        <form className="grid mt" onSubmit={submit} style={{ gridTemplateColumns: '1fr', gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Mật khẩu (≥6 ký tự)" value={pass} onChange={(e) => setPass(e.target.value)} required minLength={6} />
          <button className="primary" type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
        </form>
        <div className="flex between mt" style={{ fontSize: 12, color: 'var(--c-dim)' }}>
          <span>{mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}</span>
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ padding: '4px 10px', fontSize: 12 }}>
            {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </div>
        <p className="mt" style={{ fontSize: 11, color: 'var(--c-dim)', lineHeight: 1.5 }}>
          Dữ liệu game được lưu trên Firestore qua server xác thực. Không dùng localStorage cho tài sản (spec §4).
        </p>
      </div>
    </div>
  );
}
