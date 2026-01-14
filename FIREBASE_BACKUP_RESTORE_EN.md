# 🔄 Firebase Backup & Restore Guide

## 📋 Overview

This guide helps you backup and restore Firebase Realtime Database data to a previous version (e.g., yesterday's data).

## ⚠️ IMPORTANT NOTES

**Firebase does NOT automatically create daily backups!** You need to:
1. Set up automated backups (see below)
2. OR create manual backups regularly
3. OR use Firebase's Automated Backups feature (if enabled)

## 🎯 RESTORE OPTIONS

### Option 1: Using Firebase Console (If Automated Backups Enabled)

If you have enabled Automated Backups in Firebase:

1. **Access Firebase Console**
   - Open https://console.firebase.google.com/
   - Select project: `la-perla-53540395-70c43`

2. **Go to Realtime Database**
   - Left menu → Realtime Database
   - Select "Backups" tab (if available)

3. **Select Backup to Restore**
   - Find backup from yesterday
   - Click "Restore"
   - Confirm restoration

⚠️ **WARNING**: Restoration will **OVERWRITE** all current data!

### Option 2: Using Manual Backup (If Previously Created)

If you have created a backup JSON file before:

1. **Export Current Data (Safety Backup)**
   ```bash
   # Run backup script first
   ./scripts/firebase-backup.sh
   ```

2. **Import Old Backup File**
   ```bash
   # Restore from backup file
   ./scripts/firebase-restore.sh backups/database-backup-YYYY-MM-DD.json
   ```

3. **Verify Data**
   - Open app and check data
   - Ensure everything has been restored correctly

### Option 3: Manual Export/Import via Firebase Console

#### Step 1: Export Current Data (Safety Backup)

1. Open Firebase Console
2. Realtime Database → Data tab
3. Click on root node (/)
4. Click menu (⋮) → Export JSON
5. Save file: `database-backup-current.json`

#### Step 2: Restore from Old Backup

**If you have a backup file from yesterday:**

1. Delete current data (or part that needs restoration):
   - Select node to restore
   - Click menu (⋮) → Delete

2. Import old backup file:
   - Click on parent node
   - Click menu (⋮) → Import JSON
   - Select backup file from yesterday
   - Click "Import"

## 🛠️ SETTING UP AUTOMATED BACKUPS

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Create Automated Backup Script

A backup script has been created at `scripts/firebase-backup.sh`. Run:

```bash
# Create manual backup
./scripts/firebase-backup.sh

# Backup file will be saved at: backups/database-backup-YYYY-MM-DD-HH-MM-SS.json
```

### Step 4: Setup Daily Backup (Linux/Mac)

Add to crontab to run automatically every day at 2:00 AM:

```bash
# Open crontab
crontab -e

# Add this line (change path as needed):
0 2 * * * cd /path/to/La-perla && ./scripts/firebase-backup.sh
```

### Step 5: Setup Backup on GitHub Actions (Recommended)

A workflow has been created at `.github/workflows/firebase-backup.yml`. This workflow:
- Runs automatically every day at 2:00 AM UTC
- Can be run manually at any time
- Saves backup as artifact (kept for 7 days)

**Run manually on GitHub:**
1. Go to https://github.com/nthminh/La-perla/actions
2. Select "Firebase Database Backup" workflow
3. Click "Run workflow"

## 🔧 USING SCRIPTS

### Backup Script: `scripts/firebase-backup.sh`

**Usage:**
```bash
# Backup entire database
./scripts/firebase-backup.sh

# Backup with custom filename
./scripts/firebase-backup.sh custom-backup.json
```

**Output file:**
- Location: `backups/database-backup-YYYY-MM-DD-HH-MM-SS.json`
- Format: Full JSON of database

### Restore Script: `scripts/firebase-restore.sh`

**Usage:**
```bash
# Restore from backup file
./scripts/firebase-restore.sh backups/database-backup-2026-01-13-14-30-00.json

# Restore only part of database
./scripts/firebase-restore.sh backups/database-backup-2026-01-13-14-30-00.json /customers
```

**Parameters:**
- Parameter 1 (required): Path to backup JSON file
- Parameter 2 (optional): Database path to restore (e.g., /customers, /bookings)

## 📁 BACKUP DIRECTORY STRUCTURE

```
La-perla/
├── backups/
│   ├── database-backup-2026-01-13-14-30-00.json
│   ├── database-backup-2026-01-12-14-30-00.json
│   ├── database-backup-2026-01-11-14-30-00.json
│   └── ...
├── scripts/
│   ├── firebase-backup.sh
│   └── firebase-restore.sh
└── .github/
    └── workflows/
        └── firebase-backup.yml
```

## 🎯 RECOMMENDED RESTORE WORKFLOW

### When You Need to Restore Data:

1. **Backup Current Data First**
   ```bash
   ./scripts/firebase-backup.sh
   ```

2. **Identify Backup File to Restore**
   ```bash
   ls -lh backups/
   ```

3. **Check Backup Content (Optional)**
   ```bash
   cat backups/database-backup-YYYY-MM-DD.json | jq '.' | less
   ```

4. **Perform Restoration**
   ```bash
   ./scripts/firebase-restore.sh backups/database-backup-YYYY-MM-DD.json
   ```

5. **Verify Results**
   - Open app: https://la-perla-53540395-70c43.web.app
   - Login and check data
   - Confirm everything has been restored correctly

## ⚠️ SAFETY NOTES

### Before Restoring:

1. ✅ **ALWAYS backup current data first**
2. ✅ Notify team that restoration is in progress
3. ✅ Select correct backup file and verify date
4. ✅ Read confirmation carefully before executing

### After Restoring:

1. ✅ Check all app functionality
2. ✅ Verify critical data (customers, bookings, staff)
3. ✅ Notify team that restoration is complete
4. ✅ Keep current backup file for rollback if needed

## 🔍 TROUBLESHOOTING

### Issue 1: No Backup from Yesterday

**Solution:**
- Check `backups/` folder for most recent backup
- Check GitHub Actions artifacts (kept for 7 days)
- Contact team to see if anyone has local backup
- If no backup exists: Cannot restore, can only recover manually

### Issue 2: Backup Script Errors

**Common causes:**
- Firebase CLI not installed: `npm install -g firebase-tools`
- Not logged in: `firebase login`
- No database access permissions

**Solution:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Check project
firebase projects:list
```

### Issue 3: Restore Not Working

**Solution:**
1. Check if backup file exists
2. Check if JSON format is valid
3. Check database write permissions
4. Try manual restore via Firebase Console

### Issue 4: Data Lost After Restore

**Solution:**
- Restore from current backup created in step 1
- Backup file located at: `backups/database-backup-[timestamp].json`

## 📊 BACKUP AUTOMATION

### Daily Backup via GitHub Actions (Already Setup)

Workflow configured to:
- ✅ Run automatically every day at 2:00 AM UTC
- ✅ Can be run manually at any time
- ✅ Save backup as artifact
- ✅ Keep backup for 7 days

**View backups:**
1. Go to https://github.com/nthminh/La-perla/actions
2. Select most recent workflow run
3. Download `firebase-backup` artifact

### Scheduled Backup on Server

If running on your own server, add to cron:

```bash
# Backup every day at 2:00 AM
0 2 * * * cd /path/to/La-perla && ./scripts/firebase-backup.sh

# Backup every 6 hours
0 */6 * * * cd /path/to/La-perla && ./scripts/firebase-backup.sh

# Delete backups older than 30 days
0 3 * * * find /path/to/La-perla/backups -name "*.json" -mtime +30 -delete
```

## 🎓 BEST PRACTICES

### 3-2-1 Backup Strategy:

1. **3 copies** of data
   - Production data on Firebase
   - Local backup in `backups/` folder
   - Backup on GitHub Actions artifacts

2. **2 different media types**
   - Cloud backup (GitHub)
   - Local or external drive backup

3. **1 offsite copy**
   - Backup on GitHub (offsite)
   - Optional: Google Drive, Dropbox, etc.

### Recommended Backup Schedule:

- **Daily**: Automated backup at 2:00 AM
- **Before deploy**: Always backup before deploying new code
- **Before major changes**: Manual backup before database structure changes
- **Retention**: 7 daily backups, 4 weekly backups, 12 monthly backups

## 📞 EMERGENCY SUPPORT

### If You Need Urgent Restore:

1. **Stop all app operations immediately**
2. **Backup current data** (even if corrupted)
3. **Contact team for confirmation**
4. **Only restore when certain**

### Firebase Support:
- Firebase Console: https://console.firebase.google.com/
- Firebase Support: https://firebase.google.com/support
- Documentation: https://firebase.google.com/docs/database

## ✅ RESTORATION CHECKLIST

Before performing restore, check:

- [ ] Current data has been backed up
- [ ] Correct backup file identified
- [ ] Backup file content verified
- [ ] Team has been notified
- [ ] Understand data will be overwritten
- [ ] Rollback plan in place
- [ ] Instructions read carefully

After restore:

- [ ] Customer data verified
- [ ] Booking data verified
- [ ] Staff data verified
- [ ] Service pricing verified
- [ ] Main functions tested
- [ ] Team notified of completion
- [ ] Actions documented

## 🎉 CONCLUSION

With this guide, you can:
- ✅ Create automated daily Firebase Database backups
- ✅ Create manual backups at any time
- ✅ Restore data to any point with backup available
- ✅ Manage and organize backup files
- ✅ Establish safe backup procedures

**IMPORTANT NOTE:** 
- Cannot restore to yesterday if no backup from that day exists
- Start creating backups today to enable future restoration
- Regular backups are the only way to protect your data

---

**Need help?** See also:
- [FIREBASE_DEPLOY_GUIDE.md](./FIREBASE_DEPLOY_GUIDE.md) - Deployment guide
- [FIREBASE_STUDIO_GUIDE.md](./FIREBASE_STUDIO_GUIDE.md) - Firebase Studio guide
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Setup guide

**Start backing up now:** `./scripts/firebase-backup.sh` 🚀
