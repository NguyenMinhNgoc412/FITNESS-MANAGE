# Đề xuất — Nhật ký tập luyện và lịch sử tiến bộ của Member

**Ngày:** 2026-10-28  
**Trạng thái:** Proposal lịch sử; Owner đã yêu cầu triển khai ngày 2026-10-28. Nguồn hiện hành: [SOT 21](../21-business-member-workout-sot.md); các câu đề xuất/chưa triển khai bên dưới giữ nguyên để lưu lịch sử.  
**Phạm vi:** Member tự ghi nhận hoạt động tập luyện, cân nặng, chiều cao và xem lịch sử thay đổi của mình trên mobile/web.

## 1. Mục tiêu

Giúp Member nhớ đã tập gì, ghi nhận số hiệp/lần/mức tạ và xem thay đổi qua thời gian. Dữ liệu do Member tự nhập, không phải kết quả được PT hay hệ thống xác nhận.

Luồng chính: **Tạo buổi tập → thêm bài và các hiệp → lưu nháp → hoàn tất → xem lịch sử/tiến bộ.** Có thể ghi sau khi tập; không yêu cầu ứng dụng luôn mở trong buổi tập.

Đợt đầu gồm nhật ký, lịch sử tiến bộ, theo dõi cân nặng/chiều cao và thư viện bài tập mẫu theo nhóm cơ theo yêu cầu bổ sung ngày 2026-10-28. Đồng hồ nghỉ, mục tiêu tuần, PT giao bài/giáo án, so sánh AI và chia sẻ dữ liệu chưa thuộc phạm vi này.

## 2. Boundary kế thừa SOT

- Giữ đúng ba role OWNER/PT/MEMBER; chỉ Owner quản lý booking và assignment theo FR-BOOK-002/003 và FR-PT-002.
- Nhật ký độc lập với check-in, booking, PT attendance và AI session/result. Không tự tạo/liên kết attendance, không consume/hoàn quota gói, Trial hoặc External PT Pass.
- Một Member có thể ghi nhiều buổi/ngày; giới hạn check-in một lượt/ngày của FR-CHECKIN-008 vẫn giữ nguyên.
- Không suy ra đến gym, PT có mặt, thời gian phục vụ hay chất lượng PT từ nhật ký.
- Không thêm AI sinh giáo án, chẩn đoán hoặc gợi ý mức tạ. Không tự lấy dữ liệu từ AI hoặc đính kèm video/ảnh vào nhật ký.
- Giữ baseline Expo/React Native Web, NestJS REST, Prisma và MongoDB; không thêm provider/dependency.

## 3. Quyền truy cập đề xuất

| Đối tượng | Quyền trong phần nhật ký |
|---|---|
| Member có tài khoản hoạt động | Tạo, đọc, sửa, hoàn tất, lưu trữ nhật ký của chính mình; xem tiến bộ của mình |
| Member khác | Không truy cập |
| PT, kể cả PT đang được assign | Không truy cập, không giao bài hoặc sửa dữ liệu |
| Owner | Không có màn/API đọc nội dung nhật ký cá nhân trong phạm vi đề xuất |
| Lead/Trial/External PT | Không có tài khoản để dùng chức năng |

Đề xuất cho phép Member còn tài khoản hoạt động dùng nhật ký kể cả gói đã hết hạn: chức năng này không cấp quyền vào gym. Đây là quyết định mới cần Owner review. Account bị khóa/ngừng hoạt động vẫn chịu auth policy hiện hành.

Server lấy member identity từ phiên đăng nhập; không nhận memberId do client chọn. Kiểm tra cả role và quyền sở hữu ở service boundary, không chỉ ẩn UI.

Cân nặng/chiều cao và lịch sử số đo áp dụng cùng quyền MEMBER self, chính sách tài khoản/gói và giới hạn log như nhật ký. Owner/PT không có API đọc số đo trong phạm vi đề xuất. Số đo lưu riêng, không tự ghi đè hồ sơ chính thức do Owner quản lý.

Thư viện là nội dung tham khảo chung, Member được đọc kể cả khi gói hết hạn nhưng account còn active. Đợt đầu không có API CRUD thư viện cho Member/PT/Owner; nội dung được review và phát hành qua seed có version trong repository. Việc kiểm duyệt nội dung không cấp quyền đọc nhật ký/số đo riêng tư.

## 4. Requirement dự kiến

Các ID sau chỉ là ID đề xuất; đưa vào SOT 02 khi phạm vi được chốt.

| ID | Requirement | Acceptance chính |
|---|---|---|
| FR-WORKOUT-001 | Member tạo và lưu nháp buổi tập của mình | Lưu thành công trả id/version; mở lại vẫn có dữ liệu; retry không tạo bản trùng |
| FR-WORKOUT-002 | Nhập bài tập và từng hiệp với số lần/mức tạ | Validation ở client và server; lỗi chỉ rõ trường; không mất nội dung form khi lưu lỗi |
| FR-WORKOUT-003 | Hoàn tất, sửa và lưu trữ buổi tập có lịch sử | Chỉ buổi hợp lệ mới hoàn tất; sửa/lưu trữ giữ revision trước; conflict không ghi đè |
| FR-WORKOUT-004 | Xem danh sách và chi tiết nhật ký theo thời gian | Phân trang, lọc khoảng ngày/trạng thái, sort ổn định; không giới hạn ở trang đầu |
| FR-WORKOUT-005 | Xem số buổi và tiến bộ theo bài | Chỉ tính buổi COMPLETED chưa lưu trữ; công thức rõ ràng; thiếu dữ liệu không được bịa điểm |
| FR-WORKOUT-006 | Bảo vệ dữ liệu cá nhân và tách nghiệp vụ | Chặn truy cập chéo tại server; mọi mutation nhật ký không đổi booking/check-in/quota/AI |
| FR-WORKOUT-007 | Member ghi cân nặng và/hoặc chiều cao theo ngày đo | Ít nhất một số đo hợp lệ; kg/cm rõ ràng; có thể ghi độc lập với buổi tập; retry không tạo bản trùng |
| FR-WORKOUT-008 | Xem lịch sử, biểu đồ và chênh lệch số đo | Mỗi chỉ số có ngày đo riêng, bỏ qua giá trị thiếu, không nội suy hoặc coi thiếu là 0; sửa/lưu trữ giữ revision và cập nhật biểu đồ |
| FR-WORKOUT-009 | Member tham khảo bài tập mẫu theo nhóm cơ | Có danh mục, tìm kiếm tên Việt/Anh, lọc nhóm cơ/dụng cụ, chi tiết và nguồn nội dung; chỉ bài PUBLISHED được đọc |
| FR-WORKOUT-010 | Chọn bài mẫu vào nhật ký, giữ định danh và nội dung lịch sử | Không tự điền hiệp/lần/tạ; catalog đổi tên/ngừng phát hành không sửa nhật ký cũ; không tự gộp bài tùy chỉnh với bài mẫu |

