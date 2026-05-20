# Quick Setup Guide

Get Milky running in 10 minutes.

## 1️⃣ Prerequisites

- Node.js 18+
- npm or yarn
- Free Supabase account
- Free Vercel account (optional, for production)

## 2️⃣ Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd milky

# Install dependencies
npm install
```

## 3️⃣ Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Create new project
4. Wait 2-3 minutes for setup
5. Copy credentials:
   - **Project URL** (from Settings > API)
   - **Anon Key** (from Settings > API)
   - **Service Role Key** (from Settings > API - marked "secret")

## 4️⃣ Create Database

1. In Supabase, go to **SQL Editor**
2. Click **"New Query"**
3. Copy-paste entire `src/lib/db/schema.sql` file
4. Click **"Run"**
5. Wait for all tables to be created

## 5️⃣ Configure Environment

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_BUYING_RATE=55
NEXT_PUBLIC_SELLING_RATE=70
```

Replace `your_*_here` with actual values from Supabase.

## 6️⃣ Run Locally

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

## 7️⃣ First Login

1. Click **"Setup new PIN"**
2. Enter 4-digit PIN (e.g., `1234`)
3. Confirm PIN
4. Log in with your PIN
5. You're in! 🎉

## 📱 Try It Out

### Add a Farmer
1. Click "Farmers" in sidebar
2. Click "Add Farmer"
3. Fill in details:
   - Name: John Kipchoge
   - Phone: +254712345678
   - Notes: (optional)
4. Click "Add Farmer"

### Record Milk Entry
1. Go to Dashboard (home)
2. Click "+ Add" next to farmer name
3. Enter litres (e.g., 2.5)
4. Click "Save"
5. See stats update instantly!

### View Reports
1. Click "Reports"
2. See daily and monthly summaries
3. Download PDFs

## 🚀 Deploy to Production

### Via Vercel (Recommended)

1. Push to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import GitHub repository
5. Add environment variables (same as .env.local)
6. Click "Deploy"
7. Done! Your app is live 🎉

### Custom Domain
1. In Vercel project settings
2. Add your domain
3. Follow DNS setup instructions
4. SSL automatic in 24h

## 🔧 Troubleshooting

### "Connection refused" error
- Check Supabase is running (visit project URL in browser)
- Verify keys in .env.local are correct
- Clear browser cache

### "Invalid PIN"
- Click "Back to login" → "Setup new PIN"
- Create a new PIN
- This resets your auth

### Can't see farmers added
- Check Supabase project is active
- Verify RLS policies are enabled
- Check browser console for errors

### Offline mode not working
- Check browser supports IndexedDB
- Allow site storage in browser
- Try in incognito/private window

## 📚 Learn More

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Main README.md](./README.md)
- [Deployment Guide](./DEPLOYMENT.md)

## ❓ FAQ

**Q: Can I use this on mobile?**
A: Yes! It's fully responsive and works great on phones.

**Q: Does it work offline?**
A: Yes! Data syncs automatically when internet returns.

**Q: Can I backup my data?**
A: Yes! Export from Supabase Dashboard, or backup via Reports.

**Q: How do I add more farmers?**
A: Go to Farmers page → Add Farmer (multiple times)

**Q: Can I change the buying/selling rates?**
A: Yes! Settings page > Business Information

**Q: What if I forget my PIN?**
A: Reset via browser settings or contact admin

## 💡 Pro Tips

1. **Phone entry faster**: Use +/- buttons, press Enter to save
2. **Mobile view**: Works perfect on phone - try it!
3. **Offline entry**: Works in airplane mode - sync later
4. **Multiple devices**: Same PIN works on all devices
5. **Print statements**: Use Reports > PDF download

## 🎯 Next Steps

1. ✅ Complete setup
2. ✅ Add your farmers
3. ✅ Record test entries
4. ✅ Deploy to production
5. ✅ Train users
6. ✅ Go live! 🚀

---

**Need help? Check README.md or DEPLOYMENT.md**

Built for real milk collection businesses in Kenya 🥛
