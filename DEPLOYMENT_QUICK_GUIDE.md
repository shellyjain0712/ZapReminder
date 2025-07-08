# 🚀 Deployment Instructions for Vercel

## Environment Variables Required

Copy your actual values from your `.env` file to Vercel dashboard:

### In Vercel Dashboard → Settings → Environment Variables:

1. **AUTH_SECRET** - From your `.env` file
2. **NEXTAUTH_URL** - `https://your-vercel-app-name.vercel.app`
3. **GOOGLE_CLIENT_ID** - From your Google Cloud Console
4. **GOOGLE_CLIENT_SECRET** - From your Google Cloud Console
5. **DATABASE_URL** - Your PostgreSQL connection string

### Google OAuth Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Add redirect URI: `https://your-vercel-app-name.vercel.app/api/auth/callback/google`

### After Adding Variables:

1. Redeploy your app in Vercel
2. Test both manual signup and Google OAuth
3. Check function logs if there are any issues

## ✅ Your app should now work on Vercel with:
- Manual account creation
- Google OAuth login
- PostgreSQL database
- Proper authentication flow
