// WebSocket layer: presence + chat channels (spec §32–33).
// Auth: client sends {type:'auth', token} first. Server verifies Firebase token.
// Rate-limited chat; spam rejected. Messages persisted via repository.
import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'node:http';
import { verifyIdToken } from '../auth/firebaseAdmin';
import { getRepository } from '../repositories';
import { safeStr } from '../../../shared/schemas/validators';
import { GAME_LIMITS } from '../../../shared/constants';
import type { ChatMessage, ChatChannel, PresenceInfo } from '../../../shared/types';

interface Client {
  ws: WebSocket;
  uid: string;
  name: string;
  regionId: string;
  shipId?: string;
  lastChatAt: number;
  chatCountWindow: number;
  chatWindowStart: number;
}

const clients = new Map<string, Client>(); // uid -> client (one connection per uid MVP)

function send(ws: WebSocket, msg: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(channel: ChatChannel, regionId: string | undefined, msg: unknown, excludeUid?: string) {
  for (const c of clients.values()) {
    if (c.uid === excludeUid) continue;
    if (channel === 'region' && c.regionId !== regionId) continue;
    send(c.ws, msg);
  }
}

export function attachWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let client: Client | null = null;

    ws.on('message', async (raw) => {
      let data: any;
      try { data = JSON.parse(raw.toString()); } catch { return; }

      // Auth handshake
      if (data.type === 'auth') {
        const decoded = await verifyIdToken(String(data.token || ''));
        if (!decoded) { send(ws, { type: 'error', error: 'Xác thực WebSocket thất bại.' }); return ws.close(); }
        const repo = getRepository();
        const profile = await repo.getProfile(decoded.uid);
        const ships = await repo.listShips(decoded.uid);
        client = {
          ws, uid: decoded.uid, name: profile?.commanderName || decoded.uid.slice(0, 8),
          regionId: ships[0]?.position.regionId || 'sol-inner', shipId: ships[0]?.id,
          lastChatAt: 0, chatCountWindow: 0, chatWindowStart: Date.now(),
        };
        clients.set(decoded.uid, client);
        const presence: PresenceInfo = { uid: decoded.uid, commanderName: client.name, regionId: client.regionId, shipId: client.shipId, online: true, lastSeenAt: Date.now() };
        await repo.setPresence(presence);
        send(ws, { type: 'auth_ok', uid: decoded.uid, name: client.name, regionId: client.regionId });
        broadcast('region', client.regionId, { type: 'presence', presence: { ...presence } });
        return;
      }

      if (!client) { send(ws, { type: 'error', error: 'Chưa xác thực.' }); return; }

      if (data.type === 'chat') {
        const now = Date.now();
        if (now - client.chatWindowStart > 60_000) { client.chatWindowStart = now; client.chatCountWindow = 0; }
        client.chatCountWindow += 1;
        if (client.chatCountWindow > GAME_LIMITS.CHAT_RATE_PER_MIN) {
          send(ws, { type: 'error', error: 'Gửi tin quá nhanh, vui lòng chậm lại.' }); return;
        }
        const channel = (['region', 'global', 'nohast', 'faction', 'alliance', 'private'].includes(data.channel) ? data.channel : 'region') as ChatChannel;
        const text = safeStr(data.text, GAME_LIMITS.CHAT_MAX_LENGTH);
        if (!text) return;
        const msg: ChatMessage = {
          id: `msg-${now}-${Math.random().toString(36).slice(2, 6)}`,
          channel, regionId: channel === 'region' ? client.regionId : undefined,
          fromUid: client.uid, fromName: client.name, toUid: data.toUid, text, createdAt: now,
        };
        const repo = getRepository();
        await repo.addChatMessage(msg);
        const payload = { type: 'chat', message: msg };
        if (channel === 'private' && msg.toUid) {
          const target = clients.get(msg.toUid);
          if (target) send(target.ws, payload);
          send(ws, payload);
        } else {
          broadcast(channel, msg.regionId, payload);
        }
        return;
      }

      if (data.type === 'ping') { send(ws, { type: 'pong', t: Date.now() }); return; }
    });

    ws.on('close', async () => {
      if (client) {
        clients.delete(client.uid);
        const repo = getRepository();
        await repo.setPresence({ uid: client.uid, commanderName: client.name, regionId: client.regionId, online: false, lastSeenAt: Date.now() });
        broadcast('region', client.regionId, { type: 'presence_offline', uid: client.uid });
      }
    });
  });

  return wss;
}

export function getOnlineCount() { return clients.size; }
