// Central game state: auth, profile, wallet, ships, stations, crew, toasts.
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { apiGet, apiPost, apiPatch, ApiError } from '../api/client';
import { wsClient } from './WSClient';
import type { PlayerProfile, Wallet, Ship, PersonalStation, CrewMember, OfflineReport, ChatMessage, PresenceInfo } from '../../../shared/types';

interface Toast { id: number; text: string; kind: 'error' | 'success' | 'info'; }

interface GameState {
  user: any | null;
  authLoading: boolean;
  profile: PlayerProfile | null;
  wallet: Wallet | null;
  ships: Ship[];
  stations: PersonalStation[];
  crew: CrewMember[];
  offline: OfflineReport | null;
  presence: PresenceInfo[];
  chat: ChatMessage[];
  toasts: Toast[];
  view: string;
  setView: (v: string) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  createProfile: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
  toast: (text: string, kind?: Toast['kind']) => void;
  updateTutorial: (step: number) => Promise<void>;
  setPerformance: (m: 'low' | 'medium' | 'high') => Promise<void>;
}

const Ctx = createContext<GameState | null>(null);
export const useGame = () => useContext(Ctx)!;

let toastId = 0;

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ships, setShips] = useState<Ship[]>([]);
  const [stations, setStations] = useState<PersonalStation[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [offline, setOffline] = useState<OfflineReport | null>(null);
  const [presence, setPresence] = useState<PresenceInfo[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [view, setView] = useState('cockpit');
  const regionRef = useRef('sol-inner');

  const toast = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet<any>('/api/profile');
      setProfile(data.profile); setWallet(data.wallet); setShips(data.ships);
      setStations(data.stations); setCrew(data.crew); setOffline(data.offline || null);
      if (data.ships[0]) regionRef.current = data.ships[0].position.regionId;
      if (data.offline && (data.offline.maintenanceCredits > 0 || data.offline.miningYield)) {
        toast(`Bạn đã ngoại tuyến ${Math.round(data.offline.elapsedMs / 60000)} phút. Bảo trì: -${data.offline.maintenanceCredits} CR.`, 'info');
      }
    } catch (e: any) {
      if (e.code === 'NO_PROFILE') { setProfile(null); }
      else toast(e.message || 'Lỗi tải dữ liệu.', 'error');
    }
  }, [toast]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u); setAuthLoading(false);
      if (u) {
        wsClient.connect();
        await refresh();
      } else {
        wsClient.disconnect();
        setProfile(null); setWallet(null); setShips([]);
      }
    });
    return () => unsub();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const off = wsClient.on((msg) => {
      if (msg.type === 'chat') setChat((c) => [...c.slice(-80), msg.message]);
      if (msg.type === 'presence') setPresence((p) => [...p.filter((x) => x.uid !== msg.presence.uid), msg.presence]);
      if (msg.type === 'presence_offline') setPresence((p) => p.filter((x) => x.uid !== msg.uid));
      if (msg.type === 'error') toast(msg.error, 'error');
    });
    return () => { off(); };
  }, [user, toast]);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    toast('Đăng nhập thành công.', 'success');
  };
  const register = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
    toast('Tài khoản đã tạo. Tiếp tục tạo hồ sơ chỉ huy.', 'success');
  };
  const logout = async () => { await signOut(auth); toast('Đã đăng xuất.'); };

  const createProfile = async (name: string) => {
    await apiPost('/api/profile', { commanderName: name });
    toast('Hồ sơ đã tạo. Bạn nhận được tàu khởi đầu và tài sản ban đầu!', 'success');
    await refresh();
  };
  const updateTutorial = async (step: number) => { await apiPatch('/api/profile', { tutorialStep: step }); if (profile) { setProfile({ ...profile, tutorialStep: step }); } };
  const setPerformance = async (m: 'low' | 'medium' | 'high') => { await apiPatch('/api/profile', { performanceMode: m }); if (profile) setProfile({ ...profile, performanceMode: m }); };

  const value: GameState = {
    user, authLoading, profile, wallet, ships, stations, crew, offline, presence, chat, toasts, view, setView,
    login, register, logout, createProfile, refresh, toast, updateTutorial, setPerformance,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
