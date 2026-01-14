# ❓ Trả Lời: Phục Hồi Firebase về Phiên Bản Ngày Hôm Qua

## 🎯 Câu Hỏi
> "Bạn có thể phục hồi mọi thứ ở firebase studio về phiên bản của ngày hôm qua được không"

## ✅ CÂU TRẢ LỜI NHANH

**CÓ THỂ** - nhưng chỉ khi bạn đã có backup từ ngày hôm qua!

Firebase **KHÔNG** tự động tạo backup hàng ngày. Để phục hồi về ngày hôm qua, bạn cần:

1. ✅ Đã có file backup từ ngày hôm qua, HOẶC
2. ✅ Đã bật tính năng Automated Backups trong Firebase Console

## 🔍 KIỂM TRA NHANH

### Bạn Có Backup Không?

Chạy lệnh này để kiểm tra:
```bash
ls -lh backups/
```

Nếu thấy file như `database-backup-2026-01-13-*.json` từ ngày hôm qua → **CÓ THỂ PHỤC HỒI!** ✅

Nếu thư mục trống hoặc không có file từ ngày hôm qua → **KHÔNG THỂ PHỤC HỒI!** ❌

## 🚀 CÁCH PHỤC HỒI (Nếu Có Backup)

### Bước 1: Kiểm Tra File Backup

```bash
# Xem các backup có sẵn
ls -lh backups/

# Ví dụ kết quả:
# database-backup-2026-01-13-14-30-00.json  (ngày hôm qua)
# database-backup-2026-01-14-09-15-00.json  (hôm nay)
```

### Bước 2: Phục Hồi

```bash
# Phục hồi từ file backup ngày hôm qua
./scripts/firebase-restore.sh backups/database-backup-2026-01-13-14-30-00.json
```

Script sẽ:
1. Tự động backup dữ liệu hiện tại (để an toàn)
2. Hỏi xác nhận: Gõ `yes` để tiếp tục
3. Phục hồi dữ liệu từ file backup
4. Thông báo kết quả

### Bước 3: Kiểm Tra

Mở app và kiểm tra dữ liệu:
```
https://la-perla-53540395-70c43.web.app
```

## ⚠️ TRƯỜNG HỢP KHÔNG CÓ BACKUP

Nếu không có backup từ ngày hôm qua, bạn **KHÔNG THỂ** phục hồi tự động.

### Các Phương Án Thay Thế:

1. **Kiểm tra GitHub Actions**
   - Vào: https://github.com/nthminh/La-perla/actions
   - Tìm workflow "Firebase Database Backup"
   - Download artifact nếu có (giữ 7 ngày)

2. **Liên hệ team**
   - Hỏi xem ai có backup local
   - Kiểm tra máy tính cá nhân

3. **Khôi phục thủ công**
   - Nhập lại dữ liệu quan trọng
   - Sử dụng các nguồn dữ liệu khác (nếu có)

## 🛡️ NGĂN CHẶN VẤN ĐỀ TRONG TƯƠNG LAI

### Thiết Lập Backup Tự Động NGAY BÂY GIỜ!

#### Option 1: Backup Tự Động Qua GitHub Actions (Khuyến Nghị)

Workflow đã được tạo sẵn! Chỉ cần setup secret:

1. **Lấy Firebase Service Account Key**
   - Vào: https://console.firebase.google.com/
   - Chọn project: La Perla
   - Settings → Service Accounts
   - Generate New Private Key
   - Lưu file JSON

2. **Thêm Secret vào GitHub**
   - Vào: https://github.com/nthminh/La-perla/settings/secrets/actions
   - New repository secret
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste toàn bộ nội dung file JSON
   - Add secret

3. **Xong!** 🎉
   - Backup tự động chạy mỗi ngày lúc 2:00 AM
   - Có thể chạy thủ công bất kỳ lúc nào
   - Giữ backup 7 ngày

#### Option 2: Backup Thủ Công Hàng Ngày

```bash
# Chạy lệnh này mỗi ngày:
./scripts/firebase-backup.sh
```

Hoặc thêm vào crontab (Linux/Mac):
```bash
# Mở crontab
crontab -e

# Thêm dòng này (chạy lúc 2:00 AM mỗi ngày):
0 2 * * * cd /path/to/La-perla && ./scripts/firebase-backup.sh
```

## 📚 TÀI LIỆU CHI TIẾT

Xem hướng dẫn đầy đủ tại:

