# 🔄 BẮT ĐẦU: Backup & Restore Firebase

## 🎯 BẠN CẦN GÌ?

Đọc file này nếu bạn muốn:
- ✅ Phục hồi Firebase về ngày hôm qua
- ✅ Tạo backup định kỳ
- ✅ Bảo vệ dữ liệu khỏi mất mát

## ⚡ NHANH NHẤT

### Câu 1: Có Thể Phục Hồi Về Ngày Hôm Qua Không?

**Đọc ngay:** [PHUC_HOI_FIREBASE_TRA_LOI.md](PHUC_HOI_FIREBASE_TRA_LOI.md)

### Câu 2: Làm Sao Tạo Backup?

```bash
# Cài Firebase CLI (nếu chưa có)
npm install -g firebase-tools

# Đăng nhập
firebase login

# Tạo backup
./scripts/firebase-backup.sh
```

### Câu 3: Làm Sao Phục Hồi?

```bash
# Kiểm tra backup có sẵn
ls -lh backups/

# Phục hồi (thay đổi tên file cho đúng)
./scripts/firebase-restore.sh backups/database-backup-2026-01-13-14-30-00.json
```

## 📚 TÀI LIỆU CHI TIẾT

### 1. Trả Lời Trực Tiếp Câu Hỏi Của Bạn
**[PHUC_HOI_FIREBASE_TRA_LOI.md](PHUC_HOI_FIREBASE_TRA_LOI.md)**
- ✅ Trả lời câu hỏi về phục hồi
- ✅ Checklist nhanh
- ✅ Các bước cụ thể

### 2. Hướng Dẫn Đầy Đủ
**[FIREBASE_BACKUP_RESTORE_VI.md](FIREBASE_BACKUP_RESTORE_VI.md)**
- ✅ 3 phương án phục hồi
- ✅ Hướng dẫn setup backup tự động
- ✅ Xử lý sự cố
- ✅ Best practices

### 3. English Version
**[FIREBASE_BACKUP_RESTORE_EN.md](FIREBASE_BACKUP_RESTORE_EN.md)**

## 🔧 CÀI ĐẶT

### Bước 1: Cài Firebase CLI

```bash
npm install -g firebase-tools
```

### Bước 2: Đăng Nhập

```bash
firebase login
```

### Bước 3: Test Backup

```bash
./scripts/firebase-backup.sh
```

Nếu thành công, bạn sẽ thấy:
- ✅ File backup trong thư mục `backups/`
- ✅ Thông báo kích thước file
- ✅ Hướng dẫn restore

## 🚀 SETUP BACKUP TỰ ĐỘNG (5 PHÚT)

### GitHub Actions (Khuyến Nghị)

1. **Lấy Firebase Service Account Key**
   - https://console.firebase.google.com/
   - Project Settings → Service Accounts
   - Generate New Private Key

2. **Thêm vào GitHub Secrets**
   - https://github.com/nthminh/La-perla/settings/secrets/actions
   - New secret: `FIREBASE_SERVICE_ACCOUNT`
   - Paste JSON content

3. **Xong!** Backup tự động chạy mỗi ngày lúc 2:00 AM

## ⚠️ LƯU Ý

### ❌ KHÔNG THỂ phục hồi nếu:
- Không có file backup từ ngày cần phục hồi
- Chưa setup backup tự động
- File backup bị lỗi/hỏng

### ✅ CÓ THỂ phục hồi nếu:
- Đã có file backup
- File backup hợp lệ
- Đã cài Firebase CLI và đăng nhập

## 🆘 KHẨN CẤP?

### Nếu Cần Phục Hồi Ngay:

1. **DỪNG** app ngay
2. **BACKUP** dữ liệu hiện tại: `./scripts/firebase-backup.sh`
3. **ĐỌC** [PHUC_HOI_FIREBASE_TRA_LOI.md](PHUC_HOI_FIREBASE_TRA_LOI.md)
4. **RESTORE** nếu có backup

### Nếu Setup Backup Lần Đầu:

1. **ĐỌC** [FIREBASE_BACKUP_RESTORE_VI.md](FIREBASE_BACKUP_RESTORE_VI.md)
2. **SETUP** theo hướng dẫn
3. **TEST** backup: `./scripts/firebase-backup.sh`

## 📋 CHECKLIST

### Hôm Nay:
- [ ] Cài Firebase CLI
- [ ] Đăng nhập Firebase
- [ ] Test backup thủ công
- [ ] Đọc tài liệu đầy đủ

### Tuần Này:
- [ ] Setup backup tự động qua GitHub Actions
- [ ] Test restore 1 lần
- [ ] Thông báo team về quy trình backup

### Hàng Tháng:
- [ ] Kiểm tra backup có chạy
- [ ] Test restore để đảm bảo hoạt động
- [ ] Review và cập nhật quy trình

## 🎯 CÂU HỎI THƯỜNG GẶP

**Q: Backup mất bao lâu?**
A: 30 giây - 2 phút tùy kích thước database

**Q: Restore có an toàn không?**
A: Có! Script tự động backup trước khi restore

**Q: Có thể restore một phần không?**
A: Có! Dùng: `./scripts/firebase-restore.sh backup.json /customers`

**Q: Backup lưu ở đâu?**
A: Local: `backups/`, GitHub Actions: Artifacts (7 ngày)

**Q: Chi phí có tăng không?**
A: Không! GitHub Actions miễn phí cho public repos

## 📞 HỖ TRỢ

- 📖 Tài liệu: [FIREBASE_BACKUP_RESTORE_VI.md](FIREBASE_BACKUP_RESTORE_VI.md)
- 🔧 Scripts: [scripts/README.md](scripts/README.md)
- 🐛 Issues: https://github.com/nthminh/La-perla/issues

## ✅ TÓM TẮT

```
Cài Firebase CLI → Đăng nhập → Test backup → Setup tự động → Yên tâm!
```

**Bắt đầu:** `./scripts/firebase-backup.sh` 🚀

---

**File quan trọng nhất:** [PHUC_HOI_FIREBASE_TRA_LOI.md](PHUC_HOI_FIREBASE_TRA_LOI.md)
