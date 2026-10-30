# FITNESS-MANAGE SOT — CHANGELOG

## 2026-10-30 — Sửa review design system thư viện Member

- Thu gọn trạng thái ảnh lỗi; dropdown native chỉ mở một ô, đóng khi chọn/tìm/thu bộ lọc và xử lý Android Back.
- CTA chọn bài chuyển sang footer cố định của DetailModal; fetch một nguồn dữ liệu, tính safe-area, header/body/footer độc lập. Giữ form/dirty/pending của popup khác.
- SOT 03/05 và regression media/footer/workouts cập nhật; kết quả SOT 20. Không đổi API/business/database/dependency.

## 2026-10-30 — Minh họa động tác cho 20 bài mẫu

- Owner chọn nguồn ảnh mở: đóng gói 43 frame cho 20 bài, nguồn free-exercise-db và Workout Guide; không sao chép media ACE. Thêm player phát/dừng/từng khung, reduced-motion, AppState, lỗi/tải lại và ghi công/giấy phép.
- Manifest code/name/version giữ identity và catalog bất biến; không đổi API/schema/DB/provider hoặc AI video boundary. Cập nhật SOT 02/03/04/05/21 và verification SOT 20; scripts kiểm tra provenance và browser media.

## 2026-10-30 — Sửa native measureLayout sau tìm bài

- Native scroll tìm bài và focus field lỗi dùng getInnerViewRef() thay getInnerViewNode(): RN 0.88 ReactNativeElement.measureLayout yêu cầu native component ref, không nhận numeric handle dù signature còn union number. Giữ null guard, offset và Keyboard.dismiss.
- Không thay UI flow/query/API/dữ liệu; kết quả verification và giới hạn thiết bị thật tại SOT 20.

## 2026-10-30 — Đóng bàn phím và làm rõ kết quả tìm bài

- Nút/phím Search đóng bàn phím, cuộn tới vùng kết quả; thêm tiêu đề, số bài/từ khóa, nền và viền nhấn; giữ danh sách → popup. Cùng query vẫn refresh và giữ filters.
- Sửa exercise-library.tsx, mở rộng workouts-regression về blur/Enter/viewport; SOT 05 và kết quả SOT 20 cập nhật. Không đổi server/database/dependency.

## 2026-10-30 — Member Home tập trung hoạt động tập luyện

- Home render trực tiếp hoạt động, bỏ QR/Lịch/AI shortcut và card trùng navigation; PT/gói/Pass/yêu cầu xác nhận chuyển vào Tài khoản Member. Route cũ redirect, giữ dirty/pending guard ở Home mới.
- Không sửa API/quyền/dữ liệu. SOT 03/05/21 và browser regression cập nhật; kết quả SOT 20.

## 2026-10-30 — Thu gọn bộ lọc nhóm cơ và dụng cụ

- Thư viện bài mẫu dùng FilterSelect dạng xổ xuống thay Choices cuộn ngang; giữ giá trị/query/summary/phân trang và chọn bài vào nhật ký. Không đổi API/catalog/business/dependency.
- Cập nhật SOT 05, regression tương tác combo box và scenario browser; kết quả thực tế ở SOT 20.

## 2026-10-29 — Kiểm tra lại toàn dự án trên SDK 58

- Lint/build/unit API/app/AI, Expo Doctor/export và tám browser regression PASS; integration MongoDB thật 16 ca và scenario 30 Member/browser API thật PASS. Kết quả, dataset riêng và giới hạn tại SOT 20.
- Sửa race của runner activity-scenario-browser: chờ hàng thống kê gói tải/render trước khi duyệt locator.all(); giữ toàn bộ assertions tên/count/phân trang. Không thay mã ứng dụng hay dữ liệu Atlas.

## 2026-10-29 — Nâng Expo SDK 58 theo yêu cầu Owner

- Nâng Expo/React Native/React và module native tương thích; đồng bộ TypeScript/Jest/ts-jest và lockfile. Chuyển splash sang plugin mới, bỏ config-plugins trực tiếp và packageExtension picker cũ.
- Migrate RN instance refs, React type resolution ngoài workspace và Router unsaved guard; giữ Web SPA/loading đồng bộ. Không đổi backend/database/privacy. Baseline và yêu cầu rebuild native ở SOT 04; kết quả thực tế ở SOT 20.

## 2026-10-29 — Thống nhất record list và popup chi tiết

