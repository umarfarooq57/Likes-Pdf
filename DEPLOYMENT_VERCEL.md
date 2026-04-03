# Vercel Deployment Guide

## Required Environment Variables

When deploying the frontend to Vercel, you **MUST** configure these environment variables in the Vercel dashboard:

### Production Variables (Settings > Environment Variables)

```
NEXT_PUBLIC_API_URL=https://likes-pdf-backend-production-668e.up.railway.app
```

**Important:**
- `NEXT_PUBLIC_` prefix means this variable is available to the browser
- Do NOT set this to `localhost` or `127.0.0.1` on production - it will cause connection errors
- This URL must point to your production Railway backend

## Steps to Configure

1. Go to your Vercel project dashboard
2. Click **Settings** > **Environment Variables**
3. Add new variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://likes-pdf-backend-production-668e.up.railway.app`
   - **Environments:** Production (and Preview/Development if needed)
4. Click **Save**
5. Redeploy your application

## Verification

After deployment:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try uploading a file
4. Verify the request goes to `https://likes-pdf-backend-production-668e.up.railway.app`
5. Should NOT see `127.0.0.1` or `localhost` requests

## Changes from Previous Attempts

This permanent solution:
- Removes all fallback logics that tried to guess the API URL
- Requires explicit environment variable configuration
- Production environment enforces non-localhost API URLs
- Development environment still supports localhost for local testing
