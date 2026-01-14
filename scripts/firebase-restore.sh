#!/bin/bash

###############################################################################
# Firebase Database Restore Script
# 
# This script restores Firebase Realtime Database from a JSON backup file.
# Usage: ./firebase-restore.sh <backup-file> [database-path]
#
# Examples:
#   ./firebase-restore.sh backups/database-backup-2026-01-13.json
#   ./firebase-restore.sh backups/database-backup-2026-01-13.json /customers
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Firebase project ID from .firebaserc
PROJECT_ID="la-perla-53540395-70c43"
DATABASE_URL="https://la-perla-53540395-70c43-default-rtdb.firebaseio.com"

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Firebase Database Restore Script${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Backup file not specified!${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  $0 <backup-file> [database-path]"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 backups/database-backup-2026-01-13.json"
    echo -e "  $0 backups/database-backup-2026-01-13.json /customers"
    echo ""
    exit 1
fi

BACKUP_FILE="$1"
DATABASE_PATH="${2:-/}"  # Default to root if not specified

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found!${NC}"
    echo -e "${YELLOW}File: ${BACKUP_FILE}${NC}"
    echo ""
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lh backups/*.json 2>/dev/null || echo "  No backups found in backups/ directory"
    echo ""
    exit 1
fi

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI not found!${NC}"
    echo -e "${YELLOW}Please install it with: npm install -g firebase-tools${NC}"
    exit 1
fi

echo -e "${YELLOW}→ Project:${NC} ${PROJECT_ID}"
echo -e "${YELLOW}→ Database:${NC} ${DATABASE_URL}"
echo -e "${YELLOW}→ Backup file:${NC} ${BACKUP_FILE}"
echo -e "${YELLOW}→ Target path:${NC} ${DATABASE_PATH}"
echo ""

# Show file info
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${YELLOW}→ Backup size:${NC} ${FILE_SIZE}"

# Check if user is logged in
echo -e "${BLUE}Checking Firebase authentication...${NC}"
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Firebase!${NC}"
    echo -e "${YELLOW}Please login with: firebase login${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo ""

# Warning message
echo -e "${RED}⚠️  WARNING ⚠️${NC}"
echo -e "${RED}This will OVERWRITE existing data at path: ${DATABASE_PATH}${NC}"
echo ""

# Create safety backup before restore
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
SAFETY_BACKUP="backups/pre-restore-backup-${TIMESTAMP}.json"

echo -e "${YELLOW}Creating safety backup before restore...${NC}"
firebase database:get "$DATABASE_PATH" --project "$PROJECT_ID" --output "$SAFETY_BACKUP" 2>&1 | while IFS= read -r line; do
    echo -e "${YELLOW}  $line${NC}"
done

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✓ Safety backup created: ${SAFETY_BACKUP}${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Could not create safety backup${NC}"
fi
echo ""

# Confirmation prompt
echo -e "${YELLOW}Are you sure you want to restore from this backup?${NC}"
echo -e "${YELLOW}Type 'yes' to continue, or anything else to cancel:${NC} "
read -r CONFIRMATION

if [ "$CONFIRMATION" != "yes" ]; then
    echo ""
    echo -e "${YELLOW}Restore cancelled by user.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Starting database restore...${NC}"
echo -e "${YELLOW}This may take a few minutes depending on database size...${NC}"
echo ""

# Perform restore using Firebase CLI
firebase database:set "$DATABASE_PATH" "$BACKUP_FILE" --project "$PROJECT_ID" --confirm 2>&1 | while IFS= read -r line; do
    echo -e "${YELLOW}  $line${NC}"
done

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Restore completed successfully!${NC}"
    echo -e "${BLUE}=================================${NC}"
    echo ""
    echo -e "${GREEN}Database has been restored from:${NC}"
    echo -e "${YELLOW}  ${BACKUP_FILE}${NC}"
    echo ""
    echo -e "${GREEN}Safety backup saved at:${NC}"
    echo -e "${YELLOW}  ${SAFETY_BACKUP}${NC}"
    echo ""
    echo -e "${BLUE}Please verify your data in the app:${NC}"
    echo -e "${YELLOW}  https://la-perla-53540395-70c43.web.app${NC}"
    echo ""
    
    if [ "$DATABASE_PATH" != "/" ]; then
        echo -e "${YELLOW}Note: Only path '${DATABASE_PATH}' was restored.${NC}"
        echo -e "${YELLOW}Other data remains unchanged.${NC}"
        echo ""
    fi
    
    exit 0
else
    echo ""
    echo -e "${RED}✗ Restore failed!${NC}"
    echo -e "${YELLOW}Your data has NOT been changed.${NC}"
    echo -e "${YELLOW}Please check your Firebase permissions and try again.${NC}"
    echo ""
    
    if [ -f "$SAFETY_BACKUP" ]; then
        echo -e "${GREEN}Safety backup is available at:${NC}"
        echo -e "${YELLOW}  ${SAFETY_BACKUP}${NC}"
        echo ""
    fi
    
    exit 1
fi