- Owner yêu cầu bỏ card lặp ở danh sách/thống kê: chuyển CRM, gói/Pass, lịch, Sales/Logs, thống kê tháng/gói, lịch sử/check-in/PT Member, tập luyện/biểu đồ/revisions và AI session/per-rep sang hàng mở popup. Giữ card KPI/QR/form và giảm padding; selection picker trong form dùng hàng phẳng.
- Thêm RecordRow/PopupRow và DetailState/FormScroll; popup cuộn riêng, có safe-area/keyboard, khóa đóng khi Form/useCommand pending. Nhật ký/số đo giữ dirty confirmation; Home tiếp tục client navigation. Không đổi server/API/dữ liệu hay raw-video pipeline.
- Cập nhật các browser regression theo popup mà giữ kiểm tra payload, pending, reason, pagination, role, conflict và privacy. Bổ sung list-popup-regression cho Sales pending/error/retry và tháng zero/PT độc lập; kết quả và giới hạn tại SOT 20.

## 2026-10-29 — Thu gọn thống kê gói theo nhóm

- PackageStatistics bỏ card lồng từng gói, dùng nhóm Theo số buổi/Theo thời gian với hàng gọn và 3 gói/trang mỗi nhóm. Màn rộng hai cột, mobile đổi nhóm, bỏ nhóm rỗng và footer phân trang không cần thiết. Giữ cách đếm toàn lịch sử/unique Member theo tên + mode, API và dữ liệu.
- Thêm package-statistics-regression kiểm tra viewport, phân trang đủ dữ liệu, không gộp trùng tên khác mode, nhóm rỗng và loading/error/retry. Cập nhật scenario browser đọc qua từng trang thống kê thay vì giả định mọi gói hiện cùng lúc. Kết quả tại SOT 20.

## 2026-10-29 — Đổi tên 30 Member và 3 PT trong dữ liệu vận hành kiểm thử

- Owner yêu cầu thay tên Demo bằng tên tiếng Việt tự nhiên: cập nhật trực tiếp fitness_manage qua PeopleService.update/TransactionService với actor Owner, giữ audit; 30 customer liên kết đồng bộ tên. Không thêm tài khoản hoặc đổi SĐT, CCCD, credentials, gói, lịch, assignment, check-in, workout/số đo hay revision.
- Lưu tên cũ/mới để khôi phục và đối chiếu digest 21 model; cập nhật members.csv, accounts.csv, demo30-data.json, pt-matches.json và hướng dẫn tra cứu tên mới trong .local/demo30-app-data. Report nhập gốc giữ tính lịch sử. Không khởi động API chiếm port; xác minh domain service/MongoDB và read model tên trong booking/PT/Member. Kết quả ở SOT 20.

## 2026-10-29 — Làm mới giao diện hoạt động mobile

- Thêm activity-visuals dùng token hiện hành: header nền nhạt, menu icon hai cột mobile, card padding gọn, thẻ ngày nhật ký/số đo, giá trị có đơn vị và thẻ tiến bộ có điểm nhấn. Thư viện thu bộ lọc để ưu tiên bài tập. Không thêm dependency, ảnh mạng hoặc animation.
- Page hỗ trợ header riêng; Home được đánh dấu mục cha khi ở workouts. Giữ dữ liệu thật, validation, dirty/pending, client navigation và API/quyền. Bổ sung regression bộ lọc thư viện, ảnh mobile và cập nhật runner scenario để mở bộ lọc; kết quả thực tế tại SOT 20.

## 2026-10-29 — Sửa Member từ hoạt động về Home mất phiên

- Handler link trong Shell luôn chặn tải lại document và điều hướng bằng Expo Router, kể cả khi màn hoạt động không có form guard. Trước đây nhánh không có guard trả về sớm, làm anchor tải lại trang và mất phiên web lưu trong memory. Không thay cách lưu token hoặc auth/RBAC/API.
- Bổ sung workouts-regression: từ cả bốn mục về Home trên mobile/desktop không có document request, editor chưa sửa vẫn về được, đang lưu chặn Home và dirty cancel giữ nội dung. Đối chiếu bản thật 8081 bằng tài khoản Demo Member; kết quả tại SOT 20.

## 2026-10-29 — Danh sách PT/Member phân trang và popup

- Owner PT & Member chuyển sang list giới hạn chiều cao, phân trang tự co theo vùng nhìn thấy; form tạo và chi tiết chuyển vào popup. Chi tiết tách thông tin/gói, sửa hồ sơ, PT phụ trách/lịch sử; giữ trang khi đóng và khóa đóng khi mutation pending.
- Tách DetailModal và PeopleDetail; giữ API, RBAC, audit/history và schema hiện hành. Cập nhật regression cũ theo popup, thêm people-regression cho phân trang vượt 30 hồ sơ, viewport nhỏ, pending/lỗi/empty và popup. Kết quả thực tế ghi tại SOT 20.

## 2026-10-29 — Lịch dạng list và phân công PT mẫu

