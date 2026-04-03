# Vercel Deployment Guide

## Permanent Setup

The frontend now uses a same-origin API proxy in production. That means the browser calls `/api/*` on Vercel, and Next.js rewrites those requests to the Railway backend.

### What you need

1. Deploy the frontend to Vercel.
2. Deploy the backend to Railway.
3. Redeploy the frontend after changes to `frontend/next.config.js`.

## How it works

- Production on Vercel: `/api/*` -> `https://likes-pdf-backend-production-668e.up.railway.app/api/*`
- Local development: `/api/*` -> `http://127.0.0.1:8000/api/*`

## Important

- You do **not** need `NEXT_PUBLIC_API_URL` for production uploads anymore.
- Do **not** point production uploads to `localhost`.
- The proxy must be included in the deployed frontend build.

## Verification

After deployment:

1. Open DevTools.
2. Upload a file from the merge page.
3. Confirm the request goes to the Vercel origin first, then proxies to Railway.
4. You should no longer see `127.0.0.1:8000` in production network requests.
