# Hướng Dẫn Triển Khai Firebase Security Rules

## Tổng Quan
File này hướng dẫn cách triển khai (deploy) Firebase Security Rules mới để bảo vệ database của ứng dụng La Perla POS.

## Vấn Đề Cũ
Rules cũ cho phép **bất kỳ ai** trên internet đọc và ghi vào database:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
Điều này rất nguy hiểm vì:
- ❌ Bất kỳ ai cũng có thể xóa dữ liệu
- ❌ Có thể đọc thông tin nhạy cảm (mật khẩu admin, thông tin khách hàng)
- ❌ Có thể thay đổi giá dịch vụ, thông tin nhân viên

## Giải Pháp Mới
Rules mới yêu cầu xác thực (authentication) cho tất cả thao tác:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

✅ Chỉ người dùng đã xác thực mới được truy cập
✅ App tự động đăng nhập ẩn danh (anonymous auth)
✅ Bảo mật cao mà vẫn hoạt động bình thường

## Các Bước Triển Khai

### Bước 1: Đảm Bảo Firebase CLI Đã Được Cài Đặt

```bash
# Kiểm tra xem Firebase CLI đã được cài chưa
firebase --version

# Nếu chưa có, cài đặt:
npm install -g firebase-tools
```

### Bước 2: Đăng Nhập Firebase

```bash
firebase login
```

### Bước 3: Kiểm Tra Project

```bash
# Xem project hiện tại
firebase use

# Nếu cần chuyển project
firebase use laperlapos
```

### Bước 4: Deploy Rules

**Cách 1: Chỉ deploy database rules (Khuyến nghị)**
```bash
firebase deploy --only database
```

**Cách 2: Sử dụng script có sẵn**
```bash
./deploy-to-firebase.sh
```

**Cách 3: Deploy toàn bộ**
```bash
firebase deploy
```

### Bước 5: Xác Nhận Thành Công

Sau khi deploy, bạn sẽ thấy thông báo:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/laperlapos/overview
```

## Kiểm Tra Rules Đã Được Áp Dụng

1. Mở Firebase Console: https://console.firebase.google.com
2. Chọn project "laperlapos"
3. Vào **Build** → **Realtime Database** → **Rules**
4. Kiểm tra rules đã được cập nhật

## Bật Anonymous Authentication (Nếu Chưa Bật)

**Quan trọng:** App cần anonymous authentication để hoạt động với rules mới.

1. Vào Firebase Console: https://console.firebase.google.com
2. Chọn project "laperlapos"
3. Vào **Build** → **Authentication** → **Sign-in method**
4. Tìm "Anonymous" và click **Enable**
5. Lưu lại

## Kiểm Tra App Hoạt Động

Sau khi deploy rules:

1. Mở app trong trình duyệt
2. Mở Console (F12)
3. Kiểm tra không có lỗi authentication
4. Thử thêm/xóa khách hàng, dịch vụ để đảm bảo app hoạt động bình thường

## Khắc Phục Sự Cố

### Lỗi: "PERMISSION_DENIED"

**Nguyên nhân:** Anonymous authentication chưa được bật

**Giải pháp:** 
1. Vào Firebase Console → Authentication → Sign-in method
2. Bật "Anonymous" provider

### Lỗi: "Database not initialized"

**Nguyên nhân:** Firebase config chưa được setup đúng

**Giải pháp:**
1. Kiểm tra file `services/firebaseConfig.ts`
2. Đảm bảo project ID là "laperlapos"

### App Không Kết Nối Được Database

**Giải pháp tạm thời (KHÔNG khuyến nghị cho production):**
1. Vào Firebase Console → Realtime Database → Rules
2. Tạm thời đổi thành:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
3. Publish rules
4. Kiểm tra lại app

## Rollback (Hoàn Tác)

Nếu cần hoàn tác về rules cũ (KHÔNG an toàn):

1. Chỉnh sửa `database.rules.json`:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

2. Deploy lại:
```bash
firebase deploy --only database
```

**Lưu ý:** Không nên sử dụng rules không an toàn này cho môi trường production.

## Tài Liệu Bổ Sung

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/database/security)
- [Anonymous Authentication](https://firebase.google.com/docs/auth/web/anonymous-auth)
- File `FIREBASE_SECURITY_RULES.md` trong repo này

## Liên Hệ Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra Firebase Console → Realtime Database → Rules
2. Xem browser console log (F12)
3. Đảm bảo anonymous authentication đã được bật

---

**Tóm tắt nhanh:**
```bash
# 1. Đăng nhập
firebase login

# 2. Deploy rules
firebase deploy --only database

# 3. Bật Anonymous Auth trong Firebase Console

# 4. Test app
```

✅ Xong! Database của bạn giờ đã được bảo mật.
