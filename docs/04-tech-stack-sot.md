# FITNESS-MANAGE SOT 04 — Tech Stack

**Trạng thái:** Tech stack đã khóa

---

## 1. Client

- React Native
- Expo
- TypeScript
- React Native Web dùng cùng codebase Expo
- Expo Router
- Zustand
- React Hook Form
- Zod
- Axios
- `expo-sqlite`
- `expo-file-system`

## 2. Backend

- NestJS + TypeScript
- REST API
- JWT Access Token + Refresh Token
- Prisma

## 3. Server database

- MongoDB
- MongoDB Atlas Free Tier ưu tiên cho MVP

MongoDB là source-of-truth cho business data toàn hệ thống.

## 4. Local database

- SQLite thông qua `expo-sqlite`

SQLite dùng cho:

- local AI sessions/results;
- URI file local;
- cache đọc nếu cần offline;
- pending sync metadata nếu có.

SQLite **không** là server database và không thay MongoDB.

## 5. Storage

- Supabase Storage cho cloud file được phép lưu.

Không dùng Supabase Auth, Supabase Realtime hoặc Edge Functions trong baseline.

Raw AI workout video **không** được upload Supabase Storage.

## 6. AI

- On-device: MediaPipe Pose
- Python + FastAPI cho AI service
- OpenCV cho xử lý/prototype/tooling phù hợp
- OpenAI API nhận structured JSON/metrics, không nhận raw workout video

### AI routing bắt buộc

```text
Video local
 -> on-device pose/metrics
 -> structured JSON
 -> FastAPI
 -> OpenAI API nếu cần
 -> structured feedback
```

Nếu việc tích hợp MediaPipe Pose vào Expo yêu cầu Development Build/custom native integration, implementation được phép dùng cơ chế đó nhưng **không được đổi framework client**. Không được tự chọn package thay thế MediaPipe mà không cập nhật SOT.

## 7. Notification

- Expo Push Notifications

## 8. Realtime

- Không dùng WebSocket trong MVP.
- Không bật Supabase Realtime.
- Sau mutation dùng REST + refresh/re-fetch.

## 9. Source control & deploy

- Git
- GitHub
- Local/free tier first

## 10. Không dùng trong baseline

- PostgreSQL
- Firebase
- Supabase Auth
- Supabase Realtime
- WebSocket
- Redis/Kafka nếu chưa có requirement
- React/Vite web app tách riêng
- raw-video AI cloud pipeline

## 11. Rule đổi stack

Muốn đổi phải ghi:

1. công nghệ hiện tại;
2. công nghệ đề xuất;
3. vấn đề cần giải quyết;
4. ảnh hưởng business/architecture;
5. migration;
6. cost;
7. security/privacy;
8. test plan.

Không đổi ngầm trong task implementation.

## Baseline implementation — 2026-09-24

Các package hiện thực hóa stack đã duyệt: expo-sqlite, expo-file-system, expo-camera, expo-image-picker, expo-notifications, expo-crypto; Zod ở client/API. MediaPipe web dùng @mediapipe/tasks-vision 0.10.21, Android/iOS dùng Tasks Vision 0.10.21 qua Expo local module fitness-pose. Không bổ sung provider cloud.

Web dùng OPFS cho video và SQLite WASM cho sessions; static hosting cần COOP/COEP. Native cần development build chứa module pose. Playwright chạy tạm bằng pnpm dlx để kiểm tra browser, không là runtime dependency.

Date/time UI dùng `@react-native-community/datetimepicker` 9.1.0 đã có trong package/lockfile cho native, datetime-local của browser cho web. Không thêm dependency/provider trong task ngày 2026-10-08. Native binary cần chứa module picker; binary cũ thiếu module hiển thị hướng dẫn cài Development Build mới.


## Nâng Expo SDK 58 — 2026-10-29

Owner yêu cầu nâng SDK 57 lên SDK 58. Baseline client: Expo 58.0.21, React/React DOM 19.3.0, React Native 0.88.1, Router 58, TypeScript 6.0.3, Jest 30.5.2 và ts-jest 29.4.15; các module Expo/native căn theo `expo install --fix` và pnpm-lock.yaml. Node trên máy kiểm tra là 22.22.0.

- Chuyển splash config cũ sang plugin `expo-splash-screen` 58; dùng sub-export Expo thay dependency trực tiếp `@expo/config-plugins`. Bỏ packageExtension datetimepicker 9.1.0 cũ khi nâng lên 9.2.1; bổ sung peer `@expo/dom-webview` 58 cho log-box.
- Web giữ SPA bằng `web.output: single`, tắt asyncRoutes web để giữ flow và export hiện tại; không thêm server rendering/provider. Guard chưa lưu dùng `usePreventRemove`/`repeat` của Router 58. Ref dùng instance types của RN 0.88; TypeScript khai báo jest/node/react/typeRoots; packageExtension expo-camera@58.* bổ sung @types/react 19.3 để CameraView tìm được React.Component trong virtual store ngoài repo trên Windows (không dùng alias runtime React).
- Không thay business/API/database, provider AI hay local-only video. Không cần migration MongoDB/SQLite. Native cần development build mới chứa SDK 58 và fitness-pose; binary SDK 57 không dùng lại với bundle mới. Chưa xác minh build Gradle/Xcode hoặc camera/pose trên thiết bị thật.
- Nguồn migration: https://expo.dev/blog/how-to-upgrade-to-sdk-58 và https://docs.expo.dev/router/migrate/sdk-57-to-58/. Giữ packageManager pnpm hiện hành; cài trên máy này với npm_config_virtual_store_dir=C:\.fitness-pnpm.

## Nguồn media thư viện bài mẫu — 2026-10-30

Owner đã chọn ảnh mở: free-exercise-db (yuhonas, Unlicense/Public Domain) và Workout Guide (Bryl Lim/Everkinetic, CC BY-SA 4.0). Chỉ nhập các JPEG/PNG được review vào assets; không cài npm package workout-guide, không thêm API/provider/CDN runtime. React Native Image + timer hiện hành phát các vị trí chính; không dùng GIF decoder/new native dependency. Asset provenance pin commit và SHA256, LICENSE/ATTRIBUTION giữ nguyên. Baseline 43 ảnh khoảng 2,37 MiB thêm vào bundle, chỉ decode tối đa 3 ảnh khi mở một detail; cần cập nhật build/bundle đang chạy để có asset mới. Không liên quan raw AI video local-only.
