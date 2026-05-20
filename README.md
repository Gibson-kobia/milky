# Milky - Milk Collection & Farmer Payment System

A production-ready, mobile-first web application for managing milk collection and farmer payments in Meru, Kenya.

## 🎯 Features

### Core Operations
- **Fast Morning Entry Board** - Rapid milk quantity entry for multiple farmers simultaneously
- **Farmer Management** - Complete farmer profiles with contact info and delivery preferences
- **Accounting Ledger** - Immutable transaction log for complete financial transparency
- **Monthly Calculations** - Automatic farmer payout calculations
- **Offline-First** - Works without internet; syncs automatically when online

### Financial Management
- **Buying/Selling Rates** - Configurable KES per litre (default: 55 buying, 70 selling)
- **Advance System** - Track cash and goods advances for farmers
- **Payment Recording** - Cash or M-Pesa payment tracking
- **Profit Calculations** - Real-time business profit estimation
- **PDF Statements** - Printable farmer payment statements

### Reporting
- **Daily Reports** - Collection totals and profit estimates
- **Monthly Summaries** - Complete month-end financial reports
- **Farmer Reports** - Individual farmer delivery and payment history

### Security & Reliability
- **PIN-Based Login** - Fast 4-digit PIN authentication
- **IndexedDB Caching** - Local data persistence
- **Sync Queue System** - Reliable offline queue with retry logic
- **Audit Logging** - Complete transaction history

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - App Router with TypeScript
- **React 19** - Latest features and performance
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible UI components
- **Zustand** - Lightweight state management
- **React Hook Form** - Efficient form handling
- **Zod** - Schema validation
- **TanStack Query** - Server state management
- **Framer Motion** - Subtle animations
- **Recharts** - Data visualization
- **Lucide Icons** - Beautiful SVG icons

### Backend
- **Supabase** - PostgreSQL + Auth + Storage
- **PostgreSQL** - Relational database
- **Row Level Security** - Data isolation

### Offline
- **Dexie.js** - IndexedDB wrapper
- **Background Sync** - Auto-sync when online

### Deployment
- **Vercel** - Fast, reliable hosting
- **Edge Functions** - Serverless backend

## 📋 Project Structure

```
milky/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── farmers/
│   │   │   │   ├── page.tsx          # Farmers list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Farmer detail
│   │   │   ├── accounting/
│   │   │   │   └── page.tsx          # Ledger view
│   │   │   ├── reports/
│   │   │   │   └── page.tsx          # Reports & exports
│   │   │   └── settings/
│   │   │       └── page.tsx          # Configuration
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── badge.tsx
│   │   │   └── tabs.tsx
│   │   ├── header.tsx                # Top navigation
│   │   ├── sidebar.tsx               # Left sidebar nav
│   │   ├── fast-entry-board.tsx      # Core entry component
│   │   ├── daily-dashboard.tsx       # Stats display
│   │   └── toast-container.tsx       # Notifications
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts
│   │   ├── db/
│   │   │   ├── schema.sql            # Database schema
│   │   │   └── indexeddb.ts          # Local storage
│   │   ├── stores/
│   │   │   ├── auth.ts
│   │   │   └── ui.ts
│   │   ├── utils.ts                  # Utility functions
│   │   ├── validations.ts            # Zod schemas
│   │   └── cn.ts
│   └── types/
│       └── index.ts
├── public/
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── next.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works great)
- Vercel account (optional, for deployment)

### 1. Clone & Setup

```bash
# Clone the repository
git clone <repo-url>
cd milky

