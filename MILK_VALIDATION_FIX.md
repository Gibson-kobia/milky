# Milk Quantity Validation: Production Bug Analysis & Fix

## Issue Summary
Database record `199a0d74-faf4-4007-8b44-b1fe7eb56d9f` contains `litres = 4.8`, which violates the business rule that milk quantities must only be in quarter increments: `.00`, `.25`, `.50`, `.75`.

## Root Cause
**Exact Location:** [src/lib/db/schema.sql#L30-L34](../src/lib/db/schema.sql#L30-L34)

The database CHECK constraint was too permissive:
```sql
CONSTRAINT valid_litres CHECK (
  litres > 0 AND
  litres::text ~ '^\d+(\.\d{1,2})?$'
)
```

This regex `^\d+(\.\d{1,2})?$` allows ANY 1-2 decimal places:
- ✅ Allowed: 4, 4.7, 4.75, 4.8, 4.99, 5.0
- ❌ Should only allow: 4, 4.25, 4.5, 4.75

**No rounding bug in the application.** The value 4.8 was accepted and stored by the database as-is because the constraint didn't enforce quarter-step increments.

## Solution Implemented

### 1. Application-Level Validation
**File:** [src/lib/utils.ts#L178-L188](../src/lib/utils.ts#L178-L188)

Added `validateMilkQuantity()` that rejects invalid fractional increments:
```typescript
export const validateMilkQuantity = (litres: number): boolean => {
  if (typeof litres !== 'number' || isNaN(litres) || litres <= 0) return false;
  
  const fractional = Math.round((litres - Math.floor(litres)) * 100) / 100;
  const allowed = [0, 0.25, 0.5, 0.75];
  return allowed.includes(fractional);
};
```

### 2. Save Path Validation & Decimal Preservation
**File:** [src/lib/data.ts#L461-L525](../src/lib/data.ts#L461-L525)

Both `saveMilkDelivery()` and `updateMilkDelivery()` now:
1. Validate before saving using `validateMilkQuantity()`
2. Convert to 2-decimal-place string to preserve exact decimal representation
3. Log detailed trace information at each step

```typescript
// Example from updateMilkDelivery
if (!validateMilkQuantity(litres)) {
  throw new Error('Invalid milk quantity - allowed fractional increments: 0, .25, .5, .75');
}
const finalValue = Number.isInteger(litres) ? String(litres) : litres.toFixed(2);
const { data, error } = await supabase
  .from('milk_deliveries')
  .update({ litres: finalValue, ... })
```

### 3. Database Schema Constraint Fix
**File:** [src/lib/db/schema.sql#L30-L34](../src/lib/db/schema.sql#L30-L34)

Updated CHECK constraint to enforce quarter-step increments:
```sql
CONSTRAINT valid_litres CHECK (
  litres > 0 AND
  -- Enforce quarter-step increments: .00, .25, .50, .75 only
  ((litres * 100)::INTEGER % 25) = 0
)
```

How it works:
- `litres * 100` converts 4.75 → 475, 4.8 → 480
- `::INTEGER % 25` checks if divisible by 25
- Only results where remainder = 0 are allowed (0, 25, 50, 75)
- ✅ Valid: 4 (400), 4.25 (425), 4.5 (450), 4.75 (475)
- ❌ Rejected: 4.8 (480), 4.1 (410), 4.3 (430)

### 4. Unit Tests
**File:** [src/__tests__/validateMilkQuantity.test.ts](../__tests__/validateMilkQuantity.test.ts)

Tests verify:
- ✅ Valid: 4, 4.25, 4.5, 4.75
- ❌ Rejected: 4.1, 4.2, 4.3, 4.8

### 5. Comprehensive Logging
**Files:** [src/components/fast-entry-board.tsx](../components/fast-entry-board.tsx), [src/lib/data.ts](../lib/data.ts)

Added `[TRACE]` logs at each step:
1. **Input parsing:** `handleInputChange()` logs raw and parsed values
2. **Submit:** `handleSubmit()` logs before calling update
3. **Data layer:** `updateMilkDelivery()` logs before/after validation and DB call
4. **DB response:** Logs returned value from Supabase

Example trace sequence:
```
[TRACE] handleInputChange user input { rawValue: "4.75", parsedValue: 4.75 }
[TRACE] handleSubmit ENTRY { litres: 4.75, isFloat: true }
[TRACE] updateMilkDelivery ENTRY { litres: 4.75, fractional: 0.75 }
[TRACE] updateMilkDelivery after toFixed { litres: 4.75, finalValue: "4.75" }
[TRACE] updateMilkDelivery response from DB { returnedLitres: 4.75 }
```

## Migration: Handling Existing Invalid Data

### Find Invalid Records
Run the query in `scripts/find-invalid-litres.sql` to identify all records with invalid litres:

```bash
# In Supabase dashboard, run:
scripts/find-invalid-litres.sql
```

For the problematic record `199a0d74-faf4-4007-8b44-b1fe7eb56d9f` with `litres = 4.8`:
1. Contact the farmer to confirm intended quantity
2. Update to nearest valid quarter-step (4.75 or 5.00)
3. Run:
   ```sql
   UPDATE milk_deliveries 
   SET litres = 4.75, updated_at = NOW() 
   WHERE id = '199a0d74-faf4-4007-8b44-b1fe7eb56d9f';
   ```

### Deploy Schema Update
The new CHECK constraint in `schema.sql` will:
1. ✅ Prevent new invalid entries from being saved
2. ✅ Reject any direct SQL INSERTs/UPDATEs with invalid litres
3. ⚠️ Require cleanup of existing invalid records before applying constraint in production

## Testing Trace

Run tests to verify validation:
```bash
npm install
npm test
```

Example output:
```
 ✓ validateMilkQuantity accepts valid quarter increments
 ✓ validateMilkQuantity rejects invalid fractional values
```

## Files Changed
- [src/lib/utils.ts](../src/lib/utils.ts#L178-L188) - Quarter-step validation
- [src/lib/data.ts](../src/lib/data.ts#L461-L525) - Save path validation & logging
- [src/components/fast-entry-board.tsx](../components/fast-entry-board.tsx) - Input & submit logging
- [src/app/home-content.tsx](../src/app/home-content.tsx) - Handler logging
- [src/lib/db/schema.sql](../src/lib/db/schema.sql#L30-L34) - Database constraint
- [src/__tests__/validateMilkQuantity.test.ts](../__tests__/validateMilkQuantity.test.ts) - Unit tests
- [package.json](../package.json) - Added `vitest` and `test` script
- [scripts/find-invalid-litres.sql](../scripts/find-invalid-litres.sql) - Migration query

## Next Steps
1. ✅ Deploy application code (prevents new invalid values)
2. ⏳ Run `find-invalid-litres.sql` to identify all invalid records
3. ⏳ Contact affected farmers to confirm correct quantities
4. ⏳ Update invalid records to valid quarter-step values
5. ⏳ Deploy database schema update (adds strict CHECK constraint)
6. ✅ Monitor logs for any validation failures (will appear as `[TRACE]` messages)
