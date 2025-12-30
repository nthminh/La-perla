# 🔄 GitHub-Firebase Auto-Sync - Quick Setup

## 🎯 What You Get

After setup, just push to `main` and your site auto-deploys to Firebase! No manual commands needed.

```bash
git push origin main
# ✨ Auto-deploys to Firebase!
```

---

## ⚡ Quick Setup (One-Time)

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **La Perla** project
3. **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save and open the JSON file

### Step 2: Add Secret to GitHub

1. Go to https://github.com/nthminh/La-perla/settings/secrets/actions
2. Click **New repository secret**
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Value: Paste entire JSON content
5. Click **Add secret**

### Step 3: Done! 🎉

Push to main and watch it auto-deploy:
```bash
git add .
git commit -m "Update"
git push origin main
```

---

## 📊 Monitor Deployments

View progress: https://github.com/nthminh/La-perla/actions

- 🟡 Running
- ✅ Success  
- ❌ Failed (check logs)

---

## 🔧 Workflow Triggers

**Automatic:**
- Every push to `main` branch

**Manual:**
1. Go to [Actions tab](https://github.com/nthminh/La-perla/actions)
2. Select "Deploy to Firebase Hosting"
3. Click "Run workflow"

---

## 🛠️ Troubleshooting

### Permission Error (403)
- Check `FIREBASE_SERVICE_ACCOUNT` secret is set correctly
- Regenerate service account key if needed

### Build Failed
- Check logs in GitHub Actions
- Fix code and push again

### Workflow Doesn't Run
- Verify pushed to `main` branch
- Check if Actions enabled in repo settings

---

## 📱 Verify Deployment

**Live Site:**
- https://la-perla-53540395-70c43.web.app
- https://la-perla-53540395-70c43.firebaseapp.com

**Firebase Console:**
- https://console.firebase.google.com/ → Hosting

---

## 💡 Key Benefits

✅ **No manual deploy commands**
✅ **Always in sync** - GitHub = Firebase
✅ **Full deployment logs**
✅ **Can rollback anytime**
✅ **Works with any branch workflow**

---

## 📚 Full Documentation

For detailed guide in Vietnamese:
- [HUONG_DAN_TU_DONG_DONG_BO.md](HUONG_DAN_TU_DONG_DONG_BO.md)

For manual deployment:
- [deploy-to-firebase.sh](deploy-to-firebase.sh) (still works if needed)

---

## 🎯 Answer to Original Question

**Q: "What command to keep GitHub and Firebase in sync?"**

**A: NO COMMAND NEEDED!** Just push to main:

```bash
git push origin main
```

GitHub Actions handles the rest automatically! 🚀
