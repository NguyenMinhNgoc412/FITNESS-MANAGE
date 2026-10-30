# FITNESS-MANAGE SOT 20 — Testing & Acceptance

## Demo 30 trong app localhost:8081 — đối chiếu 2026-10-29

- Theo yêu cầu Owner, xác định đúng app `http://localhost:8081/` → API `http://localhost:3000/api` → database `fitness_manage` theo apps/api/.env. Đã nhập bổ sung từ scenario real API/MongoDB PASS `fitness_test_activity_20261028122824429`, không đổi database app hoặc reset bản ghi cũ. Scenario chạy lại đạt 8.168 assertions / 1.777 HTTP requests, browser 20 bài/10 nhóm/Member/Owner PASS. Lượt đầu browser còn dùng câu chữ empty state cũ, đã cập nhật locator trong activity-scenario-browser.cjs rồi chạy full scenario lại PASS.
- `.local/import-demo30.cjs` kiểm tra trùng identity/id, bỏ Owner test để dùng Owner demo hiện có, đổi nhóm tên thành Demo 30 và cấp dải SĐT/CCCD mẫu mới không trùng; reuse password hash của Member/PT demo tương ứng chỉ cho tài khoản thêm mới. Ghi bổ sung trong transaction/shared write lock, tạo index cho các collection workout/số đo/catalog mới và audit metadata cho import. Digest trước/sau xác nhận bản ghi cũ không bị sửa. Không copy sessions, commands, device tokens hoặc notification credentials từ test.
- Nhập thêm 30 Member + 3 PT, 67 gói, 855 check-ins, 73 PT logs, 341 workouts/681 revisions, 315 measurements/443 revisions, 20 guides/versions. Tại thời điểm nhập: tổng 39 users (34 Member), 72 gói, 862 check-ins, 77 PT logs; dữ liệu cũ giữ nguyên.
- `node .local/verify-export-demo30.cjs`: lần cuối PASS **30 Member / 1.236 assertions / 279 HTTP requests**, `retriedAuthConflicts=0`. Đăng nhập thật, so journal/count/progress/buckets/reps/max tạ/null/0, số đo/latest date, packages/library và phân trang với dữ liệu DB; Member bị chặn reports, Owner bị chặn nhật ký/số đo riêng. Báo cáo Owner về nhóm gói và 12 tháng được đối chiếu với toàn database app. Có lượt trước dừng ở auth/logout và auth/login HTTP 409 khi chạy dịch vụ nền; helper chỉ cho retry lỗi auth CONCURRENT_CHANGE có giới hạn và ghi số retry, không giả lập response. Không suy ra benchmark tải từ lượt cuối PASS.
- `pnpm --package=@playwright/test dlx -c "node .local/demo30-browser-live.cjs"`: PASS **actual localhost:8081 + API + Atlas**, không route mock. Owner tìm được Demo 30 và báo cáo gói; Member mới thấy nhật ký/tiến bộ/20 guides; Member 30 trống vẫn đọc thư viện. Ảnh và browser-verification.json trong `.local/demo30-app-data/`.
- `node .local/export-demo30-accounts.cjs`: PASS 33 tài khoản (30 Member/3 PT), không xuất credentials. File `members.csv`, `accounts.csv`, `demo30-data.json`, report/verification/README nằm cùng thư mục; JSON chỉ chứa nhóm mẫu, bỏ password/hash/token/secret/CCCD. Thao tác kiểm tra auth tạo/revoke session test, không sửa quota/check-in/booking hoặc dữ liệu huấn luyện.
- Cover dữ liệu và truy cập FR-PKG/FR-CHECKIN/FR-WORKOUT-001–010 theo phạm vi scenario. Dữ liệu tổng hợp, lịch sử check-in quá khứ là fixture; gói tính trạng thái theo ngày thực tế. Chưa kiểm thử camera/native/push hoặc usability người dùng thật. API/web phải đang chạy để truy cập; dữ liệu Atlas và file xuất còn khi dừng tiến trình. Xem testing-activity-scenario.md cho cách lấy dữ liệu.

## Cải thiện UX ghi tập và xem tiến bộ — 2026-10-28

- Cover FR-WORKOUT-001–005/007/008, giữ 006/009/010 và FR-UI-001/004: lưu nháp/sửa giữ form với response id/version, complete explicit; thu gọn bộ lọc có tóm tắt, hiệp gọn responsive, lỗi tại ô/focus, summary trước biểu đồ, bảng số liệu mở/ẩn và câu chữ dễ hiểu. SOT 05/21 và CHANGELOG cập nhật. Không đổi API/schema, không đụng database nghiệp vụ hoặc dataset scenario 30 Member.
- File chính: screens/workout-journal.tsx, body-measurements.tsx, workout-progress.tsx, workouts.tsx; components/workout-controls.tsx; features/workouts.ts và workouts.spec.ts; ui.tsx thêm scrollRef tùy chọn cho Page và expanded state cho Button. scripts/workouts-regression.cjs mở rộng ca; activity-scenario-browser.cjs cập nhật thao tác theo flow lưu tại chỗ.
- `pnpm --filter @fitness/app lint`: PASS TypeScript/unused checks. `pnpm test:app`: PASS 14 suites / 65 tests, thêm ca định vị lỗi bài/hiệp, null/0 và dữ liệu cần bổ sung trước complete so với draft.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: PASS 1.070 modules. Export Android/iOS bằng `pnpm --filter @fitness/app exec expo export --platform android --platform ios --output-dir dist-sot-native`: PASS 1.473/1.328 modules, Hermes bundles; cảnh báo NO_COLOR/FORCE_COLOR. Không phải APK/Xcode build.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: lần cuối PASS Edge headless, API mock. Cover filter mặc định thu gọn, nhãn khi mở, đóng/mở giữ status; bốn viewport 320/390/768/1280px, không tràn ngang, ô hiệp 48px và hai ô cùng hàng từ 390px; lỗi tại ô và focus, không gửi request khi invalid; mất response/retry cùng key; lưu nháp giữ form rồi sửa/complete dùng đúng version; conflict giữ form, tải lại thất bại chỉ retry chứ không mở form tạo mới; số đo invalid focus, giữ chỉ số cũ khi bổ sung; summary số đo có ngày riêng, bảng số liệu chỉ hiện khi mở; catalog selection và dirty leave guard.
- Một lượt browser dừng vì locator “Nháp” khớp hai revision sau bổ sung ca lưu sửa thành công, không phải lỗi production; đã sửa locator và chạy lại toàn bộ PASS. Kết quả cuối cũng giữ regression semantic feedback, badge/action tiếng Việt và trợ năng từ lượt trước.
- `pnpm --package=@playwright/test dlx -c "node scripts/design-system-regression.cjs"`: PASS Owner/PT/Member trên export cuối. `node --check scripts/workouts-regression.cjs`, `node --check scripts/activity-scenario-browser.cjs`, `git diff --check`: PASS (Git cảnh báo LF/CRLF).
- Đã xem ảnh mới tại `.local/workouts/design-system-390.png`, `sets-compact-390.png`, `progress-overview-mobile.png`, `inline-error-mobile.png`. Chưa kiểm thử native keyboard/focus/scroll, back gesture, screen reader hoặc usability với người dùng thật. Browser dùng API mock; không chạy lại scenario 30 Member/backend integration trong lượt chỉ sửa frontend này. Script scenario được cập nhật flow và kiểm tra cú pháp, chưa chạy end-to-end lại.

## Sửa 5 điểm design system hoạt động tập luyện — 2026-10-28

- Cover FR-UI-001/004 và trải nghiệm FR-WORKOUT-001–010 theo SOT 05/21: nhãn ngày hiển thị, mục đang chọn có dấu ✓/trạng thái trợ năng, semantic feedback lỗi/thành công, trạng thái/action lịch sử bằng tiếng Việt, placeholder tìm bài đúng ngữ cảnh. Không đổi API/schema/nghiệp vụ hoặc dataset 30 Member.
- File chính: ui.tsx (Button selected, Feedback, Badge), components/workout-controls.tsx, components/workout-revision-history.tsx, features/workouts.ts và screens/workouts/workout-journal/body-measurements/workout-progress/exercise-library; mở rộng scripts/workouts-regression.cjs. SOT 05 và CHANGELOG ghi quy tắc giao diện mới.
- `pnpm --filter @fitness/app lint`: PASS TypeScript/unused checks. `pnpm test:app`: PASS 14 suites / 63 tests, gồm semantic contrast tối thiểu 4,5:1.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: PASS 1.070 modules. `pnpm --filter @fitness/app exec expo export --platform android --platform ios --output-dir dist-sot-native`: PASS Android 1.473/iOS 1.328 modules, Hermes bundles. Cảnh báo NO_COLOR/FORCE_COLOR không chặn export; không phải APK/Xcode build.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: PASS Edge headless với API mock. Kiểm tra nhãn Từ ngày/Đến ngày; aria-pressed/dấu chọn và nút tối thiểu 48px; không tràn ngang ở 320/390/768/1280px; error role alert/live region và màu chữ/nền semantic; success live region/màu; Badge/action tiếng Việt, không lộ mã enum; placeholder bài tập. Giữ các ca pending/retry/conflict/revisions/số đo/tiến bộ/catalog và dismiss/accept cảnh báo rời form. Đã xem ảnh `.local/workouts/design-system-390.png`, `design-system-1280.png`, `progress-mobile.png`.
- `pnpm --package=@playwright/test dlx -c "node scripts/design-system-regression.cjs"`: PASS Owner/PT/Member trên export mới để kiểm tra hồi quy component dùng chung. `node --check scripts/workouts-regression.cjs` và `git diff --check`: PASS, Git cảnh báo LF/CRLF.
- Giới hạn: xác minh DOM/accessibility attributes, chưa kiểm thử screen reader hoặc tương tác trên thiết bị native thật; export không chứng minh native interaction. Không chạy lại backend/integration vì lượt này chỉ sửa UI; bằng chứng backend trước đó giữ nguyên ở mục refactor bên dưới.

## Refactor design pattern hoạt động tập luyện — 2026-10-28

- Giữ acceptance FR-WORKOUT-001–010 / SOT 21; tách service nhật ký/số đo/thư viện, bỏ import component/hook từ màn hình khác và giữ kiểu query Zod. Không đổi endpoint, data model/index, workflow hoặc dependency.
- `pnpm --filter @fitness/api lint` và `pnpm --filter @fitness/app lint`: PASS. Lần API lint đầu phát hiện q.page có thể undefined theo generic và test còn gọi service cũ; đã chuẩn hóa page sau parse/cập nhật test theo service mới, chạy lại PASS.
- `pnpm test:api`: PASS 16 suites / 110 tests; `pnpm test:app`: PASS 14 suites / 63 tests. Test mới kiểm tra default/coercion/strict query cùng kiểu enum, mở rộng service role checks và xác nhận resolve cả ba service trong graph NestJS.
- `pnpm build`: PASS NestJS build và app typecheck. `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: PASS, 1.070 modules; cảnh báo NO_COLOR/FORCE_COLOR không chặn export.
- TEST_DATABASE_URL trỏ tới `mongodb://127.0.0.1:27031/fitness_test_patterns_20261028?replicaSet=workouttest`, chạy `pnpm --filter @fitness/api test:integration`: PASS 16/16 ca, 51,039 giây. Runner chỉ tạo/drop database test riêng này; không dùng database nghiệp vụ hoặc database scenario 30 Member đã giữ. Cover HTTP CRUD/self scope, idempotency/replay/races, rollback/revisions, progress, catalog snapshot/search, phân trang và zero operational side effects, cùng regression nghiệp vụ cũ.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: PASS Edge headless mobile/desktop trên export mới; API mock, cover nhật ký pending/retry/conflict/revisions, số đo, biểu đồ, thư viện và guard rời form.
- Giới hạn: chưa kiểm thử thiết bị native/back gesture/camera thật; browser dùng API mock, integration MongoDB xác minh backend riêng. Không chạy lại scenario 30 Member hoặc thay dataset cũ trong lượt refactor. Không cần migration/rollout index vì schema/index không đổi.

## Scenario 30 Member / dữ liệu nhiều ngày / browser API thật — 2026-10-28

