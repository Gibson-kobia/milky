# Deployment Guide

## Prerequisites
- GitHub account with repo pushed
- Vercel account (free tier OK)
- Supabase project created and initialized
- Environment variables documented

## Step-by-Step Deployment

### 1. Prepare Repository

```bash
# Ensure all files are committed
git add .
git commit -m "Production-ready version"
git push origin main
```

### 2. Create Supabase Project

1. Visit [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create new project (free tier)
4. Wait for initialization (2-3 minutes)

### 3. Initialize Database

1. In Supabase Dashboard, go to **SQL Editor**
2. Create new query
3. Copy entire contents of `src/lib/db/schema.sql`
4. Paste into query editor
5. Click "Run"
6. Wait for all tables to be created

### 4. Get Credentials

In Supabase Project Settings:

1. **Project URL**: Copy from Project URL
2. **Anon Key**: Copy from "anon public" key
3. **Service Role Key**: Copy from "service_role" (secret)

### 5. Deploy to Vercel

1. Visit [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select project name
5. Add environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_BUYING_RATE=55
NEXT_PUBLIC_SELLING_RATE=70
```

6. Click "Deploy"
7. Wait 3-5 minutes for deployment

### 6. Post-Deployment Testing

1. Visit your Vercel domain
2. Go to login page
3. Test PIN setup (use 1234)
4. Log in
5. Test adding farmer
6. Test milk entry
7. Verify offline mode

## Domain Setup

### Custom Domain
1. In Vercel Project Settings
2. Add custom domain
3. Follow DNS instructions
4. Wait for SSL certificate (24 hours)

### HTTPS
- Automatic with Vercel

## Monitoring

### Vercel Dashboard
- Monitor deployments
- View error logs
- Check analytics

### Supabase Monitoring
- View database logs
- Monitor connections
- Check storage usage

## Backup Strategy

### Database
```bash
# Daily backup via Supabase (automatic on free plan - every 7 days)
# Recommended: Set up automatic exports to external storage
```

### Files
- GitHub is your main backup
- Commit regularly
- Tag releases

## Scaling

### As business grows:

1. **Upgrade Supabase plan**
   - Increases database connections
   - Better performance
   - Professional support

2. **Vercel scaling**
   - Automatic serverless scaling
   - No additional setup needed

3. **Database optimization**
   - Add indexes for common queries
   - Implement pagination
   - Archive old records

## Troubleshooting Deployment

### "Database connection failed"
- Check Supabase project is active
- Verify environment variables in Vercel
- Check RLS policies in Supabase

### "Build failed"
- Check Node version (18+)
- Clear Vercel cache and redeploy
- Check for TypeScript errors: `npm run type-check`

### "Slow performance"
- Check Supabase query logs
- Implement pagination
- Add database indexes
- Enable CDN caching

## Security Checklist

- [ ] PIN is strong and changed from default
- [ ] Supabase RLS policies are enabled
- [ ] Environment variables are secure
- [ ] HTTPS is enabled (automatic)
- [ ] Regular backups scheduled
- [ ] Access logs reviewed periodically
- [ ] Database credentials never in code
- [ ] Admin email verified in Supabase

## Performance Checklist

- [ ] Database indexes created
- [ ] Queries optimized
- [ ] Images optimized
- [ ] CSS purged (Tailwind)
- [ ] Code split implemented
- [ ] Caching strategies in place

## Maintenance

### Weekly
- Review sync error logs
- Check disk usage
- Monitor database connections

### Monthly
- Review usage analytics
- Backup critical data
- Update dependencies: `npm update`

### Quarterly
- Performance audit
- Security review
- Plan for scaling needs

## Rollback Procedure

If something breaks:

```bash
# On GitHub
git revert <commit-hash>
git push origin main

# Vercel automatically redeploys
# Check deployment status on Vercel dashboard
```

## Production Checklist

- [ ] All pages tested on mobile/tablet/desktop
- [ ] Offline mode tested thoroughly
- [ ] All forms validated
- [ ] Error messages clear and helpful
- [ ] Performance acceptable (<3s load time)
- [ ] PIN login working
- [ ] Database syncing working
- [ ] All business rules implemented
- [ ] Backup strategy in place
- [ ] Monitoring configured

---

**Questions? Check the main README.md or contact support.**
