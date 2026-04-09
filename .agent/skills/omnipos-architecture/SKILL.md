---
name: omnipos-architecture
description: Bách Khoa Toàn Thư về Nghiệp vụ (Business Logic) & Cấu trúc Dữ liệu Lõi của hệ thống Poppy POS. Tất cả các Agent phải đọc và tuân thủ tuyệt đối trước khi tạo tính năng mới.
allowed-tools: Read, Write
version: 2.0
priority: CRITICAL
---

# 🔴 OmniPOS Architecture: Kỷ Luật Thép & Nghiệp Vụ Cốt Lõi (Business Logic)

> **CRITICAL KNOWLEDGE BASE** - Mọi dòng code sinh ra liên quan đến Kho, Tiền, Đơn Hàng THỀ BẮT BUỘC phải tuân thủ 100% các nguyên tắc kế toán tài chính dưới đây.

---

## 1. 🧬 QUY TẮC CẤU TRÚC DỮ LIỆU & BẢO MẬT KHÓA TRUNG TÂM (CORE DATA)

Đế chế Poppy POS vận hành với một hệ triết lý duy nhất: **Toàn Vẹn Dữ Liệu Tự Sinh (ACID Auto-Gen)**.
- **Quy tắc Vùng Cấm Khóa Chính (Primary Key Isolation):** TUYỆT ĐỐI KHÔNG SỬ DỤNG `payload.id`, `orderCode`, hay mã nhập tay từ Excel để làm Khóa Chính (ID của Document). 100% Khóa Chính (Entities) ở các bảng phải tự động được cấp bằng Hàm Phá Vòng Lặp: `StorageService.generateId('PREFIX-')`! (Cụm sinh mã mã hóa có 4 lớp bảo vệ: Tiền tố + Thời gian + Xúc xắc ngẫu nhiên + Bộ đếm xung nhịp).
- **Phân loại Tiền tố (Prefixes):**
   - Đơn Hàng: `ORD-`
   - Nhập Kho: `PO-` (Purchase Order) / `NK-`
   - Giao Dịch/Sổ Quỹ: `TX-` / `GD-` (Trừ nội bộ), Phiếu Thu: `PT-`, Phiếu Chi: `PC-`
   - Nguyên vật liệu: `ING-` ; Thực Đơn: `SP-`
   - Đối tác: Khách (`KH-`), Nhà Cung Cấp (`SUP-`), Tài Khoản/Ví (`ACC-`)
- **Quy tắc Liên kết (Foreign Key Linkage - Map by ID):** 
   - Tuyệt đối KHÔNG BAO GIỜ liên kết hai đối tượng thông qua Chuỗi Ký Tự (`product.name === input.name`). Tên món ăn có thể đổi, viết hoa, viết thường gây hỏng link.
   - Luôn luôn, phải bám sát Khóa Chính (Ví dụ: `p.id === cartItem.productId` hoặc `po.supplierId === s.id`). Đối soát quá khứ (Backward Tracking) cũng phải tuân thủ chuẩn SQL này.

---

## 2. 🧮 NGHIỆP VỤ BÁN HÀNG (POS OPERATIONS)

Khi một đơn hàng POS được ghi nhận, các luồng dữ liệu sau phải đồng loạt chạy ngầm:
1. **Trừ Kho Kép (Recursive Inventory Deduction):** Mọi "Sản phẩm" (Product) gắn với "Công Thức Định Lượng" (Recipe). Khi bán 1 Gà Ủ Muối, tuyệt đối không được trừ 1 Gà Ủ Muối, MÀ PHẢI map qua bảng `ingredients` trừ đi (X gram muối, Y ml nước chấm, Z hộp nhựa) bằng hàm trung tâm `adjustInventoryQuantity` ở `coreServices.js`.
2. **Kế toán Khuyến mãi ròng (Net Amount vs Discount):** 
   - `totalAmount` = Tổng tiền bán hàng gốc.
   - `discountAmount` = `totalAmount` * `% Chiết khấu`. (Ví dụ: Đơn GrabFood tính phí hoa hồng ngầm 29% thì Discount chính là % phí sàn).
   - `netAmount` = `totalAmount` - `discountAmount`. Đây là SỐ TIỀN THỰC THU chạy vào Ví Của Chủ Cửa Hàng. (Nếu Grab thu 29%, bạn chỉ nhận 71% bỏ vào Ví).
