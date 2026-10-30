# Kiểm thử 30 Member qua nhiều ngày

## Bộ dữ liệu đã đưa vào bản localhost:8081 theo yêu cầu Owner

Owner đã chỉ định `http://localhost:8081/` để lấy dữ liệu. Bản này dùng API `http://localhost:3000/api` và database cấu hình `fitness_manage` trên Atlas, không phải MongoDB test ở cổng 27031. Đã nhập bổ sung nhóm **Demo 30** từ scenario PASS `fitness_test_activity_20261028122824429`: 30 Member + 3 PT, 67 gói, 855 check-ins, 73 PT attendance, 341 nhật ký, 315 số đo, 20 bài mẫu. Các bản ghi có trước được kiểm tra bằng digest trước/sau nhập và giữ nguyên. Không chuyển app sang database test, không reset/drop dữ liệu.

Artifact trên máy này nằm tại `.local/demo30-app-data/` (Git ignore):

- `members.csv`: 30 Member để đăng nhập; `accounts.csv`: thêm cả 3 PT, không chứa mật khẩu.
- `demo30-data.json`: dữ liệu của nhóm mẫu, đã bỏ password/hash, token, secret, CCCD và không xuất hồ sơ tài khoản cũ. Đây là file dữ liệu tham khảo, không phải backup đầy đủ để restore database.
- `report.json`: baseline, số lượng nhập và đối chiếu giữ nguyên bản ghi cũ; `verification.json`: kiểm tra API thật sau nhập; `browser-verification.json`: kiểm tra app 8081 không mock.
- `README.md`: hướng dẫn xem dữ liệu. Owner vào Khách hàng → tìm theo Tên → tên trong accounts.csv, ví dụ Nguyễn Minh Anh. Ngày 2026-10-29 đã đổi tên 30 Member/3 PT sang tên tiếng Việt; nhãn Demo 30 trong report nhập gốc là lịch sử. Member mở Hoạt động tập luyện. Member/PT mới dùng mật khẩu tài khoản demo cùng role hiện có trong `.local/demo-accounts.json`; không chép mật khẩu vào báo cáo hoặc file xuất.

Đối chiếu ngày 2026-10-29: 30 Member, 1.236 assertions / 279 HTTP requests PASS trên API/Atlas của app; browser Owner/Member có dữ liệu/Member trống PASS trên web 8081, không mock. Trạng thái gói tính theo ngày hiện tại; lịch sử mẫu tạo ngày trước có thể chuyển từ chờ kích hoạt sang đang dùng. Giữ nguyên giới hạn lịch sử fixture và camera/native/push ở bên dưới. Runner scenario gốc vẫn chỉ chấp nhận database test rỗng; không đổi guard đó để ghi vào database app.

Runner: `apps/api/test/activity-scenario.ts`. Browser: `scripts/activity-scenario-browser.cjs`.

## Mục tiêu và phạm vi

- 30 Member, một Owner, ba PT và ba khách Trial (Trial không phải user đăng nhập).
- Sáu tên gói mẫu, thêm gói lịch sử; mỗi nhóm có Member active/sắp hết, exhausted/expired, cancelled và pending. Gia hạn nhiều lần vẫn chỉ tính một người trong thống kê cùng tên + mode.
- Lịch sử vào tập có QR/PHONE, các mốc UTC+7 sát nửa đêm, cuối tháng, chuyển năm 2023–2026, ngày nhuận 29/02/2024. Có PT logs riêng và lượt hiện tại SELF_TRAINING/WITH_INTERNAL_PT với booking Owner tạo.
- Nhật ký nhiều ngày với CUSTOM/CATALOG trùng tên nhưng khác identity, nhiều buổi/ngày, DRAFT/COMPLETED/ARCHIVED; số đo có trường thiếu, sửa và lưu trữ. Một Member không có hoạt động để kiểm tra empty state.
- Thống kê được đối chiếu với oracle độc lập tạo từ input fixture, không gọi lại hàm aggregate của production để tính expected. Kiểm tra toàn bộ 30 Member, tất cả 20 bài và 60 tổ hợp nhóm cơ/dụng cụ.
- Browser dùng API NestJS và MongoDB thật; chỉ đổi đường dẫn transport `/api` của web export sang cổng API test. Không trả JSON giả. Kiểm tra mở hướng dẫn, lọc, chọn bài vào nháp, lưu/hoàn tất, tăng thống kê đúng một buổi; Owner đọc báo cáo năm và gói.

