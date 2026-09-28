# FITNESS-MANAGE SOT 09 — Member Profile & Internal PT Assignment

## 1. Official profile

Member/PT chính thức có tối thiểu:

- họ tên;
- SĐT;
- CCCD;
- role;
- account status.

Có thể có:

- ngày sinh;
- giới tính;
- địa chỉ;
- avatar;
- ghi chú phù hợp nghiệp vụ.

SĐT unique. CCCD unique khi non-null/non-empty.

Trial không bắt buộc CCCD cho đến conversion.

---

## 2. Primary PT

Member sử dụng PT nội bộ có tối đa một assignment active:

```text
Member -> Primary PT
```

PT có thể phụ trách nhiều Member ở các thời điểm khác nhau, miễn booking không overlap.

---

## 3. Assignment ownership

Chỉ Owner:

- assign PT;
- đổi PT;
- hủy PT;
- gán lại PT.

Member không có nút/API đổi PT.

PT không có nút/API bỏ Member.

---

## 4. Request đổi/hủy PT

Nghiệp vụ ngoài app có thể bắt đầu bằng Member/PT liên hệ Owner.

Owner quyết định và ghi:

- assignment cũ;
- assignment mới nếu có;
- reason;
- changed_at;
- changed_by.

Không overwrite mất lịch sử.

---

## 5. PT visibility

PT chỉ được xem Member đang/đã liên quan theo quyền nghiệp vụ cần thiết, đặc biệt Member active được assign và booking của mình.

Không cho PT duyệt customer database toàn gym.

Member information hiển thị cho PT phải theo nguyên tắc minimum necessary. CCCD không cần hiển thị đầy đủ cho PT trong booking screen.

---

## 6. Acceptance

1. Không có hai primary assignment active cho cùng Member.
2. Member/PT gọi mutation assignment trả 403.
3. Owner đổi PT giữ lịch sử.
4. PT chỉ thấy Member thuộc phạm vi mình.
5. Duplicate CCCD bị chặn khi CCCD đã tồn tại.
