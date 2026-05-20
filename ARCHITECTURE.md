# Milky Architecture

Complete system architecture and design documentation.

## 📦 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / Mobile                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        React Components (TSX/UI)                     │   │
│  │  ├─ Dashboard       (fast entry board)               │   │
│  │  ├─ Farmers         (CRUD operations)                │   │
│  │  ├─ Accounting      (ledger view)                    │   │
│  │  └─ Reports         (analytics & PDFs)               │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        State Management (Zustand)                    │   │
│  │  ├─ Auth State       (PIN login)                     │   │
│  │  └─ UI State         (notifications, sync status)    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Offline Layer (IndexedDB + Dexie)             │   │
│  │  ├─ Local deliveries cache                           │   │
│  │  ├─ Sync queue        (failed operations)            │   │
│  │  └─ Offline flag      (read-only mode)               │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Validation Layer (Zod)                        │   │
│  │  ├─ Form validation                                  │   │
│  │  ├─ Business rules    (milk quantity, phone format)  │   │
│  │  └─ Type safety       (TypeScript)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        API Layer (Server Actions)                    │   │
│  │  ├─ addMilkDelivery()                                │   │
│  │  ├─ addFarmer()                                      │   │
│  │  ├─ recordPayment()                                  │   │
│  │  └─ generateReport()                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │        Network Layer (HTTPS)          │
        │  Encrypted data transmission          │
        │  Automatic retry on failure           │
        │  Background sync when online          │
        └───────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Supabase (Cloud)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        PostgreSQL Database                           │   │
│  │  ├─ farmers          (farmer profiles)               │   │
│  │  ├─ milk_deliveries  (entry log)                     │   │
│  │  ├─ ledger_entries   (financial transactions)        │   │
│  │  ├─ monthly_summaries (computed aggregates)          │   │
│  │  ├─ payments         (payout records)                │   │
│  │  ├─ audit_logs       (activity log)                  │   │
│  │  └─ settings         (configuration)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Row Level Security (RLS)                      │   │
│  │  ├─ Authentication checks                            │   │
│  │  ├─ Data isolation                                   │   │
│  │  └─ Immutable audit trail                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Triggers & Functions                          │   │
│  │  ├─ Auto-create ledger entries from deliveries       │   │
│  │  ├─ Update audit logs                                │   │
│  │  └─ Calculate monthly summaries                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Storage (for PDFs, exports)                   │   │
│  │  ├─ Generated PDFs                                   │   │
│  │  └─ Data exports                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🏗 Component Layers

### 1. Presentation Layer (React Components)

**Location**: `/src/components/` and `/src/app/`

**Responsibility**: User interface rendering

**Key Files**:
- `fast-entry-board.tsx` - Core daily workflow
- `daily-dashboard.tsx` - Stats and metrics
- `header.tsx` - Top navigation
- `sidebar.tsx` - Left navigation
- `ui/` - Reusable UI components

**Pattern**: Functional components with hooks

```tsx
function ComponentName() {
  const { data, isLoading } = useQuery(...);
  
  return <JSX />;
}
```

### 2. State Management Layer (Zustand)

**Location**: `/src/lib/stores/`

**Files**:
- `auth.ts` - Authentication state
- `ui.ts` - UI state (toasts, sync status, online/offline)

**Pattern**: Store per domain

```tsx
const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
}));
```

### 3. Validation Layer (Zod)

**Location**: `/src/lib/validations.ts`

**Schemas**:
- `FarmerSchema` - Farmer data validation
- `MilkDeliverySchema` - Milk quantity rules
- `AdvanceSchema` - Advance/deduction validation
- `PaymentSchema` - Payment validation

**Pattern**: Parse and validate before API calls

```tsx
const result = FarmerSchema.parse(formData);
if (result.success) {
  // proceed
}
```

### 4. Offline Layer (IndexedDB + Dexie)

**Location**: `/src/lib/db/indexeddb.ts`

**Tables**:
- `deliveries` - Local milk entries
- `ledger` - Local financial records
- `syncQueue` - Pending operations

**Pattern**: Optimistic updates + sync queue

```tsx
// Add to local DB first
await db.deliveries.add(delivery);

// Add to sync queue
await addToSyncQueue({
  type: 'milk_delivery',
  data: delivery,
});

// Try to sync when online
if (isOnline) {
  await syncPendingItems();
}
```

