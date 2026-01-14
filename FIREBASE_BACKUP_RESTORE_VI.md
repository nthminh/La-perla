# 🔄 Hướng Dẫn Sao Lưu & Phục Hồi Firebase

## 📋 Tổng Quan

Hướng dẫn này giúp bạn sao lưu và phục hồi dữ liệu Firebase Realtime Database về phiên bản trước đó (ví dụ: ngày hôm qua).

## ⚠️ LƯU Ý QUAN TRỌNG

**Firebase không tự động tạo backup hàng ngày!** Bạn cần:
1. Thiết lập backup tự động (xem bên dưới)
2. HOẶC tạo backup thủ công thường xuyên
3. HOẶC sử dụng tính năng Backups của Firebase (nếu đã bật)

## 🎯 CÁC PHƯƠNG ÁN PHỤC HỒI

### Phương Án 1: Sử Dụng Firebase Console (Nếu Đã Bật Backups)

Nếu bạn đã bật tính năng Automated Backups trong Firebase:

1. **Truy cập Firebase Console**
   - Mở https://console.firebase.google.com/
   - Chọn project: `la-perla-53540395-70c43`

2. **Vào Realtime Database**
   - Menu bên trái → Realtime Database
   - Chọn tab "Backups" (nếu có)

3. **Chọn Backup Cần Phục Hồi**
   - Tìm backup từ ngày hôm qua
   - Click "Restore"
   - Xác nhận phục hồi

⚠️ **CHÚ Ý**: Việc phục hồi sẽ **GHI ĐÈ** toàn bộ dữ liệu hiện tại!

### Phương Án 2: Sử Dụng Backup Thủ Công (Nếu Đã Tạo)

Nếu bạn đã tạo file backup JSON trước đó:

1. **Xuất Dữ Liệu Hiện Tại (An Toàn)**
   ```bash
   # Chạy script sao lưu trước
   ./scripts/firebase-backup.sh
   ```

2. **Import File Backup Cũ**
   ```bash
   # Phục hồi từ file backup
   ./scripts/firebase-restore.sh backups/database-backup-YYYY-MM-DD.json
   ```

3. **Xác Nhận Dữ Liệu**
   - Mở app và kiểm tra dữ liệu
   - Đảm bảo mọi thứ đã được phục hồi đúng

### Phương Án 3: Export/Import Thủ Công Qua Firebase Console

#### Bước 1: Export Dữ Liệu Hiện Tại (Backup An Toàn)

1. Mở Firebase Console
2. Realtime Database → Data tab
3. Click vào root node (/)
4. Click menu 3 chấm (⋮) → Export JSON
5. Lưu file: `database-backup-current.json`

#### Bước 2: Phục Hồi Từ Backup Cũ

**Nếu bạn có file backup từ ngày hôm qua:**

1. Xóa dữ liệu hiện tại (hoặc một phần cần phục hồi):
   - Chọn node cần phục hồi
   - Click menu 3 chấm (⋮) → Delete

2. Import file backup cũ:
   - Click vào parent node
   - Click menu 3 chấm (⋮) → Import JSON
   - Chọn file backup từ ngày hôm qua
   - Click "Import"

## 🛠️ CÀI ĐẶT BACKUP TỰ ĐỘNG

### Bước 1: Cài Đặt Firebase CLI

```bash
npm install -g firebase-tools
```

### Bước 2: Đăng Nhập Firebase

```bash
firebase login
```

### Bước 3: Tạo Script Backup Tự Động

Script backup đã được tạo sẵn tại `scripts/firebase-backup.sh`. Chạy:

```bash
# Tạo backup thủ công
./scripts/firebase-backup.sh

# File backup sẽ được lưu tại: backups/database-backup-YYYY-MM-DD-HH-MM-SS.json
```

### Bước 4: Thiết Lập Backup Hàng Ngày (Linux/Mac)

Thêm vào crontab để chạy tự động mỗi ngày lúc 2:00 sáng:

```bash
# Mở crontab
crontab -e

# Thêm dòng này (thay đổi đường dẫn cho phù hợp):
0 2 * * * cd /path/to/La-perla && ./scripts/firebase-backup.sh
```

### Bước 5: Thiết Lập Backup Trên GitHub Actions (Khuyến Nghị)

Đã tạo workflow tự động tại `.github/workflows/firebase-backup.yml`. Workflow này:
- Chạy tự động mỗi ngày lúc 2:00 AM UTC
- Có thể chạy thủ công bất kỳ lúc nào
- Lưu backup dưới dạng artifact (giữ 7 ngày)

**Chạy thủ công trên GitHub:**
1. Vào https://github.com/nthminh/La-perla/actions
2. Chọn workflow "Firebase Database Backup"
3. Click "Run workflow"

## 🔧 SỬ DỤNG SCRIPTS

