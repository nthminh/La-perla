<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# La Perla Nail AI Stylist

A beautiful, AI-powered nail salon management system with real-time booking, AI nail art generation, and comprehensive business management tools.

View your app in AI Studio: https://ai.studio/apps/drive/1Ay5kinG8NgbB3wU-5ZvKukt069HMWDCN

## 🚀 Quick Start

**Prerequisites:** Node.js (v16+)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   Get your API key from: https://ai.google.dev/

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Visit: http://localhost:5173/

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Deploy to Firebase (One Command!):**
   ```bash
   ./deploy-to-firebase.sh
   ```
   This automated script handles merge, build, and deployment! See [DEPLOY_HUONG_DAN.md](./DEPLOY_HUONG_DAN.md) for details.

## 📚 Documentation

- **[🚀 Deploy to Firebase (English)](./FIREBASE_DEPLOY_GUIDE.md)** - **NEW!** One-command deployment guide
- **[🚀 Deploy to Firebase (Vietnamese)](./DEPLOY_HUONG_DAN.md)** - **NEW!** One-command deployment guide (Tiếng Việt)
- **[⚡ Quick Deploy Commands (Vietnamese)](./LENH_DEPLOY_NHANH.md)** - Quick reference for deployment
- **[🇻🇳 Hướng Dẫn Tiếng Việt](./HUONG_DAN_TIENG_VIET.md)** - Vietnamese Setup Guide
- **[Setup Guide](./SETUP_GUIDE.md)** - Detailed installation and configuration instructions
- **[Firebase Studio Import Guide](./FIREBASE_STUDIO_GUIDE.md)** - How to import this app into Firebase Studio for advanced AI features
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Production deployment guide

## ✨ Features

- 🎨 AI-powered nail art design generation
- 📅 Customer booking system with calendar
- 👥 Staff portal with check-in/out
- 💰 Point-of-sale (POS) system
- 📊 Business analytics dashboard
- 🌐 Multi-language support (Vietnamese, English, Spanish)
- 🔥 Real-time Firebase sync
- 📱 Progressive Web App (PWA) ready

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite (Build tool)
- Firebase (Realtime Database)
- Google Gemini AI
- TailwindCSS

## 📖 More Information

For detailed setup instructions, troubleshooting, and Firebase Studio integration, please refer to:
- [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- [FIREBASE_STUDIO_GUIDE.md](./FIREBASE_STUDIO_GUIDE.md)