### 5. API Layer (Server Actions)

**Location**: `/src/app/actions.ts`

**Functions**:
- `addMilkDelivery()`
- `updateMilkDelivery()`
- `addFarmer()`
- `getLedgerEntries()`
- `getMonthlySummaries()`

**Pattern**: Server-side data mutations

```tsx
'use server';

export async function addMilkDelivery(...) {
  const supabase = createClient();
  return await supabase.from('milk_deliveries').insert(...);
}
```

### 6. Database Layer (PostgreSQL)

**Location**: `/src/lib/db/schema.sql`

**Core Tables**:

```
farmers
├── id (UUID PK)
├── name (VARCHAR)
├── phone (VARCHAR UNIQUE)
├── active (BOOLEAN)
├── evening_delivery_enabled (BOOLEAN)
├── notes (TEXT)
└── archived_at (TIMESTAMP)

milk_deliveries
├── id (UUID PK)
├── farmer_id (UUID FK)
├── date (DATE)
├── litres (DECIMAL 5,1)
├── delivery_type (morning|evening)
└── UNIQUE(farmer_id, date, delivery_type)

ledger_entries
├── id (UUID PK)
├── farmer_id (UUID FK)
├── entry_type (VARCHAR enum)
├── amount_kes (DECIMAL)
├── transaction_date (DATE)
└── reference_id (UUID)

monthly_summaries
├── id (UUID PK)
├── farmer_id (UUID FK)
├── year, month
├── total_litres
├── gross_earnings
├── total_advances
├── total_payouts
└── UNIQUE(farmer_id, year, month)

payments
├── id (UUID PK)
├── farmer_id (UUID FK)
├── amount (DECIMAL)
├── method (cash|mpesa)
└── date (DATE)

audit_logs
├── id (UUID PK)
├── action (VARCHAR)
├── changes (JSONB)
└── created_at
```

**Key Constraints**:
- Farmers can't be deleted (archived instead)
- One morning + one evening delivery per farmer per day
- Ledger entries are immutable
- Phone numbers validated with Kenyan format regex

## 🔄 Data Flow Examples

### Adding a Milk Delivery

```
User Input
    ↓
FormValidation (Zod)
    ↓
Optimistic UI Update
    ↓
Save to IndexedDB (offline queue)
    ↓
Server Action (addMilkDelivery)
    ↓
Supabase INSERT
    ↓
Trigger: Create Ledger Entry
    ↓
Trigger: Update Monthly Summary
    ↓
Mark as Synced in IndexedDB
    ↓
UI Toast Notification
```

### Offline Workflow

```
No Internet
    ↓
User Records Entry
    ↓
Saved to IndexedDB
    ↓
Added to SyncQueue
    ↓
UI Shows "Offline" Badge
    ↓
Internet Returns
    ↓
Auto-retry SyncQueue Items
    ↓
Push to Supabase
    ↓
Mark as Synced
    ↓
UI Shows "Synced" Badge
```

### Monthly Payout Calculation

```
Month Ends
    ↓
PostgreSQL Function Triggers
    ↓
Calculate: SUM(litres) WHERE month=X
    ↓
Calculate: gross_earnings = total_litres * 55
    ↓
SUM(advances) from ledger_entries
    ↓
final_payout = gross_earnings - advances
    ↓
INSERT monthly_summary
    ↓
Email/PDF available for download
```

## 🔐 Security Model

### Authentication
- PIN stored as SHA-256 hash in localStorage
- No server-side auth required for MVP
- Session persists until logout
- Future: Migrate to Supabase Auth

### Authorization
- Supabase RLS policies (Row Level Security)
- All tables have RLS enabled
- Future: Add role-based access

### Data Protection
- HTTPS in production
- IndexedDB data is client-side only
- No sensitive data in localStorage except PIN hash
- Audit logs for compliance

## 🚀 Performance Optimizations

### Database
- Indexed queries on common filters
- Lazy loading with pagination
- Materialized summaries (monthly_summaries table)
- No N+1 queries

### Frontend
- Code splitting with Next.js
- CSS purging with Tailwind
- Image optimization
- Memoization of expensive computations

### Caching
- IndexedDB for offline
- SWR/TanStack Query for server state
- Tailwind CSS class caching