3. **Cộng Tiền Ví Ảo (Auto Wallet Mapping):**
   - Khách mua GrabFood (`ACC4`), ShopeeFood (`ACC3`), Trực tiếp (`ACC1` - Tiền Quầy). Đơn thành công, tiền `netAmount` BẮT BUỘC phải cộng thẳng vào `balance` của `accountId` tương ứng. Kèm theo một Dòng lịch sử `Transaction` loại `'Thu'`.

---

## 3. ⚖️ NGHIỆP VỤ NHẬP KHO & CÔNG NỢ (PURCHASE LIFECYCLE)

Nhập rổ Hàng (Nguyên liệu) quyết định tính sống còn của Giá Trị Kho và Dòng Tiền.
1. **Tự động Cập Nhật Bình Quân Gia Quyền (Moving Average Cost):** Khi tạo 1 phiếu PO, Không chỉ cộng số lượng `stock = stock + baseQty`. MÀ BẮT BUỘC PHẢI TÍNH LẠI Giá Trị.
   - `Cập nhật new_cost` = [ (Tồn Rủi ro cũ * Giá cũ) + (Tiền nhập lô này) ] / Tổng Tồn Kho Mới. (Giá Vốn dao động).
2. **Theo dõi Công Nợ Nhà Cung Cấp (Debt Tracking):** Khởi tạo PO với `status: 'Debt' | 'Pending'` -> Cộng tiền `po.totalAmount` vào `supplier.debt` (Tiền nợ Ông A). Xóa PO -> Trừ nợ Ông A.
3. **Thanh Toán (Payment Execution):** Khi Trạng thái PO nhảy sang `Paid`, tự động rút tiền mặt từ Máy Đếm Tiền `ACC1` (Balance giảm) -> Lập Phiếu Chi `PC-` vào bảng Transactions. Nếu thanh toán Công nợ (Update Status), tiếp tục tự động trừ Tiền Nợ Tối Đa `supplier.debt -= totalAmount`.

---

## 4. 🧲 KỊCH BẢN XÓA / THỦY PHÂN GIAO DỊCH (DELETION ORCHESTRATION)

Để sửa chữa sai lầm, Hệ thống cấm sửa xóa thủ công kiểu "Lấy tay sửa số". Phải xóa theo Hệ Chuỗi Phản Ứng:

### 4.1 Hủy Bỏ Lệnh (Kịch Bản A - Khớp Link)
*Khi Xóa 1 Lệnh (Đơn / Phiếu Thu) -> Hệ thống quét Link IDs:*
- Nếu tìm thấy Đơn Hàng đúng mã ID và Khớp chuẩn Số Tiền (Dung sai 100đ): `status` Đơn chuyển thành `'Cancelled'`.
- Ngay lập tức Chạy Lùi lại Kho -> Hồi máu (Cộng lại) cho Nguyên Liệu đã mất.
- Sổ Quỹ tự động Hủy Phiếu liên đới.

### 4.2 Data Healer (Kịch Bản B - Dịch Ngược Dòng Thời Gian)
*Thảm họa nảy sinh: Phiếu Thu Mồ Côi, Nhập CSV Hỏng, Đứt Gãy Liên Kết Giao Dịch.*
- Lệnh: "Xóa Phiếu Thu 114.239đ (Ghi chú: Đơn GrabFood)". Mã lỗi, chả tìm thấy đơn.
- Kịch Bản Hồi Sinh Kích Hoạt (Data Healer).
- Phép Dịch Thuật Giá Trị Gốc: System gọi `114.239 / (1 - 0.29 fee) = 160.900đ` (Ra giá trị Cửa hàng Gross value).
- Triệu hồi Phép Trục Xuất `inferItemsFromPrice` -> Mò tung Menu. Lôi ra "1/2 Gà Ủ Muối + Chân gà rút xương" = đúng y chóc 160.900đ!
- Bẻ khóa công thức Gà và Chân, hồi sinh đúng ngữ cảnh đó ném vào Kho.

