#!/bin/bash

# ============================================================================
# La Perla - Firebase Deployment Script
# Kịch bản Triển khai Firebase - La Perla
# ============================================================================
# This script automates the process of:
# 1. Merging changes from current branch to main
# 2. Building the application
# 3. Deploying to Firebase Hosting
#
# Kịch bản này tự động hóa quy trình:
# 1. Merge thay đổi từ nhánh hiện tại vào main
# 2. Build ứng dụng
# 3. Deploy lên Firebase Hosting
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}======================================"
    echo -e "$1"
    echo -e "======================================${NC}"
    echo ""
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning messages
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print info messages
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_section "La Perla - Firebase Deployment / Triển khai Firebase"

# ============================================================================
# Step 1: Check Prerequisites / Kiểm tra yêu cầu
# ============================================================================
print_section "Step 1: Checking Prerequisites / Bước 1: Kiểm tra yêu cầu"

# Check Git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed / Git chưa được cài đặt"
    exit 1
fi
print_success "Git $(git --version | cut -d ' ' -f3) installed / đã cài đặt"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed / Node.js chưa được cài đặt"
    print_info "Please install from / Vui lòng cài từ: https://nodejs.org/"
    exit 1
fi
print_success "Node.js $(node --version) installed / đã cài đặt"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed / npm chưa được cài đặt"
    exit 1
fi
print_success "npm $(npm --version) installed / đã cài đặt"

# Check Firebase CLI
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed / Firebase CLI chưa được cài đặt"
    print_info "Installing Firebase CLI / Đang cài đặt Firebase CLI..."
    npm install -g firebase-tools
    if [ $? -ne 0 ]; then
        print_error "Failed to install Firebase CLI / Không thể cài đặt Firebase CLI"
        exit 1
    fi
fi
print_success "Firebase CLI installed / đã cài đặt"

# ============================================================================
# Step 2: Git Status Check / Kiểm tra trạng thái Git
# ============================================================================
print_section "Step 2: Git Status Check / Bước 2: Kiểm tra trạng thái Git"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch / Nhánh hiện tại: $CURRENT_BRANCH"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "You have uncommitted changes / Bạn có thay đổi chưa commit"
    print_info "Please commit or stash your changes first / Vui lòng commit hoặc stash các thay đổi trước"
    git status --short
    exit 1
fi
print_success "No uncommitted changes / Không có thay đổi chưa commit"

# Check if we're on main branch
if [ "$CURRENT_BRANCH" = "main" ]; then
    print_info "Already on main branch / Đã ở trên nhánh main"
    SKIP_MERGE=true
else
    print_info "On branch: $CURRENT_BRANCH, will merge to main / Ở nhánh: $CURRENT_BRANCH, sẽ merge vào main"
    SKIP_MERGE=false
fi

# ============================================================================
# Step 3: Update and Merge / Cập nhật và Merge
# ============================================================================
if [ "$SKIP_MERGE" = false ]; then
    print_section "Step 3: Merging to Main Branch / Bước 3: Merge vào nhánh Main"
    
    # Fetch latest changes
    print_info "Fetching latest changes / Đang lấy thay đổi mới nhất..."
    git fetch origin
    
    # Switch to main branch
    print_info "Switching to main branch / Đang chuyển sang nhánh main..."
    git checkout main
    
    # Pull latest main
    print_info "Pulling latest main / Đang pull main mới nhất..."
    git pull origin main
    
    # Merge current branch into main
    print_info "Merging $CURRENT_BRANCH into main / Đang merge $CURRENT_BRANCH vào main..."
    if git merge "$CURRENT_BRANCH" --no-edit; then
        print_success "Successfully merged $CURRENT_BRANCH into main / Đã merge $CURRENT_BRANCH vào main thành công"
    else
        print_error "Merge conflict detected / Phát hiện xung đột merge"
        print_info "Please resolve conflicts manually and run this script again / Vui lòng giải quyết xung đột thủ công và chạy lại script này"
        exit 1
    fi
    
    # Push to remote main
    print_info "Pushing to remote main / Đang push lên main remote..."
    git push origin main
    print_success "Pushed to remote main / Đã push lên main remote"
