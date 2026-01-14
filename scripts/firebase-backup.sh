#!/bin/bash

###############################################################################
# Firebase Database Backup Script
# 
# This script exports the entire Firebase Realtime Database to a JSON file.
# Usage: ./firebase-backup.sh [output-filename]
#
# If no filename is provided, it will create one with timestamp:
# database-backup-YYYY-MM-DD-HH-MM-SS.json
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

# Backup directory
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Generate filename with timestamp if not provided
if [ -z "$1" ]; then
    TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
    FILENAME="database-backup-${TIMESTAMP}.json"
else
    FILENAME="$1"
fi

OUTPUT_FILE="${BACKUP_DIR}/${FILENAME}"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Firebase Database Backup Script${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI not found!${NC}"
    echo -e "${YELLOW}Please install it with: npm install -g firebase-tools${NC}"
    exit 1
fi

echo -e "${YELLOW}→ Project:${NC} ${PROJECT_ID}"
echo -e "${YELLOW}→ Database:${NC} ${DATABASE_URL}"
echo -e "${YELLOW}→ Output:${NC} ${OUTPUT_FILE}"
echo ""

# Check if user is logged in
echo -e "${BLUE}Checking Firebase authentication...${NC}"
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Firebase!${NC}"
    echo -e "${YELLOW}Please login with: firebase login${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo ""

# Perform backup using Firebase CLI
echo -e "${BLUE}Starting database backup...${NC}"
echo -e "${YELLOW}This may take a few minutes depending on database size...${NC}"
echo ""

# Export entire database
firebase database:get / --project "$PROJECT_ID" --output "$OUTPUT_FILE" 2>&1 | while IFS= read -r line; do
    echo -e "${YELLOW}  $line${NC}"
done

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Backup completed successfully!${NC}"
    echo ""
    
    # Show file size
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "${YELLOW}→ Backup file:${NC} ${OUTPUT_FILE}"
    echo -e "${YELLOW}→ File size:${NC} ${FILE_SIZE}"
    
    # Show file info
    if [ -f "$OUTPUT_FILE" ]; then
        LINE_COUNT=$(wc -l < "$OUTPUT_FILE")
        echo -e "${YELLOW}→ Lines:${NC} ${LINE_COUNT}"
    fi
    
    echo ""
    echo -e "${GREEN}Backup saved successfully!${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo -e "To restore this backup, run:"
    echo -e "${YELLOW}  ./scripts/firebase-restore.sh ${OUTPUT_FILE}${NC}"
    echo ""
    
    exit 0
else
    echo ""
    echo -e "${RED}✗ Backup failed!${NC}"
    echo -e "${YELLOW}Please check your Firebase permissions and try again.${NC}"
    exit 1
fi
