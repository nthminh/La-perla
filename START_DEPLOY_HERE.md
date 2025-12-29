# 🎯 START HERE - La Perla Deployment

## ⚡ Deploy Your App in 3 Steps

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