### Tiếng Việt 🇻🇳
**[FIREBASE_BACKUP_RESTORE_VI.md](FIREBASE_BACKUP_RESTORE_VI.md)**

Bao gồm:
- ✅ 3 phương án phục hồi khác nhau
- ✅ Hướng dẫn chi tiết từng bước
- ✅ Thiết lập backup tự động
- ✅ Xử lý sự cố
- ✅ Best practices

### English 🇬🇧
**[FIREBASE_BACKUP_RESTORE_EN.md](FIREBASE_BACKUP_RESTORE_EN.md)**

## 🔧 SCRIPTS CÓ SẴN

### 1. Backup Script
```bash
./scripts/firebase-backup.sh
```
Tạo backup của toàn bộ database

### 2. Restore Script
```bash
./scripts/firebase-restore.sh backups/[file-name].json
```
Phục hồi database từ file backup

### 3. Xem Hướng Dẫn Scripts
```bash
cat scripts/README.md
```

## 📊 WORKFLOW KHUYẾN NGHỊ

```
┌─────────────────────────────────────┐
│  Setup Backup Tự Động (1 lần)      │
│  ↓                                  │
│  Backup Chạy Mỗi Ngày (tự động)    │
│  ↓                                  │
│  Giữ 7 ngày backup gần nhất        │
│  ↓                                  │
│  Khi Cần: Phục Hồi Từ Backup       │
└─────────────────────────────────────┘
```

## ⚡ CHECKLIST HÀNH ĐỘNG

### Ngay Bây Giờ:
- [ ] Kiểm tra xem có backup từ ngày hôm qua không: `ls -lh backups/`
- [ ] Nếu có: Phục hồi bằng `./scripts/firebase-restore.sh`
- [ ] Nếu không: Xem phương án thay thế ở trên

### Sau Khi Xử Lý:
- [ ] Setup backup tự động qua GitHub Actions
- [ ] Test backup thủ công: `./scripts/firebase-backup.sh`
- [ ] Đọc tài liệu đầy đủ: [FIREBASE_BACKUP_RESTORE_VI.md](FIREBASE_BACKUP_RESTORE_VI.md)
- [ ] Thông báo team về quy trình backup mới

### Hàng Tuần:
- [ ] Kiểm tra backup có chạy tự động không
- [ ] Verify file backup được tạo ra
- [ ] Test restore 1 lần/tháng để đảm bảo hoạt động

## 🆘 CẦN GIÚP ĐỠ NGAY?

### Nếu Cấp Bách:

1. **DỪNG** mọi thao tác trên app ngay
2. **BACKUP** dữ liệu hiện tại: `./scripts/firebase-backup.sh`
3. **ĐỌC** hướng dẫn chi tiết: [FIREBASE_BACKUP_RESTORE_VI.md](FIREBASE_BACKUP_RESTORE_VI.md)
4. **LIÊN HỆ** team trước khi restore

### Liên Hệ:
- GitHub Issues: https://github.com/nthminh/La-perla/issues
- Firebase Console: https://console.firebase.google.com/

## 💡 TÓM TẮT

| Tình Huống | Có Thể Phục Hồi? | Làm Gì? |
|-----------|-----------------|---------|
| Có backup từ ngày hôm qua | ✅ CÓ | Chạy `./scripts/firebase-restore.sh` |
| Không có backup | ❌ KHÔNG | Khôi phục thủ công hoặc liên hệ team |
| Chưa setup backup | ⚠️ RỦI RO | Setup backup tự động NGAY! |

## 🎯 KẾT LUẬN

**TRẢ LỜI CUỐI CÙNG:**

- ✅ **CÓ**, có thể phục hồi về ngày hôm qua
- ⚠️ **NHƯNG** chỉ khi đã có backup từ ngày đó
- 🚀 **QUAN TRỌNG**: Setup backup tự động NGAY để tránh mất dữ liệu trong tương lai

**HÀNH ĐỘNG TIẾP THEO:**

1. Kiểm tra backup: `ls -lh backups/`
2. Nếu có → Phục hồi ngay
3. Nếu không → Setup backup để tránh lặp lại
4. Đọc tài liệu đầy đủ: [FIREBASE_BACKUP_RESTORE_VI.md](FIREBASE_BACKUP_RESTORE_VI.md)

---

**Tạo backup ngay:** `./scripts/firebase-backup.sh` 🚀

**Cần trợ giúp?** Đọc: [FIREBASE_BACKUP_RESTORE_VI.md](FIREBASE_BACKUP_RESTORE_VI.md)
