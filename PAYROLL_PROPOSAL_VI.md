# ĐỀ XUẤT TÍNH NĂNG TÍNH LƯƠNG & IN BẢNG LƯƠNG NHÂN VIÊN
## Employee Payroll Calculation & Print Feature Proposal

---

## 📋 PHÂN TÍCH HIỆN TRẠNG / CURRENT STATE

Hệ thống hiện tại đã có:
- ✅ Quản lý thông tin nhân viên (tên, mật khẩu, avatar)
- ✅ Cấu hình payroll cho từng nhân viên:
  - Base Salary (Lương cơ bản hàng ngày)
  - Bonus Rate (% hoa hồng trên doanh thu vượt target)
- ✅ Thiết lập Revenue Target theo từng ngày trong tuần
- ✅ Theo dõi doanh thu theo nhân viên trong Dashboard
- ✅ Tính toán tự động bonus dựa trên (Revenue - Target) × Bonus Rate
- ✅ Hiển thị tổng Revenue và Bonus trong "Stylist Performance"

**Những gì còn thiếu:**
- ❌ Không có trang riêng để tổng hợp và xem chi tiết lương của từng nhân viên
- ❌ Không có chức năng in/export bảng lương
- ❌ Không có lịch sử bảng lương theo tháng
- ❌ Không có chức năng điều chỉnh/ghi chú thêm (trừ lương, thưởng đặc biệt, v.v.)

---

## 🎯 PHƯƠNG ÁN 1: TRANG TÍNH LƯƠNG ĐƠN GIẢN (Simple Payroll Page)

### Mô tả:
Thêm một tab mới "Payroll" trong AdminView với các tính năng cơ bản.

### Tính năng:

#### 1. **Bảng tổng hợp lương theo tháng**
```
┌────────────────────────────────────────────────────────┐
│  Tháng: [Chọn tháng] [2024 ▼]          [🔄 Refresh]   │
├────────────────────────────────────────────────────────┤
│  Nhân viên      Ngày làm   Doanh thu    Bonus   Tổng  │
│  ─────────────────────────────────────────────────────│
│  🧑 Hương          15      $4,500      $250   $2,500  │
│  🧑 Mai            18      $5,200      $320   $3,020  │
│  🧑 Linh           12      $3,800      $150   $1,950  │
└────────────────────────────────────────────────────────┘
```

#### 2. **Chi tiết lương từng nhân viên** (Click vào tên)
- Danh sách các ngày làm việc trong tháng
- Doanh thu từng ngày
- Target vs Actual revenue
- Bonus tính được mỗi ngày
- Tổng: Base Salary × Số ngày + Total Bonus

#### 3. **Nút in bảng lương**
- Xuất PDF hoặc in trực tiếp
- Format đẹp, có logo La Perla
- Có chữ ký và xác nhận

### Ưu điểm:
- ✅ Đơn giản, dễ implement (1-2 ngày)
- ✅ Sử dụng data có sẵn từ transactions
- ✅ Không cần thêm database mới
- ✅ Tích hợp ngay trong AdminView hiện tại

### Nhược điểm:
- ❌ Chỉ tính toán tự động, không điều chỉnh được
- ❌ Không lưu lịch sử "đã thanh toán"
- ❌ Không có tính năng trừ lương, phạt, thưởng thêm

### Công việc cần làm:
1. Thêm tab "Payroll" trong AdminView
2. Tạo component PayrollSummary
3. Thêm translation cho tiếng Việt
4. Implement logic tính lương theo tháng
5. Tạo function print/export PDF
6. Test và chụp screenshot

**Thời gian ước tính: 1-2 ngày**

---

## 🎯 PHƯƠNG ÁN 2: TRANG TÍNH LƯƠNG NÂNG CAO (Advanced Payroll Page)

### Mô tả:
Trang payroll độc lập với đầy đủ tính năng quản lý lương, cho phép điều chỉnh và lưu lịch sử.

### Tính năng:

#### 1. **Chọn kỳ lương**
```
┌──────────────────────────────────────────┐
│  Chọn kỳ lương:                          │
│  ⭕ Tháng [Tháng 12 ▼] [2024 ▼]         │
│  ⭕ Khoảng tùy chọn: [01/12] đến [31/12] │
│  [📊 Xem Bảng Lương]                     │
└──────────────────────────────────────────┘
```

