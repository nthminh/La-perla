# La Perla Nail AI Stylist - Setup & Build Guide

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **Gemini API Key** (Get from: https://ai.google.dev/)

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Create or update the `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
   
   Replace `your_actual_gemini_api_key_here` with your actual Gemini API key from Google AI Studio.

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   The app will be available at: http://localhost:5173/

4. **Build for Production**
   ```bash
   npm run build
   ```
   
   Built files will be in the `dist/` directory.

5. **Preview Production Build**
   ```bash
   npm run preview
   ```

## 🔥 Firebase Configuration

The app comes with Firebase integration pre-configured. You can:

### Option 1: Use Default Configuration
The app uses a default Firebase project (`laperlapos`) that's already configured.

### Option 2: Use Your Own Firebase Project
1. Go to the Admin panel in the app
2. Navigate to Settings → Firebase Setup
3. Paste your Firebase configuration JSON
4. Test the connection
5. Save and reload

## 📱 Features

- **AI Nail Art Generation**: Upload hand photos and get AI-generated nail art designs
- **Multi-language Support**: Vietnamese, English, and Spanish
- **Booking System**: Customer booking with calendar integration
- **Staff Portal**: Check-in/out system with GPS verification
- **Admin Dashboard**: Comprehensive business management
- **Firebase Sync**: Real-time cloud synchronization
- **PWA Support**: Install as a mobile app

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS (via CDN)
- **Backend**: Firebase Realtime Database
- **AI**: Google Gemini API

## 📂 Project Structure

```
La-perla/
├── components/          # React components
│   ├── AdminView.tsx
│   ├── BookingView.tsx
│   ├── ChatWidget.tsx
│   └── ...
├── services/           # Service layer
│   ├── firebaseService.ts
│   ├── geminiService.ts
│   └── storageService.ts
├── utils/              # Utility functions
├── App.tsx             # Main app component
├── index.tsx           # Entry point
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |

## 📝 Development Notes

- The app uses `vite` for fast development and building
- TypeScript is configured with relaxed mode for compatibility
- Environment variables are loaded via Vite's `loadEnv` function
- Firebase configuration can be dynamically changed from the admin panel

## 🐛 Troubleshooting

### Build Errors
If you encounter TypeScript errors, the `tsconfig.json` is configured with relaxed strict mode. If issues persist:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Key Issues
Make sure your `.env.local` file is in the root directory and the variable is named exactly `GEMINI_API_KEY`.

### Firebase Connection Issues
1. Check your Firebase project settings
2. Ensure Realtime Database is enabled
3. Update database rules to allow read/write access

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google AI Studio](https://ai.google.dev/)

## 🎯 Next Steps for Firebase Studio Import

See [FIREBASE_STUDIO_GUIDE.md](./FIREBASE_STUDIO_GUIDE.md) for detailed instructions on importing this app into Firebase Studio for further development.
