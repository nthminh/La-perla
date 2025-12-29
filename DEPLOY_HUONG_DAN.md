# Hướng Dẫn Deploy Lên Firebase - La Perla

## 🎯 Tổng Quan

Bạn giờ đây có một lệnh chuẩn để tự động cập nhật mọi thứ từ nhánh phụ lên nhánh chính và deploy lên Firebase Hosting. Mỗi lần hoàn thành công việc, chỉ cần chạy một lệnh duy nhất!

## ⚡ Lệnh Nhanh - Chạy Mỗi Lần Deploy

```bash
./deploy-to-firebase.sh
```

**Đó là tất cả!** Script này sẽ tự động:
1. ✅ Kiểm tra yêu cầu hệ thống (Git, Node.js, Firebase CLI)
2. ✅ Merge thay đổi từ nhánh hiện tại vào nhánh main
3. ✅ Cài đặt dependencies
4. ✅ Build ứng dụng
5. ✅ Deploy lên Firebase Hosting
6. ✅ Hiển thị link ứng dụng sau khi deploy

## 📋 Yêu Cầu Lần Đầu

### 1. Cài Đặt Firebase CLI (Chỉ cần làm một lần)

Nếu chưa có Firebase CLI:
```bash
npm install -g firebase-tools
```

### 2. Đăng Nhập Firebase (Chỉ cần làm một lần)

```bash
firebase login
```

Lệnh này sẽ mở trình duyệt để bạn đăng nhập vào tài khoản Google/Firebase của mình.

### 3. Làm Script Có Thể Thực Thi (Chỉ cần làm một lần)

Nếu script chưa thực thi được:
```bash
chmod +x deploy-to-firebase.sh
```

## 🚀 Quy Trình Làm Việc Hàng Ngày

### Kịch Bản 1: Đang Làm Việc Trên Nhánh Phụ

1. **Hoàn thành công việc và commit thay đổi:**
   ```bash
   git add .
   git commit -m "Mô tả công việc bạn vừa làm"
   ```

2. **Chạy script deploy:**
   ```bash
   ./deploy-to-firebase.sh
   ```

3. **Xong!** Script sẽ:
   - Merge nhánh của bạn vào main
   - Build ứng dụng
   - Deploy lên Firebase
   - Hiển thị link website live

### Kịch Bản 2: Đang Làm Việc Trực Tiếp Trên Main

1. **Commit thay đổi:**
   ```bash
   git add .
   git commit -m "Mô tả thay đổi"
   ```

2. **Chạy script deploy:**
   ```bash
   ./deploy-to-firebase.sh
   ```

3. **Xong!** Script sẽ build và deploy ngay.

## 📖 Chi Tiết Các Bước Script Thực Hiện

### Bước 1: Kiểm Tra Yêu Cầu
- Kiểm tra Git đã cài đặt
- Kiểm tra Node.js đã cài đặt
- Kiểm tra npm đã cài đặt
- Kiểm tra hoặc cài đặt Firebase CLI

### Bước 2: Kiểm Tra Trạng Thái Git
- Xác định nhánh hiện tại
- Kiểm tra có thay đổi chưa commit không
- Yêu cầu commit trước khi tiếp tục

### Bước 3: Merge vào Main
- Lấy thay đổi mới nhất từ remote
- Chuyển sang nhánh main
- Pull main mới nhất
- Merge nhánh làm việc vào main
- Push main lên remote

### Bước 4: Cài Đặt Dependencies
- Chạy `npm install` để đảm bảo tất cả dependencies được cài đặt

### Bước 5: Build Ứng Dụng
- Chạy `npm run build`
- Kiểm tra build thành công
- Hiển thị kích thước build

### Bước 6: Kiểm Tra Đăng Nhập Firebase
- Kiểm tra đã đăng nhập Firebase chưa
- Nếu chưa, mở trình duyệt để đăng nhập

### Bước 7: Deploy Lên Firebase
- Chạy `firebase deploy --only hosting`
- Hiển thị link website sau khi deploy thành công

### Bước 8: Tóm Tắt
- Hiển thị tóm tắt các bước đã hoàn thành
- Hiển thị link ứng dụng đã deploy

## 🛠️ Xử Lý Lỗi Thường Gặp

### Lỗi: "You have uncommitted changes"

**Nguyên nhân:** Bạn có thay đổi chưa được commit.

**Giải pháp:**
```bash
git add .
git commit -m "Mô tả thay đổi"
./deploy-to-firebase.sh
```

### Lỗi: "Merge conflict detected"

**Nguyên nhân:** Có xung đột giữa nhánh của bạn và main.

**Giải pháp:**
1. Xem file có xung đột: `git status`
2. Mở file và sửa xung đột (tìm các đoạn `<<<<<<<`, `=======`, `>>>>>>>`)
3. Sau khi sửa:
   ```bash
   git add .
   git commit -m "Resolved merge conflicts"
   ./deploy-to-firebase.sh
   ```

### Lỗi: "Build failed"

**Nguyên nhân:** Có lỗi trong code.

**Giải pháp:**
1. Xem lỗi build chi tiết trong console
2. Sửa lỗi trong code
3. Thử build thủ công: `npm run build`
4. Khi build thành công, chạy lại: `./deploy-to-firebase.sh`

### Lỗi: "Firebase login failed"

**Nguyên nhân:** Không thể đăng nhập Firebase.

**Giải pháp:**
```bash
firebase logout
firebase login
./deploy-to-firebase.sh
```

### Lỗi: "Permission denied: ./deploy-to-firebase.sh"

**Nguyên nhân:** Script chưa có quyền thực thi.

