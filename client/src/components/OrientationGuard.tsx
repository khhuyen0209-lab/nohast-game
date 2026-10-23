// spec §36: prompt landscape; try Screen Orientation API after user gesture.
import { useState } from 'react';

export function OrientationGuard() {
  const [dismissed, setDismissed] = useState(false);
  const tryLock = async () => {
    try {
      const anyScreen = screen as any;
      if (anyScreen.orientation?.lock) await anyScreen.orientation.lock('landscape');
    } catch { /* not supported — fallback to prompt only */ }
    setDismissed(true);
  };
  if (dismissed) return null;
  return (
    <div className="orient-guard">
      <div className="phone" />
      <h2 className="title glow-text">Nohast ưu tiên chơi ngang</h2>
      <p style={{ color: 'var(--c-dim)', maxWidth: 320 }}>
        Xoay điện thoại ngang để có trải nghiệm tốt nhất. Nếu trình duyệt hỗ trợ, bạn có thể khóa xoay tự động.
      </p>
      <button className="primary" onClick={tryLock}>Đã xoay ngang — tiếp tục</button>
      <button onClick={() => setDismissed(true)}>Vẫn chơi dọc</button>
    </div>
  );
}
