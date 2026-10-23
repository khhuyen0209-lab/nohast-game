import { useGame } from '../../systems/GameContext';
import { API_BASE, HOSTING_URLS } from '../../config/runtime';

export function SettingsScreen() {
  const { profile, setPerformance, toast } = useGame();
  const setPerf = async (m: 'low' | 'medium' | 'high') => {
    try { await setPerformance(m); toast('Đã lưu cài đặt hiệu năng. Tải lại scene để áp dụng.', 'success'); }
    catch (e: any) { toast(e.message, 'error'); }
  };
  return (
    <div className="panel scroll" style={{ height: '100%', padding: 16, maxWidth: 640 }}>
      <div className="title">Cài đặt</div>
      <div className="subtitle mt mb">Chế độ hiệu năng (spec §47 — Android cũ nên chọn Low)</div>
      <div className="flex">
        {(['low', 'medium', 'high'] as const).map((m) => (
          <button key={m} onClick={() => setPerf(m)} style={{ borderColor: profile?.performanceMode === m ? 'var(--c-gold)' : undefined }}>
            {m === 'low' ? 'Thấp (Android cũ)' : m === 'medium' ? 'Trung bình' : 'Cao'}
          </button>
        ))}
      </div>
      <div className="subtitle mt mb">Thông tin kết nối</div>
      <div style={{ fontSize: 12, color: 'var(--c-dim)', lineHeight: 1.8 }}>
        <div>API server: <code>{API_BASE || '(dev proxy)'}</code></div>
        <div>Hosting URLs: {HOSTING_URLS.join(', ') || '(mặc định)'}</div>
        <div>Firebase project: nohast-galaxy-c6c9f</div>
        <div className="mt">Mẹo: thêm game vào màn hình chính (PWA) để trải nghiệm gần ứng dụng hơn, có thể ẩn thanh địa chỉ (spec §37). Không ép buộc ẩn thanh địa chỉ trên mọi trình duyệt.</div>
      </div>
    </div>
  );
}
