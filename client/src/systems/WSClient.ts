// WebSocket client: presence + chat (spec §32–33). Reconnects with backoff.
import { auth } from '../config/firebase';
import { WS_URL } from '../config/runtime';
import type { ChatMessage, PresenceInfo } from '../../../shared/types';

type Handler = (msg: any) => void;

export class WSClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<Handler>();
  private reconnectTimer: any = null;
  private backoff = 1000;
  closed = false;

  on(h: Handler) { this.handlers.add(h); return () => this.handlers.delete(h); }
  private emit(msg: any) { this.handlers.forEach((h) => { try { h(msg); } catch {} }); }

  connect() {
    this.closed = false;
    this.open();
  }

  private async open() {
    if (this.closed) return;
    const user = auth.currentUser;
    if (!user) { this.reconnectTimer = setTimeout(() => this.open(), 3000); return; }
    const idToken = await user.getIdToken(true);
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = WS_URL ? `${WS_URL}/ws` : `${proto}://${location.host}/ws`;
    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => { this.backoff = 1000; this.send({ type: 'auth', token: idToken }); };
    this.ws.onmessage = (e) => { try { this.emit(JSON.parse(e.data)); } catch {} };
    this.ws.onclose = () => this.scheduleReconnect();
    this.ws.onerror = () => { try { this.ws?.close(); } catch {} };
  }

  private scheduleReconnect() {
    if (this.closed) return;
    this.backoff = Math.min(this.backoff * 2, 15000);
    this.reconnectTimer = setTimeout(() => this.open(), this.backoff);
  }

  send(msg: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  sendChat(channel: string, text: string, toUid?: string) {
    this.send({ type: 'chat', channel, text, toUid });
  }

  disconnect() {
    this.closed = true;
    clearTimeout(this.reconnectTimer);
    try { this.ws?.close(); } catch {}
  }
}

export const wsClient = new WSClient();
