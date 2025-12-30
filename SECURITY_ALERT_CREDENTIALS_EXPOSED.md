# 🚨 CẢNH BÁO BẢO MẬT KHẨN CẤP / CRITICAL SECURITY ALERT

## ⚠️ THÔNG TIN NHẠY CẢM ĐÃ BỊ LỘ / CREDENTIALS HAVE BEEN EXPOSED

**Ngày phát hiện / Date Detected:** 2025-12-30

### 🔴 Vấn Đề / Problem

Thông tin Service Account của Firebase (bao gồm Private Key) đã bị chia sẻ công khai. Đây là **vấn đề bảo mật nghiêm trọng**.

Firebase Service Account credentials (including the Private Key) have been publicly shared. This is a **critical security issue**.

### 📋 Thông Tin Bị Lộ / Exposed Information

- Project ID: `la-perla-53540395-70c43`
- Private Key ID: `eae3e8ce4a1f8fee34ce2d70f980404e1979e3b1`
- Client Email: `firebase-adminsdk-fbsvc@la-perla-53540395-70c43.iam.gserviceaccount.com`
- Client ID: `113618941591980297326`
- Private Key: ✅ (Đã bị lộ / Exposed)

### 🚀 HÀNH ĐỘNG KHẨN CẤP CẦN LÀM NGAY / IMMEDIATE ACTIONS REQUIRED

#### Bước 1: Thu Hồi Service Account Cũ / Step 1: Revoke Old Service Account

1. Truy cập Firebase Console: https://console.firebase.google.com/
2. Chọn project **La Perla** (`la-perla-53540395-70c43`)
3. Vào **Project Settings** (biểu tượng bánh răng) > **Service Accounts**
4. Tìm service account: `firebase-adminsdk-fbsvc@la-perla-53540395-70c43.iam.gserviceaccount.com`
5. **XÓA** hoặc **VÔ HIỆU HÓA** service account này ngay lập tức

**HOẶC / OR:**

1. Vào **IAM & Admin** trong Google Cloud Console
2. Tìm service account có Private Key ID: `eae3e8ce4a1f8fee34ce2d70f980404e1979e3b1`
3. Xóa tất cả các keys của service account này

#### Bước 2: Tạo Service Account Mới / Step 2: Create New Service Account

1. Trong Firebase Console > **Project Settings** > **Service Accounts**
2. Click **Generate New Private Key**
3. Click **Generate Key** để tải file JSON mới về máy
4. ⚠️ **LƯU Ý:** File này cũng rất nhạy cảm, giữ an toàn!

#### Bước 3: Cập Nhật GitHub Secret / Step 3: Update GitHub Secret

1. Mở file JSON mới vừa tải về
2. Copy **TOÀN BỘ** nội dung JSON (từ `{` đến `}`)
3. Truy cập: https://github.com/nthminh/La-perla/settings/secrets/actions
4. Tìm secret `FIREBASE_SERVICE_ACCOUNT`
5. Click **Update** hoặc xóa và tạo mới
6. Paste nội dung JSON mới
7. Click **Save** hoặc **Add secret**

#### Bước 4: Xác Minh Hoạt Động / Step 4: Verify

1. Commit một thay đổi nhỏ và push lên nhánh `main`
2. Vào https://github.com/nthminh/La-perla/actions
3. Xem workflow "Deploy to Firebase Hosting" chạy thành công với credentials mới

---

## 📚 TẠI SAO ĐIỀU NÀY QUAN TRỌNG / WHY THIS IS CRITICAL

### Nguy Cơ Khi Credentials Bị Lộ / Risks When Credentials Are Exposed:

1. ❌ **Truy cập trái phép vào Firebase project**
   - Kẻ xấu có thể thay đổi database
   - Có thể xóa dữ liệu
   - Có thể đọc thông tin nhạy cảm

2. ❌ **Triển khai code độc hại**
   - Có thể deploy website giả mạo
   - Có thể chèn mã độc vào website

3. ❌ **Chi phí không mong muốn**
   - Có thể lạm dụng tài nguyên Firebase
   - Gây ra chi phí cao bất thường

4. ❌ **Vi phạm quyền riêng tư**
   - Dữ liệu người dùng có thể bị truy cập
   - Thông tin cá nhân có thể bị lộ

---

