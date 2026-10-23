import { useGame } from '../../systems/GameContext';
import { apiPost } from '../../api/client';

export function CrewScreen() {
  const { crew, wallet, refresh, toast } = useGame();
  const hire = async () => {
    try { await apiPost('/api/world/crew/hire', {}); toast('Đã tuyển thủy thủ mới.', 'success'); refresh(); }
    catch (e: any) { toast(e.message, 'error'); }
  };
  return (
    <div className="panel scroll" style={{ height: '100%', padding: 16 }}>
      <div className="flex between">
        <div className="title">Thủy thủ &amp; sĩ quan</div>
        <button className="primary" onClick={hire}>Tuyển ngẫu nhiên (~200–700 CR)</button>
      </div>
      <p className="mt" style={{ fontSize: 12, color: 'var(--c-dim)' }}>NPC hoạt động theo máy trạng thái / quy tắc / mục tiêu, không chạy AI ngôn ngữ liên tục (spec §27). Sĩ quan được bổ nhiệm có thể tạm thời tiếp quản khi chỉ huy chết (spec §14).</p>
      <div className="grid mt" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {crew.length === 0 && <div style={{ color: 'var(--c-dim)', fontSize: 13 }}>Chưa có thủy thủ. Hãy tuyển người đầu tiên.</div>}
        {crew.map((c) => (
          <div key={c.id} className="panel" style={{ padding: 14 }}>
            <b>{c.name}</b> <span className="tag">{c.role}</span>
            <div className="stat mt"><span className="label">Kỹ năng</span><div className="bar"><div style={{ width: `${c.skill}%` }} /></div></div>
            <div className="stat mt"><span className="label">Lòng trung thành</span><div className="bar"><div style={{ width: `${c.loyalty}%`, background: 'var(--c-gold)' }} /></div></div>
            <div style={{ fontSize: 11, color: 'var(--c-dim)', marginTop: 6 }}>Lương: {c.salaryPerDay} CR/ngày</div>
          </div>
        ))}
      </div>
    </div>
  );
}
