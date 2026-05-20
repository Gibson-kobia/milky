# Customization Guide

How to tailor Milky for your specific business needs.

## 🎨 Visual Customization

### Colors

Edit `tailwind.config.ts`:

```ts
colors: {
  'milk-green': {
    600: '#16a34a',  // Primary color
    // Change this to your brand color
  }
}
```

**Popular alternatives**:
- Blue: `#2563eb`
- Orange: `#ea580c`
- Purple: `#7c3aed`

### Logo & Branding

1. Replace logo in `/src/components/header.tsx`:
```tsx
<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-milk-green-600">
  <span className="text-lg font-bold text-white">M</span>  // Change "M"
</div>
```

2. Update app name in `/src/components/sidebar.tsx`:
```tsx
<h1 className="text-xl font-bold">Milky</h1>  // Change "Milky"
```

3. Update metadata in `/src/app/layout.tsx`:
```tsx
export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your description'
};
```

### Typography

Edit `tailwind.config.ts` to use your preferred font:

```ts
fontFamily: {
  sans: ['YourFont', 'system-ui', 'sans-serif'],
}
```

Or import from Google Fonts in `app/layout.tsx`:
```tsx
import { Poppins } from 'next/font/google';

const poppins = Poppins({ subsets: ['latin'] });
```

## 💰 Financial Customization

### Change Rates

In `.env.local`:
```env
NEXT_PUBLIC_BUYING_RATE=55      # KES per litre (change as needed)
NEXT_PUBLIC_SELLING_RATE=70     # KES per litre (change as needed)
```

Or make it configurable via Settings page:

```tsx
// In settings/page.tsx
<Input
  {...form.register('buying_rate')}
  type="number"
  placeholder="Current: 55"
/>
```

### Business Metrics

Add custom calculations in `/src/lib/utils.ts`:

```tsx
export const calculateCustomMetric = (data) => {
  // Your custom calculation
  return result;
};
```

## 👥 User Management

### Add Multiple Users (Future)

1. Integrate Supabase Auth
2. Add user roles (admin, viewer, data-entry)
3. Implement team sharing
4. Add permission-based views

**Current**: Single PIN-based access (suitable for small shops)

## 📱 Features to Add

### SMS Notifications
```tsx
// When payment is recorded
await sendSMS(farmer.phone, `Received ${litres}L. Balance: ${balance}KES`);
```

### WhatsApp Integration
- Send payment confirmations
- Payment reminders
- Monthly statements

### Email Reports
- Daily summary email
- Monthly report auto-send
- Payment receipts

### Mobile App
- Wrap in React Native or Flutter
- Use same Supabase backend
- Offline-first approach

## 🔌 API Integrations

### M-Pesa Integration

```tsx
// Create API endpoint
// /api/payments/mpesa

export async function initiateMpesaPayment(
  phone: string,
  amount: number,
  farmerId: string
) {
  const response = await fetch('https://api.safaricom.co.ke/mpesa/...', {
    method: 'POST',
    body: JSON.stringify({
      // M-Pesa payment request
    })
  });
  
  // Handle response
  // Update ledger on success
}
```

### Banking APIs
- Pesapal integration
- Stripe (for international)
- PayPal

### Accounting Software
- QuickBooks integration
- Xero integration
- SAP

```tsx
export async function syncToQuickBooks(ledgerEntry) {
  // Map to QB format
  // POST to QB API
  // Handle errors
}
```

## 📊 Analytics & Dashboard

### Add Charts

```tsx
import { LineChart, Line, XAxis, YAxis } from 'recharts';

export function CollectionTrend({ data }) {
  return (
    <LineChart data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Line type="monotone" dataKey="litres" stroke="#16a34a" />
    </LineChart>
  );
}
```

**Chart Ideas**:
- Daily collection trend
- Farmer comparison
- Revenue vs. payouts
- Profit margin over time

### Add Reports

Create new report types in `/src/app/(dashboard)/reports/`:

```tsx
// annual-report/page.tsx
export default function AnnualReportPage() {
  // Year-over-year analysis
  // Profit trends
  // Top farmers
  // Seasonal patterns
}
```

## 🔐 Security Enhancements

### Upgrade Authentication

