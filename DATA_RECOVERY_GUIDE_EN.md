# 🆘 Emergency Guide: Data Loss Recovery

## ⚠️ SITUATION

All cloud data has been deleted and reset to 0 after adding the cash drawer function and editing the preview bill feature.

## 🔍 ROOT CAUSE ANALYSIS

**Investigation Results:**
- ✅ Cash drawer function (`openCashDrawer`) does NOT cause data loss
- ✅ Invoice preview fix does NOT cause data loss
- ❌ Dangerous function `deleteAllTransactions()` exists in code that can wipe all data
- ⚠️ Data may have been deleted due to:
  - Calling `deleteAllTransactions()` via browser console
  - Accidental trigger of this function
  - Firebase rules modification
  - Incorrect export/import operation

## 🚀 IMMEDIATE RECOVERY STEPS

### Step 1: Check Firebase Console (HIGHEST PRIORITY)

Firebase may have automatically backed up your data!

1. **Access Firebase Console**
   ```
   https://console.firebase.google.com/
   ```

2. **Select Your Project**
   - Find project: `la-perla-53540395-70c43` (or your project name)
   - Click on the project

3. **Go to Realtime Database**
   - Left menu → "Realtime Database"
   - Check "Data" tab to see current data

4. **Check for Backups**
   - Look for "Backups" tab (if available)
   - If automated backups exist → **Step 2**
   - If no backups → **Step 3**

### Step 2: Restore From Firebase Automated Backup

**If you see a "Backups" tab with backup points:**

1. **Select Backup Point**
   - Find backup from BEFORE data was lost
   - Usually yesterday's or the day before's backup
   - Click on that backup point

2. **Restore**
   - Click "Restore" or "Download" button
   - If "Restore" available: Click and confirm
   - ⚠️ **WARNING**: Restore will OVERWRITE current data!

3. **Verify**
   - Open your application and check data
   - If successful → **DONE!** ✅

### Step 3: Restore From GitHub Actions Backup

**Check if GitHub Actions backups exist:**

1. **Go to GitHub Repository**
   ```
   https://github.com/nthminh/La-perla/actions
   ```

2. **Find "Firebase Backup" Workflow**
   - Look at recent workflow runs
   - Find successful runs (green ✅ checkmark)

3. **Download Backup Artifacts**
   - Click on workflow run
   - "Artifacts" section → Download backup JSON file
   - Save as: `firebase-backup-YYYY-MM-DD.json`

4. **Restore Backup** (see Step 5)

### Step 4: Check Local Backups

**If you previously ran backup scripts:**

1. **Check backups folder**
   ```bash
   cd /path/to/La-perla
   ls -lh backups/
   ```

2. **Find most recent backup file**
   ```
   database-backup-2026-01-20-14-30-00.json
   ```

3. **If backup file exists → Step 5**

### Step 5: Import Backup Into Firebase

**Method 1: Using Script (Recommended)**

```bash
# Navigate to project directory
cd /path/to/La-perla

# Ensure execute permission
chmod +x scripts/firebase-restore.sh

# Run restore (replace with actual filename)
./scripts/firebase-restore.sh backups/database-backup-2026-01-20.json
```

**Method 2: Manual Import via Firebase Console**

1. **Open Firebase Console**
   - https://console.firebase.google.com/
   - Select project → Realtime Database

2. **Go to "Data" Tab**
   - Click on root node `/`

3. **Import JSON**
   - Click 3-dot menu (⋮) on the right
   - Select "Import JSON"
   - Choose backup file
   - **SELECT "Merge" or "Overwrite"**:
     - **Merge**: Keep new data + add old data
     - **Overwrite**: Delete everything and use only backup
   - Click "Import"

4. **Verify Data**
   - Refresh page
   - Check if data has been restored

### Step 6: Check Local Storage

**Data is also saved in browser:**

1. **Open Developer Tools**
   - Chrome/Edge: F12 or Ctrl+Shift+I
   - Firefox: F12 or Ctrl+Shift+K

