# Firebase Rules Quick Reference

## Deploy Commands

```bash
# Deploy only database rules (fastest)
firebase deploy --only database

# Deploy everything (rules + hosting)
firebase deploy

# Use automated script
./deploy-to-firebase.sh
```

## Verify Deployment

1. Open Firebase Console: https://console.firebase.google.com/project/laperlapos
2. Go to **Realtime Database** → **Rules**
3. Check that rules show `auth != null`

## Enable Anonymous Authentication

1. Go to Firebase Console → **Authentication** → **Sign-in method**
2. Find "Anonymous" provider
3. Click **Enable** and Save

## Rules Summary

| Path | Access | Validation |
|------|--------|------------|
| `/systemState/activeBills` | `auth != null` | Must have: id, customerName, items, discountPercentage |
| `/systemState/waitlist` | `auth != null` | Must have: id, customerName, customerPhone, notes, addedTime, estimatedReturnTime |
| `/systemState/bookings` | `auth != null` | Must have: id, customerName, customerPhone, services, date, timeSlot, status, createdAt |
| `/settings` | `auth != null` | No validation (flexible structure) |
| `/settingsHistory` | `auth != null` | Must have: id, timestamp, data |
| `/transactions` | `auth != null` | Must have: id, date, total, items |

## Troubleshooting

### Error: PERMISSION_DENIED
**Solution:** Enable Anonymous Authentication in Firebase Console

### Error: Database not initialized
**Solution:** Check `firebaseConfig.ts` has correct project ID

### Error: Validation failed
**Solution:** Ensure all required fields are present in your data

## Security Best Practices

✅ **DO:**
- Keep anonymous authentication enabled
- Monitor Firebase Console for suspicious activity
- Review rules periodically
- Use the deployment script for consistency

❌ **DON'T:**
- Never set rules to `.read: true` or `.write: true` in production
- Don't share Firebase config publicly
- Don't disable authentication requirement

## For More Information

- Full Documentation: `FIREBASE_SECURITY_RULES.md`
- Vietnamese Guide: `HUONG_DAN_DEPLOY_RULES.md`
- Implementation Summary: `FIREBASE_RULES_IMPLEMENTATION_SUMMARY.md`

---

**Quick Test:**
```bash
firebase login
firebase deploy --only database
# Check app in browser - should work normally
```