- Theo yêu cầu Owner thêm dữ liệu để kiểm tra thống kê, tạo runner riêng `apps/api/test/activity-scenario.ts`, command `pnpm --filter @fitness/api test:activity-scenario`, browser `scripts/activity-scenario-browser.cjs`. Hướng dẫn tại `testing-activity-scenario.md`. Không đổi nghiệp vụ/schema/provider hoặc code production trong lượt này.
- Lần cuối: `$env:SCENARIO_BROWSER='1'` rồi `pnpm --filter @fitness/api test:activity-scenario` PASS **8.168 assertions / 1.777 HTTP requests**, toàn bộ 30 Member. Database được giữ: `fitness_test_activity_20261028105423189` tại MongoDB replica set riêng 127.0.0.1:27031. Chỉ chấp nhận database local rỗng có tiền tố fitness_test_activity_, không dùng/reset/drop database nghiệp vụ. API test đóng sau khi chạy; MongoDB test giữ để xem dữ liệu. Secrets/password runtime chỉ ở RAM, không lưu credential vào report/fixture/stdout.
- Dataset cuối gồm 34 users (30 Member, 1 Owner, 3 PT), 3 Trial không account, 67 gói, **855 Member/Trial check-ins + 73 PT logs**, 6 booking PT cụ thể, 341 nhật ký/681 revisions, 315 số đo/443 revisions, 20 bài mẫu/10 nhóm. Browser thêm và hoàn tất một buổi thật nên tổng nhật ký tăng từ 340 lên 341.
- Gói: 15/30/45 buổi, 3/6/12 tháng; Member active, gần hết, exhausted/expired, cancelled, pending. Gia hạn tạo thêm registration nhưng không tăng unique member trong nhóm. Mọi session counter được đối chiếu với số log consume thành công, không âm. Current check-in thử request đồng thời cùng key, replay sau đó, QR/PHONE khác key cùng ngày, gói không hợp lệ, SELF_TRAINING và WITH_INTERNAL_PT; PT daily guard vẫn độc lập.
- Lịch sử có sát nửa đêm UTC+7, cuối tháng/chuyển năm 2023–2026, ngày nhuận 29/02/2024. Đối chiếu báo cáo đủ 12 tháng cho 2023/2024/2025/2026/2027, tháng/năm rỗng là 0; Dashboard đúng 15 lượt vào tập hôm nay, 2 Trial active, 6 booking/3 PT. Lịch sử quá khứ là fixture có ngày/gói/quota nhất quán, không replay clock hoặc thêm endpoint backdate; không xem fixture này là bằng chứng check-in API đã chạy ở ngày quá khứ.
- Nhật ký/tiến bộ: weekly/monthly, khoảng 30/366 ngày, biên ngày nhuận/chuyển năm, nhiều buổi/ngày, CUSTOM/CATALOG trùng tên vẫn tách, bỏ DRAFT/ARCHIVED, null/0 tạ, phân trang vượt 20, range quá dài bị chặn. Số đo kiểm tra latest/date riêng từng chỉ số, delta đúng precision, không carry-forward/zero fill, sửa/lưu trữ giữ history. Member 30 không có activity kiểm tra empty state; không mở quyền Owner/PT/cross-member.
- Thư viện: kiểm tra API tất cả 20 detail/source/steps, tìm tên Anh không phân biệt hoa thường, 60 tổ hợp nhóm cơ/dụng cụ (gồm trường hợp rỗng), literal query `[`, mọi Member kể cả pending/hết gói đọc được. Browser Edge mobile 390px/Owner 1280px dùng Nest/MongoDB thật, chỉ proxy URL transport; không mock business response. Mở đủ 20 bài, chọn 10 nhóm, tạo nháp từ bài mẫu rồi hoàn tất và đối chiếu progress +1, Member rỗng, báo cáo Owner 2026→2024 và thống kê gói đều PASS.
- Oracle độc lập lấy từ input fixture, không dùng lại helper aggregate production để tính expected. Không phát hiện sai lệch thống kê trong các ca đã chạy. Đối chiếu operations trước/sau toàn bộ nhật ký/số đo và browser không đổi gói/check-in/attendance/pass/booking.
- `pnpm --filter @fitness/api lint`: pass; `pnpm test:api`: pass 16 suites / 109 tests. `node --check scripts/activity-scenario-browser.cjs` và `git diff --check`: pass (Git cảnh báo LF/CRLF). Một lần browser launcher không chạy được do quoting `.cmd` Windows; đã chuyển sang gọi pnpm JS entry bằng Node/stdin và chạy lại full scenario + browser PASS. Các run cũ giữ dataset riêng, không ghi đè kết quả cuối.
- Artifact cuối `.local/activity-scenario/20261028105423189/report.md` (bảng từng Member), `report.json` (counts, tháng/gói), ảnh browser cùng thư mục; dữ liệu giả lập, không token/password/phone/CCCD trong report. Chưa kiểm tra camera, push, native device hoặc kỹ thuật bài tập trên người thật; không phải benchmark tải production.

## Hoạt động tập luyện Member — 2026-10-28

- Phạm vi FR-WORKOUT-001–010 / SOT 21: nhật ký/hiệp/lần/tạ, nháp/hoàn tất/sửa/lưu trữ, revisions, tiến bộ, cân nặng/chiều cao và thư viện 20 bài/10 nhóm. Role/self checks ở guard và service; không mở quyền Owner/PT đọc dữ liệu cá nhân, không tác động booking/check-in/quota/AI.
- `pnpm --filter @fitness/api prisma:generate` và `prisma:validate`: pass Prisma 6.19.3. Chỉ thêm model/index/seed mới; không thêm dependency/provider. Có cảnh báo cấu hình package.json#prisma deprecated; không nâng version trong task.
- `pnpm lint`: pass API/app. `pnpm build`: pass NestJS và app typecheck. `pnpm test:api`: pass 16 suites / 109 tests; `pnpm test:app`: pass 14 suites / 63 tests. Bao gồm ngày UTC+7, validation/precision/null/0, đủ dữ liệu mới hoàn tất, aggregation, catalog/custom identity, source completeness và service authorization; 67 domain routes có guard/role explicit.
- `TEST_DATABASE_URL` trỏ tới MongoDB replica set riêng `127.0.0.1:27031/fitness_test_workouts_20261028`, rồi `pnpm --filter @fitness/api test:integration`: lần cuối pass 16/16 ca (95,875 giây). Runner chạy db push/index/seed chỉ trên DB test có tiền tố fitness_test_, drop database khi kết thúc; tiến trình mongod test đã được xác minh/dừng, giữ thư mục D:/fitness-workout-test-20261028.
- Integration mới cover: retry cùng key chỉ một buổi/revision, stale-version race chỉ một bên thắng, rollback khi complete/update invalid, cross-member read/mutation/revisions 404, archive giữ lịch sử và cập nhật thống kê, một ACTIVE số đo/ngày dưới concurrency, null chiều cao không carry-forward, đơn vị storage nguyên, catalog seed idempotent/không reset ARCHIVED, metadata giả bị chặn, snapshot cũ đọc/sửa được sau archive catalog. Thêm phân trang vượt 20 buổi/số đo/revisions, lọc server; đối chiếu DB trước/sau nhật ký không đổi operational collections. Các ca booking/quota/Trial/auth/CRM cũ cũng pass.
- Lần integration đầu dừng compile vì fixture dùng sai tên delegate ptAttendance (đúng là ptAttendanceLog), 0 tests chạy; đã sửa. Ca bổ sung tìm kiếm q=. phát hiện Prisma MongoDB contains hiểu metacharacter như regex (20 kết quả thay vì 0); đã escape literal query, thêm regression, chạy lại toàn bộ 16 ca pass. Không suy ra các lần thất bại là đã verify thành công.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass. Android/iOS export `--platform android --platform ios --output-dir dist-sot-native`: pass Hermes bundles; đây không phải APK/Xcode build hoặc kiểm thử thiết bị thật. Có cảnh báo NO_COLOR/FORCE_COLOR.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: pass Edge headless với API giả, viewport mobile 390px/desktop 1280px. Cover Home shortcut, nhập hiệp, pending khóa thao tác/đổi mục, mất response rồi retry cùng key, conflict giữ form/tải bản mới, hoàn tất/revisions, số đo chỉ cân nặng rồi bổ sung chiều cao không mất số cũ, duplicate-day mở bản hiện có, chart dữ liệu thiếu, xem hướng dẫn và chọn catalog vào nháp không tự điền reps/tạ. Kiểm tra hủy/đồng ý rời form qua menu. Ảnh local trong .local/workouts/, không dùng identity/video người thật.
- Rà soát browser phát hiện beforeRemove không chặn push từ menu dưới; thêm guard tại Shell chỉ cho /member/workouts, đồng thời dùng usePreventRemove từ expo-router/react-navigation có sẵn và beforeunload. Không thêm thư viện. Một lần hồi quy phát hiện onPress truyền qua Link asChild làm navigation PT reload/mất session memory; fix chỉ gắn handler khi đúng surface, không truyền key onPress=undefined cho các route khác.
- Sau fix Shell, chạy lại `pnpm --package=@playwright/test dlx -c "node scripts/design-system-regression.cjs"`: pass OWNER/PT/MEMBER; chạy lại workouts-regression cũng pass, gồm dismiss/accept cảnh báo rời form. Web export cuối 1.068 modules; native export cuối Android 1.471/iOS 1.324 modules pass. Không suy ra native interaction acceptance từ export.
- `node --check scripts/workouts-regression.cjs` và `git diff --check`: pass (Git cảnh báo LF/CRLF).
- Chưa rollout schema/index/seed vào database nghiệp vụ, chưa deploy/restart hệ thống thật. Chưa thử native device/back gesture/screen reader hoặc toàn bộ acceptance matrix trên thiết bị. Hướng dẫn bài có nguồn ACE/NASM và nội dung ngắn tự biên soạn, chưa kiểm chứng bởi PT trên người thật; không gán chứng nhận chuyên môn, không chẩn đoán/giáo án. Đợt đầu online/text-only; giữ giới hạn theo SOT 21.

## Năm lỗi design system sau review — 2026-10-20

- `pnpm --filter @fitness/app lint`: pass TypeScript/unused checks.
- `pnpm test:app`: pass 13 suites / 60 tests; thêm 9 ca contrast tối thiểu 4,5:1 cho semantic button/link/navigation/badge/message. Các cặp chính: CTA trắng trên primaryStrong khoảng 5,87:1; primaryText trên selected surface khoảng 6,07:1; dangerText trên dangerSurface khoảng 5,69:1.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass, 1.057 modules. Có cảnh báo NO_COLOR/FORCE_COLOR; không phải lỗi build. Đây là web bundle, không phải native build.
- Regression runner `scripts/design-system-regression.cjs` dùng web export mới và API mock, không truy cập database/tài khoản/camera thật. Phạm vi gồm pending cấp/gia hạn, destructive confirmations, menu Owner màn thấp, booking loading/error/retry/empty, tự tập độc lập và PT/Member schedule read-only.
- `pnpm --package=@playwright/test dlx -c "node scripts/design-system-regression.cjs"`: pass Owner/PT/Member trên Edge headless. Khóa picker/date/submit trong request giữ pending ở cả cấp/gia hạn, chặn thử đổi mẫu; ba nút hủy có label/màu semantic; Settings nằm trọn viewport và bấm được sau cuộn ở 1440×480 và 390×480; booking lỗi/rỗng khóa form, retry hoạt động, tự tập vẫn mở. Đã xem ảnh render trong `.local/design-system-fixes/`.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass regression hiện có cho package, booking datetime/prefill/timezone/pending, Member read-only, conversion/picker/shortcut, root isolation và local AI import/pose failure/góc giả lập/delete/cancel/pending. API mock; không suy ra độ chính xác video người thật hoặc tích hợp database.
- `git diff --check` và `node --check scripts/design-system-regression.cjs`: pass; Git có cảnh báo CRLF.
- Cover FR-UI-001/002/004, UX cấp/gia hạn FR-PKG-004/007, check-in FR-CHECKIN-001/002/003 và giữ FR-BOOK-002/003. Không đổi server RBAC/quota/history/schema/provider/dependency; chưa kiểm thử native/thiết bị thật hoặc concurrency MongoDB trong task UI này.

## Dashboard và scheduler sau review — 2026-10-20