#### 2. **Bảng lương chi tiết với điều chỉnh**
```
┌─────────────────────────────────────────────────────────────────┐
│  Nhân viên: HƯƠNG (ID: 001)                                     │
├─────────────────────────────────────────────────────────────────┤
│  📅 Số ngày làm: 20 ngày                                        │
│  💰 Lương cơ bản: $150/ngày × 20 = $3,000                      │
│  📈 Doanh thu cá nhân: $6,500                                   │
│  🎯 Target: $5,000                                              │
│  💎 Bonus (20%): ($6,500 - $5,000) × 20% = $300                │
│  ─────────────────────────────────────────────────────────────  │
│  ➕ Thưởng thêm:        [+$0]    [Ghi chú...]                  │
│  ➖ Trừ lương/Phạt:     [-$0]    [Ghi chú...]                  │
│  💵 Tạm ứng:            [-$0]    [Ghi chú...]                  │
│  ─────────────────────────────────────────────────────────────  │
│  🏆 TỔNG LƯƠNG THỰC NHẬN: $3,300                               │
│                                                                  │
│  [✏️ Lưu Thay Đổi]  [💾 Lưu & Đánh dấu đã trả]  [🖨️ In]      │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. **Lịch sử bảng lương**
- Lưu trạng thái "Đã trả" / "Chưa trả"
- Ngày thanh toán
- Người thanh toán (admin nào)
- Không thể chỉnh sửa sau khi đã đánh dấu "Đã trả"

#### 4. **Báo cáo tổng hợp**
- Tổng chi phí lương theo tháng
- So sánh với các tháng trước
- Export Excel với tất cả nhân viên
- Biểu đồ chi phí lương theo thời gian

#### 5. **In bảng lương chuyên nghiệp**
- Template đẹp, có logo
- QR code để verify (optional)
- Chữ ký điện tử
- Mã hóa để bảo mật

### Ưu điểm:
- ✅ Đầy đủ tính năng quản lý lương
- ✅ Linh hoạt điều chỉnh (thưởng, phạt, tạm ứng)
- ✅ Lưu lịch sử, kiểm soát tốt
- ✅ Chuyên nghiệp, phù hợp dài hạn

### Nhược điểm:
- ❌ Phức tạp hơn, cần thêm database
- ❌ Thời gian implement dài hơn (3-5 ngày)
- ❌ Cần quyền admin cao hơn để chỉnh sửa

### Công việc cần làm:
1. Tạo type PayrollRecord trong types.ts
2. Thêm Firebase collection "payroll_records"
3. Tạo component PayrollCalculator
4. Implement logic điều chỉnh và lưu trữ
5. Tạo hệ thống in/export nâng cao
6. Thêm authorization (chỉ Master admin mới sửa được)
7. Translation đầy đủ cho tiếng Việt
8. Test kỹ lưỡng và chụp screenshot

**Thời gian ước tính: 3-5 ngày**

---

## 🎯 PHƯƠNG ÁN 3: TÍNH NĂNG HYBRID (Khuyến nghị)

### Mô tả:
Kết hợp ưu điểm của cả 2 phương án trên - bắt đầu đơn giản nhưng có thể mở rộng sau.

### Giai đoạn 1 (Immediate - 1-2 ngày):
Implement **Phương án 1** với bổ sung:
- ✅ Tab "Payroll" trong AdminView
- ✅ Bảng tổng hợp lương theo tháng
- ✅ Chi tiết lương từng nhân viên
- ✅ **THÊM:** Ô input cho "Điều chỉnh" (adjustment) ngay trên UI
- ✅ **THÊM:** Ô ghi chú cho mỗi nhân viên
- ✅ Export CSV đơn giản
- ✅ In PDF cơ bản

### Giai đoạn 2 (Future Enhancement - Khi cần):
Nâng cấp lên **Phương án 2** khi cần:
- Lưu lịch sử bảng lương vào Firebase
- Trạng thái "Đã trả"/"Chưa trả"
- Báo cáo nâng cao
- In phiếu lương chuyên nghiệp hơn

### Ưu điểm:
- ✅ Triển khai nhanh, sử dụng ngay
- ✅ Linh hoạt điều chỉnh (có input adjustment)
- ✅ Dễ nâng cấp sau này
- ✅ Không quá phức tạp ban đầu
- ✅ Cost-effective (tối ưu thời gian)

### Nhược điểm:
- ⚠️ Điều chỉnh chỉ tạm thời (không lưu lịch sử ngay)
- ⚠️ Cần implement thêm ở giai đoạn 2 nếu muốn lưu trữ

### Công việc Giai đoạn 1:
1. Thêm tab "Payroll" trong AdminView
2. Component PayrollView với:
   - Month/Year selector
   - Bảng tổng hợp tất cả nhân viên
   - Detail view cho từng nhân viên
   - Input fields cho adjustment & notes
3. Logic tính lương:
   - Tự động: Base Salary × Days + Bonus
   - Manual adjustment field
   - Final total = Auto + Adjustment
4. Export functions:
   - Export to CSV (all staff)
   - Print individual payslip (PDF)
5. Translation (Vietnamese + English)
6. Styling phù hợp với design hiện tại

**Thời gian ước tính Giai đoạn 1: 1-2 ngày**

---

## 📊 SO SÁNH CÁC PHƯƠNG ÁN

| Tiêu chí | Phương án 1 | Phương án 2 | Phương án 3 |
|----------|-------------|-------------|-------------|
| Thời gian implement | 1-2 ngày | 3-5 ngày | 1-2 ngày (giai đoạn 1) |
| Độ phức tạp | Thấp | Cao | Trung bình |
| Tính năng điều chỉnh | ❌ Không | ✅ Đầy đủ | ✅ Cơ bản |
| Lưu lịch sử | ❌ Không | ✅ Có | ⚠️ Sau này |
| In/Export | PDF cơ bản | PDF chuyên nghiệp | CSV + PDF cơ bản |
| Khả năng mở rộng | Thấp | Cao | Cao |
| Phù hợp cho | Sử dụng ngay | Dài hạn | Cả 2 |
| Chi phí phát triển | Thấp | Cao | Thấp → Cao |

---

## 🎯 KHUYẾN NGHỊ

**Tôi khuyến nghị chọn PHƯƠNG ÁN 3 (Hybrid)** vì:

1. ✅ **Sử dụng ngay được** - Có thể tính lương và in ngay trong 1-2 ngày
2. ✅ **Linh hoạt** - Có thể điều chỉnh lương (thưởng/phạt) trực tiếp trên UI
3. ✅ **Tiết kiệm** - Không mất nhiều thời gian ban đầu
4. ✅ **Có thể nâng cấp** - Dễ dàng thêm tính năng lưu trữ sau nếu cần
5. ✅ **Phù hợp workflow** - Match với cách làm việc hiện tại của salon

### UI Mock-up (Phương án 3):

```
┌──────────────────────────────────────────────────────────┐
│  💰 TÍNH LƯƠNG NHÂN VIÊN / PAYROLL                       │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Chọn tháng: [Tháng 12 ▼] [2024 ▼]  [🔄 Tính lại]       │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Nhân viên  Ngày  Doanh thu  Bonus  Điều chỉnh  Tổng│  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Hương  👁️  15    $4,500    $250   [+$0]    $2,500 │  │
│  │ Mai    👁️  18    $5,200    $320   [+$0]    $3,020 │  │
│  │ Linh   👁️  12    $3,800    $150   [+$0]    $1,950 │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  [📥 Export CSV]  [🖨️ In tất cả bảng lương]             │
└──────────────────────────────────────────────────────────┘

