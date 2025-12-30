# 🔄 Hướng Dẫn Tự Động Đồng Bộ GitHub và Firebase
# Auto-Sync GitHub and Firebase Setup Guide

## 📋 Tổng Quan / Overview

Với workflow này, **không cần chạy lệnh deploy thủ công nữa**! Mỗi khi bạn push code lên nhánh `main`, GitHub Actions sẽ tự động:
1. ✅ Build ứng dụng
2. ✅ Deploy lên Firebase Hosting
3. ✅ Giữ GitHub và Firebase luôn đồng bộ

With this workflow, **no more manual deployment commands**! Every time you push to `main` branch, GitHub Actions will automatically:
1. ✅ Build the application
2. ✅ Deploy to Firebase Hosting
3. ✅ Keep GitHub and Firebase in sync

---

## 🚀 Thiết Lập Lần Đầu / Initial Setup

### Bước 1: Tạo Firebase Service Account Key

#### 1.1. Truy cập Firebase Console
- Mở https://console.firebase.google.com/
- Chọn project **La Perla** (la-perla-53540395-70c43)

#### 1.2. Tạo Service Account
1. Vào **Project Settings** (biểu tượng bánh răng) > **Service Accounts**
2. Click **Generate New Private Key**
3. Click **Generate Key** để tải file JSON về máy

⚠️ **LƯU Ý:** File này chứa thông tin nhạy cảm, giữ an toàn!

#### 1.3. Copy nội dung file JSON
- Mở file JSON vừa tải về
- Copy toàn bộ nội dung (từ `{` đến `}`)

### Bước 2: Thêm Secret vào GitHub Repository

#### 2.1. Truy cập GitHub Repository Settings
1. Mở https://github.com/nthminh/La-perla
2. Vào **Settings** > **Secrets and variables** > **Actions**

#### 2.2. Thêm FIREBASE_SERVICE_ACCOUNT Secret
1. Click **New repository secret**
2. Name: `FIREBASE_SERVICE_ACCOUNT`
3. Value: Paste toàn bộ nội dung JSON từ bước 1.3
4. Click **Add secret**

### Bước 3: Kiểm Tra Workflow File

File `.github/workflows/firebase-deploy.yml` đã được tạo sẵn với cấu hình:
- ✅ Tự động chạy khi push lên nhánh `main`
- ✅ Có thể chạy thủ công từ GitHub Actions tab
- ✅ Build và deploy tự động

---

## 💻 Quy Trình Làm Việc Mới / New Workflow

### Trước Đây (Manual) / Before:
```bash
# Phải chạy script thủ công
./deploy-to-firebase.sh
```

### Bây Giờ (Automatic) / Now:
```bash
# Chỉ cần commit và push!
git add .
git commit -m "Update feature"
git push origin main
```

**Xong!** GitHub Actions sẽ tự động deploy. ✨

---

## 📊 Theo Dõi Deployment / Monitor Deployments

### Xem Tiến Trình Deploy
1. Mở https://github.com/nthminh/La-perla/actions
2. Xem workflow runs và status
3. Click vào run để xem chi tiết logs

### Các Trạng Thái / Status Icons
- 🟡 **Đang chạy / Running**: Workflow đang thực thi
- ✅ **Thành công / Success**: Deploy thành công
- ❌ **Thất bại / Failed**: Có lỗi, cần kiểm tra logs

---

## 🔧 Các Tình Huống Sử Dụng / Use Cases

### Tình Huống 1: Làm Việc Trên Nhánh Phụ
```bash
# 1. Tạo và làm việc trên nhánh riêng
git checkout -b feature/new-feature
# Code...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 2. Merge vào main (qua Pull Request hoặc local)
git checkout main
git merge feature/new-feature
git push origin main

# 3. GitHub Actions tự động deploy! ✅
```

### Tình Huống 2: Làm Việc Trực Tiếp Trên Main
```bash
# 1. Commit thay đổi
git add .
git commit -m "Quick fix"

# 2. Push lên main
git push origin main

# 3. GitHub Actions tự động deploy! ✅
```

