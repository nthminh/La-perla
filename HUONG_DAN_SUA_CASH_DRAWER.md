# Hướng Dẫn Sửa Chức Năng Mở Ngăn Kéo Tiền (Cash Drawer)

## Vấn Đề Ban Đầu

Chức năng mở ngăn kéo tiền qua cổng RJ12 đã được thêm vào trước đó nhưng không hoạt động trên máy POS Android. Nguyên nhân là cách triển khai cũ chỉ nhúng lệnh ESC/POS vào một thẻ div ẩn, không thực sự gửi lệnh đến máy in.

## Giải Pháp Mới

Đã sửa chức năng để gửi lệnh ESC/POS trực tiếp đến máy in bằng cách:

1. **Tạo iframe ẩn** chứa lệnh ESC/POS
2. **In iframe riêng biệt** trước khi in hóa đơn
3. **Đảm bảo lệnh được gửi** đến driver máy in và phần cứng

## Những Thay Đổi

### 1. File `utils/cashDrawer.ts`
- Thay đổi từ phương pháp div ẩn sang phương pháp iframe
- Tạo một công việc in riêng biệt cho lệnh mở ngăn kéo
- Thêm xử lý lỗi đầy đủ
- Ngăn chặn rò rỉ bộ nhớ bằng cách quản lý timeout

### 2. File `components/PricingView.tsx`
- Thêm độ trễ 500ms sau khi gửi lệnh mở ngăn kéo
- Đảm bảo lệnh được xử lý trước khi in hóa đơn

### 3. File `CASH_DRAWER_IMPLEMENTATION.md`
- Cập nhật tài liệu với phương pháp mới
- Thêm phần khắc phục sự cố
- Cập nhật phiên bản lên 2.0

## Cách Hoạt Động

1. Người dùng nhấn nút "Open / Print" trong phần View Bill
2. Hệ thống tạo iframe ẩn chứa lệnh ESC/POS mở ngăn kéo: `[27, 112, 0, 25, 250]`
3. In iframe (gửi lệnh đến máy in)
4. Chờ 500ms để lệnh được xử lý
5. Hiển thị hộp thoại in hóa đơn
6. Ngăn kéo tiền mở khi máy in nhận được lệnh
7. Dọn dẹp iframe sau 1 giây

## Hướng Dẫn Sử Dụng

### Vị Trí Nút
1. Đăng nhập Staff Mode
2. Chọn nhân viên và nhập mật khẩu
3. Vào tab "Price List"
4. Thêm sản phẩm vào giỏ hàng
5. Nhấn "View Bill (n)"
6. Nhấn nút "Open / Print"

### Kết Quả Mong Đợi
- Ngăn kéo tiền tự động mở
- Hộp thoại in hóa đơn xuất hiện
- Console log hiển thị "Cash drawer opened successfully"

## Yêu Cầu Phần Cứng

1. **Máy in hóa đơn** hỗ trợ lệnh ESC/POS
2. **Ngăn kéo tiền** kết nối với máy in qua cổng RJ12
3. **Driver máy in** đã được cài đặt đúng cách
4. **Máy in được đặt làm mặc định** trong hệ thống

## Khắc Phục Sự Cố

Nếu ngăn kéo tiền vẫn không mở:

### 1. Kiểm tra kết nối phần cứng
- Đảm bảo cáp RJ12 được cắm chắc chắn từ ngăn kéo vào máy in
- Kiểm tra máy in được bật và kết nối với máy POS
- Kiểm tra cổng RJ12 trên máy in (thường ở phía sau)

### 2. Kiểm tra cài đặt máy in
- Đảm bảo máy in được đặt làm máy in mặc định
- In thử một trang để kiểm tra máy in hoạt động
- Một số máy in cần bật chức năng ngăn kéo trong cài đặt

### 3. Thử đổi cấu hình pin
Mở file `utils/cashDrawer.ts` và thử thay đổi:
```typescript
const m = 0;  // Pin 2 (mặc định)
```
Thành:
```typescript
const m = 1;  // Pin 5 (thay thế)
```

### 4. Kiểm tra console log
1. Mở Developer Tools (F12 hoặc Ctrl+Shift+I)
2. Vào tab Console
3. Nhấn nút "Open / Print"
4. Xem thông báo lỗi (nếu có)

### 5. Kiểm tra tương thích máy in
- Đảm bảo máy in hỗ trợ lệnh ESC/POS
- Xem hướng dẫn sử dụng máy in về chức năng ngăn kéo
- Một số máy in cần cấu hình đặc biệt

## Lệnh ESC/POS

Lệnh mở ngăn kéo: `[27, 112, 0, 25, 250]`

Chi tiết:
- `27` (ESC): Ký tự Escape
- `112` (p): Lệnh kích ngăn kéo
- `0` (m): Pin 2 (0 = Pin 2, 1 = Pin 5)
- `25` (t1): Thời gian BẬT (25ms × 2 = 50ms)
- `250` (t2): Thời gian TẮT (250ms × 2 = 500ms)

## Tùy Chỉnh

Để thay đổi thời gian mở ngăn kéo, sửa file `utils/cashDrawer.ts`:

```typescript
const t1 = 25;   // Thời gian xung BẬT (× 2ms)
const t2 = 250;  // Thời gian xung TẮT (× 2ms)
```

Tăng `t1` để mở ngăn kéo mạnh hơn (tối đa 255).

## Bảo Mật

- Chức năng chỉ hoạt động trong Staff Mode
- Yêu cầu xác thực nhân viên
- Ẩn khỏi chế độ khách hàng
- Tất cả hoạt động được ghi log để kiểm tra

## Hỗ Trợ

Nếu vẫn gặp vấn đề:
1. Kiểm tra lại tất cả các bước ở trên
2. Thử với máy in khác (nếu có)
3. Liên hệ nhà sản xuất máy in để hỗ trợ kỹ thuật
4. Kiểm tra xem ngăn kéo có hoạt động khi nhấn nút trên ngăn kéo (nếu có)

## Tương Thích

✅ Web browser (Chrome, Firefox, Safari, Edge)  
✅ Máy POS Android  
✅ Máy in ESC/POS  
✅ Ngăn kéo tiền RJ12 chuẩn  

---
**Ngày cập nhật:** 26/01/2026  
**Phiên bản:** 2.0  
**Người thực hiện:** GitHub Copilot