# Install dependencies
npm install
```

### 2. Database Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for project initialization
4. Copy `Project URL` and `anon key` to `.env.local`

#### Initialize Database Schema

Run the SQL from `src/lib/db/schema.sql` in Supabase SQL editor:
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy-paste the entire schema.sql file
4. Click "Run"

### 3. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Config
NEXT_PUBLIC_APP_NAME=Milky
NEXT_PUBLIC_BUYING_RATE=55
NEXT_PUBLIC_SELLING_RATE=70
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

**First Login:**
1. Click "Setup new PIN"
2. Enter a 4-digit PIN (e.g., 1234)
3. Confirm the PIN
4. Log in with your PIN

## 📱 Usage Guide

### Daily Workflow

1. **Morning Entry**
   - Go to Dashboard (main page)
   - Each farmer row shows yesterday's collection for reference
   - Click "+ Add" or edit button to enter today's litres
   - Use +/- buttons for quick adjustments
   - Press Enter or click "Save" to record
   - App auto-focuses next farmer

2. **Add New Farmer**
   - Go to "Farmers" page
   - Click "Add Farmer"
   - Enter name, phone (Kenyan format), optional notes
   - Toggle "Enable evening deliveries" if needed
   - Click "Add Farmer"

3. **View Reports**
   - Go to "Reports" page
   - View daily and monthly summaries
   - Download PDF for record-keeping

4. **Accounting**
   - Go to "Accounting" page
   - View all financial transactions
   - Track advances and payouts

## 🔐 Security

### Authentication
- PIN-based login (4 digits)
- Stored locally in browser (SHA-256 hashed)
- Session persists until logout

### Data Protection
- All data sent over HTTPS
- Supabase RLS policies control access
- Offline data stored in encrypted IndexedDB

### Best Practices
- Change PIN regularly (Settings > Security)
- Log out before leaving device
- Backup reports monthly

## 🔄 Offline Functionality

The app works perfectly offline:

1. **Offline Data Entry**
   - Add/edit deliveries without internet
   - Data stored in IndexedDB locally

2. **Automatic Sync**
   - When internet returns, sync badge appears
   - Click to manually sync or wait for auto-sync
   - Failed syncs show retry option

3. **Conflict Resolution**
   - Local changes take precedence
   - Server version loaded after sync

## 📊 Milk Entry Rules

### Valid Quantities
Only whole or .5 litre increments allowed:
- ✅ 1, 1.5, 2, 2.5, 3, 3.5, 4, etc.
- ❌ 1.25, 2.75, 3.1 (not allowed)

### Duplicate Prevention
- Each farmer can have ONE morning delivery per day
- Selected farmers can also have ONE evening delivery
- System prevents duplicate entries

## 💰 Financial Rules

### Rates (Configurable)
- **Buying Rate:** 55 KES/litre (default)
- **Selling Rate:** 70 KES/litre (default)
- **Profit per litre:** 15 KES

### Payout Formula
```
Gross Earnings = Total Litres × Buying Rate
Final Payout = Gross Earnings - Advances
```

### Example
- John delivers 10 litres
- Gross: 10 × 55 = 550 KES
- Advance (animal feed): -200 KES
- Final payout: 350 KES

## 📁 Key Database Tables

### farmers
- id, name, phone, active, evening_delivery_enabled, notes, archived_at

### milk_deliveries
- id, farmer_id, date, litres, delivery_type, created_at, updated_at

### ledger_entries
- id, farmer_id, entry_type, amount_kes, transaction_date, reference_id
- **Types:** milk_delivery, evening_delivery, advance_cash, advance_goods, payout_cash, payout_mpesa, adjustment

### monthly_summaries
- id, farmer_id, year, month, total_litres, gross_earnings, total_advances, total_payouts, final_balance

### payments
- id, farmer_id, amount, method (cash/mpesa), date

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import project from GitHub
   - Add environment variables
   - Deploy

3. **Post-Deployment**
   - Visit your live domain
   - Test PIN setup
   - Verify Supabase connection
   - Run through complete workflow

## 🐛 Troubleshooting

### Can't log in?
- Verify `.env.local` has correct Supabase keys
- Check browser console for errors
- Clear browser cache and try again

### Offline mode not working?
- Check browser IndexedDB support (Settings)
- Ensure "Allow offline storage" is enabled
- Try in incognito mode

### Data not syncing?
- Check internet connection
- Go to Settings, check sync status
- Look for sync error messages in toast notifications

### Database connection error?
- Verify Supabase project is active
- Check ANON_KEY is correct
- Ensure RLS policies are in place

## 📈 Performance Optimization

- **Lazy Loading:** Pages load only when visited
- **Image Optimization:** Next.js Image component
- **CSS:** Tailwind purges unused styles
- **Bundle Size:** Tree-shaking unused code
- **Database:** Indexed queries, proper pagination

## 🤝 Contributing

This is a production system for a real business. For improvements:

1. Create a feature branch
2. Keep changes focused
3. Test thoroughly offline and online
4. Include database migrations if needed
5. Update documentation

## 📄 License

MIT - Built for Meru milk collection business

## 🙏 Support

For issues or feature requests, contact the development team.

---

**Built with ❤️ for a real milk collection business in Meru, Kenya**

🥛 Fast • Reliable • Offline-first • Made locally