---

## 5. 📥 QUY TẮC NHẬP DỮ LIỆU BÁO CÁO TỪ NỀN TẢNG THỨ BA (CSV/XLSX EXPORT)

Quá trình "Nuốt" dữ liệu báo cáo từ file Excel tải về của GrabFood, ShopeeFood tiềm ẩn nguy cơ sai lệch dòng tiền và phá hủy hệ thống cực cao do Trùng lặp ID. Bắt buộc tuân thủ 2 nguyên tắc sau:

### 5.1 Khuẩn Phân Lập (Isolation) và Sinh Khóa Chống Trùng Lặp
1. **Phiên dịch File (Parser):** Nhận diện Đơn Hàng từ file CSV. Đọc ra ID Gốc của Sàn (Ví dụ: `GF-123456`).
2. **Triệt tiêu Khóa Chính:** Ép tước quyền Khóa Chính của `GF-123456`, lưu vãng lai vào `orderCode`.
3. **Sinh Khóa (Seeding ID):** Mỗi dòng nhập phải bắt buộc chạy qua máy quay `generateId('ORD-IMP-')` làm Khóa Chính mới. 
4. **Móc nối Giao dịch:** Phiếu Thu sinh ra từ CSV cũng tự động tạo `generateId('TX-IMP-')` và trường `relatedId` bám chuẩn vào Khóa sinh ở bước 3.
👉 **Kết Quả:** Nếu user Cố tình Import cùng 1 file CSV tận 2 lần, hệ thống sẽ chứa 2 dòng đơn có cùng `orderCode`, nhưng Primary Key thì khác biệt. Xóa lần nhập nào tự động khôi phục đúng lần nhập đó, không nổ Data!

### 5.2 Xử Lý Kế Toán Bóc Tách Chi Phí Sàn (Platform Cost Isolation)
1. **Bắt buộc dùng Giá Gốc đối chiếu Doanh thu (Gross):** Giá bán gốc chưa qua chỉnh sửa là con số duy nhất đại diện cho Doanh Thu Tổng lúc đầu của hóa đơn.
2. **Khấu trừ Chi Phí Phân Lớp:** Liên tục săn tìm và trừ đi các luồng chi phí ẩn từ báo cáo như: Phí dịch vụ (Phí sàn), Thuế khấu trừ, GTGT (VAT), Giảm trừ trực tiếp.
3. **Đối Chiếu Chéo Tỷ Lệ CK (Cross-check):** Phải làm phép so sánh các khoản trừ với Tỉ lệ phần trăm Chiết Khấu Kênh Bán (Commission Rate) được ấn định tại danh mục Kênh để cân đối tính toàn vẹn của chi phí (Vd đối soát xem Sàn có cắn quá 29% phí hay không). Dùng tỷ lệ này nội suy chi phí nếu file báo cáo của sàn vắng mặt thông số.
4. **Định Tuyến Dòng Tiền Thực Nhận (Net Routing):** Tổng Gross sau trừ Phí Sàn và Thuế chính là Tiền Thực Nhận (Net Sales). CHỈ ĐƯỢC PHÉP hạch toán Số tiền Thực nhận này đẩy vào số dư Tài khoản ngân hàng, hoặc Ví nền tảng.

---

