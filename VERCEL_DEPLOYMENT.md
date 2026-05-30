# Vercel Deployment Guide

## Prerequisites

1. A GitHub account
2. A Vercel account (sign up at [vercel.com](https://vercel.com) - free tier is fine)
3. Supabase project credentials (URL and anon key)

---

## Step 1: Push to GitHub

If you haven't already, push the `web-migration` branch to GitHub:

```bash
git push origin web-migration
```

Or if this is a new repository:

```bash
git remote add origin <your-github-repo-url>
git push -u origin web-migration
```

---

## Step 2: Import Project to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Connect your GitHub account if not already connected
4. Select this repository
5. Configure the project:
   - **Framework Preset:** Select "Other" (Expo is handled by our custom build command)
   - **Root Directory:** Leave as `.` (root)
   - **Build Command:** `npx expo export --platform web` (already configured in vercel.json)
   - **Output Directory:** `dist` (already configured in vercel.json)
   - **Install Command:** `npm install`

6. Add Environment Variables (see Step 3)
7. Click "Deploy"

### Option B: Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Follow the prompts. You'll need to add environment variables through the dashboard after the initial deployment.

---

## Step 3: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

| Name | Value | Notes |
|------|-------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` | Your Supabase anon/public key |

3. Make sure these are set for **Production**, **Preview**, and **Development** environments
4. After adding environment variables, trigger a redeploy

---

## Step 4: Update Supabase Auth Settings

**IMPORTANT:** Supabase needs to allow authentication from your Vercel domain.

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel URLs to **Site URL** and **Redirect URLs**:
   - Production: `https://<your-project>.vercel.app`
   - Preview: `https://<your-project>-*.vercel.app` (use wildcard for preview branches)
   - Localhost (for testing): `http://localhost:8081`

Example redirect URLs:
```
http://localhost:8081
https://cardinal-connect.vercel.app
https://cardinal-connect-*.vercel.app
```

4. Save changes

---

## Step 5: Test the Deployment

1. Open your Vercel deployment URL (e.g., `https://your-project.vercel.app`)
2. Test the following:
   - ✅ Login with Stanford email
   - ✅ Registration flow
   - ✅ Onboarding flow
   - ✅ Discover tab (events list, RSVP)
   - ✅ Friends tab (friend requests, messaging)
   - ✅ Profile tab (settings, privacy controls)
   - ⚠️ Map tab (should show placeholder message)

---

## Troubleshooting

### Build Fails

**Error:** Module not found or build timeout
- Check that all dependencies are in `package.json`
- Increase build timeout in Vercel project settings if needed
- Check build logs for specific errors

### Blank Page After Deploy

**Error:** White screen or no content
- Open browser DevTools console
- Look for JavaScript errors
- Check that environment variables are set correctly
- Verify Supabase URL is correct

### Authentication Fails

**Error:** "Invalid login credentials" or redirect loop
- Verify Supabase redirect URLs include your Vercel domain
- Check that `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
- Test authentication from localhost first to isolate the issue

### Assets Not Loading

**Error:** Images or fonts missing
- Check that `dist/` folder contains all assets after build
- Look at Network tab in DevTools for 404 errors
- Verify vercel.json cache headers are working

---

## Continuous Deployment

Once set up, Vercel will automatically:
- Deploy every push to `web-migration` branch
- Create preview deployments for pull requests
- Run the build command and serve from `dist/`

To update the live site:
```bash
git add .
git commit -m "Update feature X"
git push origin web-migration
```

Vercel will automatically rebuild and deploy within 1-2 minutes.

---

## Custom Domain (Optional)

To use a custom domain:

1. Go to **Settings** → **Domains** in Vercel
2. Add your domain
3. Update DNS records as instructed
4. Add the custom domain to Supabase redirect URLs

---

## Production Checklist

Before sharing with users:

- [ ] Environment variables set in Vercel
- [ ] Supabase redirect URLs configured
- [ ] Test login/registration flow
- [ ] Test creating an event
- [ ] Test adding friends
- [ ] Test messaging
- [ ] Test on mobile browser (Safari iOS, Chrome Android)
- [ ] Test on desktop browser (Chrome, Safari, Firefox)
- [ ] Verify HTTPS is working
- [ ] Share URL with test users!

---

## Next Steps

**Current status:** Phase 1 complete - web app is deployable and functional (except full map)

**Phase 2:** Restore the map with Mapbox GL JS or Google Maps JavaScript API
**Phase 3:** Add in-app real-time notifications via Supabase subscriptions
**Phase 4 (optional):** Add web push notifications as a PWA

---

**Questions?** Check the Expo web docs at https://docs.expo.dev/workflow/web/
