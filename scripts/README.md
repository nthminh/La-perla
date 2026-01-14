# Firebase Backup & Restore Scripts

This directory contains scripts for backing up and restoring Firebase Realtime Database data.

## 📁 Scripts

### firebase-backup.sh
Creates a backup of the entire Firebase Realtime Database to a JSON file.

**Usage:**
```bash
./scripts/firebase-backup.sh [filename]
```

**Examples:**
```bash
# Create backup with automatic timestamp
./scripts/firebase-backup.sh

# Create backup with custom filename
./scripts/firebase-backup.sh my-backup.json
```

**Output:** `backups/database-backup-YYYY-MM-DD-HH-MM-SS.json`

### firebase-restore.sh
Restores Firebase Realtime Database from a backup JSON file.

**Usage:**
```bash
./scripts/firebase-restore.sh <backup-file> [database-path]
```

**Examples:**
```bash
# Restore entire database
./scripts/firebase-restore.sh backups/database-backup-2026-01-13.json

# Restore only specific path (e.g., customers)
./scripts/firebase-restore.sh backups/database-backup-2026-01-13.json /customers
```

## 🔧 Prerequisites

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Verify project access:**
   ```bash
   firebase projects:list
   ```

## 📚 Documentation

For detailed instructions, see:
- [FIREBASE_BACKUP_RESTORE_VI.md](../FIREBASE_BACKUP_RESTORE_VI.md) - Vietnamese guide
- [FIREBASE_BACKUP_RESTORE_EN.md](../FIREBASE_BACKUP_RESTORE_EN.md) - English guide

## ⚠️ Important Notes

- **Always backup before restore:** The restore script creates a safety backup automatically
- **Backups are local:** JSON files are stored in `backups/` directory
- **Large databases:** Backup/restore may take several minutes for large databases
- **Confirmation required:** Restore script requires typing 'yes' to confirm

## 🔄 Automated Backups

GitHub Actions workflow is configured to run daily backups automatically at 2:00 AM UTC.

**View backups:**
1. Go to https://github.com/nthminh/La-perla/actions
2. Select "Firebase Database Backup" workflow
3. Download backup artifacts (kept for 7 days)

**Manual trigger:**
1. Go to Actions tab on GitHub
2. Select "Firebase Database Backup"
3. Click "Run workflow"

## 📞 Support

If you encounter issues:
- Ensure Firebase CLI is installed and updated
- Verify you're logged in: `firebase login`
- Check project permissions in Firebase Console
- Review error messages carefully

For more help, see the full documentation files listed above.
