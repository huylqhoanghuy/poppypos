---
description: Kiểm toán và đối soát sổ quỹ định kỳ
---

# Workflow: Kiểm toán Tài chính (Financial Audit)

Quy trình tự động đối soát giữa Sổ Nhật Ký và Số dư Tài khoản.

## Các bước thực hiện:

1. **Trích xuất dữ liệu**:
   - Đọc `transactions` và `accounts`.

2. **Tính toán đối soát**:
   - Với mỗi `account`, tính tổng `Thu` - tổng `Chi` từ danh sách `transactions`.
   - So sánh con số này với `balance` hiện tại của account đó.

3. **Phát hiện sai lệch**:
   - Nếu `balance` != (initialBalance + Delta), đánh dấu là "Bất thường".
   - Kiểm tra các `relatedId` để đảm bảo đơn nợ đã được đóng tương ứng.

4. **Báo cáo**:
   - Tạo `FINANCE_STATUS.json` để đồng bộ lên máy chủ.