## 5. Dữ liệu nhập và validation đề xuất

Đợt đầu hỗ trợ bài ghi theo số lần, có hoặc không có mức tạ. Cardio theo quãng đường/thời gian và bài giữ tư thế chưa thuộc phạm vi.

| Trường | Quy tắc đề xuất |
|---|---|
| Ngày tập | Bắt buộc, YYYY-MM-DD theo ngày lịch UTC+7; không vượt ngày hiện tại ở server |
| Tên buổi | Tùy chọn, tối đa 100 ký tự sau trim |
| Ghi chú buổi | Tùy chọn, tối đa 1.000 ký tự; nhắc không nhập thông tin nhạy cảm không cần thiết |
| Tên bài | 1–100 ký tự sau trim; Member tự nhập hoặc chọn bài mẫu trong thư viện; áp dụng quy tắc định danh ở mục 7 |
| Danh sách bài | Nháp cho phép rỗng; hoàn tất cần ít nhất một bài; tối đa 30 bài/buổi |
| Danh sách hiệp | Mỗi bài tối đa 30 hiệp; hoàn tất cần ít nhất một hiệp/bài |
| Số lần mỗi hiệp | Số nguyên 1–1.000; cho phép chưa điền khi lưu nháp, bắt buộc khi hoàn tất |
| Mức tạ mỗi hiệp | Tùy chọn; kg, 0–1.000, tối đa hai chữ số thập phân; null là chưa ghi, 0 là chủ động ghi không dùng tạ ngoài |

Giới hạn số là giới hạn nhập liệu đề xuất, không phải khuyến nghị tập luyện. Với tạ đôi, Member ghi tổng tải ngoài của cả hai tay và giữ cùng cách ghi qua các buổi. Bài máy/biến thể khác nhau cần tên phân biệt để tránh so sánh sai. Không coi null là 0, không suy ra cân nặng cơ thể.

### Theo dõi cân nặng và chiều cao

Member mở mục Số đo cơ thể, chọn ngày đo và nhập cân nặng, chiều cao hoặc cả hai. Không cần có nhật ký buổi tập/check-in cùng ngày.

| Trường | Quy tắc đề xuất |
|---|---|
| Ngày đo (measurementDate) | Bắt buộc, YYYY-MM-DD theo UTC+7, không vượt ngày hiện tại ở server; cho nhập số đo quá khứ |
| Cân nặng (weightKg) | Tùy chọn, lớn hơn 0 và không quá 500 kg, tối đa hai chữ số thập phân |
| Chiều cao (heightCm) | Tùy chọn, lớn hơn 0 và không quá 300 cm, tối đa một chữ số thập phân |

Ít nhất một trong weightKg/heightCm khác null. Giới hạn trên là giới hạn kỹ thuật đề xuất, không phân loại sức khỏe. Trường bỏ trống là chưa đo, không phải 0; nhập 0, số âm, NaN/Infinity hoặc quá độ chính xác cho phép phải bị từ chối, không tự làm tròn. Không thêm BMI, phân loại thể trạng, mục tiêu tăng/giảm cân hoặc tư vấn dinh dưỡng ở đợt này.

Đề xuất tối đa một bản số đo ACTIVE/Member/ngày. Nếu ngày đó đã có bản ACTIVE, UI mở bản đang có để sửa; API tạo mới trả 409 MEASUREMENT_DATE_CONFLICT, không âm thầm overwrite. Hai request tạo đồng thời cùng ngày với key khác nhau chỉ một request thành công. Bản ARCHIVED không giữ ngày đo; có thể tạo bản mới ngày đó, bản cũ vẫn còn lịch sử.

Số đo không có trạng thái nháp/hoàn tất: tạo hợp lệ thành ACTIVE, được sửa hoặc chuyển ARCHIVED. Ngày đo bất biến sau tạo; nếu chọn nhầm ngày, lưu trữ bản sai và tạo bản mới. PATCH gửi đầy đủ weightKg và heightCm (nullable) để tránh xóa nhầm số đo không hiển thị trong form, đồng thời gửi expectedVersion. Muốn thêm chiều cao vào ngày đã ghi cân nặng phải giữ cân nặng cũ trong payload; bỏ một số đo bằng null cần thao tác explicit và không được làm cả hai null.

Mỗi lần tạo/sửa/lưu trữ số đo có revision riêng trong cùng transaction với bản mới nhất và Command. Áp dụng Idempotency-Key, expectedVersion, replay, conflict, pending, lưu online và giữ form khi lỗi như mục 6. Không sửa/phục hồi ARCHIVED, không hard-delete; số đo/revision không được đưa vào audit chung Owner xem được hoặc standard logs.

