# 🎯 Hướng Dẫn Hoàn Chỉnh: Tự Động Đồng Bộ GitHub và Firebase

## 📌 Giới Thiệu

Tài liệu này hướng dẫn **từng bước chi tiết** để thiết lập tự động đồng bộ từ GitHub sang Firebase Hosting. Sau khi setup xong, bạn chỉ cần push code lên GitHub và website sẽ tự động cập nhật trên Firebase.

### 🎯 Mục Tiêu

- ✅ Hiểu rõ quy trình tự động deploy
- ✅ Thiết lập GitHub Actions workflow
- ✅ Cấu hình Firebase Service Account an toàn
- ✅ Biết cách theo dõi và troubleshoot

---

## 🚨 QUAN TRỌNG: Đọc Phần Này Trước!

### ⚠️ Bảo Mật Credentials

**KHÔNG BAO GIỜ:**
- ❌ Chia sẻ Firebase Service Account JSON công khai
- ❌ Commit credentials vào Git repository
- ❌ Paste credentials vào GitHub Issues/Discussions
- ❌ Gửi credentials qua email hoặc chat công khai

**LUÔN LUÔN:**
- ✅ Lưu credentials trong GitHub Secrets
- ✅ Sử dụng `.gitignore` cho files nhạy cảm
- ✅ Rotate keys định kỳ (3-6 tháng một lần)
- ✅ Review access logs thường xuyên

---

## 📋 Yêu Cầu Trước Khi Bắt Đầu

### 1. Tài Khoản và Quyền Truy Cập

- ✅ GitHub account với quyền **Admin** hoặc **Write** vào repository
- ✅ Firebase/Google account với quyền **Owner** hoặc **Editor** vào Firebase project
- ✅ Repository đã được khởi tạo với code

### 2. Kiểm Tra Hiện Trạng

Trước khi bắt đầu, hãy kiểm tra:

```bash
# 1. Kiểm tra repository
cd /path/to/La-perla
git status
git remote -v

# 2. Kiểm tra có workflow file chưa
ls -la .github/workflows/

# 3. Kiểm tra Firebase config
cat firebase.json
cat .firebaserc
```

---

## 🚀 PHẦN 1: Thiết Lập Firebase Service Account

### Bước 1.1: Truy Cập Firebase Console

1. Mở trình duyệt và truy cập: https://console.firebase.google.com/
2. Đăng nhập với Google account của bạn
3. Chọn project **La Perla** từ danh sách
   - Project ID: `la-perla-53540395-70c43`

### Bước 1.2: Mở Service Accounts Settings

1. Click vào biểu tượng **⚙️ (bánh răng)** ở góc trên bên trái
2. Chọn **Project settings**
3. Click tab **Service accounts** ở phía trên

