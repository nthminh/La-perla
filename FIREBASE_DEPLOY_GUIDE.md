# 🚀 Firebase Deployment Guide - La Perla

## 🎯 Overview

You now have a standardized command to automatically update everything from a feature branch to the main branch and deploy to Firebase Hosting. Every time you finish work, just run one command!

## ⚡ Quick Command - Run Every Time You Deploy

```bash
./deploy-to-firebase.sh
```

**That's it!** This script automatically:
1. ✅ Checks system requirements (Git, Node.js, Firebase CLI)
2. ✅ Merges changes from current branch to main
3. ✅ Installs dependencies
4. ✅ Builds the application
5. ✅ Deploys to Firebase Hosting
6. ✅ Shows the live app URL after deployment

## 📋 First-Time Setup

### 1. Install Firebase CLI (Only Once)

If you don't have Firebase CLI:
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase (Only Once)

```bash
firebase login
```

This will open a browser window for you to login with your Google/Firebase account.

### 3. Make Script Executable (Only Once)

If the script isn't executable:
```bash
chmod +x deploy-to-firebase.sh
```

## 🚀 Daily Workflow

### Scenario 1: Working on a Feature Branch

1. **Complete your work and commit changes:**
   ```bash
   git add .
   git commit -m "Description of your work"
   ```

2. **Run the deploy script:**
   ```bash
   ./deploy-to-firebase.sh
   ```

3. **Done!** The script will:
   - Merge your branch into main
   - Build the application
   - Deploy to Firebase
   - Show the live website URL

### Scenario 2: Working Directly on Main

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

2. **Run the deploy script:**
   ```bash
   ./deploy-to-firebase.sh
   ```

3. **Done!** The script will build and deploy immediately.

## 📖 Detailed Steps Performed by the Script

### Step 1: Check Requirements
- Verifies Git is installed
- Verifies Node.js is installed
- Verifies npm is installed
- Checks or installs Firebase CLI

### Step 2: Check Git Status
- Identifies current branch
- Checks for uncommitted changes
- Requires commit before proceeding

### Step 3: Merge to Main
- Fetches latest changes from remote
- Switches to main branch
- Pulls latest main
- Merges working branch into main
- Pushes main to remote

### Step 4: Install Dependencies
- Runs `npm install` to ensure all dependencies are installed

### Step 5: Build Application
- Runs `npm run build`
- Verifies build succeeds
- Shows build size

### Step 6: Check Firebase Login
- Verifies Firebase login status
- Opens browser for login if needed

### Step 7: Deploy to Firebase
- Runs `firebase deploy --only hosting`
- Shows live website URL after successful deployment

### Step 8: Summary
- Displays summary of completed steps
- Shows the live application URL

## 🛠️ Common Error Handling

### Error: "You have uncommitted changes"

**Cause:** You have changes that haven't been committed.

**Solution:**
```bash
git add .
git commit -m "Description of changes"
./deploy-to-firebase.sh
```

### Error: "Merge conflict detected"

**Cause:** There are conflicts between your branch and main.

**Solution:**
1. Check conflicted files: `git status`
2. Open files and resolve conflicts (look for `<<<<<<<`, `=======`, `>>>>>>>`)
3. After resolving:
   ```bash
   git add .
   git commit -m "Resolved merge conflicts"
   ./deploy-to-firebase.sh
   ```

### Error: "Build failed"

**Cause:** There are errors in your code.

**Solution:**
1. Review build error details in console
2. Fix errors in your code
3. Test build manually: `npm run build`
4. When build succeeds, run: `./deploy-to-firebase.sh`

### Error: "Firebase login failed"

**Cause:** Unable to login to Firebase.

**Solution:**
```bash
firebase logout
firebase login
./deploy-to-firebase.sh
```

### Error: "Permission denied: ./deploy-to-firebase.sh"

**Cause:** Script doesn't have execute permission.

**Solution:**
```bash
chmod +x deploy-to-firebase.sh
./deploy-to-firebase.sh
```

## 📱 Verify Deployment

After successful deployment, you can:

