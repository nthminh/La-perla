# Hướng Dẫn Cài Đặt & Chạy La Perla

## 📋 Tổng Quan

La Perla là ứng dụng quản lý tiệm nail với tích hợp AI, bao gồm:
- 🎨 Tạo mẫu nail art bằng AI
- 📅 Hệ thống đặt lịch hẹn
- 💰 Quản lý bán hàng (POS)
- 👥 Portal cho nhân viên
- 📊 Dashboard quản lý
- 🔥 Đồng bộ Firebase real-time

## 🚀 Cài Đặt Nhanh

### Yêu Cầu
- **Node.js** phiên bản 16 trở lên
- **npm** (đi kèm với Node.js)
- **Gemini API Key** từ Google AI Studio

### Các Bước Cài Đặt

1. **Cài đặt thư viện**
   ```bash
   npm install
   ```

2. **Cấu hình API Key**
   
   Tạo file `.env.local` trong thư mục gốc:
   ```env
   GEMINI_API_KEY=api_key_cua_ban_o_day
   ```
   
   Lấy API key tại: https://ai.google.dev/

3. **Chạy ứng dụng ở chế độ phát triển**
   ```bash
   npm run dev
   ```
   
   Mở trình duyệt: http://localhost:5173/

4. **Build cho production**
   ```bash
   npm run build
   ```
   
   File build sẽ nằm trong thư mục `dist/`

5. **Xem trước bản build production**
   ```bash
   npm run preview
   ```

## 🔧 Script Hỗ Trợ

### Kiểm Tra Build
Chạy script để kiểm tra mọi thứ hoạt động:
```bash
./verify-build.sh
```

Script này sẽ kiểm tra:
- ✅ Node.js và npm đã cài đặt
- ✅ Thư viện dependencies
- ✅ File cấu hình .env.local
- ✅ Build thành công
- ✅ Tạo file trong thư mục dist/

## 🔥 Cấu Hình Firebase

Ứng dụng đã tích hợp sẵn Firebase. Bạn có thể:

### Tùy Chọn 1: Dùng Firebase Mặc Định
App sử dụng project Firebase có sẵn (`laperlapos`).

### Tùy Chọn 2: Dùng Firebase Của Bạn
1. Vào Admin panel trong app
2. Chọn Settings → Firebase Setup
3. Dán cấu hình Firebase JSON của bạn
4. Test kết nối
5. Lưu và reload

## 📱 Tính Năng Chính

### Cho Khách Hàng
- Xem bảng giá dịch vụ
- Đặt lịch hẹn online
- Tạo mẫu nail art bằng AI
- Xem gallery mẫu nail
- Chat với AI assistant

### Cho Nhân Viên
- Check-in/out với GPS
- Xem lịch làm việc
- Quản lý khách hàng
- Xem thu nhập

### Cho Quản Lý
- Dashboard kinh doanh
- Quản lý nhân viên
- Quản lý giá dịch vụ
- Xem báo cáo doanh thu
- Cấu hình hệ thống

## 🌐 Đa Ngôn Ngữ

App hỗ trợ:
- 🇻🇳 Tiếng Việt
- 🇺🇸 English
- 🇪🇸 Español

## 📚 Tài Liệu Chi Tiết

### Bằng Tiếng Việt
- **File này** - Hướng dẫn cài đặt cơ bản

### Bằng Tiếng Anh
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Hướng dẫn cài đặt chi tiết
- **[FIREBASE_STUDIO_GUIDE.md](./FIREBASE_STUDIO_GUIDE.md)** - Hướng dẫn import vào Firebase Studio
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Checklist triển khai production

## 🎯 Import Vào Firebase Studio

### Bước 1: Build App
```bash
npm run build
```

### Bước 2: Deploy lên Firebase Hosting
```bash
# Cài Firebase CLI
npm install -g firebase-tools

# Đăng nhập
firebase login

# Khởi tạo project
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Bước 3: Import vào AI Studio
1. Truy cập https://aistudio.google.com/
2. Tạo project mới hoặc mở project có sẵn
3. Import từ URL Firebase Hosting của bạn
4. Cấu hình thêm các tính năng AI nâng cao

Chi tiết: [FIREBASE_STUDIO_GUIDE.md](./FIREBASE_STUDIO_GUIDE.md)

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Database**: Firebase Realtime Database
- **AI**: Google Gemini API
- **Authentication**: Firebase Auth

## ⚡ Lệnh Nhanh

```bash
# Cài đặt
npm install

# Chạy dev
npm run dev

# Build
npm run build

# Xem build
npm run preview

# Kiểm tra
./verify-build.sh
```

## 🐛 Xử Lý Lỗi

### Lỗi Build
```bash
# Xóa và cài lại
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Lỗi API Key
- Kiểm tra file `.env.local` có trong thư mục gốc
- Tên biến phải là `GEMINI_API_KEY`
- API key phải lấy từ https://ai.google.dev/

### Lỗi Firebase
- Kiểm tra Project ID trong cấu hình
- Bật Realtime Database trong Firebase Console
- Cấu hình Database Rules cho phép đọc/ghi

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Đọc kỹ các file hướng dẫn
2. Chạy `./verify-build.sh` để kiểm tra
3. Xem console log để tìm lỗi
4. Kiểm tra Firebase Console

## 🎉 Hoàn Thành!

Sau khi làm theo các bước trên, bạn sẽ có:
- ✅ App chạy được trên local
- ✅ Build thành công
- ✅ Sẵn sàng deploy lên Firebase
- ✅ Có thể import vào Firebase Studio

**Chúc bạn thành công!** 🚀

---

## Liên Kết Quan Trọng

- 🔗 [Google AI Studio](https://ai.google.dev/) - Lấy Gemini API key
- 🔗 [Firebase Console](https://console.firebase.google.com/) - Quản lý Firebase
- 🔗 [Node.js Download](https://nodejs.org/) - Tải Node.js

