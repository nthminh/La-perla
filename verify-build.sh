#!/bin/bash

# La Perla Build & Verification Script
# This script verifies that the app can build and run successfully

echo "======================================"
echo "La Perla Build & Verification Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version) installed${NC}"

# Check if npm is installed
echo "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version) installed${NC}"

# Check if node_modules exists
echo ""
echo "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ Dependencies not installed${NC}"
    echo "Running npm install..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ npm install failed${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check if .env.local exists
echo ""
echo "Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠ .env.local not found${NC}"
    echo "Creating .env.local with placeholder..."
    cat > .env.local << EOF
# Gemini API Key Configuration
# Get your API key from: https://ai.google.dev/
# Replace the placeholder below with your actual API key
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
EOF
    echo -e "${YELLOW}⚠ Please update .env.local with your actual Gemini API key${NC}"
else
    echo -e "${GREEN}✓ .env.local exists${NC}"
    
    # Check if API key is set
    if grep -q "YOUR_GEMINI_API_KEY_HERE" .env.local; then
        echo -e "${YELLOW}⚠ GEMINI_API_KEY appears to be a placeholder${NC}"
        echo "  Please update it with your actual API key from https://ai.google.dev/"
    else
        echo -e "${GREEN}✓ GEMINI_API_KEY appears to be configured${NC}"
    fi
fi

# Try to build the project
echo ""
echo "Building the project..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed${NC}"
    echo "Please check the error messages above"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# Check if dist folder was created
if [ -d "dist" ]; then
    echo -e "${GREEN}✓ Build artifacts created in dist/ directory${NC}"
    
    # Show build size
    BUILD_SIZE=$(du -sh dist | cut -f1)
    echo "  Build size: $BUILD_SIZE"
else
    echo -e "${RED}✗ dist/ directory not created${NC}"
    exit 1
fi

echo ""
echo "======================================"
echo -e "${GREEN}✓ All checks passed!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Gemini API key (if not done)"
echo "2. Run 'npm run dev' to start development server"
echo "3. Run 'npm run preview' to preview production build"
echo "4. See FIREBASE_STUDIO_GUIDE.md for Firebase import instructions"
echo ""
