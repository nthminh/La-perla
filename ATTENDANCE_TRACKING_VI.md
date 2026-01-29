# Tính Năng Theo Dõi Chuyên Cần - Đi Trễ & Về Sớm

## Tổng Quan
Tính năng mới cho phép admin ghi chú và theo dõi thời gian nhân viên đi trễ hoặc về sớm. Khi admin lọc theo ngày, hệ thống sẽ hiển thị tổng thời gian đi trễ và về sớm của từng nhân viên.

## Các Thay Đổi Đã Thực Hiện

### 1. Cấu Trúc Dữ Liệu Mới (types.ts)
Đã thêm interface `AttendanceRecord` để lưu trữ thông tin chuyên cần:

```typescript
export interface AttendanceRecord {
    id: string;                    // Mã định danh duy nhất
    staffId: string;               // ID nhân viên
    staffName: string;             // Tên nhân viên (để hiển thị)
    date: string;                  // Ngày (YYYY-MM-DD)
    lateMinutes: number;           // Số phút đi trễ (0 nếu đúng giờ)
    earlyLeaveMinutes: number;     // Số phút về sớm (0 nếu đúng giờ)
    notes?: string;                // Ghi chú của admin
    recordedBy?: string;           // Ai đã ghi chép
    recordedAt: string;            // Thời điểm ghi chép (ISO timestamp)
}
```

### 2. Dịch Vụ Firebase (firebaseService.ts)
Đã thêm các chức năng để quản lý dữ liệu chuyên cần:

- **saveAttendanceRecord**: Lưu hoặc cập nhật bản ghi chuyên cần
- **subscribeToAttendance**: Đăng ký nhận cập nhật real-time với lọc theo ngày
- **fetchAttendanceByDateRange**: Lấy dữ liệu một lần cho khoảng thời gian
- **deleteAttendanceRecord**: Xóa bản ghi

### 3. Giao Diện Quản Lý (AttendanceView.tsx)
Component mới cung cấp giao diện hoàn chỉnh để:

#### Bộ Lọc
- **Ngày bắt đầu**: Chọn ngày bắt đầu
- **Ngày kết thúc**: Chọn ngày kết thúc
- **Nhân viên**: Lọc theo nhân viên cụ thể hoặc tất cả
- **Nút "Add Record"**: Thêm bản ghi mới

#### Thẻ Tổng Kết
- **Tổng số bản ghi**: Số lượng bản ghi trong khoảng thời gian
- **Tổng thời gian đi trễ**: Hiển thị tổng số giờ:phút đi trễ (màu đỏ)
- **Tổng thời gian về sớm**: Hiển thị tổng số giờ:phút về sớm (màu xanh)

#### Bảng Dữ Liệu
Hiển thị danh sách các bản ghi với:
- Ngày
- Tên nhân viên (với ảnh đại diện)
- Thời gian đi trễ
- Thời gian về sớm
- Ghi chú
- Nút chỉnh sửa/xóa

#### Modal Thêm/Sửa
Form để nhập:
- Chọn nhân viên
- Chọn ngày
- Nhập số phút đi trễ
- Nhập số phút về sớm
- Ghi chú (tùy chọn)

### 4. Tích Hợp vào Admin Dashboard (AdminView.tsx)
- Đã thêm tab "⏰ Attendance" vào thanh điều hướng
- Tích hợp component AttendanceView
- Tuân theo mẫu thiết kế hiện có

## Cách Sử Dụng

### Bước 1: Truy Cập Tính Năng
1. Đăng nhập với tài khoản Admin
2. Vào Admin Dashboard
3. Nhấn vào tab "⏰ Attendance"

### Bước 2: Thêm Bản Ghi
1. Nhấn nút "Add Record"
2. Chọn nhân viên từ danh sách
3. Chọn ngày
4. Nhập số phút đi trễ (nếu có)
5. Nhập số phút về sớm (nếu có)
6. Thêm ghi chú (tùy chọn)
7. Nhấn "Save"

### Bước 3: Xem Báo Cáo
1. Chọn ngày bắt đầu và kết thúc
2. Chọn nhân viên cụ thể hoặc "All Staff"
3. Xem tổng thời gian đi trễ/về sớm ở các thẻ tổng kết
4. Xem chi tiết từng ngày trong bảng

### Bước 4: Chỉnh Sửa/Xóa
- Nhấn biểu tượng bút chì để chỉnh sửa
- Nhấn biểu tượng thùng rác để xóa

## Định Dạng Thời Gian
- Thời gian được hiển thị dưới dạng giờ và phút (ví dụ: "2h 30m")
- Nếu chỉ có phút: "30m"
- Nếu chỉ có giờ: "2h"
- Nếu không có: "0m"

## Đồng Bộ Firebase
- Tất cả dữ liệu được lưu trữ trong Firebase Realtime Database
- Cập nhật real-time khi có thay đổi
- Dữ liệu được lưu tại đường dẫn: `/attendance/{recordId}`

## Lợi Ích
- ✅ Theo dõi chính xác thời gian đi trễ/về sớm của nhân viên
- ✅ Lọc theo ngày và nhân viên
- ✅ Xem tổng thời gian trong khoảng thời gian
- ✅ Ghi chú chi tiết cho mỗi trường hợp
- ✅ Giao diện thân thiện, dễ sử dụng
- ✅ Đồng bộ real-time với Firebase
- ✅ Tương thích với di động

## Bảo Mật
- Chỉ admin mới có quyền truy cập
- Dữ liệu được lưu trữ an toàn trên Firebase
- Không có lỗ hổng bảo mật (đã kiểm tra với CodeQL)

## Kỹ Thuật
- **Frontend**: React + TypeScript
- **UI Framework**: TailwindCSS
- **Database**: Firebase Realtime Database
- **Timezone**: Australia/Sydney (nhất quán với hệ thống hiện có)