- `pnpm --filter @fitness/api test`: pass 12 suites / 71 tests. Thêm 7 ca cho khoảng ngày UTC+7 trước/sau nửa đêm và chuyển năm, cùng khoảng query check-in/booking, Dashboard không dùng transaction và chặn PT/Member trước khi đọc DB; hai scheduler chỉ log mã cố định khi reject, chạy tiếp ở tick sau và dừng timer khi destroy.
- `pnpm --filter @fitness/api lint`: pass TypeScript/unused checks.
- `pnpm --filter @fitness/api build`: pass NestJS build (exit code 0).
- `git diff --check`: pass, chỉ có cảnh báo line ending CRLF.
- Đối chiếu SOT 03/13/17 và FR-SALES-002/FR-NOTI-001/002, giữ Owner-only Dashboard (FR-AUDIT-003); ngày UTC+7 đồng nhất với FR-CHECKIN-008. Không đổi schema/quota/API/stack. Dashboard chỉ đọc cảnh báo đã lưu, có thể trễ khoảng chu kỳ refresh 60 giây khi worker hoạt động bình thường.
- Test dùng mock Prisma/fake timers, chưa xác minh MongoDB hoặc Expo push/thiết bị thật. Không chạy lại frontend/AI tests vì không sửa các phần này.

## Notification và domain pattern fixes — 2026-10-20

- `pnpm --filter @fitness/api prisma:generate` và `prisma:validate`: pass, Prisma Client 6.19.3 được generate từ schema mới. Không chạy db:push/db:indexes trên database nghiệp vụ trong task này.
- `pnpm lint`: pass TypeScript/unused checks API và app. `pnpm build`: pass NestJS build và app typecheck.
- `pnpm --filter @fitness/api test`: pass 10 suites / 64 tests. Bao gồm recovery/lease/claim-token fencing, claim thua không gửi, retry delay/giới hạn, thiếu device, batch được nhận một phần, chống chạy chồng local và khởi tạo external request không chờ push/không consume pass. Module test resolve toàn graph DI, kiểm tra 48 route có guards/roles explicit và HTTP test cho self attendance/pass cùng PT/Member booking/assignment/report 403. Lượt HTTP đầu quá timeout Jest 5 giây; sau đặt timeout khởi động 30 giây và timeout mỗi HTTP request 5 giây, cả suite pass.
- `pnpm --filter @fitness/app test`: pass 12 suites / 51 tests.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass (1.057 modules). Đây là web bundle, không phải native build/thiết bị thật.
- So sánh method/path với controller trước refactor: đủ 48 endpoint, không thêm/mất. `git diff --check`: pass (chỉ có cảnh báo line ending CRLF của Git).
- `pnpm --filter @fitness/api test:integration`: chưa chạy được test (0 tests), thiếu TEST_DATABASE_URL tới database fitness_test_ riêng. Cổng MongoDB test local 127.0.0.1:27027 trong README không hoạt động. Không dùng database development thay thế; chưa xác minh backfill/index/lease concurrency trên MongoDB thật hoặc push Expo/thiết bị thật.
- Cover FR-NOTI-001/002, giữ FR-AUDIT-002/003 và Owner-only booking/assignment. Không đổi UI behavior/stack/AI privacy pipeline. Trước rollout cần dừng worker cũ, chạy generate/db:push/db:indexes theo README/SOT 15. Push vẫn best-effort, có thể duplicate nếu upstream nhận trước khi response mất; không tuyên bố exactly-once.

## One check-in per UTC+7 day — 2026-10-09

- `pnpm --filter @fitness/api lint`: pass TypeScript/unused checks.
- `pnpm --filter @fitness/api build`: pass NestJS build.
- `pnpm test:api`: 7 suites / 51 tests pass. New cases cover daily guard, nửa đêm UTC+7/year rollover, đổi gói/context/method, customer identity sau conversion, Trial lượt cuối, PT độc lập, timestamp guard/log đồng nhất và pending external confirmation không trừ thêm package/pass.
- `git diff --check` cho service check-in/customer/external và integration test: pass.
- `pnpm --filter @fitness/api test:integration`: không chạy được (0 tests), thiếu TEST_DATABASE_URL tới isolated fitness_test_ database. Đã cập nhật fixtures cho ngày mới và thêm QR/SĐT race khác key, đổi gói cùng ngày và ngày sau; chưa xác minh MongoDB concurrency thực tế trong task này.
- Cover FR-CHECKIN-008/FR-AUDIT-002 và quota integrity. Không đổi UI/schema/stack; không tự hoàn số buổi đã trừ hoặc xóa duplicate logs quá khứ. Chưa quét camera/thiết bị thật.

## Owner package/check-in reports — 2026-10-09

- `pnpm lint`: pass API/app TypeScript và unused checks.
- `pnpm build`: pass NestJS build và Expo app typecheck.
- `pnpm test:api`: 6 suites / 41 tests pass. Report tests cover unique Member qua gia hạn, phân biệt mode cùng tên, dữ liệu rỗng, UTC+7/leap year/year rollover, 12 tháng/zero fill và PT/Member bị chặn trước database read.
- `pnpm test:app`: 12 suites / 51 tests pass (regression existing).
- `git diff --check` trên các file code liên quan: pass.
- Cover FR-PKG-008/FR-CHECKIN-007; chỉ read-only, không đổi schema/quota/history. Chưa kiểm thử báo cáo trên browser/native device hoặc tích hợp MongoDB thật; không suy ra số liệu thực tế từ mocked service tests.

## Counter check-in missing selection — 2026-10-08

- `pnpm lint` and `pnpm build`: pass API/app checks.
- `pnpm test:app`: pass 12 suites / 51 tests. QR confirmation requires package/internal booking, self-training omits stale booking, phone fallback omits token, external context cannot bypass dedicated flow.
- `pnpm test:api`: pass 5 suites / 36 tests. Valid QR/phone bodies accepted; missing IDs return safe field-specific errors; strict schema preserved.
- `node scripts/verify-qr.cjs | services/ai/.venv/Scripts/python.exe scripts/verify-qr.py`: 3 payload sizes round-trip decoded by OpenCV.
- Expo web export pass; browser UI regression pass with mocked API. Counter phone lookup uses the same form as QR-resolved identity: missing package sends zero requests, selecting package produces valid actual memberCheckinInput payload, missing internal booking adds zero requests. Synthetic 409 prevents consuming any quota.
- Cover FR-CHECKIN-001/003 and validation UX. Existing Owner guards, QR signature/expiry and transactional quota/idempotency service unchanged. No physical camera/device check-in, live database quota test or verification of Owner's exact selections in this task.

## Conversion validation feedback — 2026-10-08

- `pnpm lint`: pass API/app. `pnpm build`: pass NestJS build/app typecheck.
- `pnpm test:app`: pass 11 suites / 46 tests; identity checks before package builder, leading zeros/password preserved, safe field messages, date defaults independent of locale.
- `pnpm test:api`: pass 4 suites / 32 tests; strict conversion schema, valid session/time bodies, safe error messages for CCCD/password/date/price/quota/range and unknown fields rejected.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass static export. Actual form submissions for custom session, preset 15-session and preset 3-month packages are validated against the real API conversionInput schema inside the mock route before synthetic 409 response. Existing identity preservation/pending and CRM/AI regressions also pass.
- Cover validation/error UX for FR-TRIAL-006, FR-PKG-004/007 and SOT 05/16/17; no change to service transaction/history/Owner boundary. No real Member created, no device test or reproduction of Owner's exact invalid data; cannot identify that specific field from a generic error alone.

## PT & Member, date-only package and owned package summaries — 2026-10-08

- `pnpm --filter @fitness/app lint`: pass; `pnpm test:app`: pass 10 suites / 41 tests.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass; export Android/iOS sang dist-sot-native: pass bundle Hermes, không phải native device/Xcode acceptance.
- Browser regression Edge với API mock xác minh nhãn Owner PT & Member, customer dùng memberUserId khác customerId để hiển thị gói, Member detail hiển thị tên gói/23 trên 30 lượt/giá 2.100.000; đổi sang Member khác có empty state và không giữ gói của người trước.
- Custom TIME_BASED có input date ở ngày bắt đầu/kết thúc; mẫu 3 tháng dùng ngày bắt đầu date và vẫn tính hạn theo tháng. Booking datetime và các regression CRM/AI trước đó giữ nguyên. Không thêm request quyền ngoài endpoint memberships hiện hành, không sửa API/schema/quota.
- Cover FR-PKG-004/005/007, FR-UI-001/004 và privacy/Owner boundaries SOT 06/08/09. Chưa xác minh trực tiếp database/điện thoại thật trong task này; fixture không chứng minh dữ liệu Member thực tế đã có liên kết hay gói.

## Package catalog cleanup and booking datetime UI — 2026-10-08

- `pnpm --filter @fitness/app lint`: pass TypeScript/unused checks; `pnpm test:app`: pass 10 suites / 41 tests.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass.
- `pnpm --filter @fitness/app exec expo export --platform android --platform ios --output-dir dist-sot-native`: pass bundle Hermes sau sửa cuối; không phải native device/Xcode acceptance.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass Edge headless với API mock. Xác minh không còn card “6 gói hội viên mẫu”, lựa chọn gói còn giá 1.200.000; form tạo/sửa lịch có datetime-local, chặn gõ trực tiếp, ngày 10/10/2026 10:15 Asia/Bangkok gửi ISO 03:15Z, kết thúc đúng 04:15Z, khóa khi gửi/mở lại khi lỗi. Sửa lịch prefill 07:00/08:00 từ fixture UTC 00:00/01:00 và giữ trường lý do. Member không có nút tạo/sửa. Các regression CRM/AI trước đó vẫn pass.
- Không thay đổi API/quy tắc booking hoặc package; cover FR-PKG-004/007, FR-BOOK-001/002/003/004 và FR-UI-001. Overlap/assignment/RBAC tại server giữ nguyên; browser mock không chứng minh tích hợp nghiệp vụ database.
- Native đã triển khai picker Android ngày → giờ và iOS xác nhận/hủy, dùng dependency có sẵn. Chưa thao tác picker trên thiết bị thật hoặc build iOS/Xcode; binary cũ thiếu module cần Development Build mới. Không gọi export JS là device acceptance.

## FastAPI stale dev process / 422 — 2026-10-08

- Runtime trước sửa: GET http://127.0.0.1:8000/openapi.json chỉ có FormRequest, không có AutoFormRequest; xác nhận tiến trình chưa nạp contract v2.
- scripts/ai.mjs bật reload giới hạn thư mục app; restart phiên dev hiện có, không mở thêm instance trên cổng đang dùng.
- `pnpm test:ai`: pass 12 tests. Probe bằng Python urllib sau restart: OpenAPI có AutoFormRequest, POST schemaVersion=2.0 với metrics pose-failure giả lập và token gateway đọc riêng từ env trả HTTP 200 / provider LOCAL. Không log token/payload người thật, không gọi OpenAI cho probe này. Cover FR-AI-008 contract runtime; không tuyên bố xác minh nhận xét LLM hoặc video người thật.

## Automatic exercise analysis — 2026-10-08

- `pnpm build`: pass NestJS build và Expo TypeScript; `pnpm lint`: pass API/app, chạy lại sau thay đổi storage/screen.
- `pnpm test:app`: pass 10 suites / 41 tests. Ba bài nhận diện/chu kỳ bằng dữ liệu pose giả, video tĩnh/trộn bài/thiếu dữ liệu → UNKNOWN hoặc failure; push-up dùng joint khuỷu; reference snapshot, tay thiếu tiêu chí, allowlist/cap 10 reports, SQLite history migration/transaction và retry/cancel.
- `pnpm test:api`: pass 3 suites / 24 tests. Strict v2 evidence/privacy, Member guards/roles, response sai exercise bị từ chối; payload media/identity không tới fetch. Existing domain regressions vẫn pass.
- `pnpm test:ai`: pass 12 tests. FastAPI token/body/schema, v1 tương thích, v2 ba bài/unknown, số đo-target-verdict canonical, mock OpenAI giữ configured model/store=false; refusal/timeout/extra số liệu fallback LOCAL. Starlette có cảnh báo deprecation httpx; không đổi dependency ngoài baseline.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass; `pnpm --filter @fitness/app exec expo export --platform android --platform ios --output-dir dist-sot-native`: pass sau thay đổi cuối. Native export là bundle Hermes, không phải iOS/Xcode compile hoặc acceptance thiết bị.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass Edge headless trên static export, chạy lại sau SQLite v2. Kiểm tra bỏ bước chọn bài, upload local/nút phân tích, MediaPipe thật với video đen → pose failure, pose Squat giả → tự request JSON v2/nhận xét/góc cụ thể, storage transaction/reanalysis/delete/cancel và privacy. API/OpenAI response được mock; viewport Member 390x844, Owner 1440x1000. Không dùng video/account người thật, không tuyên bố độ chính xác từ fixture.
- Live SDK thử bằng synthetic metrics, đọc cấu hình server-only mà không log secret: provider LOCAL, SDK RateLimitError HTTP 429. Không có diễn giải OPENAI live được xác minh; hệ thống vẫn giữ phản hồi local. Không suy diễn 429 chắc chắn do hết quota hay tốc độ khi chưa xác minh account.
- Cover FR-AI-002/003/005/006/007/008 và SOT 05/14/18. Chưa kiểm chứng bài gần giống/biến thể, góc quay thực tế, ngưỡng app hay native device/Swift build. Cần restart FastAPI dev hiện có để nạp code/env mới; không khởi động thêm server vào cổng đã dùng.
- Kiểm tra runtime: thử API ở port tạm không listen trong window 15 giây, đã dừng/cleanup tiến trình; không tính là startup pass. API watch hiện có sau rebuild đã listen lại ở 3000 và request AI không token trả 401. Các listener 3000/8000/8081 là phiên dev hiện có; không để thêm server kiểm thử chạy nền. Không dùng runtime này để tuyên bố flow live OpenAI v2 đã qua vì FastAPI cũ vẫn cần restart và call thật bị 429.

