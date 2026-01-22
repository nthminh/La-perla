# 📅 Đề Xuất Hệ Thống Quản Lý Lịch Làm Việc Cho Thợ

## 🎯 Tổng Quan

Đây là đề xuất giải pháp để xây dựng hệ thống quản lý lịch làm việc cho các thợ tại La Perla Nails, cho phép:
1. **Đăng ký lịch làm việc trước** cho tuần tiếp theo
2. **Báo đến trễ** khi không thể đến đúng giờ
3. **Báo về sớm** khi cần rời đi sớm hơn dự kiến

## 📊 Phân Tích Hệ Thống Hiện Tại

### Các Tính Năng Đã Có
- ✅ **Staff Portal** (`StaffPortalView.tsx`): Portal riêng cho nhân viên
- ✅ **Payroll System** (`PayrollView.tsx`): Hệ thống tính lương theo tuần (Thứ 5 đến Thứ 4)
- ✅ **Staff Profiles** (`types.ts`): Hồ sơ nhân viên với thông tin cơ bản
- ✅ **Transaction Tracking**: Theo dõi giao dịch và doanh thu theo nhân viên
- ✅ **Kiosk Check-in**: Khách hàng có thể check-in tại kiosk

### Điểm Mạnh Có Thể Tận Dụng
- Đã có cơ sở dữ liệu Firebase Realtime
- Đã có hệ thống xác thực nhân viên
- Đã có timezone Sydney được xử lý đúng
- Đã có cấu trúc tuần làm việc (Thứ 5-Thứ 4)

## 🏗️ Kiến Trúc Đề Xuất

### 1. Cấu Trúc Dữ Liệu Mới

#### A. WorkSchedule Interface
```typescript
export interface WorkSchedule {
  id: string;
  staffId: string;
  staffName: string;
  weekStartDate: string; // YYYY-MM-DD (Thursday)
  weekEndDate: string;   // YYYY-MM-DD (Wednesday)
  scheduledDays: ScheduledDay[];
  createdAt: string;
  lastModified: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface ScheduledDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  status: 'scheduled' | 'confirmed' | 'absent' | 'late' | 'early_leave';
  scheduledStart: string; // "09:00"
  scheduledEnd: string;   // "18:00"
  actualStart?: string;   // Thời gian check-in thực tế
  actualEnd?: string;     // Thời gian check-out thực tế
  lateReason?: string;    // Lý do đến trễ
  earlyLeaveReason?: string; // Lý do về sớm
  notes?: string;
}
```

#### B. AttendanceRecord Interface
```typescript
export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO timestamp
  checkOutTime?: string; // ISO timestamp
  location?: {
    lat: number;
    lng: number;
  };
  device?: string; // "mobile" | "kiosk" | "admin"
  status: 'on_time' | 'late' | 'early_leave' | 'absent';
  notes?: string;
}
```

### 2. Firebase Database Structure

```
/schedules
  /{staffId}
    /{weekId}
      - id
      - staffId
      - staffName
      - weekStartDate
      - weekEndDate
      - scheduledDays []
      - status
      - createdAt
      - lastModified

/attendance
  /{date} (YYYY-MM-DD)
    /{staffId}
      - id
      - staffId
      - staffName
      - checkInTime
      - checkOutTime
      - location
      - status
      - notes

/schedule_requests
  /{requestId}
    - staffId
    - weekId
    - action: 'late_notification' | 'early_leave_request'
    - date
    - reason
    - requestedAt
    - status: 'pending' | 'approved' | 'rejected'
```

## 🎨 Giao Diện Người Dùng (UI)

### 1. Màn Hình Đăng Ký Lịch (Schedule Registration)

**Vị trí**: Tab mới trong `StaffPortalView`

**Tính năng**:
- 📅 Lịch tuần hiển thị 7 ngày (Thứ 5 - Thứ 4)
- ✏️ Click vào từng ngày để chọn ca làm việc:
  - Morning shift: 9:00 - 13:00
  - Afternoon shift: 13:00 - 18:00
  - Full day: 9:00 - 18:00
  - Custom time: Tự chọn giờ
- 💾 Nút "Save Draft" để lưu nháp
- ✅ Nút "Submit Schedule" để gửi lịch cho manager duyệt
- 📊 Hiển thị trạng thái: Draft / Submitted / Approved / Rejected

**Quy trình**:
1. Thợ mở portal vào Chủ Nhật hoặc Thứ Hai
2. Chọn tuần tiếp theo từ dropdown
3. Click vào các ngày để đăng ký ca
4. Submit lịch trước Thứ Ba 23:59
5. Manager duyệt trước Thứ Tư

