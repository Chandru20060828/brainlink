# BrainLink — Deployment Guide
## Backend → Render | Frontend → Vercel | Email → Brevo SMTP

---

## WHY BREVO INSTEAD OF GMAIL?

Render.com blocks outbound SMTP on ports 465 and 587 to Gmail servers.
Brevo's SMTP relay (`smtp-relay.brevo.com:587`) is explicitly allowed on Render.
Free tier: **300 emails/day**, no credit card required.

---

## STEP 0 — Set Up Brevo (Email)

1. Sign up free at https://app.brevo.com
2. Go to **Account → SMTP & API → SMTP** tab
3. Note your **Login** (your Brevo account email) → this is `BREVO_SMTP_USER`
4. Click **Generate a new SMTP key** → copy it → this is `BREVO_SMTP_KEY`
5. Go to **Senders & IPs → Senders → Add a sender**
6. Add and verify the email address you want to send FROM → this is `BREVO_FROM_EMAIL`

---

## STEP 1 — Prepare MongoDB Atlas

1. Go to https://cloud.mongodb.com → Create free cluster
2. Create a database user (username + password)
3. Network Access → Add IP: `0.0.0.0/0` (required for Render)
4. Get connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/brainlink?retryWrites=true&w=majority
   ```

---

## STEP 2 — Deploy Backend to Render

1. Push project to GitHub
2. Render → New → Web Service → Connect repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

4. Add these Environment Variables:

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `MONGO_URI` | Your MongoDB Atlas URI |
| `JWT_SECRET` | Any 32+ char random string |
| `CLIENT_URL` | `https://your-app.vercel.app` (add after Vercel deploy) |
| `BREVO_SMTP_USER` | Your Brevo account email |
| `BREVO_SMTP_KEY` | SMTP key from Brevo dashboard |
| `BREVO_FROM_NAME` | `BrainLink` |
| `BREVO_FROM_EMAIL` | Your verified Brevo sender email |
| `RAZORPAY_KEY_ID` | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | From Razorpay dashboard |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |

5. Deploy → Copy Render URL: `https://brainlink-backend.onrender.com`

---

## STEP 3 — Deploy Frontend to Vercel

1. Vercel → New Project → Import GitHub repo
2. **Root Directory:** `frontend`
3. Framework: Create React App (auto-detected)
4. Add environment variable:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://brainlink-backend.onrender.com/api` |

5. Deploy → Copy Vercel URL: `https://brainlink.vercel.app`

---

## STEP 4 — Update CORS on Render

After Vercel deploys:
- Render → Environment → `CLIENT_URL` → paste your Vercel URL → Save
- Render auto-redeploys

---

## STEP 5 — Verify

- `https://brainlink-backend.onrender.com/api/health` → `{"status":"ok"}`
- Register a user → check email arrives via Brevo
- OTP login flow → OTP email delivered
- Subscription payment → invoice email delivered

---

## Files Changed for Brevo Migration

| File | What Changed |
|------|-------------|
| `backend/utils/email.js` | SMTP host changed from `smtp.gmail.com` to `smtp-relay.brevo.com`; auth uses `BREVO_SMTP_USER` + `BREVO_SMTP_KEY`; all email HTML content unchanged |
| `backend/.env.example` | Replaced `EMAIL_HOST/PORT/USER/PASS` with `BREVO_SMTP_USER/KEY/FROM_NAME/FROM_EMAIL` |
| `backend/.env` | Sanitized (credentials removed) |
| `DEPLOYMENT.md` | Updated with Brevo setup steps |

**No other files changed. All features, routes, logic, and UI are identical.**
