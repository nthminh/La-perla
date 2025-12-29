# 🚀 Lệnh Deploy Nhanh - Quick Deploy Commands

## Lệnh Chính / Main Command

```bash
./deploy-to-firebase.sh
```

**Lệnh này làm tất cả:** Merge → Build → Deploy lên Firebase!

---

## Quy Trình Nhanh Hàng Ngày

### 1️⃣ Làm việc và commit
```bash
git add .
git commit -m "Mô tả công việc"
```

### 2️⃣ Deploy
```bash
./deploy-to-firebase.sh
```

### 3️⃣ Xong! ✅
Mở link mà script hiển thị để xem website live.

---

## Các Lệnh Hữu Ích Khác

### Kiểm tra build trước khi deploy
```bash
npm run build
npm run preview
```

### Xem project Firebase hiện tại
```bash
firebase projects:list
```

### Rollback về phiên bản trước
```bash
firebase hosting:rollback
```

### Đăng nhập lại Firebase
```bash
firebase logout
firebase login
```

### Xem trạng thái Git
```bash
git status
git log --oneline -5
```

---

## Sửa Lỗi Nhanh

### Script không chạy được?
```bash
chmod +x deploy-to-firebase.sh
```

### Có thay đổi chưa commit?
```bash
git add .
git commit -m "Update"
```

### Xung đột merge?
```bash
git status  # Xem file xung đột
# Sửa file thủ công
git add .
git commit -m "Resolved conflicts"
```

### Build lỗi?
```bash
npm install  # Cài lại dependencies
npm run build  # Test build
```

---

## Tạo Alias Nhanh (Tùy Chọn)

Thêm vào `~/.bashrc` hoặc `~/.zshrc`:
```bash
alias deploy='cd /path/to/La-perla && ./deploy-to-firebase.sh'
```

Thay `/path/to/La-perla` bằng đường dẫn thực tế đến thư mục dự án của bạn.

Sau đó từ bất kỳ đâu, chỉ cần gõ:
```bash
deploy
```

---

## Các Tình Huống Thường Gặp

### Tình huống 1: Làm việc trên nhánh riêng
```bash
# Làm việc...
git add .
git commit -m "Done"
./deploy-to-firebase.sh  # Tự động merge vào main và deploy
```

### Tình huống 2: Làm việc trực tiếp trên main
```bash
# Làm việc...
git add .
git commit -m "Quick fix"
./deploy-to-firebase.sh  # Deploy ngay
```

### Tình huống 3: Muốn test trước khi deploy
```bash
npm run build
npm run preview
# Nếu OK:
./deploy-to-firebase.sh
```

---

## Lưu Ý Quan Trọng

- ⚠️ **Luôn commit trước khi chạy script**
- ⚠️ **Script tự động merge vào main** nếu đang ở nhánh khác
- ⚠️ **Xem console để biết chi tiết** nếu có lỗi
- ✅ **Script hỗ trợ song ngữ** Việt-Anh

---

## Links Nhanh

- Firebase Console: https://console.firebase.google.com/
- Project: https://laperlapos.web.app
- Hướng dẫn đầy đủ: `DEPLOY_HUONG_DAN.md`

---

**Ghi nhớ:** `./deploy-to-firebase.sh` là tất cả những gì bạn cần! 🎯
