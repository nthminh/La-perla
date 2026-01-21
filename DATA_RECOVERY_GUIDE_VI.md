# 🆘 Hướng Dẫn Khẩn Cấp: Phục Hồi Dữ Liệu Bị Mất

## ⚠️ TÌNH HUỐNG

Tất cả dữ liệu trên cloud đã bị xóa và trở về 0 sau khi thêm chức năng mở tủ tiền và chỉnh sửa preview bill.

## 🔍 NGUYÊN NHÂN

**Kết luận điều tra:**
- ✅ Chức năng mở tủ tiền (`openCashDrawer`) KHÔNG gây mất dữ liệu
- ✅ Chức năng preview bill KHÔNG gây mất dữ liệu  
- ❌ Có hàm nguy hiểm `deleteAllTransactions()` trong code có thể xóa toàn bộ dữ liệu
- ⚠️ Dữ liệu có thể đã bị xóa do:
  - Gọi hàm `deleteAllTransactions()` qua browser console
  - Ai đó vô tình trigger hàm này
  - Firebase rules bị thay đổi
  - Export/Import dữ liệu sai

## 🚀 PHỤC HỒI NGAY

### Bước 1: Kiểm Tra Firebase Console (ƯU TIÊN CAO NHẤT)

Firebase có thể tự động backup dữ liệu của bạn!

1. **Truy cập Firebase Console**
   ```
   https://console.firebase.google.com/
   ```

2. **Chọn Project**
   - Tìm project: `la-perla-53540395-70c43` (hoặc tên project của bạn)
   - Click vào project

3. **Vào Realtime Database**
   - Menu bên trái → "Realtime Database"
   - Xem tab "Data" để kiểm tra dữ liệu hiện tại

4. **Kiểm Tra Backups**
   - Tìm tab "Backups" (nếu có)
   - Nếu có sẵn backup tự động → **Bước 2**
   - Nếu không có → **Bước 3**

### Bước 2: Phục Hồi Từ Firebase Automated Backup

**Nếu bạn thấy tab "Backups" với các backup points:**

1. **Chọn Backup Point**
   - Tìm backup từ TRƯỚC KHI mất dữ liệu
   - Thường là backup ngày hôm qua hoặc hôm kia
   - Click vào backup point đó

2. **Restore**
   - Click nút "Restore" hoặc "Download"
   - Nếu có "Restore": Click và xác nhận
   - ⚠️ **LƯU Ý**: Restore sẽ GHI ĐÈ dữ liệu hiện tại!

3. **Xác Nhận**
   - Mở ứng dụng và kiểm tra dữ liệu
   - Nếu thành công → **XONG!** ✅

### Bước 3: Phục Hồi Từ GitHub Actions Backup

**Kiểm tra xem có GitHub Actions backup không:**

1. **Vào GitHub Repository**
   ```
   https://github.com/nthminh/La-perla/actions
   ```

2. **Tìm Workflow "Firebase Backup"**
   - Xem các workflow runs gần đây
   - Tìm run thành công (có dấu ✅ xanh)

3. **Download Backup Artifacts**
   - Click vào workflow run
   - Phần "Artifacts" → Download file backup JSON
   - Lưu file: `firebase-backup-YYYY-MM-DD.json`

4. **Restore Backup** (xem Bước 5)

### Bước 4: Kiểm Tra Local Backups

**Nếu bạn đã chạy backup scripts trước đó:**

1. **Kiểm tra thư mục backups**
   ```bash
   cd /path/to/La-perla
   ls -lh backups/
   ```

2. **Tìm file backup gần nhất**
   ```
   database-backup-2026-01-20-14-30-00.json
   ```

3. **Nếu có file backup → Bước 5**

### Bước 5: Import Backup Vào Firebase

**Cách 1: Sử Dụng Script (Khuyến Nghị)**

```bash
# Di chuyển vào thư mục project
cd /path/to/La-perla

# Đảm bảo có quyền thực thi
chmod +x scripts/firebase-restore.sh

# Chạy restore (thay tên file cho đúng)
./scripts/firebase-restore.sh backups/database-backup-2026-01-20.json
```

**Cách 2: Import Thủ Công Qua Firebase Console**

1. **Mở Firebase Console**
   - https://console.firebase.google.com/
   - Chọn project → Realtime Database

2. **Vào Tab "Data"**
   - Click vào root node `/`

3. **Import JSON**
   - Click menu 3 chấm (⋮) bên phải
   - Chọn "Import JSON"
   - Chọn file backup
   - **CHỌN "Merge" hoặc "Overwrite"**:
     - **Merge**: Giữ dữ liệu mới + thêm dữ liệu cũ
     - **Overwrite**: Xóa tất cả và chỉ dùng backup
   - Click "Import"

4. **Kiểm Tra Dữ Liệu**
   - Refresh page
   - Xem dữ liệu đã được phục hồi chưa

### Bước 6: Kiểm Tra Local Storage

**Dữ liệu cũng được lưu trong browser:**

