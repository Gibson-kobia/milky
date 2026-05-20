# Milky Quick Reference

Fast reference for development and deployment.

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Configure .env.local
cp .env.example .env.local
# Edit with Supabase credentials

# 3. Initialize database (in Supabase SQL Editor)
# Run: src/lib/db/schema.sql

# 4. Run
npm run dev

# 5. Login to http://localhost:3000/login
# Setup PIN (e.g., 1234)
```

## 📋 Essential Files

| File | Purpose | Edit When |
|------|---------|-----------|
| `.env.local` | Secrets & config | Setting up environment |
| `src/app/layout.tsx` | Root layout & metadata | Changing app name |
| `src/lib/utils.ts` | Utility functions | Adding helpers |
| `src/lib/validations.ts` | Validation schemas | Changing business rules |
| `src/lib/db/schema.sql` | Database structure | Changing data model |
| `tailwind.config.ts` | Colors & fonts | Branding |
| `src/app/(dashboard)/*` | Main pages | Features |

## 🔑 Key Directories

```
src/
├── app/              # Pages & routes
├── components/       # UI components
├── hooks/           # Custom React hooks
├── lib/
│   ├── db/         # Database & offline
│   ├── stores/     # Zustand state
│   ├── supabase/   # Supabase client
│   ├── utils.ts    # Helpers
│   └── validations.ts  # Zod schemas
└── types/          # TypeScript types
```

## 📱 Main Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/` | Daily milk entry & stats |
| Farmers | `/farmers` | Manage farmers |
| Farmer Detail | `/farmers/[id]` | View farmer history |
| Accounting | `/accounting` | Ledger view |
| Reports | `/reports` | Export & analytics |
| Settings | `/settings` | Configuration |
| Login | `/login` | PIN authentication |

## 🎨 Customize Colors

In `tailwind.config.ts`:
```ts
'milk-green': {
  600: '#16a34a',  // Primary (change this)
  700: '#15803d',  // Dark
  800: '#166534',  // Darker
}
```

## 💰 Change Rates

In `.env.local`:
```env
NEXT_PUBLIC_BUYING_RATE=55   # Change here
NEXT_PUBLIC_SELLING_RATE=70  # Change here
```

## 🗄 Database Essentials

```sql
-- Most important tables:
farmers              -- Farmer profiles
milk_deliveries      -- Daily milk entries
ledger_entries       -- All financial records
monthly_summaries    -- Month-end calculations
payments             -- Payout records

-- Key constraints:
UNIQUE(farmer_id, date, delivery_type)  -- No duplicate entries
immutable ledger     -- Financial integrity
no hard deletes      -- Archived instead
```

## 🔌 API Functions (Server Actions)

```tsx
import { 
  addMilkDelivery,
  updateMilkDelivery,
  addFarmer,
  getLedgerEntries,
  getMonthlySummaries 
} from '@/app/actions';

// Usage:
await addMilkDelivery(farmerId, litres, 'morning', '2025-05-19');
```

## 🎣 Custom Hooks

```tsx
import { useNotification, useOnlineStatus } from '@/hooks';

function MyComponent() {
  const { success, error } = useNotification();
  useOnlineStatus();  // Sets online/offline in UI state
  
  return <div />;
}
```

## 🔐 Authentication State

```tsx
import { useAuthStore } from '@/lib/stores/auth';

function MyComponent() {
  const { isAuthenticated, setAuthenticated, logout } = useAuthStore();
  
  return <div />;
}
```

## 📲 UI State (Notifications)

```tsx
import { useUIStore } from '@/lib/stores/ui';

function MyComponent() {
  const addToast = useUIStore(state => state.addToast);
  
  addToast({
    type: 'success',
    message: 'Saved!',
    duration: 3000
  });
}
```

## 🗂 Add New Page

1. Create folder: `src/app/(dashboard)/newpage/`
2. Create file: `src/app/(dashboard)/newpage/page.tsx`
3. Add route to sidebar: `src/components/sidebar.tsx`

```tsx
export default function NewPage() {
  return <div>Page content</div>;
}
```

## ➕ Add Component

1. Create: `src/components/my-component.tsx`
2. Import & use in pages

```tsx
export function MyComponent() {
  return <div>Component</div>;
}
```

## ✅ Validation (Zod)

```tsx
import { MilkDeliverySchema } from '@/lib/validations';

const data = {
  farmer_id: '123',
  litres: 2.5,
  delivery_type: 'morning',
  date: '2025-05-19'
};

try {
  MilkDeliverySchema.parse(data);  // Throws if invalid
} catch (error) {
  console.error('Validation failed:', error);
}
```

## 📊 Offline Data

```tsx
import { 
  db, 
  addToSyncQueue,
  getPendingSyncItems 
} from '@/lib/db/indexeddb';

// Save locally
await db.deliveries.add(delivery);

// Add to sync queue
await addToSyncQueue({
  type: 'milk_delivery',
  data: delivery
});

// Get pending items
const pending = await getPendingSyncItems();
```

## 🚢 Deploy Checklist

- [ ] Push to GitHub
- [ ] Create Supabase project
- [ ] Run schema.sql
- [ ] Connect to Vercel
- [ ] Add env vars
- [ ] Test PIN setup
- [ ] Test milk entry
- [ ] Verify offline mode
- [ ] Deploy!

## 🔗 Important Links

- Supabase: https://supabase.com
- Vercel: https://vercel.com
- Next.js: https://nextjs.org
- Tailwind: https://tailwindcss.com
- GitHub: https://github.com

## 📚 Documentation Files

| File | Topic |
|------|-------|
| README.md | Project overview |
| SETUP_GUIDE.md | Quick setup (10 min) |
| DEPLOYMENT.md | Deploy to production |
| ARCHITECTURE.md | System design |
| CUSTOMIZATION.md | How to customize |
| PROJECT_SUMMARY.md | What's included |

## 🆘 Common Issues

### Can't login?
- Check .env.local has Supabase URL & keys
- Clear browser cache
- Check browser console for errors

### Milk entry not saving?
- Check internet connection
- Verify Supabase project is active
- Check browser console errors

### Database connection error?
- Verify Supabase keys are correct
- Check project is active
- Refresh browser

### Need more details?
- See SETUP_GUIDE.md
- See DEPLOYMENT.md
- See ARCHITECTURE.md

## 💡 Pro Tips

1. **Fast mobile typing**: Use +/- buttons for quick entry
2. **Offline entry**: Works perfectly - syncs later
3. **Multiple devices**: Same PIN on all devices
4. **Backup daily**: Download reports regularly
5. **Monitor profits**: Check dashboard daily
6. **Archive farmers**: Never delete, always archive

## 🎯 Common Tasks

### Add new farmer
```tsx
// In farmers/page.tsx
const { success } = useToast();
await addFarmer(name, phone, eveningEnabled, notes);
success('Farmer added!');
```

### Record milk entry
```tsx
// In dashboard
await addMilkDelivery(farmerId, litres, 'morning', today);
```

### Calculate payout
```tsx
// Formula: (total_litres * buying_rate) - advances
const payout = (10 * 55) - 100;  // 450 KES
```

### Export data
```tsx
// Go to Reports page
// Click "Download PDF"
// Share with farmer or accountant
```

## 🔄 Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create pull request

# Deployment
git checkout main
git pull origin main
git merge feature/new-feature
git push origin main
# Vercel auto-deploys
```

## 📞 Quick Support

- **Question**: Check docs first
- **Bug**: Check browser console
- **Feature**: See CUSTOMIZATION.md
- **Deployment**: See DEPLOYMENT.md
- **Architecture**: See ARCHITECTURE.md

---

**Bookmark this page for quick reference!**

📌 Save as: `Quick Reference` browser bookmark
🖨️ Print & post: Next to computer
📱 Screenshot: Keep on phone

**Everything you need to know at a glance.**
