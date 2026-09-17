---
title: FITNESS-MANAGE UI/UX SOT
description: Quy chuẩn visual language, màn hình tham chiếu và accessibility cho MVP.
name: Modern Athletic Wellness
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4947'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#994100'
  on-tertiary: '#ffffff'
  tertiary-container: '#c05400'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  stat-numeric:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style
The design system articulates an atmosphere of refined performance, mindful movement, and elevated fitness hospitality. Drawing inspiration from premium athletic interfaces like Apple Fitness+ and Equinox, the visual ethos departs from aggressive, hyper-saturated neon aesthetics in favor of a soothing yet energizing atmosphere: vibrant emerald mint paired with gentle coral energy resting on pristine, bone-white canvas spaces.

The style merges **Modern Contemporary** with **Soft Neomorphic Tactility** and subtle frosted glass highlights:
- **Clean Whitespace:** Intentional negative space gives breathing room to data-dense fitness statistics, PT schedules, and biometric metrics.
- **Micro-tactile Depth:** Crisp white cards float with ultra-diffused, cool-tinted shadows and featherweight borders, evoking high-end hardware interfaces.
- **Human-Centric Energy:** Athletic urgency is replaced by clear, motivating, and luminous feedback that encourages long-term wellness and seamless gym operations.

## Colors
The palette balances active vitality with optical comfort, preventing eye strain during prolonged use by personal trainers and front-desk staff.

- **Primary & Secondary (`#0D9488`, `#14B8A6`):** Active Mint & Emerald. Used for key interactive targets, confirmed workout sessions, biometric scores, and primary actions.
- **Tertiary Accent (`#F97316` / `#FB923C`):** Soft Coral. Reserved for high-priority highlights, trial session alerts, AI insight anomalies, and warm callouts.
- **Canvas & Backgrounds:**
  - Base canvas: `#FAFBFC` to `#F3F6F8` (warm ivory mist, preventing harsh glare).
  - Elevated surfaces: Pure `#FFFFFF`.
- **Borders & Dividers:** Translucent slate (`#E2E8F0` at 80% opacity or `#EDF2F7`).
- **Typography Neutrals:** Deep slate `#0F172A` for primary headlines, `#475569` for body and labels, and `#94A3B8` for subtle metadata.

## Typography
The system employs **Plus Jakarta Sans** for headlines, brand touchpoints, and large numeric readouts, leveraging its geometric curves and modern athletic confidence. **Inter** is designated for functional labels, status tags, tables, and micro-metrics to ensure instant scannability.

- Numbers for session check-ins, PT duration, and AI body fat ratios utilize tabular lining figures (`font-variant-numeric: tabular-nums`).
- Large display headings should always maintain tightened letter-spacing (`-0.02em`) to retain a punchy, editorial feel.

## Layout & Spacing
A fluid 8pt-based spatial model structured to accommodate both quick handheld interaction (mobile PT on gym floor) and dense desktop administration (desk manager):

- **Mobile (Gym Floor Mode, &lt; 768px):** 4-column layout with `margin: 1rem` and `gutter: 1rem`. Generous interactive zones with a minimum touch target size of 44×44px.
- **Tablet / iPad Dashboard (768px - 1024px):** 8-column layout, optimized for horizontal split-view schedules and check-in rosters.
- **Desktop Pro Management (&gt; 1024px):** 12-column grid maxing out at 1440px container width. Content relies on distinct, breathable modules separated by `space-xl`.

## Elevation & Depth
Depth mimics physical optical glass resting above an ultra-clean matte surface:

- **Level 0 (Canvas):** Flat base `#FAFBFC` to `#F3F6F8`.
- **Level 1 (Cards & Schedule Modules):** Pure white `#FFFFFF` surface with an ultra-soft ambient shadow: `0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)` and a hairline border: `1px solid rgba(226, 232, 240, 0.8)`.
- **Level 2 (Active Modals & Check-in Sheets):** `0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(13, 148, 136, 0.05)`. Notice the hint of emerald tint in the lower spread.
- **Level 3 (Floating Action & AI Body Analysis Overlays):** Semi-transparent frosted backdrop (`rgba(255, 255, 255, 0.82)` with `backdrop-filter: blur(12px)`) bound by an inner glow border (`1px solid rgba(255, 255, 255, 0.6)`).

## Shapes
Roundedness sits comfortably between modern tech precision and organic softness:

- **Containers & Stat Cards:** `rounded-2xl` (1.25rem - 1.5rem) to evoke an ergonomic, mobile-first design language.
- **Input Fields & Sub-panels:** `rounded-xl` (0.75rem - 1rem).
- **Buttons, Status Badges & Chips:** Full pill (`rounded-full` / 9999px) for friendly, tactile, and frictionless physical perception.

## Components