1. **Mở Developer Tools**
   - Chrome/Edge: F12 hoặc Ctrl+Shift+I
   - Firefox: F12 hoặc Ctrl+Shift+K

2. **Vào Tab "Application" (Chrome) hoặc "Storage" (Firefox)**

3. **Kiểm Tra Local Storage**
   ```
   Key: la_perla_transactions
   ```

4. **Copy Dữ Liệu**
   - Nếu còn data trong localStorage
   - Copy toàn bộ JSON value
   - Lưu vào file: `local-backup.json`

5. **Sync Lại Lên Firebase**
   - Vào Admin Panel trong app
   - Có thể có nút "Sync to Cloud" hoặc tương tự
   - Hoặc sử dụng script restore với file JSON này

## 🛡️ PHÒNG NGỪA SAU NÀY

### 1. Setup Backup Tự Động

**Cài đặt GitHub Actions Backup (Khuyến Nghị):**

```bash
# File đã có sẵn: .github/workflows/firebase-backup.yml
# Chỉ cần setup Firebase Service Account
```

1. **Lấy Service Account Key**
   - Firebase Console → Project Settings
   - Tab "Service Accounts"
   - Click "Generate New Private Key"
   - Lưu file JSON

2. **Thêm vào GitHub Secrets**
   - GitHub repo → Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste toàn bộ nội dung JSON
   - Add secret

3. **Kích Hoạt Workflow**
   - Backup sẽ tự động chạy mỗi ngày lúc 2:00 AM (Sydney time)
   - Hoặc chạy manual: Actions → Firebase Backup → Run workflow

### 2. Backup Thủ Công Định Kỳ

**Tạo backup mỗi tuần:**

```bash
# Chạy script
./scripts/firebase-backup.sh

# Backup được lưu vào thư mục backups/
# Tên file: database-backup-YYYY-MM-DD-HH-MM-SS.json
```

### 3. Enable Firebase Automated Backups

1. Firebase Console → Realtime Database
2. Tìm "Automated Backups" (có thể cần upgrade plan)
3. Enable nếu có

### 4. Code Safeguards (ĐÃ THÊM)

✅ Hàm `deleteAllTransactions()` đã được bảo vệ:
- Yêu cầu confirmation text: "DELETE ALL TRANSACTIONS"
- Ghi log mọi thao tác xóa
- Block các cuộc gọi không có confirmation

## 📞 NẾU VẪN KHÔNG PHỤC HỒI ĐƯỢC

### Liên Hệ Firebase Support

1. **Firebase Console**
   - Menu → Support
   - "Contact Support"

2. **Cung Cấp Thông Tin**
   - Project ID: `la-perla-53540395-70c43`
   - Ngày/giờ mất dữ liệu: [điền vào]
   - Yêu cầu: Restore database to previous state

3. **Hỏi Về**
   - Point-in-time recovery
   - Transaction logs
   - Undelete operations

### Kiểm Tra Browser Cache

**Nếu app đã mở trước đó:**

1. Mở DevTools → Application → Cache Storage
2. Tìm các cache entries
3. Có thể có dữ liệu cũ trong cache

### Hỏi Người Dùng Khác

**Nếu nhiều người dùng app:**
- Dữ liệu có thể còn trong localStorage của máy khác
- Yêu cầu họ:
  1. Mở DevTools
  2. Application → Local Storage
  3. Export key `la_perla_transactions`
  4. Gửi cho bạn

## ✅ CHECKLIST PHỤC HỒI

- [ ] Kiểm tra Firebase Automated Backups
- [ ] Tìm GitHub Actions backup artifacts
- [ ] Kiểm tra local backups folder
- [ ] Xem localStorage trong browser
- [ ] Liên hệ Firebase Support
- [ ] Hỏi users khác về local data
- [ ] Setup backup tự động để tránh tái diễn

## 🔗 TÀI LIỆU LIÊN QUAN

- [FIREBASE_BACKUP_RESTORE_VI.md](FIREBASE_BACKUP_RESTORE_VI.md) - Hướng dẫn chi tiết backup/restore
- [BACKUP_RESTORE_START_HERE.md](BACKUP_RESTORE_START_HERE.md) - Quick start guide
- [scripts/firebase-backup.sh](scripts/firebase-backup.sh) - Script tạo backup
- [scripts/firebase-restore.sh](scripts/firebase-restore.sh) - Script phục hồi

## 📝 GHI CHÚ

**Code changes liên quan đến vấn đề:**
- ✅ Cash drawer feature (`utils/cashDrawer.ts`) - KHÔNG ảnh hưởng đến data
- ✅ Invoice preview fix (`components/PricingView.tsx`) - KHÔNG ảnh hưởng đến data
- ⚠️ Function `deleteAllTransactions()` trong `firebaseService.ts` - ĐÃ ĐƯỢC BẢO VỆ

**Bảo vệ đã thêm:**
- Requires confirmation text to delete all data
- Logs all deletion operations
- Blocks accidental calls

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** 21/01/2026  
**Mục đích:** Hướng dẫn phục hồi dữ liệu khẩn cấp