- Đổi màn Lịch dùng chung ba role sang hàng gọn theo ngày; thu form Owner mặc định, giữ quyền và xác nhận hủy có lý do. Cập nhật regression để mở form trước khi kiểm tra.
- Phân công thêm Demo 30 Member 25–30 cho 3 Demo PT hiện có bằng API Owner trên fitness_manage; không thay phân công cũ. Đối chiếu một primary PT active mỗi Member và lịch sử; báo cáo `.local/demo30-app-data/pt-matches.json`.

## 2026-10-29 — Đối chiếu và xuất Demo 30 trong app localhost:8081

- Theo Owner chỉ định app 8081, bổ sung dữ liệu scenario đã kiểm tra vào database cấu hình fitness_manage, giữ nguyên dữ liệu/tài khoản cũ: 30 Member, 3 PT, 67 gói, 855 check-ins, 73 PT logs, 341 nhật ký, 315 số đo và 20 bài mẫu.
- Lưu CSV đăng nhập không mật khẩu, JSON dữ liệu mẫu đã lược credentials/CCCD và báo cáo tại .local/demo30-app-data/. Xác minh 30 Member bằng API thật (1.236 assertions / 279 requests) và browser 8081/API/Atlas không mock PASS; hướng dẫn và giới hạn ở testing-activity-scenario.md/SOT 20.
- Cập nhật locator empty state của activity-scenario-browser.cjs theo UI mới, chạy full scenario riêng lại PASS trước nhập. Không đổi nghiệp vụ, API/schema/provider hoặc guard database test của runner gốc.

## 2026-10-28 — Cải thiện trải nghiệm hoạt động tập luyện Member

- Giữ form nhật ký sau lưu nháp/sửa với id/version từ server để tiếp tục hoặc complete ngay; không gộp request lưu và complete. Giữ conflict/retry/pending, tải lại lỗi không mở form tạo mới, archive về danh sách.
- Thu gọn bộ lọc có tóm tắt ở nhật ký/số đo/tiến bộ, trình bày hiệp theo hàng responsive, lỗi tại trường với bài/hiệp và focus/scroll, đưa số đo gần nhất lên trước biểu đồ và cho mở/ẩn bảng số liệu. Bỏ thuật ngữ null và thông tin version khỏi form chính.
- Cập nhật SOT 05/21, regression frontend và browser hiện có; không đổi API/schema/stack, không reset dataset test 30 Member. Kết quả thực tế ghi tại SOT 20.

## 2026-10-28 — Hoàn thiện design system hoạt động tập luyện

- Thêm nhãn bộ lọc ngày, dấu chọn/trạng thái trợ năng cho bốn mục, Feedback semantic có live region/alert; dùng chung token UI và giữ pending/focus/vùng chạm 48px.
- Việt hóa action lịch sử, dùng Badge trạng thái ở danh sách/chi tiết/revisions và sửa placeholder tìm bài trong Tiến bộ. Thay đổi ở ui.tsx, workout-controls, workout-revision-history, features/workouts và các màn Member tương ứng; không đổi API/schema/nghiệp vụ.
- Mở rộng workouts-regression.cjs kiểm tra 5 điểm review, viewport 320/390/768/1280px, semantic feedback và giữ các ca pending/retry/conflict hiện có. Cập nhật SOT 05; kết quả thực tế tại SOT 20.

## 2026-10-28 — Sửa cấu trúc hoạt động tập luyện sau review

- Tách BodyMeasurementsService và ExerciseLibraryService khỏi WorkoutsService, đăng ký DI trong WorkoutsModule; controller gọi đúng service, giữ nguyên routes/contract và MEMBER self checks. Nhật ký/số đo giữ transaction, idempotency, expectedVersion và private revisions; không đổi schema/index/stack hoặc dữ liệu nghiệp vụ.
- Chuyển RevisionHistory sang components/workout-revision-history.tsx và useDirtyEffect sang hooks/use-dirty-effect.ts; hai màn Member import từ phần dùng chung, bỏ phụ thuộc số đo vào màn nhật ký.
- rangeQuery dùng generic Zod shape giữ kiểu status/groupBy và các bộ lọc, bỏ unknown index signature/ép kiểu ở service. Bổ sung regression query default/coercion/strict validation, quyền tại ba service và DI graph. Cập nhật SOT 03/17; bằng chứng kiểm tra tại SOT 20.

## 2026-10-28 — Scenario 30 Member và kiểm tra dữ liệu nhiều ngày