1. **Open the website:**
   - The script will show the URL (e.g., `https://laperlapos.web.app`)
   - Copy and open in browser

2. **Check in Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project
   - Go to "Hosting" to see deployment history

3. **View deployment logs:**
   ```bash
   firebase hosting:channel:list
   ```

## 🔄 Rollback to Previous Version

If the new version has issues, you can rollback:

```bash
firebase hosting:rollback
```

## 💡 Tips and Tricks

### Tip 1: Create Quick Alias

Add to your `~/.bashrc` or `~/.zshrc`:
```bash
alias deploy='./deploy-to-firebase.sh'
```

Then just type:
```bash
deploy
```

### Tip 2: Test Build Before Deploying

If you want to test the build first:
```bash
npm run build
npm run preview  # Preview at http://localhost:4173
```

If everything looks good, run deploy:
```bash
./deploy-to-firebase.sh
```

### Tip 3: Quick Deploy Without Merge

If you're on main and just want to deploy quickly:
```bash
git checkout main
git add .
git commit -m "Quick update"
./deploy-to-firebase.sh
```

### Tip 4: View Deployment History

```bash
firebase hosting:channel:list
```

## 📊 Comparison: Before and After

### Before (Manual Process)
```bash
# 1. Switch to main
git checkout main

# 2. Pull latest
git pull origin main

# 3. Merge feature branch
git merge feature-branch

# 4. Push to remote
git push origin main

# 5. Install dependencies
npm install

# 6. Build
npm run build

# 7. Deploy
firebase deploy --only hosting

# Total: 7 commands to remember and type!
```

### After (With Script)
```bash
./deploy-to-firebase.sh

# Just 1 command! 🎉
```

## 🎯 Recommended Workflow

### Daily Workflow

1. **Morning:** Start working
   ```bash
   git checkout -b feature/new-feature-name
   npm run dev
   ```

2. **During the day:** Code and test
   - Write code
   - Test locally (http://localhost:5173)
   - Commit frequently: `git commit -am "Work in progress"`

3. **End of day:** Deploy to production
   ```bash
   git add .
   git commit -m "Completed feature XYZ"
   ./deploy-to-firebase.sh
   ```

### Workflow for Large Features

1. **Create new branch:**
   ```bash
   git checkout -b feature/large-feature
   ```

2. **Develop on branch:**
   ```bash
   # Work...
   git add .
   git commit -m "Part 1: ..."
   git push origin feature/large-feature
   
   # Continue working...
   git add .
   git commit -m "Part 2: ..."
   git push origin feature/large-feature
   ```

3. **When complete, merge and deploy:**
   ```bash
   ./deploy-to-firebase.sh
   ```

## 📞 Support

### If Script Doesn't Run

1. **Check execute permission:**
   ```bash
   ls -la deploy-to-firebase.sh
   ```
   Should show: `-rwxr-xr-x`

2. **If no permission:**
   ```bash
   chmod +x deploy-to-firebase.sh
   ```

3. **Try running directly with bash:**
   ```bash
   bash deploy-to-firebase.sh
   ```

### If You Need to Run Steps Manually

Read the `deploy-to-firebase.sh` file to see detailed commands, or refer to:
- `FIREBASE_STUDIO_GUIDE.md` - Firebase guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- `DEPLOY_HUONG_DAN.md` - Vietnamese guide

## 🎉 Summary

Now you have:
- ✅ **One single command** to deploy: `./deploy-to-firebase.sh`
- ✅ **Automatic merge** from feature branch to main
- ✅ **Automatic build** of the application
- ✅ **Automatic deployment** to Firebase
- ✅ **Automatic error handling** with clear messages
- ✅ **Bilingual support** (English and Vietnamese)

**No need to ask again - just run the script every time you want to deploy!** 🚀

---

## Useful Links

- 🔗 [Firebase Console](https://console.firebase.google.com/)
- 🔗 [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- 🔗 [Git Documentation](https://git-scm.com/doc)

---

**Note:** If you need additional features or want to customize the script, you can edit the `deploy-to-firebase.sh` file according to your needs.
