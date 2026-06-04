# BrainLink Deployment Guide

## Fix Summary (applied to this zip)
1. **CORS multi-origin support** — backend now reads `CLIENT_URL` as a comma-separated list so both localhost and Vercel URLs work.
2. **Frontend API URL** — `api.js` now uses `REACT_APP_API_URL` env var in production instead of hardcoded `localhost:5000`.
3. **Removed proxy from frontend `package.json`** — the `"proxy"` key only works with CRA dev server, not on Vercel.
4. **Added `vercel.json`** — fixes page-refresh 404s for React Router routes on Vercel.
5. **Added `favicon.ico`** — eliminates the 404 favicon error.
6. **Fixed `autocomplete` attribute** — eliminates the browser DOM warning on the password input.
7. **Fixed React Router warnings** — added `v7_startTransition` and `v7_relativeSplatPath` future flags.

---

## Backend — Deploy to Render (free tier)

1. Push the `backend/` folder to GitHub (or the whole repo).
2. Create a new **Web Service** on [render.com](https://render.com).
3. Set **Root Directory** → `backend`
4. Set **Build Command** → `npm install`
5. Set **Start Command** → `npm start`
6. Add these **Environment Variables** in Render dashboard:

| Key | Value |
|-----|-------|
| `PORT` | `5000` (Render sets this automatically) |
| `MONGO_URI` | `mongodb+srv://...` (MongoDB Atlas connection string) |
| `JWT_SECRET` | any long random string |
| `CLIENT_URL` | `https://your-frontend.vercel.app` |
| `EMAIL_USER` | your Gmail address |
| `EMAIL_PASS` | your Gmail app password |
| `RAZORPAY_KEY_ID` | from Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | from Razorpay dashboard |
| `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | from Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |

7. After deploy, copy your Render URL e.g. `https://brainlink-backend.onrender.com`

---

## Frontend — Deploy to Vercel

1. Push the `frontend/` folder to GitHub.
2. Import project on [vercel.com](https://vercel.com).
3. Set **Root Directory** → `frontend`
4. Add this **Environment Variable** in Vercel dashboard:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://brainlink-backend.onrender.com` (your Render URL, no trailing slash) |

5. Deploy. All routes will work correctly thanks to `vercel.json`.

---

## Local Development

```bash
# 1. Setup env files
npm run setup

# 2. Fill in backend/.env with your credentials

# 3. Install dependencies
npm run install:all

# 4. Run backend (terminal 1)
npm run dev:backend

# 5. Run frontend (terminal 2) — proxy in dev handled by CRA
npm run dev:frontend
```
