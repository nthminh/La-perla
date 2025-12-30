# Firebase Security Rules Documentation

## Overview
This document explains the security rules implemented for the Firebase Realtime Database to protect the La Perla POS application data.

## Problem
The previous configuration had the following rules:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

This allowed **anyone** on the internet to read and write to the entire database, which is a critical security vulnerability.

## Solution
The new rules require authentication for all read and write operations. Since the app uses Firebase Anonymous Authentication, only authenticated users (including anonymous users) can access the database.

### Key Security Improvements

1. **Authentication Required**: All operations now require `auth != null`, meaning users must be authenticated (even anonymously).

2. **Structured Access Control**: Rules are defined for each data path:
   - `systemState/*`: Active bills, waitlist, bookings, staff presence, app version, ticket counters
   - `settings/*`: Staff list, pricing, payroll settings, knowledge base, admin passwords
   - `settingsHistory/*`: Historical snapshots of settings
   - `transactions/*`: Transaction history

3. **Data Validation**: Each path includes validation rules to ensure data structure integrity:
   - Bills must have required fields: id, ticketNumber, customer, services, totalPrice, startTime
   - Waitlist entries must have: id, ticketNumber, customer
   - Bookings must have: id, customerName, date, time
   - Transactions must have: id, date, totalPrice

## How It Works with the App

The app automatically handles authentication:
1. On initialization, `firebaseConfig.ts` calls `signInAnonymously(authInstance)`
2. Anonymous authentication creates a temporary user session
3. All Firebase operations are performed with this authenticated session
4. The `waitForAuth()` helper function ensures authentication before operations

## Deploying the Rules

To deploy these rules to Firebase:

```bash
# Deploy only the database rules
firebase deploy --only database

# Or deploy everything (hosting + rules)
firebase deploy
```

Or use the provided script:
```bash
./deploy-to-firebase.sh
```

## Testing the Rules

You can test the rules in the Firebase Console:
1. Go to Firebase Console → Realtime Database → Rules
2. Click on the "Rules playground" tab
3. Test read/write operations with different authentication states

## Compatibility

These rules are fully compatible with the existing app because:
- The app already uses anonymous authentication
- All Firebase operations in the codebase call `waitForAuth()` before executing
- The validation rules match the data structures already in use

## Security Best Practices

✅ **Implemented:**
- Authentication required for all operations
- Structured access control per data path
- Data validation to prevent malformed data

🔒 **Future Enhancements (Optional):**
- Add rate limiting to prevent abuse
- Implement role-based access control for admin operations
- Add more granular validation rules
- Consider upgrading to Firebase Security Rules v2 for more complex logic

## Rollback Plan

If you need to temporarily rollback to open access (NOT RECOMMENDED for production):

1. Edit `database.rules.json`:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

2. Deploy:
```bash
firebase deploy --only database
```

## Support

For issues or questions:
1. Check Firebase Console → Realtime Database → Rules for error messages
2. Review browser console for authentication errors
3. Ensure anonymous authentication is enabled in Firebase Console → Authentication → Sign-in method

## Vietnamese Summary / Tóm tắt tiếng Việt

**Vấn đề:** Rule cũ cho phép bất kỳ ai đọc và ghi vào toàn bộ database (rất nguy hiểm).

**Giải pháp:** Rule mới yêu cầu xác thực (authentication) cho tất cả thao tác. App tự động đăng nhập ẩn danh (anonymous authentication), đảm bảo an toàn mà vẫn hoạt động bình thường.

**Triển khai:** Chạy `firebase deploy --only database` hoặc `./deploy-to-firebase.sh`

**Kết quả:** 
- ✅ Database được bảo vệ khỏi truy cập trái phép
- ✅ App hoạt động bình thường với xác thực ẩn danh
- ✅ Dữ liệu được validate đúng cấu trúc
