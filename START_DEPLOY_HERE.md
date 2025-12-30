# 🎯 START HERE - La Perla Deployment

## 🔄 NEW: Auto-Deploy (Recommended)

### One-Time Setup (5 minutes):
1. Get Firebase Service Account Key from [Firebase Console](https://console.firebase.google.com/)
2. Add `FIREBASE_SERVICE_ACCOUNT` secret to [GitHub Settings](https://github.com/nthminh/La-perla/settings/secrets/actions)
3. Done! Just push to deploy:
   ```bash
   git push origin main
   # ✨ Auto-deploys to Firebase!
   ```

📖 **Full Guide:** [AUTO_SYNC_QUICK_GUIDE.md](./AUTO_SYNC_QUICK_GUIDE.md) | [Vietnamese](./HUONG_DAN_TU_DONG_DONG_BO.md)

---

## 📦 Manual Deploy (Alternative)

### Step 1: First Time Setup (Only Once)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Make script executable
chmod +x deploy-to-firebase.sh
```

### Step 2: Commit Your Work
```bash
git add .
git commit -m "Your work description"
```

### Step 3: Deploy! 🚀
```bash
./deploy-to-firebase.sh
```

**That's it!** Your app will be live at `https://laperlapos.web.app`

---

## 📚 Need More Information?

### Quick Reference
- **English**: [Quick Start](FIREBASE_DEPLOY_GUIDE.md)
- **Tiếng Việt**: [Hướng dẫn nhanh](LENH_DEPLOY_NHANH.md)

### Full Guides
- **English**: [Complete Deployment Guide](FIREBASE_DEPLOY_GUIDE.md)
- **Tiếng Việt**: [Hướng dẫn đầy đủ](DEPLOY_HUONG_DAN.md)

### Technical Details
- [Deployment Automation Summary](DEPLOYMENT_AUTOMATION_SUMMARY.md)

---

## 🆘 Having Issues?

### Script won't run?
```bash
chmod +x deploy-to-firebase.sh
```

### Uncommitted changes?
```bash
git add .
git commit -m "My changes"
```

### Build failed?
Check the error message and fix your code, then try again.

---

**Remember:** `./deploy-to-firebase.sh` is all you need! 🎉
