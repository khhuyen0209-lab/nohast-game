# Thiết kế game Nohast (tóm tắt theo đặc tả)

## Thế giới 3 lớp (spec §6)
- **Lớp 1 (thiên văn thực)**: Hệ Mặt Trời nội tâm — Mặt Trời, Sao Thủy, Kim, Trái Đất, Mặt Trăng, Hỏa, vành đai tiểu hành tinh. Đánh dấu `realAstronomy: true`, hiển thị tag xanh.
- **Lớp 2 (chưa khám phá)**: các hệ sao khác — deferred, data model sẵn sàng.
- **Lớp 3 (giả tưởng)**: Dị thường thì thầm (exotic_matter), Cổng dịch chuyển Proto. Đánh dấu hư cấu, tag tím.

## Kinh tế (spec §23–25)
- 3 nhóm tài nguyên: hữu hạn (iron_ore, rare_ore, ice, exotic_matter), tái tạo (biomass), chế tạo (energy_cell, alloy_plate, ship_module) + currency (credits) + fuel.
- Chuỗi cung ứng: khai thác → vận chuyển → chế tạo → thương mại → bảo trì. MVP: khai thác + bán + mua module.
- Giao dịch an toàn: atomic wallet mutation, ledger transactions, chống âm/double-spend. Giá do server tính (drift theo cung cầu).

## Tàu theo module (spec §11)
- 11 slot: hull, engine, reactor, weapon, shield, cargo, sensor, mining, lab, habitat, computer.
- Mỗi module: mass, volume, powerDraw, durability, cost, stats. Swap module = server kiểm tra slot hợp lệ trên hull, cân bằng công suất, trừ tiền.
- Trade-off: vũ khí ↑ → hàng ↓; giáp ↑ → nặng ↑; công suất ↑ → chi phí vận hành ↑.

## Nohast & Nahast-Rules (spec §16–22)
- Nohast = trạm trung tâm GM, không phải tên GM. Dịch vụ: market, storage, respawn, galaxy data, shipyard, crew recruitment, chat lobby.
- Nahast-Rules = vũ khí thảm họa. Khi chiếm giữ đạt ngưỡng → tự động xả năng lượng, KHÔNG thể dừng. Microstream bắn mục tiêu tiếp cận, sát thương suy giảm nhanh theo khoảng cách.
- **Tất cả số liệu (ngưỡng, thời lượng, ETA) là TEMPORARY placeholder** trong `NAHAST_CONFIG`, không phải cốt truyện xác nhận.

## Giới hạn (server-enforced)
- Tối đa 3 tàu, 1 trạm/người chơi.
- Hồi sinh tại Nohast mất phí; trạm cá nhân có buồng nhân bản thì giảm/miễn.
- Offline progression giới hạn 7 ngày.