```tsx
// Migrate from PIN to Supabase Auth
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createServerComponentClient({ cookies });
const { data: { session } } = await supabase.auth.getSession();
```

### Add 2FA (Two-Factor Authentication)

```tsx
export async function setupTwoFA() {
  // Use Supabase MFA
  // TOTP or SMS
}
```

### Role-Based Access

```tsx
const checkPermission = (user, permission) => {
  const roles = {
    owner: ['read', 'write', 'delete', 'export'],
    manager: ['read', 'write', 'export'],
    viewer: ['read'],
  };
  return roles[user.role]?.includes(permission);
};
```

## 🌍 Localization

### Change Language

Create translation files:

```tsx
// lib/i18n/en.ts
export const en = {
  dashboard: {
    title: 'Dashboard',
    today: 'Today',
  },
};

// lib/i18n/sw.ts
export const sw = {
  dashboard: {
    title: 'Dashibodi',
    today: 'Leo',
  },
};
```

Use translations:
```tsx
import { currentLanguage } from '@/lib/i18n';

<h1>{currentLanguage.dashboard.title}</h1>
```

### Change Currency Display

```tsx
// lib/utils.ts
const locale = 'en-KE';  // Change as needed
const currency = 'KES';   // Or any currency

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
};
```

## 📤 Data Export/Import

### Export to Excel

```tsx
import * as XLSX from 'xlsx';

export function exportToExcel(data) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Milky Data');
  XLSX.writeFile(wb, 'milky-export.xlsx');
}
```

### Import from CSV

```tsx
export async function importCSV(file) {
  const text = await file.text();
  const data = parseCSV(text);
  // Validate with Zod
  // Insert into database
}
```

## 🔄 Workflow Customization

### Morning Collection Only

Remove evening delivery option:

```tsx
// In farmer form
{/* Hide evening delivery toggle */}
{showEveningOption && (
  <input type="checkbox" {...form.register('evening_delivery_enabled')} />
)}
```

### Allow Fractional Liters

Modify validation in `validations.ts`:

```tsx
const validateMilkQuantity = (value: number) => {
  // Currently: only .5 increments
  // Change to: allow any decimal
  return value > 0 && value <= 100;
};
```

### Custom Farmer Fields

Add fields to database:

```sql
ALTER TABLE farmers ADD COLUMN village VARCHAR(255);
ALTER TABLE farmers ADD COLUMN bank_account VARCHAR(255);
ALTER TABLE farmers ADD COLUMN mpesa_number VARCHAR(20);
```

Update TypeScript types:

```tsx
export interface Farmer {
  // ... existing
  village?: string;
  bank_account?: string;
  mpesa_number?: string;
}
```

## 🎯 Multi-Shop Setup

For managing multiple locations:

```tsx
// Add shop_id to all tables
ALTER TABLE milk_deliveries ADD COLUMN shop_id UUID;
ALTER TABLE farmers ADD COLUMN shop_id UUID;

// Filter by shop
export async function getFarmers(shopId: string) {
  return supabase
    .from('farmers')
    .select()
    .eq('shop_id', shopId);
}
```

## 🚀 Performance Tuning

### Database Indexes

```sql
-- Add indexes for common queries
CREATE INDEX idx_deliveries_farmer_date 
  ON milk_deliveries(farmer_id, date);

CREATE INDEX idx_ledger_farmer_month 
  ON ledger_entries(farmer_id, transaction_date);
```

### Query Optimization

```tsx
// Instead of:
const farmers = await getFarmers();  // Gets all
const deliveries = farmers.map(f => getDeliveries(f.id));  // N queries

// Use:
const data = await supabase
  .from('farmers')
  .select('*, milk_deliveries(*)')  // Single query
  .order('name');
```

### Caching Strategy

```tsx
// Cache expensive calculations
const memoizedCalculation = useMemo(
  () => calculateMonthlyProfit(data),
  [data]
);
```

## 📞 Support & Help

- Check `ARCHITECTURE.md` for system design
- Review `DEPLOYMENT.md` for production setup
- See main `README.md` for usage
- Check `/src` directory structure for code patterns

---

**Milky is designed to be customizable. Start simple, add features as needed.**