- Thêm activity-scenario.ts, activity-scenario-browser.cjs và command test:activity-scenario; tạo dataset test riêng giữ lại, không đụng database nghiệp vụ. Thêm hướng dẫn testing-activity-scenario.md, liên kết README và ghi bằng chứng SOT 20.
- Dataset cuối: 30 Member + Owner/3 PT, 67 gói, 855 lượt Member/Trial, 73 PT logs, 341 nhật ký, 315 số đo, 20 bài mẫu. Có expired/exhausted/cancelled/pending, lịch sử nhiều ngày/UTC+7/ngày nhuận và gia hạn.
- Full run + browser API/MongoDB thật PASS 8.168 assertions / 1.777 HTTP requests; unit API 109 tests pass. Chưa phát hiện sai lệch thống kê trong phạm vi ca đã chạy; chỉ sửa launcher test Windows, không thay nghiệp vụ hoặc implementation production. Giới hạn lịch sử fixture/native/camera theo SOT 20.

## 2026-10-28 — Triển khai hoạt động tập luyện Member

- Verification cuối: lint/build pass, API 109 unit tests, app 63 tests, MongoDB test riêng 16 integration scenarios, browser luồng mới và hồi quy ba role pass; web/native bundle export pass. Đã sửa regex search literal và guard rời form/menu; chi tiết các lần fail/fix và giới hạn tại SOT 20. Chưa rollout vào database nghiệp vụ.
- Owner duyệt triển khai sau khi bổ sung số đo cơ thể và bài mẫu. Chuyển phạm vi sang SOT 21, đăng ký FR-WORKOUT-001–010 tại SOT 02, cập nhật SOT 01/03/05/06/15/16/17 và README. Proposal giữ làm lịch sử.
- Module Member-only, transaction/idempotency/version và revisions riêng; không thay booking/check-in/quota/AI. UI Home → Hoạt động tập luyện, 20 bài/10 nhóm, online/text-only, không thêm dependency. Schema/index/seed và rollout tại SOT 15/21; kết quả kiểm tra thực tế ghi SOT 20.

## 2026-10-28 — Đề xuất nhật ký tập luyện và lịch sử tiến bộ Member

- Bổ sung theo yêu cầu Owner: thư viện bài mẫu theo nhóm cơ, baseline đề xuất 10 nhóm/20 bài; FR-WORKOUT-009/010, tìm/lọc/đọc, chọn vào nhật ký với catalog id/version/snapshot và acceptance. Nội dung cần review trước publish; không thêm giáo án, media hoặc mở rộng AI.
- Bổ sung theo yêu cầu Owner: theo dõi cân nặng (kg)/chiều cao (cm) theo ngày đo, FR-WORKOUT-007/008 dự kiến, lịch sử/revision, biểu đồ và chênh lệch từng chỉ số; dữ liệu/API, quyền riêng tư, concurrency và acceptance tương ứng. Chưa thêm BMI/dinh dưỡng hoặc thay đổi SOT canonical.
- Theo yêu cầu Owner viết tài liệu sau trao đổi ý tưởng, thêm `proposals/member-workout-journal-progress.md` và liên kết trong README.
- Đặc tả FR-WORKOUT-001–006 dự kiến: Member tự ghi bài/hiệp/lần/tạ, nháp/hoàn tất/sửa có revision/lưu trữ, lịch sử và công thức tiến bộ; có hợp đồng dữ liệu/API đề xuất và ma trận nghiệm thu.
- Đây là proposal để review, chưa chốt các lựa chọn nghiệp vụ mới hoặc thay đổi SOT canonical 01–20. Không mở rộng PT giao bài hoặc AI; không thay code/schema/stack hoặc dữ liệu nghiệp vụ. Nhật ký độc lập với booking/check-in/attendance/quota.

## 2026-10-21 — PT check-in bằng QR như Member

- Theo yêu cầu Owner, thay PT tự bấm có mặt bằng QR cá nhân hạn 2 phút để Owner quét/xác nhận tại quầy.
- Thêm GET pt/me/qr, POST checkins/pt Owner-only; bỏ POST pt/me/checkin. QR kind riêng, kiểm tra active, audit và source QR. Giữ log độc lập, daily guard UTC+7, idempotency/WriteLock và dữ liệu cũ; không đổi schema/stack/dependency.
- Cập nhật SOT 02/05/11/16/17; kết quả kiểm tra ghi SOT 20.

## 2026-10-20 — Sửa 4 khoảng trống CRM sau review

- Khi hết retry write conflict, transaction trả 409 CONCURRENT_CHANGE thay vì lỗi database 500; giữ nguyên khóa và số lần retry. Thêm unit regression cho retry thành công/hết retry.
- Giữ nhật ký booking theo bằng chứng Member trong audit before/after sau reassignment; không ghi lại audit cũ. Thêm hai nested indexes bằng db:indexes, không thay schema/provider.
- Thêm GET customers/:id/checkins Owner-only và phân trang riêng booking/check-in ở CRM; giữ preview detail cũ để tương thích, truy xuất được lịch sử sau 100 lượt.
- Customer detail trả allowlist thông tin Member chính thức cho Owner và UI hiển thị CCCD/trạng thái tài khoản tách khỏi phân loại customer.
- Sales mặc định OPEN, lọc các trạng thái hiện có hoặc ALL trước phân trang; đổi lọc reset trang 1, giữ mọi alert đã đóng và không tự convert/gia hạn.
- Cập nhật SOT 02/05/13/15/16/17; validation/unit/integration/browser ghi tại SOT 20. Không sửa business database hoặc dữ liệu người thật.