### 2. Màn Hình Check-in/Check-out

**Vị trí**: Màn hình chính trong Staff Portal

**Tính năng**:
- 🟢 Nút "Check In" màu xanh lá (hiển thị khi chưa check-in)
- 🔴 Nút "Check Out" màu đỏ (hiển thị khi đã check-in)
- ⏰ Hiển thị thời gian check-in và số giờ đã làm
- 📍 Option: Lấy vị trí GPS (nếu cần)
- 📝 Trường nhập lý do nếu đến trễ hoặc về sớm

**Quy trình Check-in**:
1. Thợ click "Check In"
2. Hệ thống so sánh với lịch đã đăng ký
3. Nếu trễ > 15 phút → Bắt buộc nhập lý do
4. Lưu thời gian và trạng thái vào database

**Quy trình Check-out**:
1. Thợ click "Check Out"
2. Nếu về sớm hơn lịch > 30 phút → Bắt buộc nhập lý do
3. Lưu thời gian và tính tổng giờ làm

### 3. Màn Hình Báo Trước (Advance Notification)

**Vị trí**: Popup modal trong Staff Portal

**Tính năng**:
- 📢 Nút "Report Late Arrival" 
- 📢 Nút "Request Early Leave"
- 📝 Form nhập:
  - Ngày dự kiến trễ/về sớm
  - Thời gian dự kiến đến/về
  - Lý do
  - Ghi chú thêm (optional)
- 🔔 Gửi thông báo real-time cho manager

**Quy trình**:
1. Thợ biết trước sẽ đến trễ hoặc về sớm
2. Mở portal, click "Report Late" hoặc "Request Early Leave"
3. Điền form và submit
4. Manager nhận thông báo ngay lập tức
5. Manager approve/reject request

## 👨‍💼 Màn Hình Quản Lý (Admin View)

### 1. Schedule Management Tab

**Tính năng**:
- 📋 Danh sách tất cả schedule requests
- 🔍 Filter theo: Week / Staff / Status
- 👀 Preview lịch của từng thợ
- ✅ Approve/Reject buttons
- 📊 Biểu đồ tổng quan: Số thợ có lịch mỗi ngày

### 2. Attendance Dashboard

**Tính năng**:
- 📊 Bảng attendance hôm nay:
  - Cột: Tên thợ | Check-in | Check-out | Status | Hours
  - Màu sắc: Xanh (on time) / Vàng (late) / Đỏ (absent)
- 🔔 Notifications cho late arrivals và early leaves
- 📈 Báo cáo tuần/tháng:
  - Tỷ lệ đúng giờ của từng thợ
  - Tổng số giờ làm việc
  - Số lần đến trễ/về sớm
- 📥 Export CSV/PDF

### 3. Real-time Notifications

**Tính năng**:
- 🔔 Popup notification khi:
  - Có schedule request mới
  - Thợ báo trễ/về sớm
  - Thợ check-in/check-out
- 🔊 Option: Bật/tắt âm thanh thông báo
- 📱 Option: SMS/Email notification

## 🔧 Tính Năng Kỹ Thuật

### 1. Services Cần Thêm

```typescript
// services/scheduleService.ts
export const scheduleService = {
  // Schedule CRUD
  createSchedule(staffId, weekId, days)
  getSchedule(staffId, weekId)
  updateSchedule(scheduleId, updates)
  submitSchedule(scheduleId)
  approveSchedule(scheduleId, adminId)
  rejectSchedule(scheduleId, reason)
  
  // Attendance
  checkIn(staffId, location?)
  checkOut(staffId, reason?)
  getAttendance(staffId, date)
  getTodayAttendance()
  
  // Notifications
  notifyLateArrival(staffId, date, expectedTime, reason)
  notifyEarlyLeave(staffId, date, expectedTime, reason)
  
  // Reports
  getWeeklyReport(weekId)
  getMonthlyReport(month)
  getStaffAttendanceHistory(staffId, startDate, endDate)
}
```

### 2. Firebase Rules Cần Cập Nhật