![Service Accounts Tab](https://firebase.google.com/docs/admin/setup#service-account)

### Bước 1.3: Generate New Private Key

1. Trong tab **Service accounts**, bạn sẽ thấy:
   - Service account email (dạng: `firebase-adminsdk-...@your-project.iam.gserviceaccount.com`)
   - Nút **Generate new private key**

2. Click button **"Generate new private key"**

3. Một dialog box sẽ xuất hiện cảnh báo:
   ```
   "This key can be used to authenticate as this service account.
   Keep it confidential and never expose it publicly."
   ```

4. Click **"Generate key"** để xác nhận

5. File JSON sẽ được tự động download về máy
   - Tên file thường có dạng: `la-perla-xxx-firebase-adminsdk-xxx.json`

### Bước 1.4: Lưu File An Toàn

⚠️ **QUAN TRỌNG:**

1. **Di chuyển file ngay** khỏi thư mục Downloads
2. **Đặt ở vị trí an toàn** (NOT trong Git repository)
3. **Không share** với bất kỳ ai
4. **Backup** ở nơi an toàn (encrypted storage)

Ví dụ vị trí lưu:
```bash
# Tạo thư mục riêng cho secrets (OUTSIDE Git repo)
mkdir -p ~/firebase-secrets
mv ~/Downloads/la-perla-*-firebase-adminsdk-*.json ~/firebase-secrets/
chmod 600 ~/firebase-secrets/*.json
```

### Bước 1.5: Verify Nội Dung File

Mở file JSON và verify có các fields sau:

```json
{
  "type": "service_account",
  "project_id": "la-perla-53540395-70c43",
  "private_key_id": "xxx...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@la-perla-xxx.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

✅ Nếu có đầy đủ các fields trên → OK, tiếp tục bước tiếp theo

---

## 🔐 PHẦN 2: Thêm Secret Vào GitHub

### Bước 2.1: Mở File và Copy Nội Dung

1. Mở file JSON vừa download ở Bước 1.4
2. Copy **TOÀN BỘ** nội dung từ `{` đầu tiên đến `}` cuối cùng
   - Bao gồm cả các ký tự xuống dòng và whitespace
   - Đảm bảo không thừa/thiếu ký tự nào

### Bước 2.2: Truy Cập GitHub Repository Settings

1. Mở trình duyệt và truy cập:
   ```
   https://github.com/nthminh/La-perla
   ```

2. Click tab **"Settings"** (phải có quyền Admin/Write)

3. Trong sidebar bên trái, tìm section **"Security"**

4. Click **"Secrets and variables"** → **"Actions"**

Hoặc truy cập trực tiếp:
```
https://github.com/nthminh/La-perla/settings/secrets/actions
```

### Bước 2.3: Tạo Repository Secret

1. Click button **"New repository secret"** (màu xanh)

2. Điền thông tin:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
     - ⚠️ Phải chính xác tên này (case-sensitive)
     - ⚠️ Không có khoảng trắng
   
   - **Value:** Paste toàn bộ nội dung JSON đã copy ở Bước 2.1
     - Paste từ `{` đến `}`
     - Bao gồm tất cả các dòng

3. Click **"Add secret"** để lưu

### Bước 2.4: Verify Secret Đã Được Thêm

Sau khi add, bạn sẽ thấy:
- Secret name: `FIREBASE_SERVICE_ACCOUNT`
- Last updated: [timestamp hiện tại]
- ⚠️ Lưu ý: GitHub không cho phép xem lại value sau khi add

✅ Nếu thấy secret trong danh sách → OK, tiếp tục

---

## 🔧 PHẦN 3: Kiểm Tra GitHub Actions Workflow

### Bước 3.1: Verify Workflow File Tồn Tại

```bash
cd /home/runner/work/La-perla/La-perla
cat .github/workflows/firebase-deploy.yml
```

✅ Nếu file tồn tại và có nội dung → OK

❌ Nếu file không tồn tại → Tạo file mới (xem Bước 3.2)

### Bước 3.2: Tạo Workflow File (Nếu Chưa Có)

Nếu chưa có file, tạo mới:

```bash
mkdir -p .github/workflows
cat > .github/workflows/firebase-deploy.yml << 'EOF'
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      checks: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: la-perla-53540395-70c43
EOF
```

### Bước 3.3: Hiểu Workflow Configuration

```yaml
# Trigger: Khi nào workflow chạy?
on:
  push:
    branches:
      - main          # Tự động chạy khi push lên nhánh main
  workflow_dispatch:  # Cho phép chạy thủ công

# Build Environment
runs-on: ubuntu-latest  # Chạy trên máy Ubuntu mới nhất

# Steps: Các bước thực hiện
steps:
  1. Checkout code    # Lấy code từ repository
  2. Setup Node.js    # Cài đặt Node.js version 20
  3. Install deps     # npm ci (cài dependencies)
  4. Build app        # npm run build
  5. Deploy           # Deploy lên Firebase Hosting
```

---

## ✅ PHẦN 4: Test Workflow Lần Đầu

### Bước 4.1: Tạo Commit Test

Cách 1: Thay đổi file README

```bash
cd /home/runner/work/La-perla/La-perla

# Thêm một dòng vào README
echo "" >> README.md
echo "✅ Auto-deploy setup completed $(date)" >> README.md

# Commit
git add README.md
git commit -m "test: verify auto-deploy workflow"
```

Cách 2: Tạo file test nhỏ

```bash
echo "Auto-deploy test" > test-deploy.txt
git add test-deploy.txt
git commit -m "test: verify auto-deploy workflow"
```

### Bước 4.2: Push Lên Main Branch

```bash
# Push lên main
git push origin main
```

⚠️ **Lưu ý:** Nếu bạn đang ở branch khác, merge vào main trước:

```bash
# Xem branch hiện tại
git branch

# Nếu không phải main, chuyển về main
git checkout main
git pull origin main

# Merge branch của bạn
git merge your-branch-name

# Push
git push origin main
```

### Bước 4.3: Theo Dõi Workflow Execution

1. Mở trình duyệt và truy cập:
   ```
   https://github.com/nthminh/La-perla/actions
   ```

2. Bạn sẽ thấy workflow mới nhất đang chạy:
   - 🟡 **Yellow/Orange icon:** Đang chạy (In Progress)
   - Click vào workflow name để xem chi tiết

3. Xem logs chi tiết:
   - Click vào workflow run
   - Click vào job name: `build-and-deploy`
   - Xem từng step execution

### Bước 4.4: Kiểm Tra Kết Quả

#### ✅ Thành Công (Success)

Nếu workflow chạy thành công:
- ✅ Icon chuyển sang màu xanh (green checkmark)
- ✅ Tất cả các steps đều pass
- ✅ Cuối cùng thấy Firebase deploy URL

Example output:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/la-perla-53540395-70c43/overview
Hosting URL: https://la-perla-53540395-70c43.web.app
```

**Action:** 
1. Copy URL từ logs
2. Mở trong trình duyệt
3. Verify website đã update

#### ❌ Thất Bại (Failed)

Nếu workflow thất bại, xem Phần 5: Troubleshooting

---

## 🔍 PHẦN 5: Troubleshooting

### Lỗi 1: "Error: HTTP Error: 403, The caller does not have permission"

**Nguyên nhân:** Secret không đúng hoặc service account không có quyền

**Giải pháp:**

1. **Kiểm tra Secret:**
   ```
   GitHub → Settings → Secrets → Actions
   ```
   - Verify secret `FIREBASE_SERVICE_ACCOUNT` tồn tại
   - Nếu không chắc, xóa và tạo lại (Phần 2)

2. **Kiểm tra Service Account Permissions:**
   - Vào Firebase Console
   - Settings → Service Accounts
   - Verify service account có role **Firebase Admin SDK Admin**

3. **Generate New Key:**
   - Nếu vẫn lỗi, quay lại Phần 1
   - Generate key mới
   - Update lại secret (Phần 2)

### Lỗi 2: "npm ci failed" hoặc "Build failed"

**Nguyên nhân:** Dependencies hoặc code có vấn đề

**Giải pháp:**

1. **Test build locally:**
   ```bash
   cd /home/runner/work/La-perla/La-perla
   npm install
   npm run build
   ```

2. **Nếu build local thành công:**
   - Commit file `package-lock.json`
   - Push lại

3. **Nếu build local cũng fail:**
   - Xem error message
   - Fix code errors
   - Test lại local
   - Khi pass thì push

### Lỗi 3: "secret 'FIREBASE_SERVICE_ACCOUNT' not found"

**Nguyên nhân:** Secret chưa được add hoặc tên sai

**Giải pháp:**

1. Verify secret name chính xác: `FIREBASE_SERVICE_ACCOUNT`
   - Case-sensitive
   - Không có khoảng trắng

2. Add lại secret theo Phần 2

### Lỗi 4: Workflow Không Chạy

**Nguyên nhân:** Nhiều khả năng

**Giải pháp:**

1. **Kiểm tra branch:**
   ```bash
   git branch --show-current
   ```
   - Phải push lên branch `main`

2. **Kiểm tra Actions enabled:**
   - GitHub → Settings → Actions → General
   - Verify "Allow all actions and reusable workflows"

3. **Kiểm tra workflow file:**
   ```bash
   cat .github/workflows/firebase-deploy.yml
   ```
   - Verify syntax đúng (YAML format)

4. **Test chạy thủ công:**
   - GitHub → Actions → "Deploy to Firebase Hosting"
   - Click "Run workflow" button
   - Select branch `main`
   - Click "Run workflow"

### Lỗi 5: "permission denied" hoặc "insufficient privileges"

**Nguyên nhân:** Service account không có đủ quyền

**Giải pháp:**

1. Vào Firebase Console
2. Settings → Users and permissions
3. Tìm service account email
4. Assign role: **Editor** hoặc **Owner**

Hoặc sử dụng Google Cloud Console:
1. https://console.cloud.google.com/iam-admin/iam
2. Tìm service account
3. Edit permissions
4. Add role: **Firebase Hosting Admin**

---

## 💻 PHẦN 6: Quy Trình Làm Việc Hàng Ngày

### Scenario 1: Làm Việc Trên Nhánh Riêng (Recommended)

```bash
# 1. Tạo branch mới từ main
git checkout main
git pull origin main
git checkout -b feature/my-new-feature

# 2. Code và test local
npm run dev  # Test at http://localhost:5173

# 3. Commit changes thường xuyên
git add .
git commit -m "feat: add new feature part 1"
git push origin feature/my-new-feature

# 4. Tiếp tục code...
git add .
git commit -m "feat: complete new feature"
git push origin feature/my-new-feature

# 5. Khi hoàn thành, merge vào main
git checkout main
git pull origin main
git merge feature/my-new-feature

# 6. Push main → Tự động deploy!
git push origin main

# 7. Theo dõi tại:
# https://github.com/nthminh/La-perla/actions
```

### Scenario 2: Làm Việc Trực Tiếp Trên Main

```bash
# 1. Đảm bảo main up-to-date
git checkout main
git pull origin main

# 2. Code và test
npm run dev

# 3. Commit
git add .
git commit -m "fix: update homepage layout"

# 4. Push → Tự động deploy!
git push origin main
```

### Scenario 3: Deploy Thủ Công (Manual Trigger)

Khi bạn muốn deploy lại mà không push code mới:

1. Truy cập: https://github.com/nthminh/La-perla/actions
2. Click workflow: **"Deploy to Firebase Hosting"**
3. Click button **"Run workflow"** (bên phải)
4. Select branch: `main`
5. Click **"Run workflow"** để xác nhận
6. Workflow sẽ chạy ngay lập tức

---

## 📊 PHẦN 7: Monitoring và Maintenance

### 7.1: Theo Dõi Deployments

#### GitHub Actions
```
https://github.com/nthminh/La-perla/actions
```
- Xem history của tất cả deployments
- Xem logs chi tiết
- Re-run failed workflows

#### Firebase Console
```
https://console.firebase.google.com/project/la-perla-53540395-70c43/hosting
```
- Xem deployment history
- Xem traffic và usage
- Rollback nếu cần

### 7.2: Nhận Thông Báo

**Setup GitHub Notifications:**

1. GitHub → Settings (personal) → Notifications
2. Enable "Actions" notifications
3. Choose: Email hoặc Web notifications

**Hoặc:**

Repository → Settings → Notifications → Configure

### 7.3: Deployment Status Badge

Thêm vào README.md để hiển thị status:

```markdown
[![Deploy Status](https://github.com/nthminh/La-perla/workflows/Deploy%20to%20Firebase%20Hosting/badge.svg)](https://github.com/nthminh/La-perla/actions)
```

### 7.4: Rollback Version

Nếu phiên bản mới có vấn đề:

**Cách 1: Qua Firebase Console**
1. Firebase Console → Hosting
2. Xem deployment history
3. Click "..." trên version muốn rollback
4. Click "Rollback"

**Cách 2: Qua CLI**
```bash
firebase hosting:rollback
```

### 7.5: Maintenance Schedule

Đề xuất lịch bảo trì:

- **Hàng tuần:** Review deployment logs
- **Hàng tháng:** Check Firebase usage và costs
- **3-6 tháng:** Rotate service account keys
- **Khi cần:** Update dependencies (`npm update`)

---

## 🎯 PHẦN 8: Câu Hỏi Thường Gặp (FAQ)

### Q1: Tôi cần chạy lệnh deploy thủ công không?

**A:** Không! Sau khi setup xong:
```bash
# CHỈ CẦN:
git push origin main

# KHÔNG CẦN:
# ./deploy-to-firebase.sh  ← Không cần nữa!
# firebase deploy          ← Không cần nữa!
```

### Q2: Script ./deploy-to-firebase.sh còn dùng được không?

**A:** Có! Script vẫn hoạt động. Dùng khi:
- Muốn deploy từ local machine
- Test trước khi push
- GitHub Actions có vấn đề tạm thời
- Deploy từ branch khác (không phải main)

### Q3: Chi phí có tăng không?

**A:** 
- GitHub Actions: **Miễn phí** cho public repositories
- Firebase Hosting: **Không thay đổi**, vẫn như cũ
  - Free tier: 10 GB storage, 360 MB/day bandwidth
  - Nếu vượt quá, tính theo Firebase pricing

### Q4: Bao lâu thì deploy xong?

**A:** Thường 2-5 phút, gồm:
- Checkout code: ~10 giây
- Setup Node.js: ~10 giây
- Install deps: ~30-60 giây
- Build: ~1-2 phút
- Deploy: ~30-60 giây

### Q5: Tôi có thể deploy nhiều branches không?

**A:** Có! Modify workflow để deploy preview:

```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
```

### Q6: Làm sao disable auto-deploy?

**A:** 
Cách 1: Đổi tên file
```bash
mv .github/workflows/firebase-deploy.yml .github/workflows/firebase-deploy.yml.disabled
```

Cách 2: Xóa file
```bash
rm .github/workflows/firebase-deploy.yml
```

Cách 3: Disable trong Settings
- Repository → Settings → Actions
- Disable Actions

### Q7: Có thể deploy từ branch khác main không?

**A:** Có! Sửa workflow file:

```yaml
on:
  push:
    branches:
      - main
      - develop    # Thêm branches khác
      - staging
```

### Q8: Credentials có an toàn không?

**A:** Có, nếu follow best practices:
- ✅ Lưu trong GitHub Secrets (encrypted)
- ✅ Không commit vào Git
- ✅ Rotate keys định kỳ
- ✅ Review access logs

### Q9: Deploy fail, làm sao revert?

**A:**

Cách 1: Rollback trong Firebase Console

Cách 2: Revert commit và push
```bash
git revert HEAD
git push origin main
```

### Q10: Có thể test build trước khi push không?

**A:** Có!

```bash
# Local build test
npm run build
npm run preview  # Test at http://localhost:4173

# Nếu OK, push
git push origin main
```

---

## 🎓 PHẦN 9: Học Thêm

### Tài Liệu Chính Thức

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

### Repository Files Liên Quan

```
La-perla/
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml       # Workflow configuration
├── firebase.json                     # Firebase config
├── .firebaserc                       # Firebase project settings
├── deploy-to-firebase.sh            # Manual deploy script (backup)
├── AUTO_SYNC_QUICK_GUIDE.md         # Quick reference
├── HUONG_DAN_TU_DONG_DONG_BO.md    # Auto-sync guide
└── SETUP_COMPLETE_GUIDE_VI.md       # This file
```

### Video Tutorials (Recommended)

- [GitHub Actions Crash Course](https://www.youtube.com/results?search_query=github+actions+tutorial)
- [Firebase Hosting Guide](https://www.youtube.com/results?search_query=firebase+hosting+tutorial)

---

## ✅ CHECKLIST HOÀN CHỈNH

In ra và check từng bước:

### Setup Phase
- [ ] Đã đọc và hiểu tài liệu
- [ ] Có quyền Admin trên GitHub repository
- [ ] Có quyền Owner/Editor trên Firebase project
- [ ] Đã generate Firebase Service Account key
- [ ] Đã lưu file JSON ở nơi an toàn
- [ ] Đã add `FIREBASE_SERVICE_ACCOUNT` secret vào GitHub
- [ ] Đã verify workflow file tồn tại
- [ ] Đã commit và push code test

### Testing Phase
- [ ] Push code lên main đã trigger workflow
- [ ] Workflow chạy thành công (green checkmark)
- [ ] Website đã update trên Firebase Hosting
- [ ] Đã test mở website và verify changes
- [ ] Đã xem logs trong GitHub Actions
- [ ] Đã check deployment trong Firebase Console

### Security Phase
- [ ] Đã xóa file Service Account JSON khỏi Downloads
- [ ] Không có credentials trong Git repository
- [ ] Đã update `.gitignore` nếu cần
- [ ] Đã review IAM permissions
- [ ] Đã setup thông báo cho workflow failures

### Documentation Phase
- [ ] Đã đọc troubleshooting guide
- [ ] Đã hiểu quy trình làm việc hàng ngày
- [ ] Đã biết cách monitor deployments
- [ ] Đã bookmark các links quan trọng
- [ ] Đã share guide với team members nếu có

---

## 🎉 HOÀN THÀNH!

Chúc mừng! Bạn đã setup thành công auto-deploy từ GitHub sang Firebase.

### 🚀 Bây Giờ Làm Gì?

**Workflow mới của bạn:**

```bash
# 1. Code như bình thường
# 2. Test local
# 3. Commit
git add .
git commit -m "Your changes"

# 4. Push
git push origin main

# 5. Xong! GitHub Actions sẽ tự động deploy
# 6. Kiểm tra tại: https://la-perla-53540395-70c43.web.app
```

### 💡 Nhớ Rằng:

- ✅ **Không cần chạy lệnh deploy thủ công**
- ✅ **GitHub và Firebase luôn đồng bộ**
- ✅ **Có logs đầy đủ để troubleshoot**
- ✅ **Có thể rollback bất cứ lúc nào**

### 📞 Cần Hỗ Trợ?

- GitHub Issues: https://github.com/nthminh/La-perla/issues
- Firebase Support: https://firebase.google.com/support
- Documentation: Các files MD trong repository

---

**Happy Deploying! 🎊**

---

*Document Version: 1.0*  
*Last Updated: 2025-12-30*  
*Author: GitHub Copilot Coding Agent*