### Buttons
- **Primary Action:** Solid Emerald Gradient (`linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)`), white typography, rounded pill shape, with a subtle glow shadow `0 4px 14px rgba(20, 184, 166, 0.25)`.
- **Secondary Action:** Pale mint container (`rgba(20, 184, 166, 0.1)`), deep emerald text (`#0F766E`), no shadow, `rounded-full`.
- **Tertiary / Urgent Action:** Coral-tinted fill (`rgba(249, 115, 22, 0.1)`), coral text (`#EA580C`) for trial session alerts or cancellation flags.

### Status Badges & Chips
- Fully rounded pills with `label-sm` uppercase styling.
- **Active / Check-in:** Soft mint background (`#CCFBF1`), deep teal label (`#115E59`).
- **Trial Guest (Khách Tập Thử):** Soft coral background (`#FFEDD5`), warm coral label (`#C2410C`).
- **Pending Match / AI Processing:** Cool slate background (`#F1F5F9`), slate label (`#475569`).

### Session & Member Cards
- Pure white `#FFFFFF` surface with `rounded-2xl` corners and 1px `#E2E8F0` border.
- Integrated quick-action swipe or right-aligned check-in tap targets.
- Left-side accent indicator bar (3px vertical strip) colored by session type (Mint for PT 1-1, Coral for Trial, Violet for AI Scanning).

### Form Inputs & Check-in Triggers
- Bordered in `1px solid #E2E8F0`, transitioning on focus to `#0D9488` with an emerald focus ring (`box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15)`).
- Generous internal padding (`0.75rem 1rem`) with subtle placeholder text in `#94A3B8`.

### Specialized AI Body Analysis Card
- Translucent white gradient with an ethereal emerald-to-cyan mesh aura in the background.
- High-contrast data callouts featuring muscle mass, body fat percentage, and posture alignment metrics paired with mini circular progress indicators.

## Screen references và quy chuẩn theo role

Các ảnh trong `screenshots/` là visual reference cho hierarchy, mật độ thông tin, cách đặt action và cảm giác giao diện. Ảnh không phải dữ liệu thật và không tự tạo thêm business rule.

| Ảnh tham chiếu | Màn hình chuẩn hóa | Role/phạm vi |
|---|---|---|
| `dashboard-owner.jpg` | Dashboard vận hành chính | Owner/Admin |
| `Quản-lí-member.JPG` | Quản lý Member và danh sách PT liên quan | Owner/Admin; PT dùng biến thể chỉ đọc trong phạm vi được giao |
| `lịch-tập-checkin.JPG` | Lịch tập, check-in và trạng thái đối soát | Cả Owner/Admin, PT, Member; dữ liệu hiển thị khác theo quyền |
| `giao-diện-AI.JPG` | AI body analysis | Member là actor chính; PT/Owner chỉ xem kết quả theo policy |
| `Giao-diện-member.JPG` | Dashboard Member | Member |
| `Giao-diện-PT.JPG` | Dashboard PT | PT |
| `setting.JPG` | Setting mở từ ảnh profile | Cả ba role; menu/action theo quyền |

### Owner/Admin dashboard

`dashboard-owner.jpg` là reference chính cho màn hình Owner. Màn hình phải ưu tiên “việc cần xử lý” trước số liệu trang trí:

1. brand bar, avatar/profile và trạng thái phiên;
2. lời chào và ngữ cảnh vận hành;
3. KPI có nguồn từ API: Member active, PT active, lịch trong ngày, check-in và exception;
4. quick action cho route đã có requirement: quản lý Member/PT, lịch-check-in, guest và audit khi được phép;
5. danh sách cảnh báo cần Owner review, đặc biệt `MEMBER_ONLY`, `PT_ONLY`, `NEEDS_REVIEW`;
6. entry point **Trợ lý AI vận hành** dạng chatbot;
7. bottom navigation trên mobile hoặc rail/sidebar trên màn hình rộng.

Chatbot Owner chỉ hỗ trợ truy vấn/tóm tắt dữ liệu vận hành đã được phân quyền để giảm thời gian tổng hợp. Câu trả lời phải có phạm vi thời gian, nguồn dữ liệu hoặc link về màn hình chi tiết khi phù hợp. Chatbot không tự đổi assignment, lịch, check-in, trạng thái tài khoản; không đưa dữ liệu body/video của Member ra ngoài policy và không chẩn đoán y khoa.

### Quản lý Member và PT

`Quản-lí-member.JPG` là reference cho màn hình danh sách quản lý:

- Owner thấy bộ lọc/tìm kiếm, trạng thái Member, PT hiện tại, lịch gần nhất và trạng thái check-in/exception trong phạm vi được phép;
- PT chỉ thấy Member đang được assignment, không thấy danh sách toàn hệ thống nếu policy không cho phép;
- action chính phải nằm gần bản ghi: xem hồ sơ, xem lịch, xem assignment; action thay đổi phải có confirmation và trạng thái loading/error;
- không hiển thị hoặc log thông tin nhạy cảm ngoài nhu cầu màn hình;
- bảng desktop chuyển thành card/list trên mobile, giữ nguyên thứ tự ưu tiên và quyền.

### Lịch tập và check-in theo từng role

`lịch-tập-checkin.JPG` là một pattern dùng chung, nhưng không dùng cùng một data scope:

| Role | Được xem | Action chính | Không được thấy/làm |
|---|---|---|---|
| Owner/Admin | Toàn bộ lịch, check-in, attendance reconciliation và exception | lọc theo ngày/role/trạng thái, mở review exception, xem audit | không sửa lịch sử để khớp dữ liệu mới |
| PT | Lịch và Member thuộc assignment hiện tại | xem lịch, check-in cho chính mình, theo dõi trạng thái buổi | không check-in thay Member, không tự đổi assignment |
| Member | Lịch và PT hiện tại của chính mình | xem lịch, check-in cho chính mình, xem trạng thái buổi | không chọn PT mới ở mỗi buổi, không xem Member khác |

UI phải phân biệt rõ `MATCHED`, `MEMBER_ONLY`, `PT_ONLY`, `MISSING`, `NEEDS_REVIEW` bằng cả nhãn chữ và màu. Check-in thành công cần phản hồi idempotent; retry/double tap không tạo trải nghiệm như có nhiều lần check-in mới.

### AI body analysis của Member

`giao-diện-AI.JPG` là reference cho flow Member: hướng dẫn quay/chọn video → xem lại → gửi → tiến trình → kết quả có cấu trúc → lịch sử. UI phải luôn hiển thị trạng thái chất lượng input, confidence/uncertainty và cảnh báo “hỗ trợ fitness, không phải chẩn đoán y khoa”.

PT/Owner chỉ có entry point xem kết quả khi policy cho phép; không biến màn hình này thành luồng chỉnh sửa kết quả hoặc xóa lịch sử analysis.

### Dashboard Member và PT

`Giao-diện-member.JPG` và `Giao-diện-PT.JPG` dùng cùng visual language nhưng khác trọng tâm:

- Member: lịch sắp tới, check-in của mình, PT hiện tại, tiến trình/lịch sử AI của mình;
- PT: Member được giao, lịch trong ngày, check-in của chính PT, exception cần theo dõi trong phạm vi assignment;
- cả hai không dùng KPI toàn hệ thống của Owner và không hiển thị quick action ngoài quyền role.

### Setting từ ảnh profile

`setting.JPG` là pattern mở khi chạm avatar/profile. Tối thiểu gồm thông tin tài khoản, role, cài đặt phiên/đăng xuất và các mục được backend cho phép. Menu phải ẩn action không thuộc role nhưng server vẫn là nơi kiểm tra quyền cuối cùng. Hành động đăng xuất cần có trạng thái hoàn tất rõ ràng và đưa người dùng về màn hình đăng nhập.

### Dashboard pattern dùng chung

Mỗi dashboard theo role dùng cùng thứ tự ưu tiên:

1. brand bar và action phiên đăng nhập;
2. title ngữ cảnh theo role;
3. chỉ số lấy từ dữ liệu mà role hiện tại được phép xem;
4. khối việc vận hành cần chú ý;
5. entry card cho các route nghiệp vụ đã có requirement;
6. AI card/chatbot chỉ khi role có quyền xem hoặc tạo analysis;
7. bottom navigation trên màn hình nhỏ.

Chỉ số phải phản ánh response API thực tế. Không hard-code số liệu minh họa như dữ liệu vận hành.

## Responsive and accessibility rules

- Mobile giữ touch target tối thiểu 44×44px, safe area và bottom navigation.
- Desktop/tablet có thể để card grid tự co giãn nhưng không đổi route, quyền hoặc business flow.
- Mọi chip/màu trạng thái phải có nhãn chữ; màu không là nguồn thông tin duy nhất.
- Bề mặt tương phản cao, focus state emerald và error state coral/red phải tiếp tục dùng trên React Native Web.
- Không dùng ảnh mẫu như dữ liệu của Member/PT/Guest thực tế.

## Scope guard

File này sở hữu visual language, layout, component state, responsive behavior và mapping các ảnh tham chiếu vào màn hình. Role model, assignment, lịch, check-in, Guest và AI behavior canonical vẫn do `02` cùng các business SOT/technical SOT liên quan quyết định. Mọi chatbot Owner phải tuân theo requirement và API server; UI không được tự tính lại, tự suy diễn quyền hoặc tự thay đổi dữ liệu nghiệp vụ.