**Giải pháp:**
```bash
chmod +x deploy-to-firebase.sh
./deploy-to-firebase.sh
```

## 📱 Kiểm Tra Deployment

Sau khi deploy thành công, bạn có thể:

1. **Mở website:**
   - Script sẽ hiển thị link (ví dụ: `https://laperlapos.web.app`)
   - Copy link và mở trong trình duyệt

2. **Kiểm tra trong Firebase Console:**
   - Truy cập: https://console.firebase.google.com/
   - Chọn project của bạn
   - Vào phần "Hosting" để xem lịch sử deploy

3. **Xem log deploy:**
   ```bash
   firebase hosting:channel:list
   ```

## 🔄 Rollback Về Phiên Bản Trước

Nếu phiên bản mới có vấn đề, bạn có thể rollback:

```bash
firebase hosting:rollback
```

## 💡 Mẹo và Thủ Thuật

### Mẹo 1: Tạo Alias Nhanh

Thêm vào file `~/.bashrc` hoặc `~/.zshrc`:
```bash
alias deploy='./deploy-to-firebase.sh'
```

Sau đó chỉ cần gõ:
```bash
deploy
```

### Mẹo 2: Kiểm Tra Build Trước Khi Deploy

Nếu muốn kiểm tra build trước:
```bash
npm run build
npm run preview  # Xem preview trên http://localhost:4173
```

Nếu mọi thứ OK, chạy deploy:
```bash
./deploy-to-firebase.sh
```

### Mẹo 3: Deploy Nhanh Mà Không Merge

Nếu đang ở trên main và chỉ muốn deploy nhanh:
```bash
git checkout main
git add .
git commit -m "Quick update"
./deploy-to-firebase.sh
```

### Mẹo 4: Xem Lịch Sử Deploy

```bash
firebase hosting:channel:list
```

## 📊 So Sánh: Trước và Sau

### Trước (Quy Trình Thủ Công)
```bash
# 1. Chuyển sang main
git checkout main

# 2. Pull thay đổi mới
git pull origin main

# 3. Merge nhánh làm việc
git merge feature-branch

# 4. Push lên remote
git push origin main

# 5. Cài dependencies
npm install

# 6. Build
npm run build

# 7. Deploy
firebase deploy --only hosting

# Tổng: 7 lệnh phải nhớ và gõ!
```

### Sau (Với Script)
```bash
./deploy-to-firebase.sh

# Chỉ 1 lệnh! 🎉
```

## 🎯 Quy Trình Làm Việc Được Đề Xuất

### Quy Trình Hàng Ngày

1. **Sáng:** Bắt đầu làm việc
   ```bash
   git checkout -b feature/ten-tinh-nang-moi
   npm run dev
   ```

2. **Trong ngày:** Code và test
   - Viết code
   - Test trên local (http://localhost:5173)
   - Commit thường xuyên: `git commit -am "Work in progress"`

3. **Cuối ngày:** Deploy lên production
   ```bash
   git add .
   git commit -m "Hoàn thành tính năng XYZ"
   ./deploy-to-firebase.sh
   ```

### Quy Trình Cho Tính Năng Lớn

1. **Tạo nhánh mới:**
   ```bash
   git checkout -b feature/tinh-nang-lon
   ```

2. **Phát triển trên nhánh:**
   ```bash
   # Làm việc...
   git add .
   git commit -m "Part 1: ..."
   git push origin feature/tinh-nang-lon
   
   # Tiếp tục làm việc...
   git add .
   git commit -m "Part 2: ..."
   git push origin feature/tinh-nang-lon
   ```

3. **Khi hoàn thành, merge và deploy:**
   ```bash
   ./deploy-to-firebase.sh
   ```

## 📞 Hỗ Trợ

### Nếu Script Không Chạy

1. **Kiểm tra quyền thực thi:**
   ```bash
   ls -la deploy-to-firebase.sh
   ```
   Phải thấy: `-rwxr-xr-x`

2. **Nếu không có quyền:**
   ```bash
   chmod +x deploy-to-firebase.sh
   ```

3. **Thử chạy trực tiếp với bash:**
   ```bash
   bash deploy-to-firebase.sh
   ```

### Nếu Cần Chạy Từng Bước Thủ Công

Đọc file `deploy-to-firebase.sh` để xem các lệnh chi tiết, hoặc tham khảo:
- `FIREBASE_STUDIO_GUIDE.md` - Hướng dẫn Firebase
- `DEPLOYMENT_CHECKLIST.md` - Checklist deploy
- `HUONG_DAN_TIENG_VIET.md` - Hướng dẫn tiếng Việt

## 🎉 Tóm Tắt

Bây giờ bạn có:
- ✅ **Một lệnh duy nhất** để deploy: `./deploy-to-firebase.sh`
- ✅ **Tự động merge** từ nhánh phụ vào main
- ✅ **Tự động build** ứng dụng
- ✅ **Tự động deploy** lên Firebase
- ✅ **Xử lý lỗi** tự động và hiển thị thông báo rõ ràng
- ✅ **Hỗ trợ cả tiếng Việt và tiếng Anh**

**Không cần hỏi thêm - chỉ cần chạy script mỗi lần muốn deploy!** 🚀

---

## Liên Kết Hữu Ích

- 🔗 [Firebase Console](https://console.firebase.google.com/)
- 🔗 [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- 🔗 [Git Documentation](https://git-scm.com/doc)

---

**Lưu ý:** Nếu bạn cần thêm tính năng hoặc tùy chỉnh script, có thể chỉnh sửa file `deploy-to-firebase.sh` theo nhu cầu của bạn.