```json
{
  "rules": {
    "schedules": {
      "$staffId": {
        ".read": "auth != null && (auth.uid === $staffId || root.child('admins').child(auth.uid).exists())",
        ".write": "auth != null && (auth.uid === $staffId || root.child('admins').child(auth.uid).exists())"
      }
    },
    "attendance": {
      "$date": {
        "$staffId": {
          ".read": "auth != null",
          ".write": "auth != null && (auth.uid === $staffId || root.child('admins').child(auth.uid).exists())"
        }
      }
    },
    "schedule_requests": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### 3. Components Cần Tạo Mới

```
components/
  scheduling/
    ScheduleCalendar.tsx        # Lịch đăng ký ca
    ScheduleWeekView.tsx        # Hiển thị lịch theo tuần
    ShiftSelector.tsx           # Chọn ca làm việc
    CheckInButton.tsx           # Nút check-in/out
    LateNotificationModal.tsx   # Modal báo trễ
    EarlyLeaveModal.tsx         # Modal xin về sớm
    AttendanceTable.tsx         # Bảng điểm danh admin
    ScheduleApprovalCard.tsx    # Card duyệt lịch
    AttendanceReport.tsx        # Báo cáo điểm danh
```

## 📱 Workflow Người Dùng

### Workflow Thợ (Staff)

**Tuần trước:**
```
Chủ Nhật/Thứ Hai
└─> Mở Staff Portal
    └─> Tab "My Schedule"
        └─> Click "Next Week"
            └─> Chọn các ngày muốn làm
                └─> Chọn ca cho mỗi ngày
                    └─> "Submit Schedule"
                        └─> Chờ manager duyệt
```

**Ngày làm việc:**
```
Buổi sáng
└─> Mở Staff Portal
    └─> Click "Check In"
        ├─> Đúng giờ → Check-in thành công
        └─> Trễ > 15 phút → Nhập lý do → Check-in

Buổi chiều
└─> Click "Check Out"
    ├─> Đúng giờ → Check-out thành công
    └─> Sớm > 30 phút → Nhập lý do → Check-out
```

**Khi có việc đột xuất:**
```
Biết trước sẽ trễ
└─> Mở Staff Portal
    └─> Click "Report Late"
        └─> Chọn ngày
            └─> Nhập giờ dự kiến đến
                └─> Nhập lý do
                    └─> Submit
                        └─> Manager nhận thông báo

Cần về sớm
└─> Click "Request Early Leave"
    └─> Tương tự như trên
```

### Workflow Manager (Admin)

**Đầu tuần:**
```
Thứ Ba/Thứ Tư
└─> Mở Admin View
    └─> Tab "Schedule Management"
        └─> Xem danh sách schedule requests
            └─> Preview từng lịch
                ├─> Click "Approve" → Lịch được xác nhận
                └─> Click "Reject" → Nhập lý do → Gửi về thợ
```

**Hàng ngày:**
```
Theo dõi attendance
└─> Tab "Attendance Dashboard"
    └─> Xem bảng check-in hôm nay
        ├─> Màu xanh: Đúng giờ
        ├─> Màu vàng: Trễ (xem lý do)
        └─> Màu đỏ: Chưa đến

Nhận notifications
└─> Popup thông báo
    ├─> Thợ báo trễ → Xem chi tiết → OK
    └─> Thợ xin về sớm → Approve/Reject
```

**Cuối tuần/tháng:**
```
Xem báo cáo
└─> Tab "Reports"
    └─> Chọn Week/Month
        └─> Xem:
            ├─> Tỷ lệ đúng giờ từng thợ
            ├─> Tổng giờ làm việc
            ├─> Biểu đồ attendance
            └─> Export PDF/CSV