else
    print_section "Step 3: Update Main Branch / Bước 3: Cập nhật nhánh Main"
    
    # Pull latest main
    print_info "Pulling latest changes / Đang pull thay đổi mới nhất..."
    git pull origin main
    print_success "Updated main branch / Đã cập nhật nhánh main"
fi

# ============================================================================
# Step 4: Install Dependencies / Cài đặt Dependencies
# ============================================================================
print_section "Step 4: Installing Dependencies / Bước 4: Cài đặt Dependencies"

print_info "Installing npm dependencies / Đang cài đặt npm dependencies..."
npm install
print_success "Dependencies installed / Đã cài đặt dependencies"

# ============================================================================
# Step 5: Build Application / Build ứng dụng
# ============================================================================
print_section "Step 5: Building Application / Bước 5: Build ứng dụng"

print_info "Running build / Đang chạy build..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully / Build hoàn thành thành công"
    
    # Show build size
    if [ -d "dist" ]; then
        BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "unknown")
        print_info "Build size / Kích thước build: $BUILD_SIZE"
    fi
else
    print_error "Build failed / Build thất bại"
    print_info "Please fix build errors and try again / Vui lòng sửa lỗi build và thử lại"
    exit 1
fi

# ============================================================================
# Step 6: Firebase Login Check / Kiểm tra đăng nhập Firebase
# ============================================================================
print_section "Step 6: Firebase Login Check / Bước 6: Kiểm tra đăng nhập Firebase"

# Check if already logged in
if firebase projects:list &> /dev/null; then
    print_success "Already logged in to Firebase / Đã đăng nhập Firebase"
else
    print_info "Not logged in to Firebase / Chưa đăng nhập Firebase"
    print_info "Opening Firebase login / Đang mở đăng nhập Firebase..."
    firebase login
    
    if [ $? -ne 0 ]; then
        print_error "Firebase login failed / Đăng nhập Firebase thất bại"
        exit 1
    fi
    print_success "Logged in to Firebase / Đã đăng nhập Firebase"
fi

# ============================================================================
# Step 7: Deploy to Firebase / Deploy lên Firebase
# ============================================================================
print_section "Step 7: Deploying to Firebase / Bước 7: Deploy lên Firebase"

print_info "Starting Firebase deployment / Đang bắt đầu deploy Firebase..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully! / Deploy hoàn thành thành công!"
    
    # Get project name from .firebaserc
    if [ -f ".firebaserc" ]; then
        PROJECT_NAME=$(grep -oP '"default":\s*"\K[^"]+' .firebaserc)
        if [ -n "$PROJECT_NAME" ]; then
            print_info "Your app is live at / Ứng dụng của bạn đã được triển khai tại:"
            echo -e "${GREEN}https://${PROJECT_NAME}.web.app${NC}"
            echo -e "${GREEN}https://${PROJECT_NAME}.firebaseapp.com${NC}"
        fi
    fi
else
    print_error "Deployment failed / Deploy thất bại"
    exit 1
fi

# ============================================================================
# Step 8: Summary / Tóm tắt
# ============================================================================
print_section "Deployment Summary / Tóm tắt Triển khai"

print_success "All steps completed successfully! / Tất cả các bước đã hoàn thành thành công!"
echo ""
echo -e "${GREEN}✓${NC} Merged changes to main / Đã merge thay đổi vào main"
echo -e "${GREEN}✓${NC} Built application / Đã build ứng dụng"
echo -e "${GREEN}✓${NC} Deployed to Firebase Hosting / Đã deploy lên Firebase Hosting"
echo ""
print_info "Next time, just run / Lần sau chỉ cần chạy: ./deploy-to-firebase.sh"
echo ""

exit 0