### Script Backup: `scripts/firebase-backup.sh`

**Cách sử dụng:**
```bash
# Backup toàn bộ database
./scripts/firebase-backup.sh

# Backup với tên file tùy chỉnh
./scripts/firebase-backup.sh custom-backup.json
```

**File output:**
- Vị trí: `backups/database-backup-YYYY-MM-DD-HH-MM-SS.json`
- Format: JSON đầy đủ của database

### Script Restore: `scripts/firebase-restore.sh`

**Cách sử dụng:**
```bash
# Phục hồi từ file backup
./scripts/firebase-restore.sh backups/database-backup-2026-01-13-14-30-00.json

# Phục hồi chỉ một phần của database
./scripts/firebase-restore.sh backups/database-backup-2026-01-13-14-30-00.json /customers
```

**Tham số:**
- Tham số 1 (bắt buộc): Đường dẫn đến file backup JSON
- Tham số 2 (tùy chọn): Path trong database cần phục hồi (vd: /customers, /bookings)

## 📁 CẤU TRÚC THỦ MỤC BACKUP

```
La-perla/
├── backups/
│   ├── database-backup-2026-01-13-14-30-00.json
│   ├── database-backup-2026-01-12-14-30-00.json
│   ├── database-backup-2026-01-11-14-30-00.json
│   └── ...
├── scripts/
│   ├── firebase-backup.sh
│   └── firebase-restore.sh
└── .github/
    └── workflows/
        └── firebase-backup.yml
```

## 🎯 QUY TRÌNH PHỤC HỒI KHUYẾN NGHỊ

### Khi Cần Phục Hồi Dữ Liệu:

1. **Backup Dữ Liệu Hiện Tại Trước**
   ```bash
   ./scripts/firebase-backup.sh
   ```

2. **Xác Định File Backup Cần Phục Hồi**
   ```bash
   ls -lh backups/
   ```

3. **Kiểm Tra Nội Dung Backup (Tùy Chọn)**
   ```bash
   cat backups/database-backup-YYYY-MM-DD.json | jq '.' | less
   ```

4. **Thực Hiện Phục Hồi**
   ```bash
   ./scripts/firebase-restore.sh backups/database-backup-YYYY-MM-DD.json
   ```

5. **Xác Nhận Kết Quả**
   - Mở app: https://la-perla-53540395-70c43.web.app
   - Đăng nhập và kiểm tra dữ liệu
   - Xác nhận mọi thứ đã được phục hồi đúng

## ⚠️ LƯU Ý AN TOÀN

### Trước Khi Phục Hồi:

1. ✅ **LUÔN backup dữ liệu hiện tại trước**
2. ✅ Thông báo cho team đang thực hiện phục hồi
3. ✅ Chọn đúng file backup và kiểm tra ngày tháng
4. ✅ Đọc kỹ xác nhận trước khi thực thi

### Sau Khi Phục Hồi:

1. ✅ Kiểm tra toàn bộ chức năng của app
2. ✅ Xác nhận dữ liệu quan trọng (khách hàng, booking, nhân viên)
3. ✅ Thông báo cho team phục hồi đã hoàn tất
4. ✅ Giữ lại file backup hiện tại để có thể rollback nếu cần

## 🔍 KHẮC PHỤC SỰ CỐ

### Vấn Đề 1: Không Có Backup Từ Ngày Hôm Qua

**Giải pháp:**
- Kiểm tra trong thư mục `backups/` xem có backup nào gần nhất không
- Kiểm tra GitHub Actions artifacts (giữ 7 ngày)
- Liên hệ team xem ai có backup local
- Nếu không có backup nào: Không thể phục hồi, chỉ có thể khôi phục thủ công

### Vấn Đề 2: Script Backup Báo Lỗi

**Nguyên nhân thường gặp:**
- Chưa cài Firebase CLI: `npm install -g firebase-tools`
- Chưa đăng nhập: `firebase login`
- Không có quyền truy cập database

**Giải pháp:**
```bash
# Cài đặt Firebase CLI
npm install -g firebase-tools

# Đăng nhập
firebase login

# Kiểm tra project
firebase projects:list
```

### Vấn Đề 3: Restore Không Hoạt Động

**Giải pháp:**
1. Kiểm tra file backup có tồn tại không
2. Kiểm tra format JSON có hợp lệ không
3. Kiểm tra quyền ghi vào database
4. Thử restore thủ công qua Firebase Console

### Vấn Đề 4: Dữ Liệu Bị Mất Sau Khi Restore

**Giải pháp:**
- Restore lại từ backup hiện tại đã tạo ở bước 1
- File backup nằm ở: `backups/database-backup-[timestamp].json`

## 📊 TỰ ĐỘNG HÓA BACKUP