## 2026-10-20 — Sửa 5 lỗi design system sau review

- Khóa picker mẫu trong pending cấp/gia hạn gói bằng Form ổn định theo revision; không reset guard bằng remount khi đổi mẫu.
- Cho drawer/sidebar Owner cuộn trên màn thấp; giữ navigation theo role và touch target.
- Giữ palette thương hiệu, thêm màu semantic đậm cho chữ/CTA/error với contrast tối thiểu 4,5:1. Form xác nhận hủy lịch/PT/gói có destructive variant và nhãn cụ thể.
- Quầy hiển thị loading/error/retry/empty cho booking Member đang chọn, khóa xác nhận PT nội bộ khi booking chưa sẵn sàng; tự tập không bị khóa bởi booking. Dùng filter memberId của endpoint hiện có, không thêm API.
- Cập nhật SOT 05, bổ sung regression màu/UI; không đổi nghiệp vụ, schema, stack hoặc dependency. Kết quả kiểm tra thực tế tại SOT 20.

## 2026-10-20 — Sửa Dashboard UTC+7 và lỗi scheduler sau review

- Dashboard dùng chung khoảng ngày UTC+7 cho check-in/booking, bao gồm đầu ngày và loại trừ đầu ngày kế tiếp; không phụ thuộc timezone máy chủ.
- Bỏ refresh cảnh báo khỏi Dashboard và bỏ dependency SalesAlertsModule; đọc KPI không còn lấy business write lock. Giữ refresh lúc khởi động/mỗi 60 giây, ghi rõ độ trễ cập nhật tại SOT 03/13.
- Hai scheduler log mã lỗi cố định bằng Nest Logger khi vòng chạy thất bại; không log exception/stack/PII và vẫn chạy vòng tiếp theo. Không đổi schema, dependency, endpoint, quyền hoặc quota.
- Thêm regression test ranh giới ngày/năm, Owner-only/read-only Dashboard, scheduler failure/recovery/shutdown và log an toàn; kết quả thực tế ghi tại SOT 20.

## 2026-10-20 — Sửa notification và tách trách nhiệm module

- Theo review và yêu cầu Owner: notification có lease 60 giây/claim token, retry transport/429/5xx tối đa 3 lần và delay; phục hồi SENDING sau crash. Giữ best-effort, ghi rõ giới hạn duplicate khi upstream đã nhận nhưng response mất.
- Booking/external initiation chỉ enqueue trong transaction, không gửi push trên request; scheduler riêng xử lý outbox. Không đổi consume/history/RBAC/endpoint/provider.
- Thay `domain.controller.ts` và `operations.service.ts` bằng controller/module theo domain và Sales Alerts, Reports, Dashboard, Audit, Device Tokens service riêng; route me đứng trước dynamic id. Tách client form, useLoad, HTTP và date helpers khỏi ui.tsx, giữ hành vi giao diện.
- Notification schema bổ sung attempts/lease/retry fields và index; db:indexes backfill attempts thiếu, không reset record cũ. Hướng dẫn rollout tại README/SOT 15; cập nhật SOT 03/13. Kết quả kiểm tra thực tế ghi tại SOT 20.

## 2026-10-09 — Chặn điểm danh nhiều lần cùng ngày

- Owner báo QR quét lần hai trừ thêm buổi; code cũ chỉ chống lặp 30 giây.
- FR-CHECKIN-008 khóa một lượt vào tập/customer hoặc Member/ngày UTC+7, không reset bởi method/gói/context/conversion; PT một attendance log/ngày độc lập.
- Daily guard đặt trong transaction có shared write lock trước consume; request mới bị chặn 409 và không consume gói/Trial/pass. Same-key replay giữ nguyên. Chốt timestamp cùng guard để tránh race qua nửa đêm.
- Cập nhật SOT 02/07/08/11/12/15/16/17 và integration fixtures cho ngày mới; không đổi schema/stack hoặc tự hoàn quota lịch sử. Verification tại SOT 20.

## 2026-10-09 — Người đăng ký gói và check-in theo tháng