## 🔧 Extension Points

### Adding a New Feature

1. **Define Types** (`/src/types/index.ts`)
```tsx
export interface NewFeature {
  id: string;
  // ...
}
```

2. **Create Validation Schema** (`/src/lib/validations.ts`)
```tsx
export const NewFeatureSchema = z.object({
  // ...
});
```

3. **Create Database Table** (`/src/lib/db/schema.sql`)
```sql
CREATE TABLE new_features (
  id UUID PRIMARY KEY,
  // ...
);
```

4. **Create UI Component** (`/src/components/new-feature.tsx`)
```tsx
export function NewFeature() {
  // ...
}
```

5. **Create Server Action** (`/src/app/actions.ts`)
```tsx
export async function addNewFeature(...) {
  // ...
}
```

6. **Add Page/Route** (`/src/app/(dashboard)/new-feature/page.tsx`)
```tsx
export default function NewFeaturePage() {
  // ...
}
```

### Adding Authentication

1. Set up Supabase Auth
2. Create auth provider wrapper
3. Update RLS policies
4. Implement sign-up flow
5. Add user session management

### Adding Payments Integration

1. Create `payments` table (already exists)
2. Integrate M-Pesa API:
   - Create `/api/payments/mpesa` endpoint
   - Handle webhooks
   - Update ledger on success
3. Create payment UI component
4. Add payment confirmation

### Adding PDF Generation

1. Install `@react-pdf/renderer`
2. Create PDF templates:
   - Farmer statement
   - Monthly report
   - Daily collection sheet
3. Create download buttons
4. Handle server-side generation if needed

## 📊 Database Queries

### Get today's collection
```sql
SELECT SUM(litres) FROM milk_deliveries 
WHERE date = CURRENT_DATE 
AND delivery_type = 'morning';
```

### Get farmer's monthly earnings
```sql
SELECT 
  SUM(litres) as total_litres,
  SUM(amount_kes) as gross_earnings
FROM ledger_entries
WHERE farmer_id = $1
  AND EXTRACT(YEAR FROM transaction_date) = $2
  AND EXTRACT(MONTH FROM transaction_date) = $3
  AND entry_type LIKE '%delivery%';
```

### Calculate final payout
```sql
SELECT 
  COALESCE(SUM(le.amount_kes), 0) as gross_earnings,
  COALESCE(SUM(
    CASE WHEN le.entry_type LIKE '%advance%' 
    THEN le.amount_kes ELSE 0 END
  ), 0) as total_advances,
  COALESCE(SUM(le.amount_kes), 0) - COALESCE(SUM(
    CASE WHEN le.entry_type LIKE '%advance%' 
    THEN le.amount_kes ELSE 0 END
  ), 0) as final_payout
FROM ledger_entries le
WHERE le.farmer_id = $1
  AND EXTRACT(YEAR FROM le.transaction_date) = $2
  AND EXTRACT(MONTH FROM le.transaction_date) = $3;
```

## 🧪 Testing Strategy

### Unit Tests
- Validation functions
- Utility functions
- Business logic

### Integration Tests
- Database operations
- Server actions
- Offline sync

### E2E Tests
- Complete workflows
- Form submissions
- Offline to online transition

### Manual Testing
- Mobile device testing
- Offline mode
- Cross-browser compatibility

## 📈 Monitoring & Logging

### Frontend
- Browser console errors
- Toast notifications
- Offline indicators
- Sync status badges

### Backend (Supabase)
- Database logs
- Query performance
- RLS policy violations
- Storage usage

### Analytics
- Daily collection trends
- Monthly profit tracking
- Farmer payment status
- System uptime

## 🎯 Best Practices

1. **Always validate input** - Use Zod schemas
2. **Handle errors gracefully** - Show user-friendly messages
3. **Optimize database queries** - Use indexes
4. **Cache strategically** - IndexedDB for offline
5. **Test thoroughly** - Especially offline scenarios
6. **Log important actions** - Audit trail
7. **Secure sensitive data** - HTTPS always
8. **Monitor performance** - Watch database metrics
9. **Document code** - Clear comments
10. **Version your API** - Easier migrations

---

**This architecture supports 100s of farmers and millions of transactions. It's built for scale from day one.**