### Tình Huống 3: Deploy Thủ Công (Manual Trigger)
1. Vào https://github.com/nthminh/La-perla/actions
2. Chọn workflow "Deploy to Firebase Hosting"
3. Click **Run workflow** > **Run workflow**
4. Workflow sẽ chạy ngay lập tức

### Tình Huống 4: Vẫn Muốn Dùng Script Cũ (Optional)
Script `./deploy-to-firebase.sh` vẫn hoạt động bình thường nếu bạn muốn deploy local:
```bash
./deploy-to-firebase.sh
```

---

## 🛠️ Xử Lý Lỗi / Troubleshooting

### Lỗi: "Error: HTTP Error: 403, The caller does not have permission"

**Nguyên nhân:** Secret `FIREBASE_SERVICE_ACCOUNT` chưa được thêm hoặc không đúng.

**Giải pháp:**
1. Kiểm tra lại Bước 1 và Bước 2 ở trên
2. Đảm bảo copy toàn bộ nội dung JSON (không thừa/thiếu ký tự)
3. Thử tạo lại Private Key và update secret

### Lỗi: "Build failed"

**Nguyên nhân:** Có lỗi trong code.

**Giải pháp:**
1. Xem logs chi tiết trong GitHub Actions
2. Sửa lỗi trong code
3. Commit và push lại

### Lỗi: "npm ci failed"

**Nguyên nhân:** Dependencies có vấn đề.

**Giải pháp:**
1. Kiểm tra `package.json` và `package-lock.json`
2. Thử chạy `npm install` local để kiểm tra
3. Commit các file package đã fix

### Workflow Không Chạy

**Kiểm tra:**
1. Push có vào nhánh `main` không?
2. File workflow có ở đúng đường dẫn `.github/workflows/firebase-deploy.yml`?
3. GitHub Actions có bị disabled trong repo settings?

---

## 📱 Kiểm Tra Kết Quả / Verify Deployment

### 1. Xem Website Live
- Mở https://la-perla-53540395-70c43.web.app
- Hoặc https://la-perla-53540395-70c43.firebaseapp.com

### 2. Kiểm Tra Firebase Console
- Vào https://console.firebase.google.com/
- Chọn project La Perla
- Vào **Hosting** để xem deployment history

### 3. Kiểm Tra GitHub Actions
- Vào https://github.com/nthminh/La-perla/actions
- Xem workflow runs history

---

## 🔐 Bảo Mật / Security

### ✅ Những Điều Đã Làm
- Service Account Key được lưu an toàn trong GitHub Secrets
- Không commit sensitive data vào repository
- GitHub Actions chỉ chạy khi push vào main (có thể review trước)

### ⚠️ Lưu Ý Quan Trọng
- **KHÔNG BAO GIỜ** commit file Service Account JSON vào Git
- **KHÔNG BAO GIỜ** share Secret keys công khai
- Chỉ thêm Service Account key vào GitHub Secrets

---

## 🎯 So Sánh: Trước và Sau / Before vs After

### Trước Khi Có Auto-Deploy
```bash
# Phải nhớ và chạy nhiều lệnh
git add .
git commit -m "Update"
git push origin main
./deploy-to-firebase.sh  # ← Bước thủ công
```

### Sau Khi Có Auto-Deploy
```bash
# Chỉ cần Git bình thường
git add .
git commit -m "Update"
git push origin main
# ✨ Tự động deploy, không cần làm gì thêm!
```

---

## 📈 Workflow Details / Chi Tiết Workflow

### Workflow Chạy Khi Nào?
1. **Tự động:** Mỗi khi push code lên nhánh `main`
2. **Thủ công:** Click "Run workflow" trong GitHub Actions

### Workflow Làm Gì?
```yaml
1. Checkout code từ repository
2. Setup Node.js 20
3. Cài dependencies (npm ci)
4. Build ứng dụng (npm run build)
5. Deploy lên Firebase Hosting
```

