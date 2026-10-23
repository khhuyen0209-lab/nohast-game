// Market at Nohast. Prices from server; trades atomic server-side (spec §25).
import { useEffect, useState } from 'react';
import { useGame } from '../../systems/GameContext';
import { apiGet, apiPost } from '../../api/client';
import { RESOURCE_DEFS } from '../../../../shared/game-data/resources';
import type { MarketPrice, ResourceId } from '../../../../shared/types';

export function MarketScreen() {
  const { wallet, ships, refresh, toast } = useGame();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const ship = ships[0];
  const dockedAtNohast = ship?.position.dockedAtBodyId === 'nohast-central';

  useEffect(() => { apiGet<any>('/api/economy/market/prices').then((d) => setPrices(d.prices)).catch((e) => toast(e.message, 'error')); }, [toast]);

  const trade = async (rid: ResourceId, side: 'buy' | 'sell') => {
    const amount = amounts[rid] || 1;
    setBusy(true);
    try {
      await apiPost('/api/economy/market/trade', { resourceId: rid, amount, side });
      toast(`${side === 'buy' ? 'Mua' : 'Bán'} ${amount} ${rid} thành công.`, 'success');
      refresh();
      apiGet<any>('/api/economy/market/prices').then((d) => setPrices(d.prices));
    } catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  const sellCargo = async (rid: ResourceId) => {
    const amount = ship?.cargo[rid] || 0;
    if (!amount || !ship) return;
    const price = prices.find((p) => p.resourceId === rid)?.sellPrice || 1;
    setBusy(true);
    try { await apiPost(`/api/ships/${ship.id}/sell-cargo`, { resourceId: rid, amount, pricePerUnit: price }); toast('Đã bán hàng từ kho tàu.', 'success'); refresh(); }
    catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="panel scroll" style={{ height: '100%', padding: 16 }}>
      <div className="title">Chợ Nohast</div>
      {!dockedAtNohast && <div className="mt" style={{ padding: 10, border: '1px solid rgba(255,204,102,0.4)', borderRadius: 8, fontSize: 12, color: 'var(--c-gold)' }}>
        Bạn chưa cập bến Nohast. Mua/bán qua ví vẫn hoạt động; bán hàng từ kho tàu cần cập bến.
      </div>}
      <div className="subtitle mt mb">Bạn có: {wallet?.credits.toLocaleString()} CR</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ color: 'var(--c-dim)', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>
          <th style={{ padding: 8 }}>Tài nguyên</th><th>Nhóm</th><th>Mua</th><th>Bán</th><th>Bạn có</th><th style={{ width: 180 }}>Giao dịch</th>
        </tr></thead>
        <tbody>
          {prices.map((p) => {
            const def = RESOURCE_DEFS[p.resourceId];
            const have = (wallet?.resources as any)?.[p.resourceId] || 0;
            const cargo = ship?.cargo[p.resourceId] || 0;
            return (
              <tr key={p.resourceId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: 8 }}><b>{def.name}</b><div style={{ fontSize: 10, color: 'var(--c-dim)' }}>{p.resourceId}</div></td>
                <td><span className="tag">{def.kind}</span></td>
                <td style={{ color: 'var(--c-gold)' }}>{p.buyPrice}</td>
                <td style={{ color: 'var(--c-cyan)' }}>{p.sellPrice}</td>
                <td>{have}{cargo > 0 && <span style={{ color: 'var(--c-dim)' }}> (+{cargo} trong kho)</span>}</td>
                <td>
                  <div className="flex">
                    <input type="number" min={1} defaultValue={1} style={{ width: 60 }} onChange={(e) => setAmounts({ ...amounts, [p.resourceId]: parseInt(e.target.value) || 1 })} />
                    <button disabled={busy} onClick={() => trade(p.resourceId, 'buy')}>Mua</button>
                    <button disabled={busy} onClick={() => trade(p.resourceId, 'sell')}>Bán ví</button>
                    {cargo > 0 && <button disabled={busy || !dockedAtNohast} onClick={() => sellCargo(p.resourceId)}>Bán kho</button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