- Owner yêu cầu thêm hai thống kê; sau làm rõ đã bỏ yêu cầu doanh thu.
- FR-PKG-008 đếm Member duy nhất theo tên + mode trong lịch sử và số lần cấp/gia hạn, gồm hết hạn/hủy.
- FR-CHECKIN-007 báo cáo đủ 12 tháng theo năm/UTC+7; Member + Trial là tổng lượt vào tập, PT attendance riêng. Hai API read-only enforce Owner tại guard và service; không đổi schema/quota/history/stack.
- Cập nhật SOT 02/05/08/11/16; verification ghi tại SOT 20.

## 2026-10-08 — Lỗi dữ liệu khi xác nhận check-in sau quét QR

- Owner xác nhận lỗi xuất hiện sau nút Xác nhận vào tập. Form gửi id gói/booking rỗng khi chưa chọn; schema API từ chối với lỗi chung.
- Thêm client check-in payload helper kiểm tra lựa chọn, chỉ gửi booking trong context PT nội bộ; API trả lỗi trường cụ thể. Xóa identity/token cũ khi bắt đầu quét mới.
- Giữ cơ chế QR ký/hết hạn và quota/idempotency/Owner boundary hiện hành; không auto-select gói/booking và không đổi stack. Cập nhật SOT 05/16/20 cho FR-CHECKIN-001/003 và FR-AUDIT-002.

## 2026-10-08 — Làm rõ lỗi chuyển Trial thành Member

- Owner báo nhập đủ vẫn bị lỗi ở cả gói mẫu/tự nhập. Xác minh thông báo generic phía client/server che trường sai; chưa có dữ liệu lỗi thực tế để kết luận trường cụ thể của Owner.
- Conversion kiểm tra CCCD/mật khẩu trước gửi, giữ leading zeros/mật khẩu nguyên bản; lỗi package/date được diễn giải. Chuẩn hóa ngày mặc định độc lập locale, đồng bộ giới hạn giá/quota/tên/ngày với API existing.
- API giữ strict validation/400, bổ sung thông báo theo trường không echo PII; không đổi role/conversion transaction/history/quota. Cập nhật SOT 05/16/20 và regression cả mẫu/tự nhập.

Mọi thay đổi quyết định sản phẩm/nghiệp vụ/architecture/stack/UI quan trọng phải ghi ở đây.

## 2026-10-08 — PT & Member, date gói và hiển thị gói sở hữu

- Theo yêu cầu Owner, đổi nhãn nav PT thành PT & Member; không thay route/role/RBAC.
- Form package/conversion/gia hạn dùng date-only picker, mẫu tháng vẫn tự tính hạn; booking datetime giữ nguyên. Mở rộng control date/time existing, không thêm dependency.
- Thêm read-only package summary trong Member detail và hồ sơ customer mặc định; dùng memberUserId/user id và endpoint memberships hiện hành, trạng thái/quota do server trả. Ưu tiên ACTIVE và giữ gói lịch sử. Tab quản lý gói hiển thị các gói đã cấp trước form mới.
- Cập nhật SOT 05; cover FR-PKG-004/005/007 và FR-UI-001/004. Kiểm tra thực tế tại SOT 20.

## 2026-10-08 — Gọn trang Gói tập và bộ chọn datetime lịch tập

- Theo yêu cầu Owner, bỏ card danh sách “6 gói hội viên mẫu” đầu trang; giữ lựa chọn gói kèm giá và quyền sửa giá trước khi lưu theo FR-PKG-007.
- Form tạo/sửa booking dùng datetime control web/native, có prefill/confirm/cancel/pending. Giữ local-time → ISO, Owner-only mutation, reason/history và server overlap theo FR-BOOK-001/002/004/005/006.
- Dùng datetimepicker native đã có trong package/lockfile, không cài thêm dependency; cập nhật SOT 04/05. Verification thực tế ghi tại SOT 20.

## 2026-10-08 — Sửa FastAPI dev trả 422 do code cũ

- Xác minh OpenAPI của tiến trình 8000 chỉ có FormRequest v1 dù source đã hỗ trợ v2; request mới bị từ chối vì service chưa reload.
- Bật Uvicorn reload giới hạn services/ai/app trong scripts/ai.mjs, không đổi schema/privacy/stack. Restart đúng một phiên dev, giữ token gateway trong môi trường và không log secret.
- pnpm test:ai pass 12 tests; sau restart OpenAPI có AutoFormRequest, POST v2 với chỉ số pose-failure giả lập tới service thật trả 200. Nhận xét OpenAI live vẫn chưa được xác minh do HTTP 429 ở lần thử trước.

## 2026-10-08 — AI tự nhận diện bài, nhận xét từ số đo trên web/mobile

