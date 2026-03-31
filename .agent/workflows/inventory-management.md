---
description: Kiểm soát và tối ưu hóa tồn kho đệ quy
---

# Workflow: Tối ưu hóa Kho hàng (Inventory Optimization)

Quy trình này hướng dẫn Agent kiểm tra và xử lý tồn kho nguyên liệu dựa trên định mức công thức (Recipe) và doanh số bán hàng.

## Các bước thực hiện:

1. **Kiểm tra tồn kho thực tế**:
   - Sử dụng `view_file` đọc `src/context/DataContext.jsx` để lấy `initialState.ingredients`.
   - Tính toán danh sách nguyên liệu có `stock` dưới mức 20%.

2. **Phân tích đệ quy**:
   - Duyệt qua `products`. Với mỗi sản phẩm, quét `recipe` để tìm các nguyên liệu con.
   - Nếu có công thức lồng nhau (Sub-recipe), tiếp tục truy vết đến nguyên liệu gốc.

3. **Đề xuất nhập hàng**:
   - Tạo danh sách `Purchase Order` (Đơn nhập hàng) dựa trên danh sách thiếu hụt.
   - Ưu tiên các nguyên liệu từ cùng một `supplier`.

4. **Cập nhật dữ liệu**:
   - Xuất file `INVENTORY_AUDIT.md` để người dùng xác nhận.