Click 👁️ để xem chi tiết và in phiếu lương cá nhân
```

---

## ❓ CÂU HỎI DUYỆT

Anh/Chị vui lòng cho em biết:

1. **Phương án nào anh/chị muốn chọn?**
   - [ ] Phương án 1 - Đơn giản
   - [ ] Phương án 2 - Nâng cao
   - [ ] Phương án 3 - Hybrid (Khuyến nghị)
   - [ ] Phương án khác (mô tả thêm)

2. **Các tính năng bổ sung cần có không?**
   - [ ] Gửi email bảng lương cho nhân viên
   - [ ] Chữ ký điện tử trên phiếu lương
   - [ ] Export Excel (ngoài CSV)
   - [ ] Biểu đồ so sánh lương theo tháng
   - [ ] In nhiều phiếu lương cùng lúc
   - [ ] Tính năng tạm ứng lương giữa tháng

3. **Ngôn ngữ ưu tiên?**
   - [ ] Tiếng Việt chính, English phụ
   - [ ] English chính, Tiếng Việt phụ
   - [ ] Song ngữ ngang nhau

4. **Format in bảng lương?**
   - [ ] PDF đơn giản (nhanh)
   - [ ] PDF chuyên nghiệp (có logo, thiết kế đẹp)
   - [ ] Cả 2 (có thể chọn)

---

## 🚀 SAU KHI DUYỆT

Em sẽ:
1. ✅ Implement phương án đã chọn
2. ✅ Test kỹ các tính năng
3. ✅ Chụp screenshot demo
4. ✅ Tạo video hướng dẫn sử dụng (nếu cần)
5. ✅ Deploy và báo cáo hoàn thành

---

**Prepared by:** GitHub Copilot AI Agent  
**Date:** December 29, 2024  
**For:** La Perla Nails & Beauty Management System