## 1. Test layers

- Unit: domain/service/rules.
- Integration: NestJS + MongoDB test environment.
- Component/UI: role surfaces/forms.
- E2E: end-to-end user flows.
- Manual device: QR, push, AI, local file/SQLite.

---

## 2. Critical business test matrix

### Trial

- phone mới tạo được Trial 3 lượt;
- cùng phone không tạo Trial lần hai;
- 3 check-in → 0;
- lần 4 bị chặn;
- double request không trừ 2;
- conversion giữ history.

### Membership

- time package active/expired đúng;
- session package consume đúng;
- quota không âm;
- renewal alert đúng ngưỡng;
- expired account vẫn login nếu account active nhưng check-in bị business rule xử lý.

### PT assignment

- một Member không có hai active primary PT;
- Owner đổi được;
- Member/PT mutation bị 403;
- history còn nguyên.

### Booking

- Owner tạo/sửa/hủy;
- Member/PT không mutation;
- PT overlap reject;
- Member overlap reject;
- cancel reason lưu;
- cancelled slot có thể dùng lại.

### Check-in

- QR resolve đúng;
- phone fallback đúng;
- SELF_TRAINING không cần PT;
- PT attendance tạo log độc lập;
- không có service tự đánh `PT_ABSENT` từ mismatch.

### External PT

- pass không hợp lệ bị chặn;
- confirm thành công consume 1;
- retry không consume 2;
- owner fallback được audit.

### AI privacy

- raw video không trong HTTP request;
- không upload Supabase;
- Owner/PT không query được AI result;
- pose fail không bịa feedback;
- unsupported exercise bị chặn rõ.

---

## 3. UI acceptance

Owner:

- search customer bằng SĐT ≤ vài thao tác;
- check-in screen không bị dashboard clutter;
- create/edit/cancel booking rõ reason.

PT:

- mở app thấy lịch hôm nay nhanh;
- không có booking mutation control;
- PT check-in rõ trạng thái.

Member:

- QR mở nhanh;
- package/booking read-only rõ;
- không có đổi PT/hủy booking;
- AI flow từng bước, không lẫn với gym management.

---

## 4. Release blockers

Không release nếu có một trong các lỗi:

- Member/PT có thể mutation booking;
- duplicate Trial phone lọt;
- quota counter âm/double consume;
- booking overlap lọt dưới concurrency test;
- raw AI video upload server;
- Owner/PT xem AI result Member;
- CCCD/password/token xuất hiện trong standard logs;
- RBAC chỉ dựa frontend.

## Verification rebuild — 2026-09-24

- pnpm check: pass lint TypeScript, NestJS build, Expo typecheck, 13 API + 15 app + 7 AI tests.
- pnpm --filter @fitness/api test:integration: pass 7 scenarios với MongoDB replica set test riêng. Bao gồm Trial unique/3 lượt/history, RBAC, booking race hai phía, quota/QR, attendance độc lập, external confirm/fallback, refresh/lock và CCCD privacy.
- pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web: pass.
- node scripts/verify-qr.cjs | services/ai/.venv/Scripts/python.exe scripts/verify-qr.py: OpenCV giải mã đúng 3 payload ngắn/220/271 ký tự.
- Android gradlew.bat :fitness-pose:compileDebugKotlin --console=plain: BUILD SUCCESSFUL, module autolink được nhận diện. Đây là compile module, chưa phải full APK/device acceptance.

Browser runner dùng synthetic accounts/video và chặn mọi origin ngoài ứng dụng/API test. Không dùng credential thật. Camera quét vật lý, push delivery, iOS build, pose trên người thật/offline thiết bị và toàn bộ matrix responsive chưa được xác minh; còn là release gates. Không suy ra độ chính xác algorithm từ fixture video đen hoặc unit samples.

Browser E2E cuối: PASS bằng pnpm --package=@playwright/test dlx -c "node scripts/browser-smoke.cjs" trên Edge headless. Owner tạo Trial/check-in, PT check-in + lịch read-only, Member QR + import OPFS/SQLite + MediaPipe video không thấy pose + delete đều qua. Không request ngoài origin ứng dụng/API test, không raw-video payload. Web MediaPipe pin 0.10.21; route PT me/attendance có regression test riêng. Kết quả này không xác nhận độ chính xác pose trên người thật.

git diff --check với apps/scripts/services/README/package/lock/.gitignore pass. Toàn working tree vẫn có Markdown hard-break whitespace sẵn trong SOT core của Owner; không sửa nội dung này chỉ để làm sạch diff.

### Design pattern regression — 2026-09-24

Sau khi chuẩn hóa UI theo SOT 05: `pnpm check` pass 13 API + 15 app + 7 AI tests; MongoDB integration pass 7 scenarios; Expo web export pass. Browser E2E pass Owner Trial/master-detail, Owner menu ở viewport 390x844, PT attendance/read-only và Member QR/AI local/xác nhận xóa. Network interception không thấy raw video hoặc request ngoài origin cho phép. Ảnh kiểm tra local gồm `owner-sot.png`, `owner-customers-sot.png`, `owner-mobile-menu-sot.png`, `pt-sot.png`, `member-sot.png`; thư mục `.local` bị ignore và không phải artifact release.

Regression mobile/web CRM xác minh thêm: Customer tabs đầy đủ và booking filter theo Member giữ Owner scope; PT/Member vẫn không được mở rộng dữ liệu. Drawer compact có backdrop, bottom tabs một hàng và booking day-group được kiểm tra trong web export/browser screenshots. Kiểm tra focus bằng bàn phím thực tế và screen reader trên thiết bị vẫn là release gate thủ công.

### UI regression fixes — 2026-10-07

- `pnpm lint`: pass API/app; sau sửa cuối, `pnpm --filter @fitness/app lint` pass lại.
- `pnpm build`: pass NestJS build và Expo typecheck.
- `pnpm test:app`: pass 6 suites / 21 tests; bổ sung workflow AI cho video mới sau kết quả cũ, khóa thao tác cạnh tranh và mở khóa sau hủy/lỗi storage.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass trên Edge headless, Owner 1440x1000 và Member 390x844. Xác minh conversion giữ CCCD/mật khẩu giả khi đổi mẫu, áp dụng giá mẫu mới, khóa lựa chọn/input khi pending, dấu chọn và `aria-checked`, shortcut 48px/focus, video local qua OPFS/SQLite và pending/cancel/delete.
- Browser regression dùng API mock và identity sinh lúc chạy, không dùng database/credential thật. Đây không phải xác minh tích hợp nghiệp vụ hoặc độ chính xác pose. Chưa chạy lại native device/screen reader hoặc toàn bộ responsive matrix.

### AI web import failure — 2026-10-08

- Tái hiện trên Expo dev ở cổng 8081: video tới OPFS nhưng lưu phiên chờ vô hạn; SQLite worker URL ngoài workspace trả 404/`importScripts` NetworkError. Document `/` thiếu COOP/COEP; `/login` và `/member/ai` có headers.
- Sau sửa, `pnpm --filter @fitness/app lint` pass; `pnpm test:app` pass 7 suites / 22 tests, gồm timeout worker, đóng connection tới muộn và retry.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web` pass.
- `$env:UI_TEST_URL="http://localhost:8082"` rồi `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass trên Expo dev server mới. Cùng runner không đặt `UI_TEST_URL` pass trên static export.
- Browser kiểm tra root document isolation recovery, progress khi lưu OPFS, thông báo lưu thành công, phiên SQLite, MediaPipe với video đen tạo POSE_NOT_DETECTED, cancel/delete/pending và lỗi môi trường thiếu headers. API dùng mock; chỉ video giả và identity sinh tại runtime, không raw-video HTTP payload.
- Cover FR-AI-002/003/006, failure UX SOT 14/18 và loading/error/success SOT 05. Chưa xác minh pose accuracy với người thật, video/codec cụ thể của Owner hoặc native device. Expo đang chạy phải restart để nhận rewrite trong `metro.config.js`.
- Kiểm tra lại cổng 8081: tiến trình cũ chưa nạp cấu hình. Đã restart bằng pnpm dev; UI_TEST_URL=http://localhost:8081 cùng browser runner pass chọn video, lưu local, hiện nút phân tích và phản hồi MediaPipe. Lần đầu server chưa sẵn sàng trả connection refused; chạy lại sau khi Metro sẵn sàng đã pass. API mock, chưa xác minh video cụ thể của Owner.

### Detailed squat angle report — 2026-10-08

- `pnpm --filter @fitness/app lint`: pass.
- `pnpm test:app`: pass 8 suites / 27 tests. Bổ sung geometry/aspect ratio, vector suy biến/điểm bị che, giới hạn mục tiêu, snapshot mục tiêu, bottom từng rep, chu kỳ bị che và allowlist cloud.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass.
- `$env:UI_TEST_URL="http://localhost:8081"` + `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass. MediaPipe thật với video đen vẫn báo pose failure; sau đó mock pose riêng để xác minh UI gối 80°, khuỷu 180°, thân 0°, mục tiêu thân 40°, mở/ẩn báo cáo cùng các kiểm tra pending/privacy trước đó.
- Cùng browser runner không đặt `UI_TEST_URL`: pass bản static export; ảnh báo cáo với pose giả ở `.local/ai-angle-comparison.png` (ignored, không phải dữ liệu người thật hoặc artifact release).
- Cover FR-AI-003/005/006/007 và SOT 05/14/18. Không suy ra độ chính xác trên người thật từ pose mock; native chỉ có v1, ngưỡng tham chiếu app chưa được kiểm chứng, chưa hỗ trợ knee valgus/độ cong cột sống/hướng tay trước-sau.

### Mobile/web angle parity — 2026-10-08

- `pnpm --filter @fitness/app lint`: pass.
- `pnpm test:app`: pass 9 suites / 32 tests. Native bridge mock xác minh report từng lần/góc cụ thể, parity với helper web, điểm bị che, malformed frame, module cũ/Expo Go, cancel/kết quả tới muộn và bỏ raw landmarks khỏi result/payload.
- `gradlew.bat :fitness-pose:compileDebugKotlin --console=plain` (JDK 17, Android SDK local): BUILD SUCCESSFUL. Module autolink đúng và bridge v2 compile.
- `gradlew.bat :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain`: lần đầu fail ở Gesture Handler CMake/Ninja do đường dẫn vượt 260 ký tự trên Windows, không phải lỗi compile module AI. Chạy lại với `--init-script ../../../.local/android-ai-short-path.gradle` cấu hình `buildStagingDirectory = C:/f-cxx/fitness-ai-20261008`: BUILD SUCCESSFUL (3m14s). Init script/cache chỉ local, không sửa vendor/stack; APK ARM64 debug ở `apps/app/android/app/build/outputs/apk/debug/app-debug.apk`, cần dev server, chưa cài lên thiết bị.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass.
- `pnpm --filter @fitness/app exec expo export --platform android --platform ios --output-dir dist-sot-native`: pass bundle Hermes Android/iOS. Đây không phải native iOS/Xcode build.
- `UI_TEST_URL=http://localhost:8081` + `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass; cùng runner trên static export cũng pass. Video đen chạy MediaPipe thật kiểm tra pose failure; report góc dùng pose giả. API mock, không raw video HTTP payload.
- `adb devices`: không có thiết bị kết nối. Không có Xcode trên Windows; chưa compile native iOS hoặc test trực tiếp thiết bị/camera/pose người thật. Cover implementation FR-AI-003/005/006/007, nhưng không tuyên bố hoàn tất native device acceptance hoặc kiểm chứng ngưỡng.

### CRM regression fixes — 2026-10-20

