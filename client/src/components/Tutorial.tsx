// Onboarding overlay (spec §9, §49.15). Advances through steps.
import { useState } from 'react';
import { useGame } from '../systems/GameContext';

const STEPS = [
  { title: 'Chào mừng đến Nohast', body: 'Bạn là một chỉ huy mới. Bạn đã nhận được tàu trinh sát, nhiên liệu và tín dụng khởi đầu.' },
  { title: 'Buồng lái', body: 'Màn hình Buồng lái cho thấy tàu và khu vực xung quanh. Chọn thiên thể để di chuyển hoặc khai thác.' },
  { title: 'Bản đồ', body: 'Mở Bản đồ vũ trụ để xem các thiên thể, phân biệt dữ liệu thiên văn thực (xanh) và nội dung hư cấu (tím).' },
  { title: 'Khai thác & giao dịch', body: 'Đến vành đai tiểu hành tinh, bắt đầu khai thác quặng, rồi về Nohast bán tại chợ.' },
  { title: 'Nâng cấp tàu', body: 'Tại Quản lý tàu, bạn có thể lắp module mới. Mọi giao dịch được server xác thực (spec §5).' },
  { title: 'Gặp người chơi khác', body: 'Mở Chat để trò chuyện kênh khu vực. Người chơi cùng khu vực hiển thị trên bản đồ.' },
];

export function Tutorial() {
  const { profile, updateTutorial, toast } = useGame();
  const [step, setStep] = useState(profile?.tutorialStep || 0);
  if (!profile || profile.tutorialStep >= STEPS.length) return null;
  const s = STEPS[step];
  const next = async () => {
    const ns = step + 1;
    setStep(ns);
    try { await updateTutorial(ns); } catch (e: any) { toast(e.message, 'error'); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,20,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="panel" style={{ maxWidth: 420, padding: 24 }}>
        <div className="subtitle">Hướng dẫn {step + 1}/{STEPS.length}</div>
        <h3 className="title glow-text mt">{s.title}</h3>
        <p className="mt" style={{ color: 'var(--c-dim)', lineHeight: 1.6 }}>{s.body}</p>
        <div className="flex between mt">
          <button onClick={() => updateTutorial(STEPS.length).then(() => setStep(STEPS.length))}>Bỏ qua</button>
          <button className="primary" onClick={next}>{step === STEPS.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}</button>
        </div>
      </div>
    </div>
  );
}