2. **Go to "Application" Tab (Chrome) or "Storage" (Firefox)**

3. **Check Local Storage**
   ```
   Key: la_perla_transactions
   ```

4. **Copy Data**
   - If data still exists in localStorage
   - Copy entire JSON value
   - Save to file: `local-backup.json`

5. **Sync Back to Firebase**
   - Go to Admin Panel in app
   - May have "Sync to Cloud" button or similar
   - Or use restore script with this JSON file

## 🛡️ PREVENTION FOR FUTURE

### 1. Setup Automated Backups

**Configure GitHub Actions Backup (Recommended):**

```bash
# File already exists: .github/workflows/firebase-backup.yml
# Just need to setup Firebase Service Account
```

1. **Get Service Account Key**
   - Firebase Console → Project Settings
   - "Service Accounts" tab
   - Click "Generate New Private Key"
   - Save JSON file

2. **Add to GitHub Secrets**
   - GitHub repo → Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste entire JSON content
   - Add secret

3. **Activate Workflow**
   - Backup will run automatically daily at 2:00 AM (Sydney time)
   - Or run manually: Actions → Firebase Backup → Run workflow

### 2. Manual Periodic Backups

**Create backup weekly:**

```bash
# Run script
./scripts/firebase-backup.sh

# Backup saved to backups/ folder
# Filename: database-backup-YYYY-MM-DD-HH-MM-SS.json
```

### 3. Enable Firebase Automated Backups

1. Firebase Console → Realtime Database
2. Find "Automated Backups" (may require plan upgrade)
3. Enable if available

### 4. Code Safeguards (ALREADY ADDED)

✅ Function `deleteAllTransactions()` is now protected:
- Requires confirmation text: "DELETE ALL TRANSACTIONS"
- Logs all deletion operations
- Blocks calls without confirmation

## 📞 IF RECOVERY STILL FAILS

### Contact Firebase Support

1. **Firebase Console**
   - Menu → Support
   - "Contact Support"

2. **Provide Information**
   - Project ID: `la-perla-53540395-70c43`
   - Date/time of data loss: [fill in]
   - Request: Restore database to previous state

3. **Ask About**
   - Point-in-time recovery
   - Transaction logs
   - Undelete operations

### Check Browser Cache

**If app was open previously:**

1. Open DevTools → Application → Cache Storage
2. Look for cache entries
3. May contain old data

### Ask Other Users

**If multiple people use the app:**
- Data may still exist in other machines' localStorage
- Ask them to:
  1. Open DevTools
  2. Application → Local Storage
  3. Export key `la_perla_transactions`
  4. Send to you

## ✅ RECOVERY CHECKLIST

- [ ] Check Firebase Automated Backups
- [ ] Find GitHub Actions backup artifacts
- [ ] Check local backups folder
- [ ] Check browser localStorage
- [ ] Contact Firebase Support
- [ ] Ask other users for local data
- [ ] Setup automated backups to prevent recurrence

## 🔗 RELATED DOCUMENTATION

- [FIREBASE_BACKUP_RESTORE_EN.md](FIREBASE_BACKUP_RESTORE_EN.md) - Detailed backup/restore guide
- [BACKUP_RESTORE_START_HERE.md](BACKUP_RESTORE_START_HERE.md) - Quick start guide
- [scripts/firebase-backup.sh](scripts/firebase-backup.sh) - Backup creation script
- [scripts/firebase-restore.sh](scripts/firebase-restore.sh) - Restore script

## 📝 NOTES

**Code changes related to this issue:**
- ✅ Cash drawer feature (`utils/cashDrawer.ts`) - NO impact on data
- ✅ Invoice preview fix (`components/PricingView.tsx`) - NO impact on data
- ⚠️ Function `deleteAllTransactions()` in `firebaseService.ts` - NOW PROTECTED

**Protections Added:**
- Requires confirmation text to delete all data
- Logs all deletion operations
- Blocks accidental calls

---

**Created by:** GitHub Copilot  
**Date:** January 21, 2026  
**Purpose:** Emergency data recovery guide