- Phạm vi: FR-PROFILE-001, FR-SALES-002, FR-AUDIT-001; hồ sơ Member chỉ Owner xem, lịch sử booking giữ liên kết Member cũ/mới, phân trang booking/check-in độc lập và Sales mặc định OPEN.
- `pnpm --filter @fitness/api lint` và `pnpm --filter @fitness/app lint`: pass.
- `pnpm test:api`: pass 13 suites / 89 tests. `pnpm test:app`: pass 13 suites / 60 tests.
- `pnpm --filter @fitness/api build`: pass. Expo web export `dist-sot-web`: pass 1057 modules.
- `node --check scripts/crm-regression.cjs` và `git diff --check`: pass (Git có cảnh báo LF/CRLF).
- `pnpm --package=@playwright/test dlx -c "node scripts/crm-regression.cjs"`: pass trên Edge headless với API mock, identity giả; cover hồ sơ chính thức/trạng thái khóa, 31 booking/121 check-in, retry, reset/phân trang độc lập, Trial và bộ lọc OPEN/closed/ALL. Ảnh trong `.local/crm-fixes/` bị ignore.
- Integration lần đầu dừng ở compile do fixture thiếu operatorId (đã sửa); lần kế tiếp dừng ở setup do ổ C thiếu dung lượng, chưa chạy scenario. Dùng MongoDB replica set riêng trên ổ D: lần đầu 11/12 pass, booking race trả một HTTP 500; chạy riêng booking race pass. Không khẳng định nguyên nhân của lần 500 từ response đã được che lỗi.
- Bổ sung xử lý hết 8 lần retry P2034 thành `409 CONCURRENT_CHANGE` và hai unit test. Sau sửa: `pnpm test:api` pass 14 suites / 91 tests; API lint/build pass. Chạy lại toàn bộ `pnpm --filter @fitness/api test:integration` pass 12/12 scenario (260,988 giây), gồm CRM lịch sử A→B, 121 check-in, official profile Owner-only, Sales filter trước phân trang và booking concurrency. Database test được drop bởi runner, không dùng database nghiệp vụ.
- `pnpm --package=@playwright/test dlx -c "node scripts/design-system-regression.cjs"`: pass Owner/PT/Member trên bản web export mới.
- Dọn thư mục MongoDB test bị cơ chế tự động chặn (`blocked by policy`); giữ thư mục test trong `.local/crm-mongo-20261020-185258` và `D:/fitness-crm-test-20261020`, không thử xóa dữ liệu khác. Tiến trình MongoDB test được dừng sau khi kiểm tra.
- Chưa kiểm tra native device/screen reader; không suy ra acceptance toàn app từ API mock. Không chạy index rollout trên database nghiệp vụ; khi triển khai cần `pnpm --filter @fitness/api db:indexes` theo SOT 15. Audit cũ thiếu cả quan hệ hiện tại lẫn snapshot Member không thể tự suy ra identity đã mất.

## PT QR thay self-check-in — 2026-10-21

- Cover FR-CHECKIN-004/005/008, FR-AUDIT-003: PT mở QR có hạn, Owner-only resolve/xác nhận; QR PT/Member không dùng chéo, chữ ký/expiry/id sai bị chặn, PT inactive bị kiểm tra lại, daily guard độc lập và audit không chứa token. Command replay chạy trước validation expiry; shared transaction/WriteLock hiện có được giữ nguyên.
- `pnpm lint`: pass API/app. Sau sửa chặn identity Member cũ khi resolve PT: `pnpm --filter @fitness/app lint` pass.
- `pnpm test:api`: pass 15 suites / 100 tests, gồm PT QR service và HTTP guard/route regression. `pnpm test:app`: pass 13 suites / 60 tests.
- `pnpm build`: pass API build + app typecheck. `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass; export lại sau sửa identity cũ cũng pass.
- `pnpm --package=@playwright/test dlx -c "node scripts/pt-qr-regression.cjs"`: pass PT/Owner/Member trên Edge headless, API giả và sự kiện quét giả tại CameraView boundary. Cover QR/làm mới PT và Member, bỏ nút PT tự check-in, Owner chỉ có form PT, pending disable, success, invalid QR xóa identity và daily conflict. Ảnh `.local/pt-qr/` bị ignore. Lần chạy đầu sai shape sự kiện native trong runner, lần hai full reload làm mất session Member; đã sửa runner và chạy đủ ba role thành công.
- `pnpm --filter @fitness/api test:integration`: dừng trước scenario vì chưa có TEST_DATABASE_URL tới database fitness_test_ riêng (0 test chạy). Đã cập nhật fixture attendance cũ theo QR flow mới; chưa xác minh integration MongoDB/concurrency cho flow mới hoặc quét camera thật/native device. Không dùng database nghiệp vụ và không thay schema/index/dependency.
- `node --check scripts/pt-qr-regression.cjs` và `git diff --check`: pass; Git chỉ cảnh báo LF/CRLF.

- `pnpm --package=@playwright/test dlx -c "node scripts/design-system-regression.cjs"`: pass Owner/PT/Member trên export mới; runner thêm fixture GET pt/me/qr cho surface Hôm nay mới.


### Lịch dạng list và PT Demo — 2026-10-29

- Cover FR-PT-001/002/003, FR-BOOK-001..007 (giữ boundary hiện hành), FR-UI-001/004: thêm phân công Demo Member 25–30 qua API Owner, đối chiếu history và một active assignment mỗi người. Bản xuất demo30-data.json được cập nhật.
- `pnpm --filter @fitness/app lint`: PASS; `pnpm test:app`: 14 suites/65 tests PASS; Expo export web PASS. Browser live 8081/API/Atlas xác minh list rows, form thu mặc định và mở/đóng được; screenshot `.local/demo30-app-data/schedule-list-live.png`. Design-system regression ba role PASS.
- Đối chiếu lại 30 Member: 1.236 assertions PASS/280 requests, có 1 lần auth CONCURRENT_CHANGE được retry thành công theo helper hiện hành. Không kiểm tra thiết bị native trong thay đổi này.


### PT & Member dạng list trong một màn hình — 2026-10-29

- Requirement/acceptance: FR-UI-001/002/004 (hàng gọn, vùng chạm/focus/hover, phân trang trong viewport), FR-PROFILE-001 (hồ sơ/status), FR-PT-001/002/003 (giữ Owner-only assignment và lịch sử). Thay đổi client, không đổi API/schema hoặc chạy migration/database mutation trong task UI này.
- File chính: `apps/app/src/screens/people.tsx` giới hạn danh sách theo chiều cao, phân trang UI qua các nhóm REST 30 hồ sơ và giữ trang/lọc khi đóng; `components/detail-modal.tsx` popup giới hạn chiều cao, Escape/back, header cố định và cuộn nội dung riêng; `components/people-detail.tsx` thông tin/gói, sửa hồ sơ và phân công PT/lịch sử. `ui.tsx` bổ sung nhãn trạng thái INACTIVE/LOCKED/ENDED và Pager.disabled. Cập nhật SOT 05, CHANGELOG và hai regression cũ, thêm `scripts/people-regression.cjs`.
- `pnpm --filter @fitness/app lint`: PASS. `pnpm test:app`: 14 suites/65 tests PASS. `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: PASS, 1.072 modules.
- `pnpm --package=@playwright/test dlx -c "node scripts/people-regression.cjs"`: PASS bốn viewport 1440×900, 390×844, 320×568 và 844×480. Dữ liệu API giả: duyệt đủ 34 Member trên cả các nhóm REST và 31 PT ở desktop; kiểm tra không tràn trang/không cắt nút chuyển trang, popup, tên dài, không lẫn gói giữa Member, đóng giữ vị trí/focus, tạo hồ sơ có form, pending khóa đóng/Escape/chuyển mục, lỗi giữ nội dung và retry lưu hồ sơ thành công, empty/error/retry/filter. Ảnh `.local/people-ui/`.
- `pnpm --package=@playwright/test dlx -c "node scripts/design-system-regression.cjs"`: PASS Owner/PT/Member, giữ xác nhận hủy PT với destructive styling trong popup.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: PASS, giữ kiểm tra gói đúng Member trong popup và các flow lịch/package/conversion/AI hiện có. Hai runner trên mock API, không thay bằng bằng chứng integration backend.
- `pnpm --package=@playwright/test dlx -c "node .local/demo30-browser-live.cjs"`: PASS app thật localhost:8081/API:3000/Atlas, không mock. Owner lọc Demo 30 Member 25, mở popup thấy đúng Demo PT 1 và gói, đóng giữ bộ lọc. Ảnh `.local/demo30-app-data/people-list-live.png` và `people-detail-live.png`. Không gửi mutation nghiệp vụ trong kiểm tra live này.
- Giới hạn: lọc tên/SĐT trong nhóm REST hiện tại, có nhãn chỉ rõ phạm vi; vẫn chuyển trang được tới nhóm kế tiếp. Chưa kiểm tra thiết bị native/keyboard thực, screen reader, hoặc chạy lại integration MongoDB vì không đổi backend. Kiểm tra viewport không bao quát mọi mức phóng to chữ của hệ điều hành.


### Hoạt động → Home không mất phiên — 2026-10-29

