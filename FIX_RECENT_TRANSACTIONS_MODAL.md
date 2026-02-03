# Fix: Recent Transactions Modal Persistence

## Problem (Vietnamese)
Trong phần recent transactions của trang pricelist khi bấm nút để đóng sau khi bấm vào xem chi tiết thì còn lại danh sách. Tình trạng hiện nay là khi bấm nút đóng sau khi mở chi tiết thì danh sách mất luôn, phải bấm vào icon của nó lại thì danh sách mới hiện lại.

## Problem (English)
In the recent transactions section of the pricelist page, when clicking the close button after viewing transaction details, the entire list disappears. The user has to click the icon again to show the list.

## Expected Behavior
When closing the transaction detail view, the recent transactions list should remain visible.

## Solution

### Root Cause
The issue was in the `handleViewHistoryItem` function in `components/PricingView.tsx`:
1. When a user clicked on a transaction, the function was calling `setShowHistoryModal(false)` to close the history modal
2. Then it opened the bill detail modal with `setIsBillOpen(true)`
3. When the user closed the bill detail, only the bill modal was closed, but the history modal remained closed
4. The user had to click the receipt icon again to reopen the history modal

### Changes Made

#### File: `components/PricingView.tsx`

**Change 1: Remove line that closes history modal**
- **Line 762**: Removed `setShowHistoryModal(false)`
- This allows the history modal to stay open when viewing a transaction detail

**Before:**
```typescript
const handleViewHistoryItem = (tx: Transaction) => {
    SoundManager.playTap();
    setCashTendered(''); 
    const bill: ActiveBill = { /* ... */ };
    setViewingHistoryBill(bill);
    setShowHistoryModal(false);  // ❌ This was closing the modal
    setIsBillOpen(true); 
};
```

**After:**
```typescript
const handleViewHistoryItem = (tx: Transaction) => {
    SoundManager.playTap();
    setCashTendered(''); 
    const bill: ActiveBill = { /* ... */ };
    setViewingHistoryBill(bill);
    // Removed: setShowHistoryModal(false);
    setIsBillOpen(true); 
};
```

**Change 2: Adjust z-index for proper layering**
- **Line 1615**: Changed z-index from `50` to `101`
- This ensures the bill detail modal appears above the history modal (which has z-index 100)

**Before:**
```typescript
{isBillOpen && (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 50 }}>
```

**After:**
```typescript
{isBillOpen && (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 101 }}>
```

## Result

### User Flow After Fix:
1. User clicks the receipt icon to open recent transactions modal
2. Recent transactions list appears (z-index: 100)
3. User clicks on a transaction to view details
4. Bill detail modal opens on top (z-index: 101)
5. **Recent transactions list remains visible behind the detail modal**
6. User closes the detail modal
7. **Recent transactions list is still visible** ✅
8. User can select another transaction or close the list

### Benefits:
- ✅ Better user experience - no need to reopen the list multiple times
- ✅ Faster workflow - can quickly review multiple transactions
- ✅ Minimal code changes - only 2 lines modified
- ✅ No breaking changes - all existing functionality preserved

## Testing
- ✅ Build successful with TypeScript compilation
- ✅ Code review passed with no issues
- ✅ Security check (CodeQL) passed with no vulnerabilities
- ✅ No test infrastructure exists in repository

## Security Summary
No security vulnerabilities were introduced or discovered during this change.
