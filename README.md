# ARIA — AI HR Platform

> AI-powered HR Director that interviews candidates, evaluates performance, and assigns work — automatically, at scale.

---

## Architecture

```
aria/
├── backend/              Node.js + Express API server
│   ├── src/
│   │   ├── server.js     Entry point
│   │   ├── config.js     Firebase Admin + Anthropic clients
│   │   ├── middleware/
│   │   │   └── auth.js   JWT + Firebase token verification
│   │   ├── routes/
│   │   │   ├── auth.js       Signup, login, /me
│   │   │   ├── jobs.js       Job posting CRUD
│   │   │   ├── interview.js  AI interview engine (Claude)
│   │   │   ├── evaluation.js Auto-evaluation after interview
│   │   │   ├── assignment.js Work assignment generation
│   │   │   ├── candidates.js Candidate management
│   │   │   ├── reports.js    Pipeline analytics
│   │   │   ├── billing.js    Stripe subscriptions
│   │   │   ├── companies.js  Company profile
│   │   │   └── email.js      Invite emails
│   │   ├── services/
│   │   │   └── email.js      Nodemailer service
│   │   └── jobs/
│   │       └── queues.js     Bull + Redis background jobs
│   └── Dockerfile
│
├── frontend/             React + Vite
│   ├── src/
│   │   ├── lib/api.js         Axios client (all API calls)
│   │   ├── store/useStore.js  Zustand auth + toast state
│   │   ├── components/
│   │   │   ├── ui.jsx         Reusable UI atoms
│   │   │   └── AppShell.jsx   Sidebar layout
│   │   └── pages/
│   │       ├── Landing.jsx    Marketing page
│   │       ├── Login.jsx      Authentication
│   │       ├── Signup.jsx     Registration
│   │       ├── Dashboard.jsx  Overview stats
│   │       ├── Jobs.jsx       Job posting management
│   │       ├── Candidates.jsx Candidate list
│   │       ├── Candidate.jsx  Detail + eval + assignment
│   │       ├── Reports.jsx    Analytics
│   │       ├── Settings.jsx   Company settings
│   │       └── Interview.jsx  Candidate-facing portal
│   └── Dockerfile
│
├── firebase/
│   ├── firestore.rules        Security rules
│   └── firestore.indexes.json Compound query indexes
├── scripts/
│   └── seed.js               Demo data seeder
└── docker-compose.yml        Local dev stack
```

---

## Quick Start (Local)

### Prerequisites
- Node.js 20+
- Redis (or Docker)
- Firebase project
- Anthropic API key

### 1. Clone and install

```bash
git clone https://github.com/yourname/aria-hr.git
cd aria-hr

# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure environment

Edit `backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_PROJECT_ID=your-project-id
JWT_SECRET=your-long-random-secret
REDIS_URL=redis://localhost:6379
EMAIL_USER=your@gmail.com
EMAIL_APP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:4000/api
```

### 3. Set up Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and deploy rules + indexes
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Seed demo data (optional)

```bash
cd scripts
node seed.js
```

### 5. Start development servers

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Visit: **http://localhost:5173**

### Alternative: Docker Compose

```bash
docker-compose up
```

---

## Deployment

### Backend → Railway

```bash
cd backend
npm install -g @railway/cli
railway login
railway init
railway add redis          # Adds Redis plugin
railway up
```

Set environment variables in Railway dashboard (copy from `.env`).

### Frontend → Vercel

```bash
cd frontend
npm install -g vercel
vercel --prod
```

Set `VITE_API_URL` to your Railway backend URL.

### Firebase

```bash
firebase deploy --only firestore
```

### Custom Domain

1. Buy domain on Namecheap (~$12/year)
2. Add to Vercel: `aria-hr.com` → frontend
3. Add to Railway: `api.aria-hr.com` → backend
4. Update `FRONTEND_URL` in backend env
5. Update `VITE_API_URL` in Vercel env vars

---

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Your Claude API key |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ | Firebase service account JSON (stringified) |
| `FIREBASE_PROJECT_ID` | ✅ | Your Firebase project ID |
| `JWT_SECRET` | ✅ | Long random string for JWT signing |
| `FRONTEND_URL` | ✅ | Frontend origin for CORS |
| `REDIS_URL` | ✅ | Redis connection string |
| `EMAIL_USER` | ✅ | Gmail address for sending emails |
| `EMAIL_APP_PASSWORD` | ✅ | Gmail App Password (not your main password) |
| `STRIPE_SECRET_KEY` | Optional | For billing features |
| `STRIPE_WEBHOOK_SECRET` | Optional | For Stripe webhooks |
| `PORT` | Optional | Defaults to 4000 |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API URL e.g. `https://api.aria-hr.com/api` |
| `VITE_APP_URL` | Optional | Frontend URL (for email links) |

---

## API Reference

### Public Endpoints (no auth)

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create company account |
| POST | `/api/auth/login`  | Sign in, get JWT |
| POST | `/api/interview/start` | Start candidate interview |
| POST | `/api/interview/message` | Send interview message |
| GET  | `/api/jobs/token/:token` | Get job by candidate token |
| GET  | `/api/billing/plans` | Get pricing plans |
| GET  | `/health` | Health check |

### Protected Endpoints (JWT required)

| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/me` | Current user info |
| GET/POST/PATCH/DELETE | `/api/jobs` | Job CRUD |
| GET/PATCH/DELETE | `/api/candidates` | Candidate management |
| GET | `/api/candidates/:id` | Full candidate detail |
| POST | `/api/evaluation/run` | Run manual evaluation |
| POST | `/api/assignment/generate` | Generate work assignment |
| GET | `/api/reports/summary` | Pipeline analytics |
| GET/PATCH | `/api/companies/me` | Company profile |
| POST | `/api/email/invite` | Send candidate invite |
| POST | `/api/billing/create-session` | Stripe checkout |

---

## Testing

```bash
cd backend
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test -- --watch         # Watch mode
```

---

## Monthly Cost (Production)

| Service | Cost |
|---|---|
| Vercel (frontend) | Free |
| Railway (backend + Redis) | ~$10/month |
| Firebase Firestore | Free up to 50k reads/day |
| Anthropic API | ~$0.003/interview |
| SendGrid (emails) | Free up to 100/day |
| Domain | ~$1/month |
| **Total** | **~$11–15/month** |

Break-even: **1 paying customer** on the Starter plan ($29/mo).

---

## License

MIT — built with ❤️ using Claude by Anthropic.