- Theo yêu cầu Owner, bỏ chọn bài trước; FR-AI-008 bổ sung nhận diện on-device heuristic SQUAT/PUSH_UP/LUNGE với UNKNOWN khi thiếu bằng chứng. Không mặc định biến thể Squat hai tay đưa trước; tay/thân chưa có tiêu chí thì chỉ báo góc.
- Shared domain web/native tính motion, đếm joint cycles, lưu báo cáo góc từng lần và tự gọi JSON contract v2. Raw video/landmarks/identity không gửi cloud; tối đa mười perRep, server diễn giải sáu bằng chứng ưu tiên lỗi mục tiêu.
- FastAPI thêm prompt hướng dẫn form tiếng Việt và Responses structured output, giữ OPENAI_MODEL đã cấu hình, store=false. Server giữ số đo/target/verdict cố định; timeout/refusal/429/rewrite sai bằng chứng fallback LOCAL với nguồn hiển thị rõ. Không đổi stack/provider baseline, không tạo giáo án/chẩn đoán.
- SQLite user_version=2 thêm history local_ai_results, migrate kết quả cũ và append kết quả trong transaction; thất bại/hủy phân tích lại không xóa kết quả trước. Xóa phiên theo Member xóa cả history/video.
- Dev AI runner kế thừa gateway token từ API env khi chưa cấu hình riêng, không ghi/log secret. Cập nhật SOT 02/03/05/14/15/16/18/20, hướng dẫn README và flow trong AGENTS.md; phiên/binary cũ giữ boundary tương thích.
- Kiểm thử app/API/AI, web browser và export ba platform ghi tại SOT 20. OpenAI thật với cấu hình hiện có trả HTTP 429; không tuyên bố đã nhận diễn giải live hoặc kiểm chứng nhận diện/góc trên video người thật/native device.

---

## [1.0.0] — 2026-09-23

### Added

- Dựng lại bộ SOT canonical theo cấu trúc core + business detail + technical detail + Codex guide + testing.
- Chốt 3 role đăng nhập: OWNER, PT, MEMBER.
- Chốt CCCD trong hồ sơ chính thức Member/PT; Trial chỉ cần tên + SĐT ở onboarding.
- Chốt Trial 3 buổi cố định và một SĐT chỉ Trial một lần.
- Chốt Sales Trigger cho Trial lượt cuối và Member sắp hết package.
- Chốt Membership hỗ trợ cả time-based và session-based.
- Chốt một primary PT active cho Member dùng PT nội bộ; chỉ Owner đổi/hủy.
- Chốt booking từng buổi do Owner độc quyền tạo/sửa/hủy; bỏ mô hình ca.
- Chốt PT/Member booking read-only và conflict rule một PT chỉ tập một Member cùng thời gian.
- Chốt Member có SELF_TRAINING.
- Chốt QR primary, phone fallback cho Member check-in.
- Chốt PT attendance độc lập; không auto-match với Member để kết luận vắng/mặt.
- Chốt External PT Pass; PT ngoài không account và tra cứu qua SĐT Member.
- Chốt AI chỉ kiểm tra form/gợi ý sửa; không tạo workout plan; chỉ Member xem.
- Chốt raw AI video local-only do privacy.
- Chốt UI/UX đơn giản, màu năng động/tươi sáng không gắt, ít animation.
- Chốt tech stack React Native + Expo + TypeScript, React Native Web, Expo Router, Zustand, RHF+Zod, Axios, NestJS, REST, JWT+Refresh, Prisma, MongoDB Atlas, Supabase Storage, SQLite/File System local, MediaPipe Pose, FastAPI/OpenCV/OpenAI, Expo Push, Git/GitHub.

### Changed

- Database server chuyển từ PostgreSQL/Supabase Database sang MongoDB Atlas.
- Supabase chỉ còn vai trò Storage cho cloud-safe file; không dùng Auth/Realtime.
- SQLite được chính thức hóa cho local mobile AI/cache, không thay server DB.
- AI architecture chuyển sang raw-video local + structured JSON cloud để phù hợp privacy.

### Source reconciliation

- Giữ tinh thần CRM/Trial 3 buổi, sales trigger, External PT và offline-first AI từ đề cương tham khảo.
- Loại bỏ Staff role khỏi đề cương tham khảo; Owner kiêm nghiệp vụ quầy trong MVP.
- Không dùng React/Vite, Express, MongoDB schema cũ nguyên trạng; tech stack canonical theo quyết định mới.
- Khác đề cương tham khảo: AI result không cho Owner/PT xem; chỉ Member xem theo quyết định đã chốt.

## [Implementation] — 2026-09-24

