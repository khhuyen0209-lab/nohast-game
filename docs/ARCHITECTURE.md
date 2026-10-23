# Kiến trúc Nohast

## Nguyên tắc (spec §5)
**Server là nguồn dữ liệu có thẩm quyền.** Client chỉ gửi hành động; server kiểm tra quyền, điều kiện, tài nguyên, cooldown, tính hợp lệ trước khi ghi. Firestore Security Rules chặn mọi client write.

## Các lớp
- `shared/` — types, constants, game-data (module catalog, resources, world, factions), validators. Định nghĩa bằng dữ liệu, dễ mở rộng (spec §48).
- `server/src/repositories/` — interface `GameRepository` với 2 triển khai: `FirestoreRepository` (prod, dùng Firestore transaction cho ví) và `MemoryRepository` (dev/test, có mutex per-uid).
- `server/src/services/` — nghiệp vụ: shipService, marketService, stationService, crewService, offlineService, nohastService.
- `server/src/game/engine.ts` — hàm thuần (không I/O): aggregate stats, travel time, fuel cost, mining yield, maintenance, module validation — dễ unit test.
- `server/src/multiplayer/wsServer.ts` — WebSocket: auth handshake, presence, chat các kênh, rate-limit.
- `server/src/api/` — routes REST, tất cả (trừ world public + health) đi qua `requireAuth` (verify Firebase ID token).
- `client/` — React, phân tách features/screens; `GameContext` quản lý trạng thái; `WSClient` reconnect có backoff; `SpaceScene` (Three.js) phân tầng hiệu năng.

## Dữ liệu thời gian (spec §8)
Mọi mốc thời gian dùng đồng hồ server. Ship có `position.warp {startedAt, arrivesAt}` và `position.mining {startedAt}`. Khi load, `resolveShipState()` tính dựa trên `Date.now()` server. Offline catch-up giới hạn `MAX_OFFLINE_MS` (7 ngày).

## Mở rộng (spec §48)
- Thêm module/tài nguyên/thiên thể/phe: chỉ sửa file trong `shared/game-data/`.
- Thêm hệ thống mới (chiến đấu, nghiên cứu): thêm service + route + collection, không viết lại lõi.
- Nahast-Rules: mọi ngưỡng trong `NAHAST_CONFIG` (đánh dấu TEMPORARY), state machine trong `nohastService`.
