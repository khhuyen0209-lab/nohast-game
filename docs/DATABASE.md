# Cấu trúc dữ liệu Firestore (spec §45–46)

Không lưu mọi thứ trong một document. Phân nhóm logic:

| Collection/Document | Mô tả | Quyền client |
|---|---|---|
| `players/{uid}` | Hồ sơ chỉ huy (tên, credits, faction, tutorial, commanderStatus) | read: owner; write: server |
| `players/{uid}/ships/{shipId}` | Tàu + modules + position + cargo | read: owner; write: server |
| `players/{uid}/stations/{stationId}` | Trạm cá nhân | read: owner; write: server |
| `players/{uid}/crew/{crewId}` | Thủy thủ, sĩ quan | read: owner; write: server |
| `players/{uid}/transactions/{txId}` | Sổ cái giao dịch (kiểm tra, khôi phục — spec §25) | read: owner; write: server |
| `wallets/{uid}` | {credits, resources, updatedAt} — cập nhật atomic trong transaction | read: owner; write: server |
| `world/market/state` | Giá & cung cầu thị trường | read: auth; write: server |
| `world/nohast/state` | Trạng thái Nohast + Nahast-Rules discharge | read: auth; write: server |
| `world/events/{id}` | Sự kiện thế giới | read: auth; write: server |
| `factions/{id}`, `alliances/{id}` | Phe phái, liên minh | read: auth; write: server |
| `presence/{uid}` | Trạng thái online | read: auth; write: server |
| `chat/messages/log/{msgId}` | Lịch sử chat (giới hạn) | read: auth; write: server |

## Quy tắc
- `firebase/firestore.rules`: mọi write = false (server qua Admin SDK). Read chỉ owner hoặc public world.
- Index cần thiết: `firebase/firestore.indexes.json` (transactions, chat, presence).
- ID ổn định: ship/station/crew dùng prefix + timestamp + random. Transaction ID có thể dùng làm key tra cứu.
- Mọi thay đổi credits/resources đi qua `mutateWallet()` (Firestore transaction hoặc memory mutex) → không double-spend, không âm, có ledger.