## 6. Lifecycle và chống mất dữ liệu

- Tạo mới thành DRAFT. Lưu nháp là thao tác explicit; UI chỉ báo đã lưu sau server xác nhận. Rời form có thay đổi chưa lưu phải cảnh báo.
- DRAFT → COMPLETED khi tất cả bài/hiệp đủ dữ liệu hợp lệ. Ngày tập là ngày Member nhập; completedAt là thời điểm server ghi nhận, không dùng thay ngày tập.
- Cho phép sửa DRAFT hoặc COMPLETED. Sửa COMPLETED vẫn phải thỏa validation hoàn tất, giữ trạng thái và ghi revision mới. Không có reopen hoặc tự đổi thành nháp.
- DRAFT/COMPLETED → ARCHIVED bằng thao tác xác nhận. Giữ nội dung, trạng thái trước lưu trữ và revisions; không hard-delete. Đợt đầu không phục hồi hoặc sửa bản ARCHIVED.
- Buổi ARCHIVED chỉ xuất hiện khi chọn bộ lọc lưu trữ, không tham gia thống kê. Nhật ký không phải cơ chế xóa toàn bộ dữ liệu cá nhân; quy trình purge/retention ngoài phạm vi đề xuất.
- Mỗi mutation dùng Idempotency-Key và payload fingerprint theo cơ chế Command hiện có; cùng key/cùng payload replay kết quả, key bị dùng với payload khác trả conflict.
- Update/complete/archive gửi expectedVersion; service kiểm tra và ghi atomically cùng revision/Command. Hai thiết bị cùng sửa một version chỉ một request thành công, request còn lại nhận 409 CONCURRENT_CHANGE.
- UI giữ bản nhập khi conflict, yêu cầu tải bản mới để đối chiếu; không tự merge hoặc tự retry ghi đè. Retry sau mất response giữ nguyên key/payload của thao tác cũ.
- Đợt đầu lưu online qua REST; không hứa hẹn đồng bộ offline. Khi mất mạng báo chưa lưu, giữ form trong phiên đang mở; đóng app có thể mất phần chưa lưu. Dữ liệu cache phải tách theo account và xóa khỏi màn hình khi logout/đổi account.

## 7. Lịch sử và công thức tiến bộ

Danh sách sắp ngày tập giảm dần, sau đó id giảm dần; 20 buổi/trang. Lọc trước phân trang, đổi bộ lọc về trang đầu. Dùng khoảng ngày gồm cả hai đầu theo UTC+7; khoảng tối đa 366 ngày/lần. Trang không có kết quả có empty state.

Đề xuất nhóm bài tùy chỉnh theo tên đã trim, gộp khoảng trắng liên tiếp và lowercase; giữ dấu tiếng Việt, không tự gộp từ đồng nghĩa. Ví dụ “Squat” và “ squat ” chung nhóm; “Squat” và “Goblet squat” khác nhóm. Bài được chọn từ thư viện nhóm theo catalogExerciseId ổn định, tách khỏi nhóm bài tùy chỉnh ngay cả khi trùng tên. Không tự nhận diện biến thể hoặc map nhật ký cũ vào catalog bằng tên. Khi đổi tên bài tùy chỉnh, dữ liệu hiện tại chuyển nhóm; với bài mẫu tên được lấy từ snapshot server, không cho PATCH tên tùy ý. Muốn ghi biến thể riêng, Member chọn bài khác hoặc thêm bài tùy chỉnh.

Chỉ đọc bản mới nhất của buổi COMPLETED chưa lưu trữ trong khoảng ngày:

- **Số buổi:** số nhật ký thỏa điều kiện; hai buổi cùng ngày đếm hai. Nhãn phải ghi “buổi đã ghi nhật ký”, không gọi là số lượt đến gym.
- **Số lần theo bài/ngày:** tổng reps của các hiệp thuộc nhóm bài đó, kể cả khi thiếu mức tạ. Gộp mọi lần xuất hiện của bài trong ngày.
- **Mức tạ cao nhất theo bài/ngày:** max của các weightKg được ghi explicit. Nếu tất cả null thì không có điểm tạ; giá trị 0 vẫn là dữ liệu hợp lệ.
- **Số buổi theo tuần/tháng:** tuần từ thứ Hai đến Chủ nhật, tháng theo lịch UTC+7; bucket trong khoảng lọc không có buổi hiển thị 0, bucket đầu/cuối chỉ tính phần giao khoảng lọc.
- Ngày không có bài không thêm điểm 0 vào biểu đồ reps/tạ. Một ngày có một điểm chỉ chứng minh giá trị tự ghi ngày đó; không suy ra sức mạnh, tiến bộ kỹ thuật hay mức tạ nên tập tiếp.
- Sửa/lưu trữ buổi hoàn tất phải làm mới thống kê từ nguồn canonical; không cộng dồn lại revisions. Quy tắc đổi tên và nhóm theo định danh ở đoạn trên; revision cũ vẫn giữ snapshot cũ.

### Thư viện bài tập mẫu theo nhóm cơ

Luồng: **Mở Bài tập mẫu → chọn nhóm cơ hoặc tìm tên → đọc chi tiết → tùy chọn thêm vào buổi nháp.** Đọc bài không yêu cầu tạo nhật ký. Nếu chưa có buổi nháp được chọn, CTA dẫn tới chọn/tạo buổi nháp; chỉ ghi khi Member bấm lưu. Không tự sửa buổi COMPLETED, không tự thêm bài vào lịch/booking.

