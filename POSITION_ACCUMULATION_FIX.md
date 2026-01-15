# Position Accumulation Fix - Race Condition Resolution

## 🐛 **Problem Identified**

When multiple orders for the same symbol filled rapidly (e.g., 3 QQQ orders), the app was creating **3 separate position rows** instead of **1 accumulated position**.

### Root Cause: Race Condition

```
Order 1 fills → execDetails event → upsert() starts
Order 2 fills → execDetails event → upsert() starts  ⚠️ Concurrent!
Order 3 fills → execDetails event → upsert() starts  ⚠️ Concurrent!

All 3 upsert() calls run simultaneously:
1️⃣ findFirst() → no existing position → create new ✅
2️⃣ findFirst() → no existing position → create new ❌ (should find 1️⃣)
3️⃣ findFirst() → no existing position → create new ❌ (should find 1️⃣)

Result: 3 separate positions in database ❌
```

---

## ✅ **Solution: Mutex Lock**

Added a **mutex lock** to `positionRepository.upsert()` to ensure only one upsert operation runs at a time per symbol+broker.

### Implementation

```typescript
export class PositionRepository {
  // 🔒 Mutex to prevent race conditions
  private upsertLocks: Map<string, Promise<void>> = new Map();

  async upsert(position: Position): Promise<void> {
    const lockKey = `${position.symbol}-${position.broker}`;

    // Wait for any existing operation to complete
    while (this.upsertLocks.has(lockKey)) {
      await this.upsertLocks.get(lockKey);
    }

    // Acquire lock
    const operation = this._doUpsert(position);
    this.upsertLocks.set(lockKey, operation);

    try {
      await operation;
    } finally {
      // Release lock
      this.upsertLocks.delete(lockKey);
    }
  }
}
```

### How It Works Now

```
Order 1 fills → upsert() acquires lock → findFirst() → create new → release lock
Order 2 fills → waits for lock → acquires lock → findFirst() finds 1 → update → release lock
Order 3 fills → waits for lock → acquires lock → findFirst() finds 1 → update → release lock

Result: 1 position with quantity = 3 ✅
```

---

## 🔧 **Additional Improvements**

### 1. Better Logging

Added detailed console logs for debugging:

```typescript
console.log(`🔄 Accumulating position: QQQ from 1 to 2 shares`);
console.log(`✨ Creating new position: QQQ 1 shares @ $618.98`);
```

### 2. Pending Order Line Debugging

Enhanced `redrawLightweightLines()` to log why order lines are/aren't showing:

```typescript
console.log(`✅ Drew STP-LMT order line for QQQ at $620.00`);
console.log(`ℹ️  Skipping SPY order line (not on current chart: QQQ)`);
```

---

## 🧪 **Testing**

### Before Fix

```bash
# Place 3 QQQ orders rapidly
# Result: 3 position rows in UI ❌
```

### After Fix

```bash
# Place 3 QQQ orders rapidly
# Result: 1 position row showing "3 LONG @ $618.98 avg" ✅
```

### Manual Consolidation Script

Created `/fix-duplicate-positions.sh` to consolidate existing duplicate positions:

```bash
./fix-duplicate-positions.sh
```

This script:

1. Shows current duplicate positions
2. Calculates weighted average entry price
3. Merges all duplicates into one
4. Deletes extra rows

---

## 📝 **Order Line Visibility**

### Why Lines Don't Always Show

Order lines **only draw for the symbol currently displayed on the chart**.

**Example:**

- You have pending QQQ order
- Chart is showing SPY
- **No line visible** (expected behavior)

**Solution:**
Click "QQQ" in watchlist → line appears ✅

---

## ✅ **Deployment**

Fixed in commit: `4bd4d47` and `[latest]`

```bash
git pull
npm run build
pm2 restart trading-app
```

---

## 🎯 **Summary**

✅ **Race condition fixed** - positions now accumulate correctly
✅ **Mutex lock added** - prevents concurrent database writes
✅ **Better logging** - easier debugging
✅ **Order lines explained** - symbol-specific behavior documented
✅ **Cleanup script** - manually fix existing duplicates

---

## 🔍 **How to Verify Fix**

1. Place 3 rapid market orders for same symbol
2. Check Positions tab → should show **1 row with quantity = 3**
3. Check database:
   ```bash
   ssh root@165.227.104.40
   sudo -u postgres psql -d tradingdb
   SELECT symbol, quantity, "avgEntryPrice", "isOpen" FROM "Position" WHERE "isOpen" = true;
   ```
4. Should only see **1 row per symbol** ✅

---

## 📚 **Related Files**

- `src/repositories/positionRepository.ts` - Mutex implementation
- `src/services/ibkrClient.ts` - execDetails handler
- `src/routes/desktop.ts` - Order line rendering
- `fix-duplicate-positions.sh` - Manual cleanup script

---

**Status:** ✅ **RESOLVED**

Last updated: 2026-01-14
