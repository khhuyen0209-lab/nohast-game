// 2D canvas star map (spec §35: 2D for maps when more efficient).
// Shows bodies + online players in region (presence via WebSocket).
import { useEffect, useRef } from 'react';
import { useGame } from '../../systems/GameContext';
import { STARTER_REGION } from '../../../../shared/game-data/world';

export function StarMapScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ships, presence } = useGame();
  const ship = ships[0];

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const w = canvas.width = canvas.clientWidth * devicePixelRatio;
      const h = canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      const W = canvas.clientWidth, H = canvas.clientHeight;
      ctx.fillStyle = '#0a0e1f'; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, scale = Math.min(W, H) / 1100;
      // orbit rings
      ctx.strokeStyle = 'rgba(111,168,255,0.12)';
      for (const b of STARTER_REGION.bodies) {
        if (!b.orbitRadius) continue;
        ctx.beginPath(); ctx.arc(cx, cy, b.orbitRadius * scale, 0, Math.PI * 2); ctx.stroke();
      }
      // bodies
      for (const b of STARTER_REGION.bodies) {
        const a = (b.orbitAngleDeg * Math.PI) / 180;
        const x = cx + Math.cos(a) * b.orbitRadius * scale;
        const y = cy + Math.sin(a) * b.orbitRadius * scale;
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(x, y, Math.max(3, b.radius * 300 * scale), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = b.realAstronomy ? '#55e0c0' : '#8F7CFF';
        ctx.font = '10px sans-serif'; ctx.fillText(b.name, x + 8, y + 3);
      }
      // player ship (same coordinate space as bodies: region units = Mkm)
      if (ship) {
        const sx = cx + ship.position.x * scale, sy = cy + ship.position.y * scale;
        ctx.fillStyle = '#ffcc66'; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffcc66'; ctx.font = '10px sans-serif'; ctx.fillText('Bạn', sx + 8, sy + 3);
      }
      // other players (presence) — clustered near Nohast for MVP
      for (const p of presence) {
        if (p.uid === ship?.ownerUid) continue;
        const px = cx + (115 + (p.uid.charCodeAt(0) % 20)) * scale, py = cy + (97 + (p.uid.charCodeAt(1) % 20)) * scale;
        ctx.fillStyle = '#6FA8FF'; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6FA8FF'; ctx.font = '10px sans-serif'; ctx.fillText(p.commanderName, px + 8, py + 3);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [ship, presence]);

  return (
    <div className="panel" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', top: 10, left: 12, fontSize: 11, color: 'var(--c-dim)' }}>
        <span className="tag real">thiên văn thực</span> <span className="tag fiction">hư cấu</span> · vàng = tàu của bạn · xanh = người chơi khác
      </div>
      <div style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 11, color: 'var(--c-dim)' }}>
        Đang online khu vực: {presence.length} người chơi
      </div>
    </div>
  );
}