### Thời Gian Chạy
- Thường: 2-5 phút
- Tùy thuộc vào kích thước project và dependencies

---

## 💡 Mẹo Hay / Pro Tips

### Mẹo 1: Theo Dõi Deployment Status Badge
Thêm vào README.md:
```markdown
![Deploy Status](https://github.com/nthminh/La-perla/workflows/Deploy%20to%20Firebase%20Hosting/badge.svg)
```

### Mẹo 2: Nhận Thông Báo
1. Vào repo Settings > Notifications
2. Bật email alerts cho workflow failures

### Mẹo 3: Deploy Preview Cho Pull Requests
Có thể mở rộng workflow để tạo preview URLs cho PRs (nâng cao)

### Mẹo 4: Combine Cả Hai Phương Pháp
- Dùng auto-deploy cho main branch
- Dùng script thủ công `./deploy-to-firebase.sh` cho testing nhánh khác

---

## 🎓 Học Thêm / Learn More

### Tài Liệu Liên Quan
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy)

### Files Liên Quan Trong Repo
- `.github/workflows/firebase-deploy.yml` - Workflow configuration
- `deploy-to-firebase.sh` - Script thủ công (vẫn có thể dùng)
- `firebase.json` - Firebase configuration
- `.firebaserc` - Firebase project settings

---

## 📞 Câu Hỏi Thường Gặp / FAQ

### Q: Tôi vẫn cần script ./deploy-to-firebase.sh không?
**A:** Không bắt buộc nữa, nhưng vẫn hữu ích để:
- Deploy từ local khi cần test
- Backup option nếu GitHub Actions có vấn đề

### Q: Chi phí có tăng không?
**A:** Không, GitHub Actions miễn phí cho public repos. Firebase Hosting vẫn giữ mức miễn phí/trả phí như cũ.

### Q: Tôi có thể disable auto-deploy không?
**A:** Có, xóa hoặc đổi tên file `.github/workflows/firebase-deploy.yml`

### Q: Deploy bao lâu?
**A:** Thường 2-5 phút tùy kích thước project.

### Q: Tôi có thể rollback không?
**A:** Có, dùng Firebase Console hoặc command:
```bash
firebase hosting:rollback
```

---

## ✅ Checklist Hoàn Thành / Setup Checklist

- [ ] Tạo Firebase Service Account Key
- [ ] Thêm `FIREBASE_SERVICE_ACCOUNT` secret vào GitHub
- [ ] Workflow file đã có tại `.github/workflows/firebase-deploy.yml`
- [ ] Push code lên main branch để test
- [ ] Kiểm tra workflow chạy thành công trong Actions tab
- [ ] Verify website deploy thành công
- [ ] Đọc và hiểu quy trình làm việc mới

---

## 🎉 Kết Luận / Conclusion

**Câu trả lời cho câu hỏi ban đầu:**

### ❓ "Tôi sẽ phải chạy lệnh gì để cho file bên github và bên firebase luôn đồng nhất nhau?"

### ✅ **Trả lời:**

**KHÔNG CẦN chạy lệnh gì nữa!** 

Sau khi setup xong (một lần duy nhất):
```bash
# Chỉ cần làm như bình thường:
git add .
git commit -m "Your changes"
git push origin main

# GitHub Actions sẽ TỰ ĐỘNG deploy lên Firebase!
```

**Đó là tất cả!** GitHub và Firebase sẽ luôn đồng bộ tự động. 🎊

---

## 📝 Ghi Chú Cuối / Final Notes

- ✅ Setup một lần, dùng mãi mãi
- ✅ Không cần nhớ lệnh deploy
- ✅ Giảm thiểu lỗi thủ công
- ✅ Có logs đầy đủ trong GitHub Actions
- ✅ Có thể revert bất cứ lúc nào

**Enjoy automatic deployments!** 🚀