## 🛡️ CÁC THỰC HÀNH BẢO MẬT TỐT / SECURITY BEST PRACTICES

### ✅ LUÔN LÀM / ALWAYS DO:

1. **Lưu credentials trong GitHub Secrets**
   - Không bao giờ commit vào Git
   - Chỉ lưu trong Settings > Secrets

2. **Sử dụng .gitignore**
   - Đảm bảo các file nhạy cảm không bị commit
   - Thêm pattern cho các file credentials

3. **Rotate keys định kỳ**
   - Thay đổi service account keys mỗi 3-6 tháng
   - Xóa keys cũ sau khi cập nhật

4. **Giới hạn quyền**
   - Chỉ cấp quyền tối thiểu cần thiết
   - Review IAM permissions thường xuyên

5. **Monitor logs**
   - Theo dõi Firebase Console logs
   - Phát hiện hoạt động bất thường

### ❌ KHÔNG BAO GIỜ / NEVER:

1. ❌ Commit file `.env` hoặc service account JSON vào Git
2. ❌ Chia sẻ credentials qua email, chat, issues
3. ❌ Paste credentials vào issue trackers công khai
4. ❌ Screenshot credentials và đăng lên
5. ❌ Hardcode credentials trong source code

---

## 📝 CẬP NHẬT .gitignore

Đảm bảo file `.gitignore` có các dòng sau:

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Firebase credentials
firebase-key.json
serviceAccountKey.json
*-firebase-adminsdk-*.json

# Secret files
secrets/
*.key
*.pem
```

---

## ✅ CHECKLIST SAU KHI XỬ LÝ / POST-INCIDENT CHECKLIST

- [ ] Service account cũ đã bị xóa/vô hiệu hóa
- [ ] Service account mới đã được tạo
- [ ] GitHub Secret đã được cập nhật với credentials mới
- [ ] Workflow đã chạy thành công với credentials mới
- [ ] `.gitignore` đã được cập nhật
- [ ] Không còn file credentials nào trong repository
- [ ] Firebase logs đã được kiểm tra để phát hiện hoạt động bất thường
- [ ] Team members đã được thông báo về best practices

---

## 📞 LIÊN HỆ HỖ TRỢ / SUPPORT

Nếu bạn:
- Không chắc chắn đã xử lý đúng
- Phát hiện hoạt động bất thường
- Cần hỗ trợ thêm

Hãy:
1. Kiểm tra Firebase Console logs
2. Xem Google Cloud Console IAM logs
3. Liên hệ Firebase Support nếu cần

---

## 📖 TÀI LIỆU THAM KHẢO / REFERENCES

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/best-practices)
- [Google Cloud IAM Best Practices](https://cloud.google.com/iam/docs/best-practices)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## 🎓 HỌC BÀI HỌC / LESSONS LEARNED

### Cách Đúng Để Chia Sẻ Thông Tin / Proper Way to Share Information:

❌ **SAI / WRONG:**
```
"Đây là token Firebase của tôi: {paste entire JSON}"
```

✅ **ĐÚNG / CORRECT:**
```
"Tôi đã thêm credentials vào GitHub Secrets như hướng dẫn. 
Workflow không chạy được, có thể xem logs ở đây: [link to Actions]"
```

### Khi Cần Hỗ Trợ / When Asking for Help:

1. ✅ Mô tả vấn đề (error message, steps taken)
2. ✅ Chia sẻ logs (sau khi redact sensitive info)
3. ✅ Chia sẻ screenshots (che giấu sensitive data)
4. ❌ KHÔNG chia sẻ credentials, keys, tokens

---

## 🚀 BƯỚC TIẾP THEO / NEXT STEPS

Sau khi xử lý xong các bước khẩn cấp ở trên:

1. Đọc hướng dẫn setup đầy đủ: [SETUP_COMPLETE_GUIDE_VI.md](SETUP_COMPLETE_GUIDE_VI.md)
2. Test workflow với credentials mới
3. Review security practices định kỳ
4. Educate team members về bảo mật

---

**LƯU Ý QUAN TRỌNG:** File này là tài liệu về một sự cố bảo mật. Sau khi xử lý xong, bạn có thể xóa file này hoặc lưu lại làm tài liệu tham khảo.

**IMPORTANT NOTE:** This file documents a security incident. After resolution, you may delete this file or keep it as a reference document.