### Backup Hàng Ngày Qua GitHub Actions (Đã Setup)

Workflow đã được cấu hình để:
- ✅ Chạy tự động mỗi ngày lúc 2:00 AM UTC
- ✅ Có thể chạy thủ công bất kỳ lúc nào
- ✅ Lưu backup dưới dạng artifact
- ✅ Giữ backup trong 7 ngày

**Xem backup:**
1. Vào https://github.com/nthminh/La-perla/actions
2. Chọn workflow run gần nhất
3. Download artifact `firebase-backup`

### Backup Định Kỳ Trên Server

Nếu chạy trên server riêng, thêm vào cron:

```bash
# Backup mỗi ngày lúc 2:00 AM
0 2 * * * cd /path/to/La-perla && ./scripts/firebase-backup.sh

# Backup mỗi 6 giờ
0 */6 * * * cd /path/to/La-perla && ./scripts/firebase-backup.sh

# Xóa backup cũ hơn 30 ngày
0 3 * * * find /path/to/La-perla/backups -name "*.json" -mtime +30 -delete
```

## 🎓 BEST PRACTICES

### Chiến Lược Backup 3-2-1:

1. **3 bản copy** của dữ liệu
   - Dữ liệu production trên Firebase
   - Backup local trong thư mục `backups/`
   - Backup trên GitHub Actions artifacts

2. **2 loại phương tiện khác nhau**
   - Backup trên cloud (GitHub)
   - Backup local hoặc external drive

3. **1 bản offsite**
   - Backup trên GitHub (offsite)
   - Có thể thêm: Google Drive, Dropbox, etc.

### Lịch Backup Khuyến Nghị:

- **Hàng ngày**: Backup tự động lúc 2:00 AM
- **Trước deploy**: Luôn backup trước khi deploy code mới
- **Trước thay đổi lớn**: Backup thủ công trước khi thay đổi database structure
- **Giữ lại**: 7 ngày backup hàng ngày, 4 tuần backup hàng tuần, 12 tháng backup hàng tháng

## 📞 HỖ TRỢ KHẨN CẤP

### Nếu Cần Phục Hồi Gấp:

1. **Dừng mọi thao tác trên app ngay lập tức**
2. **Backup dữ liệu hiện tại** (dù bị lỗi)
3. **Liên hệ team để xác nhận**
4. **Chỉ restore khi đã chắc chắn**

### Hotline Firebase:
- Firebase Console: https://console.firebase.google.com/
- Firebase Support: https://firebase.google.com/support
- Documentation: https://firebase.google.com/docs/database

## ✅ CHECKLIST PHỤC HỒI

Trước khi thực hiện restore, kiểm tra:

- [ ] Đã backup dữ liệu hiện tại
- [ ] Đã xác định đúng file backup cần restore
- [ ] Đã kiểm tra nội dung file backup
- [ ] Đã thông báo cho team
- [ ] Đã hiểu rõ dữ liệu sẽ bị ghi đè
- [ ] Đã có kế hoạch rollback nếu cần
- [ ] Đã đọc kỹ hướng dẫn

Sau khi restore:

- [ ] Đã kiểm tra dữ liệu khách hàng
- [ ] Đã kiểm tra dữ liệu booking
- [ ] Đã kiểm tra dữ liệu nhân viên
- [ ] Đã kiểm tra dữ liệu giá dịch vụ
- [ ] Đã test các chức năng chính
- [ ] Đã thông báo team hoàn tất
- [ ] Đã document những gì đã làm

## 🎉 KẾT LUẬN

Với hướng dẫn này, bạn có thể:
- ✅ Tạo backup Firebase Database tự động hàng ngày
- ✅ Tạo backup thủ công bất kỳ lúc nào
- ✅ Phục hồi dữ liệu về bất kỳ thời điểm nào có backup
- ✅ Quản lý và tổ chức các file backup
- ✅ Thiết lập quy trình backup an toàn

**LƯU Ý QUAN TRỌNG:** 
- Không thể phục hồi về ngày hôm qua nếu không có backup từ ngày đó
- Bắt đầu tạo backup ngay hôm nay để có thể phục hồi trong tương lai
- Backup thường xuyên là cách duy nhất để bảo vệ dữ liệu

---

**Cần trợ giúp?** Xem thêm:
- [FIREBASE_DEPLOY_GUIDE.md](./FIREBASE_DEPLOY_GUIDE.md) - Hướng dẫn deploy
- [FIREBASE_STUDIO_GUIDE.md](./FIREBASE_STUDIO_GUIDE.md) - Hướng dẫn Firebase Studio
- [HUONG_DAN_TIENG_VIET.md](./HUONG_DAN_TIENG_VIET.md) - Hướng dẫn cài đặt

**Bắt đầu backup ngay:** `./scripts/firebase-backup.sh` 🚀
