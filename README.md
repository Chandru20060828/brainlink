# ⚡ BrainLink — Full Stack Application

A complete MERN stack web application implementing all 6 feature tasks with MongoDB, Cron Jobs, and mobile responsiveness.

---

## 🚀 Features Implemented

### 1. 💎 Subscription Plans (Task 1)
- **Free**: 1 question/day
- **Bronze** (₹100/month): 5 questions/day
- **Silver** (₹300/month): 10 questions/day
- **Gold** (₹1,000/month): Unlimited questions/day
- Razorpay payment gateway integration (with demo mode)
- Invoice email sent automatically on successful payment
- **Payment time restriction**: Only allowed between **10:00 AM – 11:00 AM IST**
- Subscription expiry tracked; auto-downgrade via cron job

### 2. 🔑 Forgot Password (Task 2)
- Dedicated `/forgot-password` route and page
- Accepts email or phone number
- **Once-per-day limit** with warning: "You can use this option only one time per day."
- Auto-generates a password with **only uppercase and lowercase letters** (no numbers/special chars)
- New password emailed to the user immediately

### 3. 🌐 Social Space (Task 3)
- Public feed with photo/video upload (multer)
- Like, comment, and share posts
- **Friend-based posting limits:**
  - 0 friends → cannot post
  - 1 friend → 1 post/day
  - 2 friends → 2 posts/day
  - >10 friends → unlimited posts/day

### 4. 🌍 Multi-Language Support (Task 4)
- 6 languages: English, Spanish, Hindi, Portuguese, Chinese, French
- **French** → OTP sent to **email** before switching
- **All other languages** → OTP sent to **mobile** before switching
- i18next integration for full UI translation

### 5. 🔐 Login Security & History (Task 5)
- Tracks: browser, OS, device type, IP address
- Login history visible on profile page
- **Chrome**: requires OTP email verification on every login
- **Microsoft browser**: direct access, no extra verification
- **Mobile device**: login restricted to **10:00 AM – 1:00 PM IST** only

### 6. ⭐ Points & Rewards (Task 6)
- Answer a question → **+5 points**
- Answer reaches 5 upvotes → **+5 bonus points**
- Answer downvoted → **-2 points**
- Answer deleted → **-5 points**
- Points visible on profile
- **Transfer points** to other users (requires >10 points)
- Search users by name or email for transfer

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, react-i18next, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Payments | Razorpay |
| Email | Nodemailer (Gmail SMTP) |
| File Upload | Multer |
| Cron Jobs | node-cron |
| Styling | Custom CSS (mobile-responsive) |

---

## ⏰ Cron Jobs (backend/cron.js)

| Job | Schedule | Description |
|-----|----------|-------------|
| Daily Reset | Midnight IST (18:30 UTC) | Resets question/post counters for all users |
| Subscription Check | Every hour | Downgrades expired paid plans to Free |
| OTP Cleanup | Every 15 minutes | Removes expired OTPs from database |

---

## 📦 Project Structure

```
brainlink/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema with all feature fields
│   │   ├── Question.js      # Q&A with answers, votes
│   │   ├── Post.js          # Social posts with media
│   │   └── Payment.js       # Payment/invoice records
│   ├── routes/
│   │   ├── auth.js          # Login, register, OTP, forgot-password, language
│   │   ├── questions.js     # CRUD + answers + voting + points
│   │   ├── posts.js         # Social posts + likes + comments + shares
│   │   ├── payment.js       # Razorpay order + verify + history
│   │   └── users.js         # Search + friends + point transfer
│   ├── middleware/
│   │   └── auth.js          # JWT middleware
│   ├── utils/
│   │   ├── email.js         # Nodemailer: OTP, invoice, password emails
│   │   └── helpers.js       # OTP gen, password gen, time checks, UA parser
│   ├── cron.js              # All 3 cron jobs
│   ├── server.js            # Express app entry point
│   ├── .env.example         # Environment variable template
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html       # Includes Razorpay checkout script
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.js    # Responsive navbar with hamburger menu
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Login.js          # Chrome OTP + Microsoft flow
│   │   │   ├── Register.js
│   │   │   ├── ForgotPassword.js # Once/day + letter-only password
│   │   │   ├── Questions.js      # Q&A list with subscription limits
│   │   │   ├── QuestionDetail.js # Answers + voting + points
│   │   │   ├── Social.js         # Friend-based post limits + media
│   │   │   ├── Subscription.js   # Plans + Razorpay + time restriction
│   │   │   └── Profile.js        # Points, friends, language, history, payments
│   │   ├── utils/
│   │   │   ├── api.js       # Axios instance with JWT interceptor
│   │   │   └── i18n.js      # 6-language translations
│   │   ├── index.css        # Mobile-responsive global styles
│   │   ├── index.js
│   │   └── App.js           # Routes + AuthProvider
│   └── package.json
└── package.json             # Root scripts
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Gmail account (for email)
- Razorpay account (optional; demo mode works without it)

### Step 1: Clone & Install

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Step 2: Configure Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/brainlink
JWT_SECRET=your_super_secret_key_here

# Gmail SMTP (enable "App Password" in Google Account)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

# Razorpay (leave blank for demo mode)
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx

CLIENT_URL=http://localhost:3000
```

### Step 3: Run

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# App opens at http://localhost:3000
```

---

## 🔧 Demo Mode

If Razorpay keys are not configured, payment runs in **demo mode**:
- No real payment is processed
- Subscription is activated immediately
- Invoice email is still sent

---

## 📱 Mobile Responsiveness

- Hamburger menu on mobile (`< 768px`)
- Single-column grid layouts on small screens
- Touch-friendly button sizes
- Responsive form layouts

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login (Chrome OTP flow) |
| POST | /api/auth/verify-login-otp | Verify Chrome login OTP |
| POST | /api/auth/forgot-password | Reset password (once/day) |
| GET | /api/auth/profile | Get current user profile |
| POST | /api/auth/request-language-change | Send language change OTP |
| POST | /api/auth/verify-language-change | Verify language OTP |
| GET | /api/auth/login-history | Get login history |
| GET | /api/questions | List all questions |
| POST | /api/questions | Post question (plan-limited) |
| GET | /api/questions/:id | Get question + answers |
| POST | /api/questions/:id/answers | Post answer (+5 pts) |
| POST | /api/questions/:qId/answers/:aId/upvote | Upvote answer |
| POST | /api/questions/:qId/answers/:aId/downvote | Downvote answer |
| DELETE | /api/questions/:qId/answers/:aId | Delete answer (-5 pts) |
| GET | /api/posts | Get all social posts |
| POST | /api/posts | Create post (friend-limited) |
| POST | /api/posts/:id/like | Like/unlike post |
| POST | /api/posts/:id/comment | Comment on post |
| POST | /api/posts/:id/share | Share post |
| POST | /api/payment/create-order | Create Razorpay order |
| POST | /api/payment/verify | Verify payment + activate plan |
| GET | /api/payment/history | Get payment history |
| GET | /api/users/search | Search users |
| POST | /api/users/:id/friend-request | Send friend request |
| POST | /api/users/:id/accept-friend | Accept friend request |
| POST | /api/users/transfer-points | Transfer points |
| GET | /api/users/me/friend-requests | Get pending requests |