- Tái hiện bản thật 8081 trước sửa bằng Demo Member: mở Nhật ký rồi bấm Trang chủ tạo document request `/member`, sau đó tới `/login`; không có API 401. Phiên web memory bị mất vì reload. Nhánh Shell.navigate trả sớm khi WorkoutLeaveContext.current null khiến custom Pressable handler không chặn anchor.
- Sửa `apps/app/src/shell.tsx`: luôn preventDefault trong custom navigation từ workouts, có guard thì chờ kết quả, không guard thì router.push trực tiếp. Giữ storage memory, server auth/RBAC, dữ liệu và quy tắc dirty/pending. Cover FR-UI-001, FR-WORKOUT-004/006 và yêu cầu trạng thái chưa lưu của SOT 21.
- `pnpm --filter @fitness/app lint`: PASS. `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: PASS, 1.072 modules. `node --check scripts/workouts-regression.cjs` và diff check các file sửa: PASS.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: PASS full runner với mock API. Bổ sung cả 4 mục → Home → mở lại ở 390px và 1280px, xác nhận không có document request; editor chưa sửa về Home được; pending chặn Home; dirty cancel Home giữ bài và nội dung; giữ coverage chấp nhận/hủy rời qua Lịch, cùng các flow nhật ký/số đo/thư viện cũ. Runner vẫn kiểm tra UI 320/390/768/1280px.
- `pnpm --package=@playwright/test dlx -c "node .local/repro-workout-home.cjs"`: PASS sau sửa, app thật localhost:8081/API và Demo Member, không mock. Nhật ký/Bài tập mẫu/Tiến bộ/Số đo → Home đều `/member`, không có document request hoặc API 401. Không sửa dữ liệu nghiệp vụ trong smoke live.
- Chưa xác minh trên thiết bị native. Chủ động refresh toàn bộ web vẫn là ranh giới phiên memory hiện hành; task này sửa điều hướng trong app, không thay persistence hoặc token policy.


### Làm mới hoạt động mobile — 2026-10-29

- Acceptance FR-UI-001/002/003/004 và giữ FR-WORKOUT-001..010: header nền nhạt/icon, bốn mục hai cột mobile/bốn cột desktop, trạng thái có chữ/dấu chọn, vùng chạm >=48px và focus/hover; giảm padding card, thẻ ngày, số đo tách đơn vị, summary tiến bộ dùng dữ liệu thật. Không thêm provider/dependency/animation hoặc suy diễn số liệu.
- File: `components/activity-visuals.tsx` sở hữu visual dùng lại; `screens/workouts.tsx`, `workout-journal.tsx`, `body-measurements.tsx`, `workout-progress.tsx`, `exercise-library.tsx` dùng visual theo scope. `ui.tsx` thêm Page.header optional (màn khác giữ header mặc định); `shell.tsx` chọn Home làm mục cha của workouts; `workout-controls.tsx` bo đầu cột chart và dùng primaryStrong. Cập nhật SOT 05/CHANGELOG, workouts-regression và locator mở bộ lọc trong activity-scenario-browser.
- `pnpm --filter @fitness/app lint`: PASS. `pnpm test:app`: 14 suites/65 tests PASS.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: PASS (1.073 modules). `pnpm --filter @fitness/app exec expo export --platform android --platform ios --output-dir dist-sot-native`: PASS. Export cuối gồm sửa nhãn tháng gọn: `pnpm --filter @fitness/app exec expo export --platform all --output-dir dist-activity-preview`: PASS Web/Android/iOS, có Hermes bundles.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: PASS, mock API. Giữ tạo/lưu nháp/complete/conflict/retry/dirty/pending, số đo, progress/bảng số liệu, guide → draft và Home không reload. Các width 320/390/768/1280 không tràn ngang, nút mục có selected/aria-pressed và vùng chạm >=48px. Bổ sung kiểm tra filter thư viện ẩn ban đầu, chọn nhóm cơ, thu gọn giữ summary và mở lại vẫn selected. Ảnh `.local/workouts/design-system-390.png`, `journal-list-mobile.png`, `measurements-list-mobile.png`, `progress-overview-mobile.png`, `library-mobile.png`; đã xem ảnh để đối chiếu bố cục. Nhãn tháng trong ô ngày được rút thành Thg để không xuống dòng; ngày ISO đầy đủ vẫn có bên cạnh.
- `pnpm --package=@playwright/test dlx -c "node scripts/design-system-regression.cjs"`: PASS Owner/PT/Member. `node --check scripts/workouts-regression.cjs`, `node --check scripts/activity-scenario-browser.cjs` và diff check các file tracked sửa: PASS.
- Live smoke `.local/demo30-browser-live.cjs` không hoàn tất: timeout ở đăng nhập Owner. Kiểm tra port sau đó xác nhận API3000 không có listener, GET /api/auth/me không kết nối được; Metro8081 vẫn chạy. Không khởi động API background chiếm cổng lại hoặc thay dữ liệu nghiệp vụ để xử lý giới hạn này. Vì vậy không tuyên bố đã verify API thật sau đợt UI này. Chưa chạy lại full MongoDB activity scenario; chỉ cập nhật locator phù hợp disclosure mới. Chưa kiểm tra app native trên thiết bị thực hoặc screen reader; native export không thay thế kiểm tra thiết bị.


### Tên tiếng Việt cho 30 Member và 3 PT — 2026-10-29

- Cover FR-PROFILE-001, FR-PT-001/003, FR-AUDIT-001: Owner yêu cầu đổi tên nhóm kiểm thử trong fitness_manage để dùng như dữ liệu vận hành; phạm vi 33 ID từ report/export đã đối chiếu, không chọn bằng tiền tố tên mới hoặc quét sửa người dùng khác. 30 customer có memberUserId tương ứng cập nhật cùng tên.
- `.local/rename-demo30.cjs` kiểm tra đích hostname/database, đúng 30 Member/3 PT và 30 customer; trước ghi lưu `.local/demo30-app-data/rename-backup.json` với tên cũ/mới và digest. Dùng PeopleService.update + TransactionService hiện hành, actor Owner active được kiểm tra trong transaction; idempotency key theo ID, đủ 33 audit PROFILE_UPDATE. Không tạo API server hoặc dùng mật khẩu/token trong output.
- `node .local/rename-demo30.cjs`: PREFLIGHT_PASS. `node .local/rename-demo30.cjs --apply`: PASS 30 Member/3 PT/30 linked customer/33 audit. Chạy lại --apply sau bổ sung read-model kiểm tra booking cũng PASS, không tạo thêm audit hoặc đổi bản ghi nghiệp vụ.
- Đối chiếu digest 21 model: User (gồm credentials/status), Session và các trường profile/customer ngoài fullName/updatedAt giữ nguyên; gói, PT assignment, booking, check-in, PT attendance, workout/revision, measurement/revision, catalog/version, alerts/notification/device và pass/request không đổi. Audit/Command/WriteLock là các ghi hợp lệ của service, không nằm trong digest bất biến. Profiles/customer ngoài 33 ID cũng giữ nguyên toàn bộ.
- Kiểm tra trực tiếp PeopleService.myPt/myMembers và BookingsService.list: tên Member/PT mới đúng theo ID; lịch sử/assignment vẫn liên kết chính xác. Không chạy HTTP/browser vì API3000 không có listener ở lượt này. Không sửa application code/schema nên không chạy lại build/unit/frontend regression cho thay đổi dữ liệu này.
- Cập nhật `members.csv` (30), `accounts.csv` (33), profiles/customer trong `demo30-data.json`, nhãn `pt-matches.json`, README và helper live/matching theo ID. `report.json` nhập gốc giữ tên alias lịch sử; tên hiện tại và chứng cứ tại `rename-verification.json`. `node --check .local/demo30-browser-live.cjs` và `.local/match-demo30.cjs`: PASS; chưa chạy helper HTTP khi API đang tắt.


### Thống kê gói tập gọn theo nhóm — 2026-10-29

- Cover FR-PKG-008, FR-UI-001/004: `apps/app/src/screens/statistics.tsx` đổi PackageStatistics sang nhóm SESSION_BASED/TIME_BASED, hàng có tên và hai số đếm, tối đa 3 gói/trang/nhóm. >=1100px hai nhóm cạnh nhau, dưới ngưỡng chọn nhóm; giữ trang riêng, không dựng nhóm rỗng hay footer cho nhóm <=3 dòng. Nhóm tên vẫn giữ nguyên chính xác và mode, không cộng memberCount giữa các gói. Backend/API/data và MonthlyCheckins không sửa.
- `pnpm --filter @fitness/app lint`: PASS. `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: PASS, 1.073 modules.
- `pnpm --package=@playwright/test dlx -c "node scripts/package-statistics-regression.cjs"`: PASS 320/390/768/1440px với mock API. Duyệt đủ 7 gói buổi và 5 gói thời gian qua các trang; cùng tên khác mode giữ số đếm riêng; tên dài không tràn ngang; group/page state giữ khi đổi nhóm, loading khóa làm mới, error/retry/empty và chỉ một mode không sinh group trống; không có mutation nghiệp vụ. Giới hạn chiều cao test theo đúng breakpoint: <700px cho màn một nhóm, <550px màn hai nhóm trong fixture nhiều gói/tên dài. Lần đầu ngưỡng test tablet dùng nhầm 600px thay breakpoint 1100px; sửa ngưỡng phân loại và chạy lại đủ viewport PASS.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: PASS, giữ chọn/gói Member, cấp gói/datetime/giá/pending và các flow cũ. `node --check scripts/package-statistics-regression.cjs`, `node --check scripts/activity-scenario-browser.cjs` và diff check file tracked sửa: PASS.
- Đã xem ảnh `.local/package-statistics/packages-390.png` và `packages-1440.png` để đối chiếu bố cục. Cập nhật `activity-scenario-browser.cjs` kiểm tra lần lượt các trang/nhóm bằng tên và nhãn số đếm đầy đủ; không chạy lại full scenario MongoDB ở lượt UI này. Không chạy unit tests mới cho formatting thuần; chưa kiểm tra API thật hoặc thiết bị native. Không thay đổi dữ liệu 30 Member/3 PT đã đổi tên.


### Thống nhất list → popup và giảm khoảng trắng — 2026-10-29

- Acceptance: FR-UI-001/002/004, giữ FR-PKG-008, FR-CHECKIN-007, FR-PROFILE/FR-PT, FR-BOOK-002/003/004, FR-SALES và FR-WORKOUT/FR-AI hiện hành. Record collections chuyển từ card lặp sang hàng phẳng có tên/thời gian/summary/status và popup; KPI tổng quan, QR, form/nhóm bài trong editor vẫn dùng card gọn. Hàng có vùng chạm >=56px, padding dọc 8px, focus/hover và hint mở dialog; mỗi list container bỏ gap giữa các record. Chỉ remaining Card.map ở màn là các nhóm nhập bài trong form, không phải bản ghi danh sách.
- File nền tảng: `components/record-row.tsx` (RecordRow/PopupRow), `detail-modal.tsx` (RN Modal safe area/keyboard, header/close cố định, cuộn riêng), `detail-state.ts` (pending registry), `form-scroll-context.ts` (cuộn/focus field trong đúng popup). `form.tsx` và `workout-controls.tsx` đăng ký pending để khóa đóng/Escape/control cạnh tranh, giữ idempotency/ref chống submit trùng. `ui.tsx` thu padding card/page và đổi selection picker sang hàng phẳng. Không thêm dependency/schema/provider/API.
- Các màn áp dụng: `statistics.tsx` (gói/tháng click detail); `customers.tsx` (list + profile popup thay master/detail, histories); `packages.tsx` (gói đã cấp/pass, gia hạn/hủy, form tạo gói/pass trong popup); `bookings.tsx` (row detail và create/edit modal, Owner-only actions); `alerts.tsx`/`logs.tsx`; `home.tsx`, `member-checkin.tsx`, `checkin-counter.tsx` và `components/people-detail.tsx` cho các collection lịch/check-in/pass/PT history. Member `workout-journal.tsx`, `body-measurements.tsx`, `exercise-library.tsx`, `workout-progress.tsx`, `workout-revision-history.tsx` dùng list/detail modal cho nhật ký/số đo/catalog/charts/revisions. `activity-visuals.tsx` giữ navigation/summary, bỏ visual record card không dùng nữa. `ai.tsx` dùng session rows, popup kết quả và per-rep detail; import video mới mở phiên vừa tạo, tham số góc trong phiên, hủy analysis ở trong popup.
- Dirty nhật ký/số đo hỏi trước đóng Header/Escape; cancel giữ nội dung, pending ngăn đóng. Save-in-place/conflict/retry/version/revisions giữ nguyên. Các popup read-only không thêm mutation. PT/Member mở detail lịch vẫn không có sửa/hủy/tạo; Owner/PT không có screen đọc workout/AI của Member. Raw video vẫn local-only, không thay gateway payload hoặc algorithm.
- `pnpm --filter @fitness/app lint`: PASS. `pnpm test:app`: 14 suites/65 tests PASS.
- `pnpm --filter @fitness/app exec expo export --platform all --output-dir dist-sot-web`: PASS Web/Android/iOS, có Hermes bundles; build cuối gồm container list liền hàng và FormScroll cho popup. Export là kiểm tra đóng gói, không phải native-device test.
- Browser commands dùng chung `pnpm --package=@playwright/test dlx -c "node scripts/<runner>.cjs"`, tất cả PASS với API giả:
  - `ui-regression`: conversion payload/giữ identity/pending, Member packages và giá trong popup, cấp gói/datetime/prefill, quầy check-in, Member read-only **khi đã mở detail lịch**, Home/navigation, import/real MediaPipe pose-failure/synthetic góc, per-rep popup và delete/cancel/pending/local storage lỗi.
  - `design-system-regression`: Owner/PT/Member; cấp/gia hạn giữ pending, destructive package/PT/booking và PT/Member read-only trong popup lịch.
  - `workouts-regression`: 320/390/768/1280px, journal/save/complete/retry/conflict, revisions popup, measurement validation/focus/duplicate-day, progress/biểu đồ/bảng qua popup, library filters/guide → draft, dirty close/Escape cancel/confirm, pending khóa đóng và Home không reload. Chạy lại sau lượt thu gọn row spacing: PASS.
  - `people-regression`: 34 Member/31 PT, pagination, profile/package popup, trạng thái/pending/error/retry/focus trên 1440×900, 390×844, 320×568, 844×480.
  - `crm-regression`: Owner profile, 31 booking/121 check-in, pagination độc lập/reset theo customer, error/retry, Trial scope và Sales OPEN/closed/ALL. Adapt selector sang customer button/popup; không bỏ assertions cũ.
  - `package-statistics-regression`: 320/390/768/1440px, phân trang đủ 12 nhóm tên+mode, số đếm tách đúng mode, click row hiện full counts trong popup, không group trống và refresh/loading/error/empty.
  - `list-popup-regression` (mới): 320×568, 390×844, 1440×900, Sales giữ note khi lỗi, retry success, pending ngăn đóng/Escape, focus trở về row; đủ 12 tháng, tháng zero, tổng Member/Trial và PT attendance riêng trong popup, log reason trong detail. Chạy lại trên build cuối sau thu gọn spacing: PASS. Ảnh `.local/list-popup/` đã xem đối chiếu list và dialog trên mobile.
  - `pt-qr-regression`: PT/OWNER/MEMBER QR permission, resolve/confirmation/pending và daily scope, camera event giả. PASS trên export cuối.
- `git diff --check` các file app/docs/scripts sửa, `node --check` workout/list-popup/activity-scenario browser helpers: PASS. Cập nhật `activity-scenario-browser.cjs` đóng guide/editor popup trước đổi mục và đọc các trang thống kê; helper live tên mới dùng customer button. Chưa chạy full MongoDB activity scenario trong lượt presentation này.
- Giới hạn: API3000 không có listener khi kiểm tra nên không chạy lại browser với HTTP/database thật, không tự mở API background. Không thay dữ liệu 30 Member/3 PT hoặc business history. Chưa chạy app trên thiết bị native, keyboard thực hoặc screen reader; safe-area/keyboard/focus native cần kiểm tra thiết bị trước release. Các test AI không xác nhận độ chính xác trên video người thật.


