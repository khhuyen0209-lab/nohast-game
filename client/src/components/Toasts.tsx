import { useGame } from '../systems/GameContext';

export function Toasts() {
  const { toasts } = useGame();
  return (
    <div className="toast">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item ${t.kind}`}>{t.text}</div>
      ))}
    </div>
  );
}