Danh mục khởi đầu đề xuất gồm 10 nhóm, mỗi nhóm ít nhất hai bài. Đây là danh sách ứng viên để biên soạn và review trước khi PUBLISHED; không phải giáo án hoặc khuyến nghị Member phải tập tất cả bài. Nhóm bên dưới phục vụ điều hướng, không khẳng định bài chỉ tác động một cơ.

| Nhóm chính / code | Bài mẫu đề xuất | Dụng cụ |
|---|---|---|
| Ngực / CHEST | Chống đẩy (Push-up); Đẩy ngực tạ đôi trên ghế phẳng (Dumbbell bench press) | Không dụng cụ; tạ đôi và ghế |
| Lưng / BACK | Kéo xô máy (Lat pulldown); Kéo tạ đôi một tay (One-arm dumbbell row) | Máy cáp; tạ đôi và ghế |
| Vai / SHOULDERS | Đẩy vai tạ đôi ngồi (Seated dumbbell shoulder press); Nâng tạ ngang (Dumbbell lateral raise) | Tạ đôi và ghế; tạ đôi |
| Tay trước / BICEPS | Cuốn tay tạ đôi (Dumbbell biceps curl); Cuốn tạ búa (Hammer curl) | Tạ đôi |
| Tay sau / TRICEPS | Duỗi tay cáp (Cable triceps pushdown); Duỗi tay sau đầu với tạ đôi (Dumbbell overhead triceps extension) | Máy cáp; tạ đôi |
| Đùi trước / QUADRICEPS | Squat không tạ (Bodyweight squat); Duỗi chân máy (Leg extension) | Không dụng cụ; máy duỗi chân |
| Đùi sau / HAMSTRINGS | Romanian deadlift với tạ đôi (Dumbbell Romanian deadlift); Gập chân máy (Leg curl) | Tạ đôi; máy gập chân |
| Mông / GLUTES | Nâng hông nằm (Glute bridge); Đẩy hông với tạ đòn (Barbell hip thrust) | Không dụng cụ; tạ đòn và ghế |
| Bắp chân / CALVES | Nhón gót đứng (Standing calf raise); Nhón gót ngồi máy (Seated calf raise) | Không dụng cụ; máy bắp chân |
| Bụng/thân giữa / CORE | Gập bụng (Crunch); Dead bug | Không dụng cụ |

Tổng baseline đề xuất là **10 nhóm, 20 bài**, mỗi nhóm ít nhất hai bài PUBLISHED trước khi phát hành đủ baseline. Các bài giữ thời gian như Plank chưa thêm ở đợt này để khớp nhật ký ghi theo reps.

Mỗi bài có code/id ổn định, tên Việt/Anh và aliases, nhóm chính và các nhóm phụ (có thể rỗng), dụng cụ, mô tả ngắn, các bước thực hiện, lưu ý kỹ thuật, nguồn tham khảo và version nội dung. Hướng dẫn cần được biên soạn/review trước khi publish; danh sách tên trong proposal chưa tương đương hướng dẫn đã kiểm duyệt. Không mặc định bài phù hợp mọi Member hoặc tự gán độ khó khi chưa review.