## Chạy

Cần dependencies đã cài, Prisma Client được generate và MongoDB replica set local riêng. Mặc định runner kết nối `127.0.0.1:27031`, replica set `workouttest`; có thể dùng replica set local khác qua SCENARIO_DATABASE_URL.

```powershell
pnpm --filter @fitness/api prisma:generate
pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web
$env:SCENARIO_BROWSER = '1'
pnpm --filter @fitness/api test:activity-scenario
```

Không đặt SCENARIO_DATABASE_URL thì mỗi lần chạy tự tạo tên mới `fitness_test_activity_<timestamp>`. Nếu đặt, URL chỉ được dùng `mongodb://` tới localhost/127.0.0.1, database đúng tiền tố `fitness_test_activity_`, không có credentials và **chưa có collection**. Runner từ chối database có sẵn thay vì reset hoặc drop; không dùng DATABASE_URL nghiệp vụ.

Chỉ chạy API/dữ liệu thì bỏ SCENARIO_BROWSER hoặc đặt `0`. Chạy browser cần Edge và Playwright tạm qua pnpm dlx, không thêm runtime dependency. CLI gọi pnpm JavaScript entry bằng Node để stdin hoạt động nhất quán trên Windows.

Runner tạo JWT secrets và password ngẫu nhiên trong RAM, chỉ lưu password hash trong database. Không ghi password, SĐT, CCCD, access/refresh token vào báo cáo hoặc stdout. Có thể dùng SCENARIO_PASSWORD từ môi trường riêng khi cần chủ động quản lý mật khẩu test; không commit/ghi giá trị vào tài liệu, lệnh log hoặc fixture.

## Kết quả và dữ liệu giữ lại

- `.local/activity-scenario/<runId>/report.json`: trạng thái, số assertions/HTTP requests, counts, thống kê gói/12 tháng và trạng thái browser; không chứa thông tin đăng nhập.
- `report.md`: bảng từng alias Member giả lập, gói/trạng thái, số lượt, nhật ký và số đo để kiểm tra nhanh.
- Ảnh browser cùng thư mục, chỉ chứa dữ liệu giả lập. `.local/` được Git ignore.
- Dataset **được giữ lại kể cả khi test lỗi**. API HTTP test đóng khi chạy xong; runner không xóa database hay dừng MongoDB do người dùng cung cấp. Chạy lại dùng tên mới; không chạy core `test:integration` trên dataset muốn giữ vì core runner drop database của nó.

## Giới hạn

Lịch sử check-in quá khứ là fixture ghi rõ timestamp và đối soát `usedSessions` với log thành công; không thêm endpoint backdate, không sửa clock hoặc business service production. Vì vậy fixture chứng minh truy vấn/báo cáo trên lịch sử nhiều ngày, không chứng minh mọi thao tác check-in từng được replay qua API vào ngày quá khứ. Thao tác hiện tại, retry/concurrency, nhật ký/số đo, packages/renewals và thư viện dùng API thật.

Không kiểm chứng camera, push, native device, độ chính xác thuật toán AI hoặc kỹ thuật tập trên người thật. Đây là kiểm thử dữ liệu/chức năng nhiều tài khoản, không phải benchmark tải production. Quyền, quota và phạm vi sản phẩm giữ theo SOT 02/08/11/17/21; kết quả thực tế ghi SOT 20.
