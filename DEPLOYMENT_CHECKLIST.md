# 🚀 Deployment Checklist for La Perla

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

### Code Quality
- [x] All TypeScript errors resolved
- [x] Build completes successfully (`npm run build`)
- [ ] No console errors in development mode
- [ ] All features tested manually

### Configuration
- [x] `.env.local` file created with Gemini API key
- [x] `.env.local` added to `.gitignore`
- [ ] Firebase project created/configured
- [ ] Firebase Realtime Database enabled
- [ ] Database security rules configured

### Security
- [ ] API keys stored securely (not in code)
- [ ] Firebase rules configured for production
- [ ] Admin passwords changed from defaults
- [ ] Authentication properly configured
- [ ] CORS settings configured if needed

## Firebase Setup

### 1. Firebase Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init
```

### 2. Select Services
- [x] Hosting
- [ ] Functions (optional, for server-side logic)
- [ ] Storage (optional, for file uploads)

### 3. Configure Hosting
```
? What do you want to use as your public directory? dist
? Configure as a single-page app? Yes
? Set up automatic builds and deploys with GitHub? No
```

### 4. Build & Deploy
```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

## Post-Deployment

### Verification
- [ ] App loads successfully at deployment URL
- [ ] Firebase connection working
- [ ] AI features functional (with API key)
- [ ] Booking system working
- [ ] Admin panel accessible
- [ ] Mobile responsiveness verified

### Performance
- [ ] Run Lighthouse audit
- [ ] Check page load speed
- [ ] Verify bundle size
- [ ] Test on slow network

### Monitoring
- [ ] Set up Firebase Analytics
- [ ] Configure error tracking
- [ ] Set up uptime monitoring
- [ ] Configure alerts

## Environment Variables for Production

### Firebase Hosting (firebase.json)
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|png|jpg|jpeg|gif|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Secure API Key Management

**Option 1: Firebase Functions (Recommended)**
Move API calls to serverless functions:
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import { GoogleGenAI } from '@google/genai';

export const generateArt = functions.https.onCall(async (data) => {
  const apiKey = functions.config().gemini.key;
  const ai = new GoogleGenAI({ apiKey });
  // Your logic here
});
```

Set the config:
```bash
firebase functions:config:set gemini.key="YOUR_API_KEY"
```

**Option 2: Environment Variables**
Use build-time environment variables (less secure for API keys):
```bash
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_PROJECT_ID=xxx
```

## Custom Domain Setup

1. **Add domain in Firebase Console**
   - Hosting → Add custom domain
   - Follow DNS configuration steps

2. **Update DNS records**
   - Add A records provided by Firebase
   - Wait for SSL certificate provisioning

3. **Test**
   - Verify HTTPS working
   - Check redirects
   - Test all features on custom domain

## Rollback Plan

If deployment fails:

1. **Quick Rollback**
   ```bash
   firebase hosting:rollback
   ```

2. **Deploy Previous Version**
   ```bash
   git checkout <previous-commit>
   npm run build
   firebase deploy --only hosting
   ```

## Performance Optimization

### Before Deploy
- [ ] Enable gzip compression
- [ ] Optimize images
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Tree shaking enabled (Vite default)

### After Deploy
- [ ] Set up CDN (Firebase Hosting includes this)
- [ ] Configure caching headers
- [ ] Monitor bundle size over time

## SEO & PWA

- [ ] Meta tags configured
- [ ] Open Graph tags added
- [ ] PWA manifest.json configured
- [ ] Service worker registered
- [ ] Icons for all platforms
- [ ] robots.txt configured

## Backup Strategy

- [ ] Database backup scheduled
- [ ] Code versioned in Git
- [ ] Environment config documented
- [ ] Firebase project backup plan

## Support & Maintenance

- [ ] Documentation updated
- [ ] Team access configured
- [ ] Support email/contact set up
- [ ] Monitoring dashboard created
- [ ] Update schedule planned

## Firebase Studio Import

See [FIREBASE_STUDIO_GUIDE.md](./FIREBASE_STUDIO_GUIDE.md) for:
- [ ] AI Studio project setup
- [ ] Advanced AI features integration
- [ ] Cloud Functions deployment
- [ ] Analytics configuration

---

## Quick Deploy Commands

```bash
# Full deployment
npm run build && firebase deploy

# Hosting only
firebase deploy --only hosting

# Functions only (if using)
firebase deploy --only functions

# View deployment
firebase open hosting:site
```

## Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Google AI Studio](https://ai.google.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

---

✅ **Ready to deploy!** Follow this checklist step by step for a successful deployment.