## Nâng Expo SDK 58 — 2026-10-29

- Owner yêu cầu nâng SDK 57 → 58. Cover tương thích nền tảng cho FR-UI-001/004, FR-WORKOUT-001–010, FR-AI-005/006/007/008, FR-BOOK-002/003 và QR theo phạm vi regression; không tạo requirement nghiệp vụ mới.
- File: apps/app/package.json, app.json, tsconfig.json, pnpm-lock.yaml, pnpm-workspace.yaml; RN instance refs ở ui.tsx, detail-modal.tsx, form-scroll-context.ts, bookings.tsx, workouts.tsx, workout-controls.tsx; Router usePreventRemove/repeat và focus lỗi native trong workout-controls.tsx. SOT 04/CHANGELOG ghi baseline, migration và rebuild native.
- `pnpm --filter @fitness/app exec expo install expo@^58.0.0 --fix`: nâng Expo 58.0.21/RN 0.88.1/React 19.3.0; lệnh đầu fail vì virtual store không khớp, chạy lại với npm_config_virtual_store_dir=C:\.fitness-pnpm thành công. Cập nhật ts-jest 29.4.15 cho Jest 30/TypeScript 6, thêm dom-webview peer 58, splash-screen 58; bỏ config-plugins trực tiếp và packageExtension picker cũ. PackageExtension camera bổ sung React types trong external store, không patch node_modules hoặc ép any.
- `pnpm install` với virtual store hiện hành: PASS; lockfile cập nhật, không còn peer mismatch trong output cuối. Còn cảnh báo dependency gián tiếp glob/inflight deprecated và build scripts pnpm đang bị ignore (Prisma/parcel/unrs); không thay policy build scripts của repository.
- `pnpm --filter @fitness/app lint`: PASS TypeScript/unused checks sau sửa instance refs, explicit types và camera declaration resolution. `pnpm test:app`: PASS 14 suites / 65 tests với Jest 30/ts-jest mới, đã chạy lại trên cấu hình cuối.
- `pnpm --filter @fitness/app exec expo install --check`: PASS, Dependencies are up to date. `pnpm dlx expo-doctor@latest` tại apps/app: PASS **20/20**, đã chạy lại sau thay config/dependency. Lượt trước báo splash legacy/config-plugins trực tiếp; đã giải quyết bằng plugin/sub-export.
- `pnpm --filter @fitness/app exec expo export --platform all --clear --output-dir dist-sot-web`: PASS Web 1080, iOS 1381, Android 1384 modules, Hermes native bundles. Lượt export trước fail do TypeScript React paths bị Metro dùng làm runtime alias; đã bỏ alias và dùng packageExtension trước lượt PASS. Cảnh báo NO_COLOR/FORCE_COLOR không chặn export.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: PASS Edge headless 320/390/768/1280, journal pending/retry/version/conflict/history, measurements, charts/catalog, dirty modal guard và về Home không reload/login.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: PASS package/booking payload, datetime/prefill/pending/Member readonly, conversion, root isolation, local AI import/MediaPipe pose-failure, góc giả lập/delete/cancel/pending/missing-header.
- `pnpm --package=@playwright/test dlx -c "node scripts/pt-qr-regression.cjs"`: PASS PT/OWNER/MEMBER. Các browser test dùng API/camera fixture, không ghi database nghiệp vụ và không khẳng định tích hợp camera/video người thật.
- `git diff --check` cho file nâng SDK: PASS (cảnh báo LF/CRLF). Không sửa API/schema/Atlas hoặc reset dataset. Chưa build Gradle APK/Xcode, chưa thử fitness-pose/camera/push/keyboard/screen reader trên native thật; cần development build SDK 58 mới, không dùng binary SDK 57. Metro đang mở từ SDK cũ cần khởi động lại với `pnpm --filter @fitness/app start --clear`.


## Kiểm tra toàn dự án sau SDK 58 — 2026-10-29

- Theo yêu cầu Owner kiểm tra chạy ổn định: đọc SOT tổng quan/stack, release gates SOT 20, security SOT 17 và scope workout SOT 21. Không thay business, database vận hành, credentials hoặc dữ liệu 30 Member đã nhập vào Atlas. Đây là kiểm tra chức năng/regression, không phải benchmark FPS/tải production.
- `pnpm check`: PASS lint API/app, NestJS build, app typecheck; **16 suites/110 tests API, 14 suites/65 tests app, 12 tests AI**. Log `.local/project-retest-check.log`. FastAPI testclient có StarletteDeprecationWarning về httpx, không làm test fail; không đổi dependency AI trong task này.
- `pnpm --filter @fitness/app exec expo install --check`: PASS. `pnpm dlx expo-doctor@latest` tại apps/app: **20/20 PASS**.
- `pnpm --filter @fitness/app exec expo export --platform all --output-dir dist-retest-sdk58`: PASS Web/Android/iOS, Hermes bundles; `.local/project-retest-export.log`. Không phải APK/Xcode build. Các browser regression dùng dist-sot-web SDK58 đã export trước đó; không có thay đổi application source giữa hai bản export.
- Tám runner đều PASS qua `pnpm --package=@playwright/test dlx -c "node scripts/<runner>.cjs"`: design-system-regression (OWNER/PT/MEMBER), people-regression (34 Member/31 PT, viewport 320/390/844/1440), crm-regression (profile/history/31 booking/121 check-in/Sales filters), package-statistics-regression (320/390/768/1440, đủ 12 nhóm/phân trang), workouts-regression (320/390/768/1280, version/retry/conflict/dirty/pending/history/Home), list-popup-regression (320/390/1440, pending/error/retry/focus/12 tháng), ui-regression (package/booking/conversion/local AI/privacy), pt-qr-regression (PT/OWNER/MEMBER). Những runner này mock API/camera, không phải kiểm tra Atlas.
- Khởi động MongoDB test mới, bind localhost cổng 27031, replica set workouttest, data `.local/retest-mongo-20261029-*`, PID 3448; init lần đầu chưa ready, chạy lại init PASS. Không sửa/dừng MongoDB service có sẵn ở 27017. Không chạy API trên cổng 3000 hoặc đổi .env.
- `$env:TEST_DATABASE_URL='mongodb://127.0.0.1:27031/fitness_test_retest_20261029?replicaSet=workouttest&directConnection=true'; pnpm --filter @fitness/api test:integration`: **16/16 PASS**, HTTP NestJS/MongoDB thật. Cover Trial once/3 lượt/conversion history, quota races/daily idempotency, booking overlap cả hai phía, Owner-only mutation/Member private, workout/measurement revisions/rollback, Sales/CRM pagination, refresh rotation/lock và CCCD scope. Database core test riêng được runner dọn; `.local/project-retest-integration.log`. PowerShell bọc dòng Jest PASS trên stderr thành NativeCommandError trong file redirect nhưng exit code 0 và toàn bộ assertions PASS, không phải lỗi ứng dụng.
- `$env:SCENARIO_BROWSER='1'; pnpm --filter @fitness/api test:activity-scenario`: lượt cuối **PASS 8168 assertions / 1777 HTTP requests**, browser `PASS real API, all 20 guides, Member/Owner`. Report `.local/activity-scenario/20261029103242014/report.json`, screenshot cùng thư mục; dataset giữ lại `fitness_test_activity_20261029103242014`. Counts: 30 Member/3 PT/1 Owner, 67 packages, 855 check-ins, 73 PT logs, 341 workouts/681 revisions, 315 measurements/443 revisions, 20 guides. Oracle thống kê độc lập, lịch sử fixture nhiều ngày; thao tác hiện tại và browser dùng API thật.
- Lượt scenario đầu 20261029103009393 FAIL ở bước Owner packages browser: `locator.all()` chạy trước khi response/render sẵn sàng, trả list rỗng; screenshot đã hiện dữ liệu hợp lệ. Sửa **duy nhất** scripts/activity-scenario-browser.cjs: chờ first package-stat-row visible trước khi duyệt, giữ kiểm tra tên/count/phân trang. Full scenario chạy lại PASS; không bỏ assertions hoặc sửa dữ liệu/API để test qua. `node --check scripts/activity-scenario-browser.cjs`: PASS.
- Cover FR-AUTH, FR-TRIAL, FR-PKG, FR-PT, FR-BOOK, FR-CHECKIN, FR-EXTPT, FR-SALES, FR-WORKOUT và AI boundary trong giới hạn các ca trên. Không phát hiện lỗi ứng dụng cần sửa trong lượt kiểm tra này. Không khẳng định mọi feature/device đều không lỗi.
- Giới hạn: lúc kiểm tra không có listener 3000/8081/8000, nên không phải smoke bản localhost/Atlas đang dùng; không chạy push/OpenAI live hoặc video người thật. Chưa kiểm tra FPS/CPU/GPU/keyboard/camera/pose trên thiết bị Android/iOS thật; cần Development Build SDK58 mới. HTTP scenario local không phản ánh latency Atlas/mạng điện thoại. Application source không đổi; chỉ script chờ dữ liệu và báo cáo SOT 20/CHANGELOG thay đổi.

- Cleanup: đã gửi shutdown graceful qua admin tới đúng MongoDB test 127.0.0.1:27031; xác nhận PID 3448 không còn và cổng 27031/3000/8081/8000 không có listener. Dataset scenario/file báo cáo giữ trên disk. `git diff --check` cho script/docs task: PASS.


## Combo box nhóm cơ/dụng cụ — 2026-10-30

- Cover FR-WORKOUT-009 và FR-UI-001/004: FilterSelect mới trong components/filter-select.tsx thay dải Choices ở screens/exercise-library.tsx. Giữ label, Tất cả, query/page reset, summary và chọn bài vào draft. Web native select, native trigger/danh sách cuộn tối đa 240px, chọn xong đóng. Không thay API/business/database/dependency; SOT 05/CHANGELOG cập nhật.
- `pnpm --filter @fitness/app lint`: PASS. `pnpm --filter @fitness/app exec expo export --platform all --output-dir dist-sot-web`: PASS Web/Android/iOS. Sau chỉnh font select Web, lint và export web chạy lại PASS (`.local/dropdown-export-final.log`); native branch không thay sau export all.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: lượt cuối PASS trên export cuối. Thêm chọn combo Nhóm cơ/Dụng cụ/Tất cả, giữ group khi thu/mở, focus keyboard, touch >=48px và không tràn ngang ở 320/390/768/1280. Giữ journal/retry/conflict/history/measurements/library→draft/Home regression. API mock, không test native thật. Ảnh `.local/workouts/library-dropdown-390.png` đã xem khi đối chiếu bố cục.
- Có lượt fail ở assertion bố cục reps/weight cũ ngay sau resize, trước khi tới dropdown. Thay kiểm tra tức thời bằng expect.poll chờ useWindowDimensions cập nhật, giữ nguyên điều kiện cùng hàng <2px từ 390px và xuống hàng tại 320px; full runner cuối PASS. Không sửa layout form để né test.
- activity-scenario-browser.cjs đổi selector radio sang combobox/selectOption cho 10 nhóm cơ; `node --check` PASS, không chạy lại full MongoDB scenario cho đổi UI này. `node --check scripts/workouts-regression.cjs`/diff check: PASS. Không chạy lại unit/backend suite vì không đổi domain/query/API. Giới hạn native dropdown/VoiceOver/TalkBack chưa thao tác trên thiết bị thật.


## Home Member là hoạt động tập luyện — 2026-10-30

