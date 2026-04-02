# 🍗 POPPY POS - Hệ Thống Quản Lý Bán Hàng (V2.1 Final ERP)

POPPY POS V2.1 Final là một hệ thống quản lý điểm bán (Point of Sale) cấp độ Doanh Nghiệp (Mini-ERP) được tùy chỉnh chuyên biệt sâu cho mô hình **Xóm Gà Ủ Muối POPPY**. Phiên bản này tập trung vào 3 cốt lõi: **Khống chế Nợ Ảo**, **Kế toán Hao Hụt Kích Hoạt Tự Động**, và **Tối Ưu Hóa Trải Nghiệm Tốc Độ Ánh Sáng (0ms Latency)**.

---

## 🌟 Chức Năng Nổi Bật V2.1 Final

### 1. Kế Toán Kép & Dập Nợ Ảo Tự Động (MỚI)
- Giờ đây, các Đơn hàng (POS) hoặc Phiếu nhập (PO) nếu bị **Hủy (Cancelled)** hoặc **Xóa Mềm** sẽ lập tức "bốc hơi" khỏi cột cảnh báo CÔNG NỢ PHẢI THU/PHẢI TRẢ. Chặn đứng lỗi "đòi nhầm tiền" gây thất thoát tài sản.
- **Bút toán Hao Hụt Ngầm:** Chọc tay vào kho để sửa Tồn Kho (mà không nhập/xuất) hệ thống sẽ nhận diện và ném giao dịch chênh lệch này vào **Chi phí P&L (Vận hành)**, đồng thời giữ nguyên dòng tiền gốc (Cash) thay vì im lặng làm sụt giảm tổng tài sản.

### 2. Tốc Độ "Ánh Sáng" (0ms DB Latency) (MỚI)
- Các khối Delay mạng (do API giả lập 50ms) ở kho dữ liệu đã được **Gỡ sạch phần tử chặn**. Webapp chạm mốc **đáp ứng < 5ms** với mỗi lần bấm thanh toán/tạo đơn.
- Các bộ thư viện lớn (ChartsJS, Lucide React) đã được phân mảnh rạch ròi bằng **Vite `manualChunks`**, mang đến cảm giác tải trang lạnh như chớp. 

### 3. Sơ Đồ Kiến Trúc Data Flow Nhúng Sâu Vào App (MỚI)
- Lần đầu tiên, **Cây Cấu Trúc Khấu Trừ Kho & Dòng Tiền** (Architecture Logic) được hiển thị dạng đồ họa trực quan (Interactive) ngay bên trong Cài đặt Hệ thống để đào tạo nhân viên.

### 4. Bán Hàng Đa Kênh Lõi Trực Tiếp (Omnichannel POS)
- Tự động trừ rớt 25% (ShopeeFood), 30% (GrabFood) hoa hồng sàn nếu nhân viên tick chọn. Doanh thu Net (Thực nhận) mới là con số đổ về sổ Quỹ.

### 5. Quản Lý Kho & Công Thức Đệ Quy Tự Động (BOM)
- **Trừ Kho Tự Động:** Bán hạt Cơm, hệ thống tự động bốc Gạo, Nước, Muối, Cốc Nhựa theo định mức Mili-Gram và tính thẳng vào COGS (Giá vốn luân chuyển). Tránh thất thoát kho thực tế.

---

## 🚀 Công Nghệ Lõi Tối Tân

- **Frontend Core:** React 18, Vite. Phân phối luồng theo chuẩn móc `useReducer` lớn và `Context API`.
- **Database & Sync:** Tầng lưu trữ `StorageService` hoạt động Local hoàn toàn độc lập với tốc độ đọc Cache 0.1ms; hỗ trợ đẩy `Webhook (Make.com)` định kỳ lưu trữ ngầm, cho phép sao lưu về File dạng JSON và nhập ngược lên Data Cloud.
- **Micro-Animations UI:** Nhận diện Light/Dark Mode của trình duyệt, giao diện Glassmorphism độc lập trên khung CSS Vanilla thuần chủng.
- **Module Lõi Kế Toán:** Thuật toán Kế Tán Kép (Double-entry), tách bạch P&L, Dòng Tiền, Bảng Cân Đối ra riêng biệt.

---

## ⚙️ Hướng Dẫn Kích Hoạt Nhanh Bằng Terminal

Để chạy thử nghiệm hoặc Setup ban đầu trên máy nội bộ:

1. **Cài Đặt Node.js & Module:**
   ```bash
   npm install
   ```

2. **Khởi Động Server Doanh Nghiệp (Dev):**
   ```bash
   npm run dev
   ```
   *Ứng dụng sẽ khả dụng ngay tức khắc tại cổng `http://localhost:5173`.*

3. **Đóng Gói Chuyên Nghiệp (Production Build):**
   ```bash
   npm run build
   ```
   *Nhờ hệ thống Phân mảnh Chunk (V2.1), bộ Kit giờ đây ép nén hoàn hảo cho File Tĩnh.*

---

## 🗂 Cấu Trúc Mã Nguồn (Overview)
- **`src/context/DataContext.jsx`**: "Tim" của ứng dụng, ôm toàn bộ State Máy và Logic bù đắp số dư Hạch toán.
- **`src/services/financialService.js`**: Bộ não tài chính, chịu trách nhiệm lọc dập 100% tạp chất (Rác, Đơn hủy) trước khi cộng chuỗi Tiền vào P&L.
- **`src/services/api/storage.js`**: Trung tâm điều phối lưu trữ dữ liệu Zero-Latency (0ms).
- **`src/pages/SystemArchitecture.jsx`**: Cẩm nang Sơ Đồ Cấu Trúc Khối trực quan cho chủ nhà hàng.

---

**[Version 2.1.0 - ERP Ready]**
*Sản phẩm được tối ưu từng Mili-Giây, thiết kế độc quyền cho hệ sinh thái FnB nhằm xóa bỏ sự thao túng tài chính và gian lận hàng hóa.*