- Rebuild API MongoDB, auth OWNER/PT/MEMBER, Trial/conversion, membership, assignment, owner-only booking, check-in/PT attendance độc lập, External PT Pass và sales/notification/audit.
- Thay UI legacy bằng ba vùng Expo Router theo SOT/ảnh hiện hành; thêm QR local và AI sessions SQLite/File System/OPFS.
- Bỏ pipeline upload video/workout plan; MediaPipe on-device và FastAPI strict JSON-only, chỉ issue squat depth đã implement/test.
- Bổ sung transaction/idempotency/concurrency checks, MongoDB integration, browser smoke, QR decoder verification và native pose module.
- Chi tiết implementation trong SOT 04/15/16/17/18; trạng thái verification và giới hạn trong 19/20. Không chuyển dữ liệu thật hoặc sửa .env cá nhân.
- Chuẩn hóa design pattern theo SOT 05: Owner mobile drawer, KPI hierarchy, Customer CRM master/detail, record picker có tìm kiếm, check-in progressive disclosure, empty state theo ngữ cảnh và AI step flow có xác nhận xóa.
- Hoàn thiện mobile/web CRM: token-driven components, semantic badges, web focus/hover, drawer backdrop, bottom tabs một hàng, customer mobile detail và đủ section CRM, booking nhóm theo ngày.

## [UI navigation] — 2026-09-29

- Thanh điều hướng dưới của PT/Member hiển thị icon và nhãn cho mục đang mở, chỉ icon cho mục còn lại; giữ tên đầy đủ cho trợ năng và vùng chạm 48px.

- Hoàn thiện icon mobile dễ nhận biết; form sửa booking điền sẵn lịch hiện tại; CRM Owner đọc nhật ký audit theo hồ sơ qua API Owner-only, không trả snapshot nhạy cảm.

## [Membership samples] — 2026-09-29

- Bổ sung 6 gói hội viên mẫu 15/30/45 buổi và 3/6/12 tháng với giá VNĐ gợi ý tham khảo thị trường; Owner có thể sửa giá trước khi cấp gói.
- Membership lưu `priceVnd` tùy chọn để giữ lịch sử giá, không thêm payment status/gateway; bản ghi cũ giữ nguyên. Cập nhật Prisma schema và cần chạy `prisma db push` cho database đích khi triển khai.

## [UI regression fixes] — 2026-10-07

- Giữ dữ liệu identity khi đổi mẫu gói conversion; khóa lựa chọn khi form pending.
- Sửa stepper AI theo phiên hiện tại và chống thao tác xóa lặp/cạnh tranh với import, phân tích.
- Thêm dấu chọn record picker, shortcut Home có vùng chạm 48px và chuẩn hóa token dùng lại ở UI/shell.
- Giữ nguyên API, quyền và business rules; bổ sung kiểm tra hồi quy workflow AI và UI.

## [AI web import feedback] — 2026-10-08

- Tái hiện video local lưu xong nhưng SQLite dev worker 404 với pnpm store ngoài workspace; thêm entry/rewrite worker nội bộ và khắc phục document `/` thiếu isolation trước đăng nhập.
- Thêm loading stage, thông báo lưu video thành công/hướng dẫn phân tích, kiểm tra môi trường local storage và timeout khởi tạo SQLite cùng cleanup connection tới muộn.
- Test hồi quy dev web và static export cho lưu video local, MediaPipe pose failure, thiếu headers, pending/cancel/delete; không đổi pipeline raw-video local-only.

## [AI angle comparison] — 2026-10-08

- Owner yêu cầu so sánh góc từ video, chọn Squat không tạ hai tay đưa trước. Thêm FR-AI-007 và báo cáo góc gối/thân/khuỷu/tay tại điểm thấp nhất từng lần trên web.
- Phân biệt mục tiêu tham chiếu app với tiêu chuẩn đã kiểm chứng; thân không có ngưỡng chung, cho nhập mục tiêu tùy chọn theo hướng dẫn PT. Điểm thiếu không kết luận đúng/sai.
- JSON local có detail v2, phiên cũ/native vẫn đọc kết quả độ sâu. Payload giải thích vẫn allowlist v1; không thay stack/provider hoặc gửi video/landmarks lên cloud.

## [AI mobile/web parity] — 2026-10-08

- Owner yêu cầu mở rộng báo cáo góc cho mobile và web. FR-AI-007 nay bao gồm Android/iOS Development Build.
- Native MediaPipe trả landmarks tối thiểu qua bridge local v2; JS/web dùng chung phép đo góc, chọn gối đủ rõ và thuật toán so sánh. Không gửi face landmarks/frame/video và không lưu raw landmarks trong kết quả.
- Guard binary native cũ/Expo Go, validate frame bridge và bỏ kết quả tới muộn sau cancel. Giao diện cùng report/input tham chiếu trên mobile/web; dữ liệu cũ không tự bịa góc.
- Cần rebuild/cài lại app native; SQLite/API/cloud contract không đổi, không thêm dependency/provider.