- Cover FR-WORKOUT-001–010, FR-UI-001/004; giữ FR-PKG-005, FR-PT scope, FR-BOOK-003 và External PT confirmation. Home /member render trực tiếp Workouts, bỏ link trung gian và QR/Lịch/AI shortcut; /member/workouts redirect. PT/gói/Pass/yêu cầu xác nhận chuyển vào Account chỉ khi MEMBER, giữ read-only PT/package và confirm hiện hành. Không sửa API/database/RBAC/provider.
- File: app/member/index.tsx, app/member/workouts.tsx; screens/home.tsx bỏ Member dashboard cũ; screens/member-services.tsx tách read models gói/PT/Pass/confirmation; screens/account.tsx mount riêng Member; shell.tsx áp dụng navigation guard toàn bộ Member và no-op click cùng route để không reset form/tab. SOT 03/05/21/CHANGELOG cập nhật.
- `pnpm --filter @fitness/app lint`: PASS. `pnpm test:app`: PASS **14 suites/65 tests**. `pnpm --filter @fitness/app exec expo export --platform all --output-dir dist-sot-web`: PASS Web/Android/iOS/Hermes, log `.local/member-home-export.log`. Không phải APK/Xcode build.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: PASS trên export mới. Xác nhận sau login hiện hoạt động trực tiếp, không link mở/khối PT ở Home và không fetch các account services; Tài khoản có PT/gói/Pass, popup gói không có activate/renew/cancel; về Home không document reload/mất phiên. Giữ tests nhật ký/số đo/progress/library/dropdown/dirty/pending/conflict/revisions qua 320/390/768/1280. Đã xem `.local/workouts/journal-list-mobile.png`: Home mới chỉ hoạt động cùng navigation.
- `pnpm --package=@playwright/test dlx -c "node scripts/design-system-regression.cjs"`: PASS Owner/PT/Member, gồm lịch read-only. Lượt đầu Member fixture trả [] cho endpoint nhật ký mới được Home dùng; đã cập nhật response collection đúng contract rồi chạy lại PASS, không sửa production để chấp nhận fixture sai.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: PASS conversion/packages/booking/Member readonly, navigation touch/focus và AI local/privacy; thay ca shortcut Home đã xóa bằng assertion không có shortcut + năm nav link có touch >=48px và keyboard focus. `pt-qr-regression.cjs` cùng lệnh wrapper: PASS PT/OWNER/MEMBER. Hai runner cũng thêm fixture collection nhật ký cho Home trực tiếp. Tất cả browser test dùng API/camera mock.
- `scripts/activity-scenario-browser.cjs` và `.local/demo30-browser-live.cjs` bỏ thao tác bấm link hoạt động, dùng Home trực tiếp; `node --check` PASS, chưa chạy lại scenario MongoDB hoặc Atlas live trong task UI này. Không sửa dữ liệu 30 Member.
- `node --check` các runner sửa và `git diff --check` cho file task: PASS. Chưa kiểm tra native device/camera/push/screen reader hoặc URL cũ trên thiết bị thật; không tuyên bố native acceptance từ export.


## Tìm bài đóng bàn phím, kết quả nổi bật — 2026-10-30

- Cover FR-WORKOUT-009/010 và FR-UI-001/004: screens/exercise-library.tsx dùng cùng submit handler nút/Enter, blur ref + Keyboard.dismiss, native keyboardDidHide căn lại scroll; dùng ActivityScroll đúng container. Thêm vùng Kết quả tìm kiếm với tổng/từ khóa/viền nhấn, loading/error/retry/empty/pager chung; giữ list→popup/filter và chọn bài vào draft. Query trim, tìm lại cùng query reload, page reset 1. Không sửa API/dữ liệu/dependency; SOT 05/CHANGELOG cập nhật.
- `pnpm --filter @fitness/app lint`: PASS TypeScript/unused. `pnpm --filter @fitness/app exec expo export --platform all --output-dir dist-sot-web`: PASS Web/Android/iOS/Hermes, log `.local/exercise-search-export.log`. Không phải APK/Xcode build.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: PASS full runner API mock. Thêm focus ô tên, nhập từ khóa có khoảng trắng, bấm Tìm, xác nhận request q=squat, input không còn focus, tổng/từ khóa đúng; heading và first row trong viewport. Focus lại rồi Enter, cùng query phát request refresh mới, input blur và results vẫn trong viewport. Giữ regression journal/version/retry/conflict/history/measurements/progress/catalog→draft/Home cùng viewport 320/390/768/1280 và combo filters.
- Đã xem ảnh `.local/workouts/search-results-visible-390.png`: kết quả trắng/viền xanh, heading/số bài/hàng đầu hiện trên bottom navigation, không bị filter che. `node --check scripts/workouts-regression.cjs` và `git diff --check` file task: PASS.
- Browser chứng minh blur/focus/viewport, không mô phỏng xác thực soft keyboard Android/iOS. Keyboard.dismiss/keyboardDidHide đã implement và bundle native qua nhưng chưa thao tác trên thiết bị native thật. Không chạy lại backend/unit suite vì không thay domain/query contract/API.


## Sửa native measureLayout — 2026-10-30

- Owner báo ReactNativeElement.measureLayout warning sau tìm bài. Đối chiếu trực tiếp RN 0.88 cài trong workspace: getInnerViewNode trả number|undefined, runtime measureLayout chỉ nhận ReactNativeElement; getInnerViewRef trả native InnerViewInstance. Numeric handle vẫn nằm trong type signature deprecated nên typecheck trước đó không bắt được runtime warning.
- Sửa screens/exercise-library.tsx và components/workout-controls.tsx từ getInnerViewNode() sang getInnerViewRef(), giữ null guard/ancestor content ref/scroll offset, keyboard hide và web branch. Scope FR-WORKOUT-009, form validation UX FR-WORKOUT-002/007, FR-UI-004. Không thay API/quota/dữ liệu/schema/dependency.
- `pnpm --filter @fitness/app lint`: PASS TypeScript/unused. `pnpm --filter @fitness/app exec expo export --platform all --output-dir dist-sot-web`: PASS Web/Android/iOS/Hermes, log `.local/native-measure-ref-export.log`.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: PASS full browser suite, gồm tìm nút/Enter/blur/repeat-query/kết quả trong viewport, field error focus, journal/measurement/progress/catalog và Home. API mock, web branch không tái hiện warning native; đây không phải xác nhận thiết bị thật.
- `rg` xác nhận chỉ hai call measureLayout trong app và cả hai dùng getInnerViewRef; không còn getInnerViewNode tại app/src. `git diff --check` file sửa/docs: PASS. ADB không có trên PATH, chưa xác minh scroll/keyboard trên điện thoại thật. Đây là sửa JS/ref, không đổi native module hay yêu cầu build binary mới; reload app để nạp code mới.


## Minh họa ảnh động 20 bài Member — 2026-10-30

- Owner yêu cầu thay trải nghiệm chỉ link mẫu bằng GIF/chuỗi khung hình; sau kiểm tra điều khoản ACE, Owner chọn nguồn ảnh mở phù hợp. Scope FR-WORKOUT-009/010, FR-UI-001/003/004; SOT 02/03/04/05/21 và CHANGELOG/README cập nhật. Không lấy ảnh ACE/NASM, không đổi provider/dependency runtime hoặc schema/API/business/database.
- Nguồn: 34 JPEG không chỉnh sửa từ yuhonas/free-exercise-db (Unlicense/Public Domain theo repo), 9 PNG không chỉnh sửa từ bryllim/workout-guide (Bryl Lim/Everkinetic, CC BY-SA 4.0). 20 codes/43 frames khoảng 2,37 MiB. Tất cả trong apps/app/assets/exercise-demos kèm LICENSE, ATTRIBUTION, README và provenance.json: commit/path/hash/tên Anh/version và ghi công từng frame gốc. Đối chiếu 34 JPEG với Git blob SHA của source commit: PINNED_SOURCE_BYTES_MATCH 34. Ba chuỗi PNG dùng URL commit aac599224bb9780305239607ef98540b7e0ce389. Không crop/recolor/chỉnh nguồn; nét trắng được trình bày trên nền tối.
- Đã xem contact sheets cả hai vị trí của 17 bài chụp và 3 chuỗi minh họa riêng. Loại ảnh Dead_Bug chỉ duỗi chân và standing calf dùng máy khỏi assets; thay bằng dead-bug tay/chân đối diện và calf-raise bodyweight có tay vịn, UI ghi rõ tay vịn thay tường. Candidate DVIDS/Wikimedia không được ship. Chưa có review PT hay xác minh động học từ người thật; ảnh chỉ là các vị trí chính, không phải video liên tục/AI feedback.
- Implementation: features/exercise-demos.ts manifest literal require theo code/nameEn/contentVersion v1; features/workouts.ts thêm code optional đã có ở API để tương thích fixture/cache cũ. components/exercise-demo.tsx render tối đa 2–3 ảnh cho detail đang mở; auto-play sau load, reduced motion dừng, manual step dừng playback, AppState background dừng và unmount clear timer. Loading/error/retry, nguồn/giấy phép disclosure. exercise-library.tsx tích hợp player, giữ hướng dẫn/nhật ký và native scroll fix. Catalog đã publish và workout snapshots không đổi/reseed.
- `pnpm --filter @fitness/app lint`: PASS. `pnpm test:app`: PASS **14 suites/65 tests**. `pnpm --filter @fitness/app exec expo export --platform all --output-dir dist-sot-web`: PASS Web/Android/iOS/Hermes, lần cuối log `.local/exercise-demos-export-final.log`. Không phải APK/Xcode build.
- `node scripts/verify-exercise-demos.cjs`: PASS **20 catalog codes/43 SHA256 hashes**, name/version/source/license và không có asset thừa ngoài manifest. Script kiểm tra offline, không ghi DB.
- `pnpm --package=@playwright/test dlx -c "node scripts/exercise-media-regression.cjs"`: PASS trên export cuối, API mock nhưng ảnh bundled thật. Mở đủ 20 detail, decode naturalWidth>0 cho cả 43 frame; reduced-motion bắt đầu dừng, prev/next đúngindex, playback đổi ảnh/pause giữ index; 320/390/768/1280 không tràn ngang. Nguồn/giấy phép hiện được từng bài, không request media tới bên thứ ba. Thêm lỗi ảnh abort cục bộ→hướng dẫn còn dùng→retry tải đủ, contentVersion2 báo fallback không gán ảnh1; context no-preference tự phát và đóng popup unmount image. Đã xem ảnh `.local/exercise-media/bodyweight-squat-390.png` và `dead-bug-390.png`, nút Trước/Phát/Sau gọn cùng hàng.
- `pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"`: PASS full flow Home/journal/version/retry/conflict/revisions/measurement/progress/search/blur/viewport/dropdown/catalog→draft. Fixture guide thêm code thực để dùng manifest. Không giảm các assertion hiện có.
- `node --check scripts/exercise-media-regression.cjs`, integrity script và `git diff --check` file task: PASS. Chưa chạy lại MongoDB scenario/Atlas live vì API và business không đổi. Chưa xác minh memory/playback/reduced-motion/background/ảnh thiếu trên thiết bị native thật; native export không thay native device acceptance. Cần reload/cập nhật bundle app để nhận assets mới.
## Sửa review design system thư viện Member — 2026-10-30

- Scope FR-WORKOUT-009/010 và FR-UI-001/003/004: ảnh lỗi thu gọn, giữ hướng dẫn/retry; hai bộ lọc native dùng một trạng thái mở, đóng khi chọn/thu bộ lọc/tìm kiếm/mở detail và Android Back; CTA chọn bài nằm trong footer ngoài vùng cuộn, tính safe area. Không thay API/business/database/dependency.
- File chính: components/exercise-demo.tsx, filter-select.tsx, detail-modal.tsx, workout-controls.tsx và screens/exercise-library.tsx. DetailModal có footer optional; ExerciseDetail giữ một request detail. SOT 03/05/CHANGELOG cập nhật.
- `pnpm --filter @fitness/app lint`: PASS. `pnpm test:app`: PASS 14 suites/65 tests. `pnpm --filter @fitness/app exec expo export --platform all --output-dir dist-sot-web`: PASS Web/Android/iOS/Hermes; log `.local/design-fixes-export.log`.
- `pnpm --package=@playwright/test dlx -c "node scripts/exercise-media-regression.cjs"`: PASS trên export cuối; 20 bài/43 ảnh thật với API mock. Bổ sung giả lập lỗi ảnh: không còn khung ảnh/nút phát, retry dùng được; hướng dẫn dài và nguồn mở rộng vẫn giữ CTA/header trong viewport 320×568, 390×844, 844×390, 1280×900, vị trí footer không dịch khi cuộn. Đã xem compact-image-error-390.png, fixed-footer-320.png và fixed-footer-844.png trong `.local/exercise-media`.
- Các runner `workouts-regression.cjs`, `list-popup-regression.cjs`, `people-regression.cjs`, `crm-regression.cjs` qua cùng lệnh Playwright: PASS; kiểm tra hồi quy body/footer, pending/error/retry/focus, journal và quản lý Member/PT/CRM với API mock. `node --check scripts/exercise-media-regression.cjs`, `node scripts/verify-exercise-demos.cjs`: PASS (20 codes/43 hashes).
- Giới hạn: chưa kiểm tra tương tác dropdown/Android Back/safe area trên thiết bị native thật; typecheck và native export không thay device acceptance. Không chạy lại MongoDB scenario vì backend không đổi, không sửa dữ liệu 30 Member đang sử dụng.