```

## 🎯 Lợi Ích

### Cho Thợ
- ✅ Chủ động đăng ký lịch làm việc
- ✅ Minh bạch về giờ giấc và ca làm
- ✅ Dễ dàng báo trước khi có việc đột xuất
- ✅ Tránh hiểu lầm về giờ làm việc

### Cho Manager
- ✅ Biết trước lịch làm việc của tất cả thợ
- ✅ Dễ dàng sắp xếp nhân lực
- ✅ Theo dõi attendance real-time
- ✅ Có dữ liệu để đánh giá nhân viên
- ✅ Giảm thời gian quản lý thủ công

### Cho Salon
- ✅ Chuyên nghiệp hơn trong quản lý
- ✅ Tối ưu nhân lực theo nhu cầu
- ✅ Dữ liệu để phân tích và cải thiện
- ✅ Tích hợp với hệ thống payroll hiện tại

## 🚀 Kế Hoạch Triển Khai

### Phase 1: MVP (2-3 tuần)
- [ ] Tạo data types và interfaces
- [ ] Xây dựng Schedule Calendar component
- [ ] Implement Check-in/Check-out cơ bản
- [ ] Firebase database setup
- [ ] Staff Portal integration
- [ ] Admin approval workflow

### Phase 2: Advanced Features (2 tuần)
- [ ] Late notification system
- [ ] Early leave request system
- [ ] Real-time notifications
- [ ] GPS location tracking (optional)
- [ ] Attendance reports
- [ ] Mobile responsive optimization

### Phase 3: Integration (1 tuần)
- [ ] Tích hợp với Payroll system
- [ ] Export báo cáo (PDF/CSV)
- [ ] SMS/Email notifications (optional)
- [ ] Performance optimization
- [ ] Testing và bug fixes

### Phase 4: Polish & Deploy (1 tuần)
- [ ] UI/UX improvements
- [ ] Vietnamese translations
- [ ] User training materials
- [ ] Production deployment
- [ ] Monitoring và support

## 📝 Notes Kỹ Thuật

### Xử Lý Timezone
- Sử dụng timezone Sydney (đã có trong code)
- Lưu tất cả timestamps ở UTC trong database
- Convert sang Sydney time khi hiển thị

### Xử Lý Offline
- Cache schedule hiện tại ở local storage
- Cho phép check-in offline, sync khi online
- Hiển thị warning khi mất kết nối

### Security
- Thợ chỉ xem/sửa lịch của mình
- Manager xem tất cả, approve/reject
- Firebase rules bảo vệ dữ liệu
- Optional: GPS verification để chống gian lận

### Performance
- Lazy load schedules (chỉ load tuần hiện tại và tuần sau)
- Index Firebase queries theo staffId và date
- Debounce real-time updates
- Optimize rendering với React.memo

## 💡 Các Tùy Chọn Mở Rộng

### Tương Lai Có Thể Thêm:
- 🤝 **Shift Trading**: Thợ đổi ca cho nhau
- 📲 **Push Notifications**: Thông báo qua app
- 🌐 **Multi-language**: Support thêm các ngôn ngữ
- 📊 **Advanced Analytics**: ML dự đoán attendance patterns
- 🎯 **Smart Scheduling**: AI suggest lịch tối ưu dựa trên lịch sử
- ⏰ **Break Time Tracking**: Theo dõi giờ nghỉ giữa ca
- 💰 **OT Calculation**: Tính tự động giờ làm thêm
- 📱 **Biometric Check-in**: Vân tay/Face ID

## 🔗 Tích Hợp Với Hệ Thống Hiện Tại

### PayrollView Integration
```typescript
// Tích hợp dữ liệu attendance vào tính lương
interface PayrollDailyBreakdown {
  // Existing fields...
  hoursWorked?: number;        // Từ attendance
  scheduledHours?: number;     // Từ schedule
  lateMinutes?: number;        // Tính từ check-in
  earlyLeaveMinutes?: number;  // Tính từ check-out
}
```

### StaffPortalView Integration
```typescript
// Thêm tabs mới vào portal
type PortalTab = 
  | 'overview'          // Existing
  | 'schedule'          // NEW: Đăng ký lịch
  | 'attendance'        // NEW: Lịch sử check-in/out
  | 'transactions'      // Existing
  | 'portfolio';        // Existing
```

## 📞 Support & Documentation

Sau khi implement, cần chuẩn bị:
- 📖 User manual (Vietnamese)
- 🎥 Video hướng dẫn sử dụng
- ❓ FAQ document
- 🐛 Bug report template
- 💬 Support channel (SMS/WhatsApp/Email)

## ✅ Tổng Kết

Đây là một giải pháp toàn diện để quản lý lịch làm việc và attendance cho La Perla Nails. Hệ thống:

1. **Dễ sử dụng**: Giao diện đơn giản, trực quan
2. **Linh hoạt**: Thợ chủ động đăng ký, manager kiểm soát
3. **Minh bạch**: Mọi người đều biết lịch của nhau
4. **Tích hợp**: Hoạt động mượt mà với hệ thống hiện tại
5. **Mở rộng**: Dễ dàng thêm tính năng mới sau này

**Thời gian ước tính**: 6-8 tuần cho full implementation
**Độ phức tạp**: Trung bình (tận dụng được nhiều code hiện có)
**ROI**: Cao (tiết kiệm rất nhiều thời gian quản lý thủ công)

---

**📌 Lưu ý**: Đây chỉ là đề xuất chi tiết. Chưa có code nào được thay đổi. Nếu đồng ý với hướng đi này, chúng ta có thể bắt đầu implement từng phase một.

**Câu hỏi cần thảo luận**:
1. Có cần GPS tracking không?
2. Có cần SMS/Email notifications không?
3. Thời gian deadline submit schedule (Thứ Ba 23:59 có OK không)?
4. Có cần tính năng đổi ca giữa các thợ không?
5. Có muốn tích hợp biometric check-in không?