Tham khảo cấu trúc phân loại nhóm cơ/dụng cụ và nội dung hướng dẫn từ [ACE Exercise Library](https://www.acefitness.org/resources/everyone/exercise-library/) (đối chiếu ngày 2026-10-28). Bảng bài trên là lựa chọn sản phẩm đề xuất, không phải giáo án của ACE hoặc xác nhận từng bài đã được ACE duyệt cho app. Khi biên soạn cần sourceUrl cụ thể cho từng bài; tự viết nội dung ngắn, không sao chép nguyên văn hoặc lấy ảnh/video chưa có quyền sử dụng. Đợt đầu dùng văn bản, chưa tích hợp media/provider ngoài.

Catalog có DRAFT/PUBLISHED/ARCHIVED và contentVersion. Chỉ PUBLISHED hiện trên API đọc Member; version đã publish phải giữ bất biến để tra cứu snapshot, lần chỉnh nội dung tạo version mới. Đổi tên/ngừng phát hành không xóa id hoặc viết lại nhật ký. Nội dung draft không có API cho Member truy cập trực tiếp.

Tìm kiếm tên Việt/Anh/aliases không phân biệt hoa thường hoặc dấu tiếng Việt; lọc nhóm khớp nhóm chính hoặc nhóm phụ, lọc dụng cụ theo code cố định. Kết hợp query theo AND, nhóm hoặc dụng cụ rỗng nghĩa là không lọc. Phân trang 20 bài, sort nameVi rồi id ổn định. Query q tối đa 100 ký tự; group/equipment ngoài enum hoặc page sai trả 400. Không có kết quả hiển thị hướng dẫn đổi bộ lọc, không tự sinh bài tập.

Khi thêm bài mẫu vào nhật ký, client gửi catalogExerciseId/contentVersion đã xem; server xác thực PUBLISHED và version hiện hành rồi chụp tên/nhóm/dụng cụ/version vào entry. Nếu catalog thay đổi giữa lúc xem và lưu, trả 409 CATALOG_VERSION_CONFLICT và giữ form để Member tải lại, xác nhận trước khi lưu. Mỗi entry có id riêng; cùng bài mẫu xuất hiện nhiều lần vẫn nhóm chung catalogExerciseId trong thống kê. Không copy số hiệp/reps/tạ hay gợi ý tải từ catalog.

Khi sửa một buổi đã lưu, entry mẫu giữ nguyên id/catalogExerciseId/contentVersion/snapshot cũ và chỉ sửa sets/order; server lấy metadata đã lưu thay vì tin snapshot client. Entry mới hoặc thay bài phải validate catalog hiện hành. Bài đã ARCHIVED vẫn đọc được từ snapshot nhật ký cũ và sửa hiệp được; không thêm mới từ catalog ARCHIVED. Muốn dùng tên riêng có thể tạo entry CUSTOM độc lập, không giả mạo catalog id. Bài có trong thư viện không đồng nghĩa AI đã hỗ trợ nhận diện/phân tích bài đó.

Ví dụ kiểm thử giả: một ngày có Squat với hai hiệp 10 lần/20 kg và 8 lần/25 kg, cùng một hiệp 12 lần chưa ghi tạ. Kết quả ngày đó: 30 lần, tạ cao nhất 25 kg. Không tính mức tạ trung bình hoặc khối lượng từ hiệp thiếu tạ. Buổi nháp cùng ngày không làm tăng các chỉ số.

### Lịch sử và biểu đồ số đo cơ thể

- Danh sách số đo có phân trang 20 bản/trang, lọc ngày/trạng thái trước phân trang; mặc định ACTIVE, 30 ngày gần nhất, tối đa 366 ngày/lần, sort measurementDate giảm dần rồi id giảm dần. Cho chọn khoảng cũ để xem lịch sử trước 366 ngày gần nhất.
- Vẽ hai chuỗi riêng theo ngày đo tăng dần: cân nặng (kg) và chiều cao (cm). Chỉ dùng bản ACTIVE mới nhất, không cộng revisions hoặc bản lưu trữ; không trộn hai đơn vị trên cùng một trục.
- Mỗi chuỗi chỉ có điểm khi chỉ số đó được nhập. Không điền 0, không nối thành dữ liệu đo giả ở ngày thiếu, không tự mang chiều cao/cân nặng cũ sang ngày đo mới.
- Thẻ tổng quan trả số đo gần nhất của từng chỉ số trong khoảng lọc kèm ngày đo tương ứng. Hai chỉ số có thể có ngày gần nhất khác nhau; khoảng không có số đo trả null/“Chưa có dữ liệu”.
- Chênh lệch mỗi chỉ số = giá trị có ngày mới nhất trừ giá trị có ngày sớm nhất trong khoảng lọc; hiển thị cả hai ngày và đơn vị, dùng độ chính xác của trường. Chỉ có một điểm thì hiển thị “Chưa đủ dữ liệu so sánh”; hai điểm bằng nhau trả 0. Không dùng trung bình, không tự đánh giá tăng/giảm là tốt hoặc xấu.
- Sau sửa/lưu trữ phải tính lại từ dữ liệu ACTIVE. Không tính BMI hoặc suy ra thay đổi sức khỏe, cơ/mỡ hay hiệu quả của PT từ các số đo tự nhập.

Ví dụ kiểm thử giả: ngày 01 ghi 70 kg và 170 cm; ngày 10 chỉ ghi 69,5 kg. Tổng quan trong khoảng này là 69,5 kg (ngày 10) và 170 cm (ngày 01); chênh lệch cân nặng -0,5 kg, chiều cao chưa đủ dữ liệu so sánh. Nếu lưu trữ ngày 10, cân nặng gần nhất trở lại 70 kg và không còn đủ hai điểm để so sánh.

## 8. Hợp đồng dữ liệu/API dự kiến

Phần này là thiết kế đề xuất, chưa tạo collection, schema hoặc endpoint thực tế. Tên field cuối cùng phải theo naming của implementation hiện hành.

MongoDB giữ canonical business data:

- `workout_sessions`: id, memberId, workoutDate, title, note, status, statusBeforeArchive, exercises, version, createdAt, updatedAt, completedAt, archivedAt.
- `exercises`: id ổn định trong buổi, source CUSTOM/CATALOG, displayName, normalizedName, order, sets; CATALOG thêm catalogExerciseId/contentVersion/catalogSnapshot (tên/nhóm/dụng cụ). CUSTOM không nhận catalog metadata. Mỗi set có id, order, reps nullable, weightKg nullable. Không dùng id exercise trong buổi như id catalog toàn hệ thống.
- `workout_session_revisions`: sessionId, memberId, version, action, actorId, recordedAt và snapshot nội dung cần khôi phục lịch sử. Unique (sessionId, version). Snapshot riêng tư không đi vào standard logs hoặc audit Owner xem được.
- Index dự kiến: (memberId, status, workoutDate, id) cho danh sách; (memberId, sessionId, version) cho revisions. Không tạo summary cache canonical riêng ở đợt đầu.
- `body_measurements`: id, memberId, measurementDate, weightKg nullable, heightCm nullable, status ACTIVE/ARCHIVED, version, createdAt, updatedAt, archivedAt. Ngày đo là business date UTC+7, timestamps lưu thời điểm server. Số thập phân phải có biểu diễn/serialization nhất quán (có thể dùng số nguyên theo đơn vị 0,01 kg và 0,1 cm trong storage); không để sai số floating point tạo chênh lệch giả.
- `body_measurement_revisions`: measurementId, memberId, version, action, actorId, recordedAt và snapshot số đo riêng tư; unique (measurementId, version). Index đọc (memberId, measurementId, version); danh sách (memberId, status, measurementDate, id). Partial unique (memberId, measurementDate) khi status=ACTIVE qua db:indexes; service kiểm tra và map duplicate-key thành MEASUREMENT_DATE_CONFLICT. Không backfill từ profile hoặc dữ liệu AI.
- `exercise_catalog`: id, code unique ổn định, status, currentPublishedVersion; `exercise_catalog_versions`: catalogExerciseId, contentVersion, nameVi/nameEn/aliases, primaryMuscleGroup/secondaryMuscleGroups, equipmentCodes, description, steps, techniqueNotes, sourceUrls, reviewedAt, publishedAt. Unique (catalogExerciseId, contentVersion), index status/nameVi/id và nhóm/dụng cụ phù hợp bộ lọc; tìm kiếm bằng field normalized đã chuẩn hóa, không dùng input người dùng làm raw regex. Seed upsert idempotent theo code/version, không reset status/version cũ hoặc hard-delete bài đã có lịch sử; thay nội dung published phải tạo version mới. Quy trình review người phụ trách nội dung trước publish, không thêm role đăng nhập mới.

| Method và path dưới `/api/v1` | Nội dung |
|---|---|
| POST `/members/me/workouts` | Tạo DRAFT; Idempotency-Key; body ngày/tên/ghi chú/bài |
| GET `/members/me/workouts?from=&to=&status=&page=` | Danh sách phân trang; mặc định DRAFT và COMPLETED, 30 ngày gần nhất gồm hôm nay; status nhận DRAFT/COMPLETED/ARCHIVED hoặc ALL |
| GET `/members/me/workouts/:id` | Chi tiết và version mới nhất |
| PATCH `/members/me/workouts/:id` | Sửa nội dung với expectedVersion; không cho client tự set status/memberId/timestamps |
| POST `/members/me/workouts/:id/complete` | Hoàn tất với expectedVersion; cần lưu các thay đổi nội dung thành công trước |
| POST `/members/me/workouts/:id/archive` | Lưu trữ với expectedVersion |
| GET `/members/me/workouts/:id/revisions?page=` | Lịch sử sửa của chính Member; 20 revisions/trang, version giảm dần |
| GET `/members/me/workout-progress?from=&to=&exerciseName=&catalogExerciseId=&groupBy=` | Tổng số buổi, buckets tuần/tháng và chuỗi reps/tạ; exerciseName chỉ lọc CUSTOM, catalogExerciseId chỉ lọc CATALOG; không gửi đồng thời hai bộ lọc; groupBy=week hoặc month |
| POST `/members/me/body-measurements` | Tạo ACTIVE; body measurementDate, weightKg/heightCm tùy chọn; Idempotency-Key |
| GET `/members/me/body-measurements?from=&to=&status=&page=` | Danh sách số đo; status ACTIVE/ARCHIVED/ALL, mặc định ACTIVE |
| GET `/members/me/body-measurements/:id` | Chi tiết và version của bản số đo |
| PATCH `/members/me/body-measurements/:id` | Body expectedVersion, weightKg, heightCm; không sửa ngày đo/memberId/status |
| POST `/members/me/body-measurements/:id/archive` | Lưu trữ với expectedVersion và Idempotency-Key |
| GET `/members/me/body-measurements/:id/revisions?page=` | Revisions riêng tư, 20 bản/trang, version giảm dần |
| GET `/members/me/body-measurement-progress?from=&to=` | Hai chuỗi điểm theo ngày, latest và delta riêng từng chỉ số kèm ngày đầu/cuối; không nhận groupBy |
| GET `/exercise-library?muscleGroup=&equipment=&q=&page=` | MEMBER đọc danh sách PUBLISHED, 20 bài/trang, envelope items/page/pageSize/total |
| GET `/exercise-library/:id` | MEMBER đọc version PUBLISHED hiện hành và nguồn; id draft/archived/không tồn tại trả 404 |

Hai endpoint thư viện là read-only cho MEMBER, 401 khi chưa đăng nhập/403 cho OWNER/PT theo phạm vi đợt đầu. Không nhận memberId, không trả dữ liệu nhật ký/số đo hoặc trường review nội bộ. Chọn bài dùng mutation nhật ký hiện có, không có endpoint tự tạo buổi/booking. Nếu không lọc bài, progress trả danh sách chuỗi theo groupKey `catalog:<id>` hoặc `custom:<normalizedName>`, không gộp hai nguồn; labels dùng snapshot trong khoảng lọc, nhóm catalog không đổi khi tên catalog đổi. Khi catalogExerciseId đã archived nhưng có nhật ký self, vẫn lọc lịch sử được mà không mở API catalog archived.

Các API số đo áp dụng auth/error/envelope, ngày mặc định, giới hạn khoảng và transaction như nhật ký. Mọi mutation, gồm PATCH, bắt buộc Idempotency-Key. Progress số đo trả `{from,to,timeZone,weight:{unit,points,latest,comparison},height:{unit,points,latest,comparison}}`; points gồm date/value, latest nullable gồm date/value, comparison nullable gồm firstDate,lastDate,delta. Không đủ hai điểm thì comparison=null. Tạo trùng ngày ACTIVE trả 409 MEASUREMENT_DATE_CONFLICT; mutation bản ARCHIVED trả 409 MEASUREMENT_STATE_CONFLICT. Route progress là resource riêng để tránh bị route `:id` bắt nhầm.

Progress dùng mặc định cùng khoảng 30 ngày và giới hạn 366 ngày như danh sách; exerciseName áp dụng cùng quy tắc chuẩn hóa tên. Query/body strict allowlist, giới hạn kích thước theo số bài/hiệp; malformed id/date/page trả 400. Response danh sách `{items,page,pageSize,total}`, progress trả khoảng lọc, múi giờ UTC+7, định nghĩa metric và dữ liệu đã tổng hợp. Revision cũng theo envelope phân trang.

Tất cả API chỉ MEMBER self; chưa đăng nhập 401, OWNER/PT gọi 403. Member truy cập id không tồn tại hoặc thuộc người khác đều 404, không lộ sự tồn tại dữ liệu. Lỗi input 400 INVALID_INPUT; stale version 409 CONCURRENT_CHANGE; sai lifecycle 409 WORKOUT_STATE_CONFLICT; reuse key khác payload 409 IDEMPOTENCY_CONFLICT. Mã mới phải đối chiếu implementation Command trước khi chốt SOT 16; lỗi không echo nội dung riêng tư hoặc stack.

Khi triển khai mới cập nhật Prisma, generate/validate và rollout `db:push`/`db:indexes` theo công cụ MongoDB hiện có; không dùng Prisma migrate cho MongoDB. Không backfill nhật ký từ check-in/booking/AI. Transaction phải bao gồm bản mới nhất, revision và kết quả idempotency, không ghi lịch sử thành công nếu mutation rollback.

## 9. Yêu cầu trải nghiệm

Đề xuất lối vào “Hoạt động tập luyện” từ Home Member, gồm Nhật ký và Tiến bộ; không thêm tab chính ở đợt đầu. Đây là mô tả chức năng, chưa phải bản thiết kế giao diện; khi thiết kế cần đối chiếu SOT 05 và ảnh Home Member canonical.

Bổ sung mục “Số đo cơ thể” trong cùng surface: form ngày đo/cân nặng/chiều cao, lịch sử số đo, hai biểu đồ và thẻ số đo gần nhất có ngày. Nhãn “Cân nặng cơ thể (kg)” phải phân biệt với “Mức tạ (kg)” của hiệp tập. Trùng ngày dẫn tới sửa bản đang có; xác nhận lưu trữ nêu rõ bản sẽ không còn tham gia biểu đồ. Áp dụng loading/empty/error/success/permission, pending disable, bảng dữ liệu thay thế biểu đồ và cảnh báo chưa lưu như nhật ký.

Bổ sung “Bài tập mẫu”: nhóm cơ, tìm kiếm tên, lọc dụng cụ, danh sách và chi tiết; CTA “Thêm vào buổi nháp” không tự chọn mức tạ/hiệp/lần. Có loading/empty/error/retry/permission, phân trang và giữ lựa chọn khi lỗi version; tên/nguồn nội dung dễ đọc, trạng thái không chỉ dựa vào màu. Member vẫn có thể nhập bài tùy chỉnh khi không tìm thấy bài phù hợp trong catalog.

- Form hiển thị đơn vị kg và hướng dẫn cách ghi tải, phân biệt chưa nhập tạ và 0 kg; thêm/xóa bài/hiệp trong form chưa lưu không phải xóa lịch sử đã lưu.
- Lưu nháp/hoàn tất có pending disable để chống double-submit, success chỉ sau response thành công.
- Loading, empty, error/retry, permission/account hết phiên có trạng thái rõ. Không dùng dữ liệu account cũ khi request trả về muộn.
- Biểu đồ kèm bảng giá trị/ngày/đơn vị để đọc được trên mobile/web và không chỉ dựa vào màu. Chưa có dữ liệu hiển thị hướng dẫn ghi nhật ký, không vẽ điểm tiến bộ giả.
- Buổi đã sửa/lưu trữ có nhãn rõ; Member mở được lịch sử phiên bản. Mất mạng và conflict cần thông báo phần chưa lưu.

## 10. Ma trận nghiệm thu dự kiến

Các ca dưới đây là kế hoạch kiểm thử, **chưa được chạy**.

| Ca | Requirement | Kết quả cần chứng minh |
|---|---|---|
| Tạo nháp rỗng, thêm bài và hoàn tất | 001–003 | Nháp lưu được; chỉ complete khi có bài/hiệp hợp lệ |
| Reps âm/lẻ/0, tạ âm, null/0, tên rỗng, quá giới hạn | 002 | Server validation đúng; null không thành 0; không lưu một phần |
| Retry cùng key, hai request đồng thời, mất response sau commit | 001/003 | Một mutation/revision; replay đúng; không có buổi trùng |
| Hai thiết bị sửa cùng version; complete đua với archive | 003 | Một bên thắng, bên kia conflict; không mất revision hoặc đổi sai lifecycle |
| Sửa/lưu trữ COMPLETED, sửa ARCHIVED | 003/005 | Giữ lịch sử; thống kê cập nhật; chặn sửa bản lưu trữ |
| Lịch sử vượt 20 buổi/revisions, lọc rồi chuyển trang | 004 | Đọc được đủ dữ liệu, sort/tie-break ổn định, lọc trước phân trang |
| Nhiều buổi/ngày, nhiều lần cùng bài, tên khác cách viết/biến thể | 005 | Đếm buổi và nhóm tên đúng quy tắc; không gộp nhầm biến thể |
| Ngày UTC+7, cuối tuần/tháng/năm, năm nhuận, bucket rỗng | 004/005 | Đúng ngày tập, biên khoảng, tuần thứ Hai và zero fill số buổi |
| Fixture 30 reps/25 kg; mọi hiệp thiếu tạ; chỉ một điểm | 005 | Đúng công thức; không bịa điểm tạ hoặc kết luận tiến bộ |
| OWNER/PT, Member khác, token hết hạn/account khóa | 006 | Chặn ở HTTP và service, không lộ nội dung hoặc existence |
| Hết gói nhưng account active; tạo nhiều nhật ký/ngày | 006 | Theo chính sách đề xuất, không đổi quyền vào gym hoặc quota |
| So sánh DB trước/sau mọi mutation nhật ký | 006 | Booking/check-in/attendance/gói/pass/AI không bị thay đổi |
| Pending, retry, offline, account switch, response muộn | 001/004/006 | Không double-submit, không báo lưu sai, không lộ account cũ |
| Standard logs, generic audit, network payload | 006 | Không log nội dung nhật ký/token/PII; không truyền raw AI media |
| Ghi chỉ cân nặng, chỉ chiều cao, cả hai; không có nhật ký/check-in | 007 | Tạo ACTIVE độc lập; thiếu cả hai bị chặn |
| 0/âm/quá giới hạn, NaN/Infinity, sai độ chính xác, ngày tương lai | 007 | Client/server từ chối; đơn vị và lỗi rõ; không tự làm tròn |
| Tạo cùng ngày khác key đồng thời; replay key sau mất response | 007/008 | Một ACTIVE/ngày; conflict rõ; replay không tạo revision trùng |
| Bổ sung chiều cao giữ cân nặng; stale version; sửa ngày đo | 007/008 | PATCH explicit hai trường, không mất số đo; stale conflict; không sửa ngày đo |
| Lưu trữ rồi tạo lại ngày đó; sửa/lưu trữ đua nhau | 008 | Giữ revisions; bản ARCHIVED không giữ ngày; atomic lifecycle/version |
| Fixture 70 → 69,5 kg; chiều cao thiếu; sửa/lưu trữ điểm cuối | 008 | Delta -0,5 kg; latest có ngày riêng; không carry-forward/zero fill; tính lại đúng |
| 0/1/2 điểm, hai điểm bằng nhau, thứ tự ngày nhập khác ngày đo | 008 | Thiếu dữ liệu trả null; delta=0 khi bằng nhau; sort theo ngày đo |
| Quá 20 số đo/revisions, ngày biên UTC+7, khoảng cũ, account switch | 007/008 | Phân trang/filter đúng, không lộ dữ liệu account cũ |
| Owner/PT/Member khác đọc số đo/revisions/progress; kiểm tra logs/DB | 006–008 | Server chặn; không ghi số đo vào log/audit chung; không đổi profile/quota/booking/AI |
| Seed baseline, chạy seed lần hai, bài DRAFT/ARCHIVED | 009 | Có 10 nhóm/20 bài đã review trước publish; không tạo trùng/reset lịch sử; API chỉ trả PUBLISHED |
| Tìm Việt không dấu/Anh/aliases, lọc nhóm phụ + dụng cụ, quá 20 bài | 009 | AND filter trước phân trang, sort ổn định, empty/error đúng; query invalid bị chặn |
| Thêm bài mẫu vào nháp, chưa chọn nháp, catalog thay version | 010 | Chỉ ghi khi lưu; không tự điền reps/tạ hoặc sửa COMPLETED; conflict giữ form |
| Catalog đổi tên/archive; sửa hiệp entry cũ; metadata client giả | 010 | Snapshot/revisions không đổi; server giữ metadata cũ; chỉ entry mới cần PUBLISHED |
| CUSTOM trùng tên CATALOG, catalog đổi tên, cùng bài nhiều entry | 005/010 | Nhóm riêng theo source/id; catalog đổi tên không tách chuỗi; không map dữ liệu cũ bằng tên |
| Truy cập trái quyền thư viện và payload nhật ký gắn catalog giả | 006/009/010 | Server enforce role/version/allowlist; không mở quyền xem nhật ký/số đo hoặc AI |

Khi triển khai: chạy unit domain cho validation/lifecycle/aggregation, HTTP RBAC và integration MongoDB replica set riêng cho concurrency/rollback/idempotency; app test và browser/native phù hợp cho form/trạng thái. Lint/build/typecheck theo repository. Không dùng database nghiệp vụ hoặc fixture người thật. Không coi test mock là xác minh concurrency MongoDB.

## 11. Quyết định cần review và tài liệu cập nhật sau khi chốt

Owner cần review các lựa chọn được đề xuất ở trên: chỉ Member xem nội dung; dùng được khi gói hết hạn; lifecycle cho phép sửa có revision và lưu trữ thay hard-delete; tên bài tự nhập; cách ghi tổng tải; công thức tiến bộ; chỉ lưu online. Các lựa chọn này chưa được xem là SOT đã duyệt.

Owner đã yêu cầu bổ sung theo dõi cân nặng/chiều cao. Chi tiết một bản ACTIVE/ngày, đơn vị/giới hạn, sửa có revision, lưu trữ và cách so sánh là thiết kế đề xuất trong tài liệu; chưa tự chuyển thành SOT canonical. Chưa mở rộng BMI, dinh dưỡng hoặc quyền PT xem số đo.

Owner đã yêu cầu thêm bài mẫu theo nhóm cơ. Đề xuất baseline 10 nhóm/20 bài, seed có version, review nội dung trước publish, Member đọc và chọn bài vào nhật ký. Hướng dẫn chi tiết từng bài và nguồn cụ thể chưa được biên soạn/kiểm duyệt trong task tài liệu này; không coi danh sách ứng viên là nội dung sẵn sàng phát hành. Không thêm CRUD thư viện trong app, giáo án, media hay mở rộng danh sách AI hỗ trợ.

Sau khi chốt, cập nhật theo đúng nơi sở hữu quyết định:

| Tài liệu | Nội dung cần bổ sung |
|---|---|
| SOT 01/02 | Phạm vi Member nhật ký/tiến bộ/số đo cơ thể/thư viện bài và FR-WORKOUT-001–010 |
| SOT business mới | Chuyển nghiệp vụ đã chốt từ đề xuất thành canonical, đăng ký trong README |
| SOT 03 | Module workout-journal; ownership MongoDB; tách check-in/AI |
| SOT 05/06 | Surface Member, trạng thái UI, quyền self và hạn chế Owner/PT |
| SOT 15/16/17 | Schema/index/revisions, REST contract, transaction/idempotency/quyền sở hữu và log privacy |
| SOT 20 | Acceptance matrix và kết quả kiểm thử thực tế khi có implementation |
| CHANGELOG | Ghi quyết định đã duyệt, tách khỏi mốc viết proposal |

Không cần đổi SOT 04 hoặc thêm dependency theo thiết kế đề xuất hiện tại. Task viết tài liệu này chưa tạo API, schema, migration, giao diện hoặc test tự động cho feature.
