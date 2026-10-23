import { useGame } from '../systems/GameContext';
import { Toasts } from '../components/Toasts';
import { OrientationGuard } from '../components/OrientationGuard';
import { Tutorial } from '../components/Tutorial';
import { AuthScreen } from '../features/auth/AuthScreen';
import { CreateProfile } from '../features/auth/CreateProfile';
import { CockpitScreen } from '../features/cockpit/CockpitScreen';
import { StarMapScreen } from '../features/starmap/StarMapScreen';
import { ShipManager } from '../features/ship/ShipManager';
import { MarketScreen } from '../features/market/MarketScreen';
import { StationScreen } from '../features/station/StationScreen';
import { NohastScreen } from '../features/nohast/NohastScreen';
import { ChatPanel } from '../features/chat/ChatPanel';
import { CrewScreen } from '../features/crew/CrewScreen';
import { FactionsScreen } from '../features/factions/FactionsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { RESOURCE_DEFS } from '../../../shared/game-data/resources';

const NAV = [
  { id: 'cockpit', label: 'Buồng lái', icon: '◈' },
  { id: 'starmap', label: 'Bản đồ', icon: '✦' },
  { id: 'ship', label: 'Tàu & Module', icon: '⬢' },
  { id: 'market', label: 'Chợ', icon: '⬡' },
  { id: 'station', label: 'Trạm cá nhân', icon: '▣' },
  { id: 'nohast', label: 'Trạm Nohast', icon: '◉' },
  { id: 'crew', label: 'Thủy thủ', icon: '☺' },
  { id: 'factions', label: 'Phe phái', icon: '⚑' },
  { id: 'chat', label: 'Chat', icon: '✎' },
  { id: 'settings', label: 'Cài đặt', icon: '⚙' },
];

function ResourceBar() {
  const { wallet, profile } = useGame();
  if (!wallet) return null;
  const top = ['credits', 'fuel', 'iron_ore', 'rare_ore', 'exotic_matter'];
  return (
    <div className="panel" style={{ display: 'flex', gap: 18, padding: '8px 16px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ fontWeight: 700, color: 'var(--c-gold)' }}>{profile?.commanderName}</div>
      {top.map((rid) => {
        const def = RESOURCE_DEFS[rid as keyof typeof RESOURCE_DEFS];
        const amt = rid === 'credits' ? wallet.credits : (wallet.resources as any)[rid] || 0;
        return (
          <div key={rid} className="stat" title={def.name}>
            <span className="label">{def.name}</span>
            <span className="value" style={{ color: rid === 'credits' ? 'var(--c-gold)' : 'var(--c-blue)' }}>{Math.floor(amt).toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const { user, authLoading, profile, view, setView, logout } = useGame();

  if (authLoading) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-dim)' }}>Đang kết nối Nohast…</div>;

  return (
    <>
      <OrientationGuard />
      <Toasts />
      {!user && <AuthScreen />}
      {user && !profile && <CreateProfile />}
      {user && profile && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 10px 0' }}><ResourceBar /></div>
          <div style={{ flex: 1, display: 'flex', minHeight: 0, padding: 10, gap: 10 }}>
            <nav className="panel scroll" style={{ width: 150, padding: 10, display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              <div className="subtitle mb" style={{ padding: '4px 6px' }}>Nohast</div>
              {NAV.map((n) => (
                <button key={n.id} onClick={() => setView(n.id)}
                  style={{ textAlign: 'left', background: view === n.id ? 'linear-gradient(135deg, rgba(111,168,255,0.3), rgba(143,124,255,0.3))' : undefined, borderColor: view === n.id ? 'var(--c-blue)' : undefined }}>
                  <span style={{ marginRight: 8 }}>{n.icon}</span>{n.label}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button className="danger" onClick={logout}>Đăng xuất</button>
            </nav>
            <main style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              {view === 'cockpit' && <CockpitScreen />}
              {view === 'starmap' && <StarMapScreen />}
              {view === 'ship' && <ShipManager />}
              {view === 'market' && <MarketScreen />}
              {view === 'station' && <StationScreen />}
              {view === 'nohast' && <NohastScreen />}
              {view === 'crew' && <CrewScreen />}
              {view === 'factions' && <FactionsScreen />}
              {view === 'chat' && <ChatPanel />}
              {view === 'settings' && <SettingsScreen />}
            </main>
          </div>
          <Tutorial />
        </div>
      )}
    </>
  );
}