## 6. 🎛 QUY TẮC TOÁN HỌC KHI LẬP TRÌNH BẢN ĐỊA (VIETNAMESE CURRENCY LOCALE)
- **Cấm ngặt:** KHÔNG SỬ DỤNG `parseFloat()` hay ép kiểu `Number(input.value)` đối với các Textbox nhập liệu có số tiền, tỉ lệ, định lượng. Người Việt dùng dấu phẩy `,` làm số thập phân (`0,5`), JavaScript sẽ trả về `NaN` nếu parse sống, gây đứt gãy Database toàn hệ thống!
- **Mandatory (Luật bắt buộc):** Luôn import và sử dụng `parseSafeNumber(val)` từ `utils/numberFormat.js`.
- Bất kể là khi lấy từ Textbox Input hay khi render lại, Cấm dùng các thủ thuật Regex chắp vá để override value tự động trên thẻ `<input>`. Sử dụng thẻ chuẩn: `type="text" inputMode="decimal"`. Data Healer (`sanitizeNumericFields`) trong storage đã được cài đặt tự động cứu hộ nền tảng.

---

## 7. 🎨 QUY TẮC ĐỒNG NHẤT GIAO DIỆN & COMPONENT (UI/UX UNIFORMITY)
Để đảm bảo trải nghiệm nguyên khối (monolithic experience) cho Poppy POS, mọi Agent khi xây dựng hoặc tùy biến màn hình phải CHỐT CỨNG các tiêu chuẩn sau. Cấm tự ý sáng tạo giao diện rác hoặc xé lẻ quy chuẩn:
1. **Bộ Lọc Thời Gian (Time Filters):** Mọi module có báo cáo (Doanh thu, Sổ quỹ, Nhập hàng...) MẶC ĐỊNH phải dùng chung UI Bộ lọc thời gian (Ví dụ: DateRangePicker hoặc các Nút chọn nhanh Hôm nay/Hôm qua/Tháng này). Tuyệt đối không mỗi trang code một logic ngày tháng khác nhau.
2. **Cấu Trúc Cột & Bảng Dữ Liệu (Data Tables):**
   - **Render Số Tiền:** Phải Căn lề phải (Right-align), format chuẩn `toLocaleString('vi-VN')` + `đ`. Tiền vô (Gross/Thực thu) dùng chữ Màu Xanh Lá, Tiền ra/Khấu trừ/Lỗ dùng chữ Màu Đỏ tươi kèm dấu âm (`-`).
   - **Render Thời gian:** Đồng nhất hiển thị dạng `DD/MM/YYYY HH:mm`.
   - **Giao diện dòng (Row):** Có mảng màu xen kẽ lịch sự (zebra stripes) hoặc thẻ Box shadow viền bo cong. Cấm làm bảng thô kệch.
3. **Quy Tắc Kế Thừa (Inheritance Rule):** Trước khi tạo mới 1 Component UI (Nút, Bảng, Thanh tìm kiếm), Agent BẮT BUỘC phải tham chiếu (grep) xem các màn hình lớn khác (như `FinancialReports.jsx`, `InventoryManagement.jsx`) đang dùng cấu trúc HTML/CSS nào để lấy sang dùng chung. Không "sáng chế lại bánh xe".
4. **Hiển Thị Dữ Liệu Toán Học (Mathematical Transparency):** Trong lưới danh sách món mua (Đơn hàng, Báo cáo Import), **BẮT BUỘC** trình bày rõ thuật toán bóc tách công khai: `(Đơn giá x Số lượng = Tổng giá trị Gross | Thực thu Net)` ngay phía dưới tên món ăn bằng định dạng text phụ, có đóng khung/viền mờ (`border: dashed`) phân cách rõ ràng. Tuyệt đối không gộp số liệu hoặc chỉ in mỗi tên món ẩn dòng tiền khiến Kế toán không nhẩm lại được.

---

## 8. SỔ TAY RA LỆNH VÀ UY QUYỀN
Bất kể khi nào bạn (AI) nhận yêu cầu "Sửa Đơn Hàng", "Sửa Tính Toán", "Chống trùng lặp" hay "Sửa Giao Diện Bảng", "Sửa Bộ Lọc" - bạn BẮT BUỘC PHẢI LUÔN chiếu theo Luật lệ ở file này. Hệ thống Đồng nhất Giao Diện và ACID Business Logic này là Chén Thánh của Ứng dụng.
