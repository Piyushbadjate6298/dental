# Shital Dental Services — Dental Laboratory Inquiry & Prescription Desk

A production-grade dental laboratory customer inquiry, prescription management, and anatomical odontogram platform. Built with React, Vite, Node.js REST API, and Neon PostgreSQL, designed for deployment on Render (Backend Web Service) and Vercel (Frontend SPA).

---

## 1. Project Architecture

```
shital-dental-services/
├── frontend/                     # React 18 + Vite Frontend SPA
│   ├── src/
│   │   ├── components/           # UI Components
│   │   │   ├── DentalOdontogram.jsx        # Anatomical 32-tooth odontogram (Arch & Grid views)
│   │   │   ├── ToothIllustration.jsx      # Vector illustrations for 8 tooth types
│   │   │   ├── SelectedTeethSummary.jsx    # Grouped prescription summary with chips
│   │   │   ├── InquiryReportRenderer.jsx   # Live preview dialog for generated report
│   │   │   ├── ToothPicker.jsx             # Unified picker component
│   │   │   ├── InquiryForm.jsx             # Inquiry submission workflow
│   │   │   ├── HistoryPage.jsx             # Searchable inquiry records
│   │   │   ├── DoctorsPage.jsx             # Doctor directory management
│   │   │   ├── SettingsPage.jsx            # Lab details & WhatsApp settings
│   │   │   ├── Dashboard.jsx               # Metric summary cards
│   │   │   └── Login.jsx                   # Admin authentication screen
│   │   ├── services/
│   │   │   └── api.js                      # API client supporting VITE_API_URL & credentials
│   │   ├── utils/
│   │   │   ├── toothData.js                # Tooth paths, Palmer notation & quadrant grouping
│   │   │   └── dental.js                   # Canvas prescription generator & WhatsApp sharing
│   │   ├── main.jsx                        # Application shell & real-time DB synchronization
│   │   └── styles.css                      # Responsive dental design system
│   ├── vite.config.js                      # Vite config with /api reverse proxy
│   └── package.json                        # Frontend dependencies
│
├── backend/                      # Production Node.js REST API (for Render Web Service)
│   ├── src/
│   │   ├── controllers/          # Request handlers (auth, doctors, inquiries, settings, dashboard)
│   │   ├── routes/               # Express REST routing
│   │   ├── middleware/           # JWT verification, CORS, Helmet, Rate limiting
│   │   ├── services/             # Business logic & SQL parameterized queries
│   │   ├── database/             # Neon PostgreSQL pooler & query runner
│   │   ├── validators/           # Input validation schemas
│   │   ├── utils/                # Response helpers, formatters, logger
│   │   ├── app.js                # Express app configuration
│   │   └── server.js             # HTTP server entry point (port 5000 / $PORT)
│   ├── migrations/
│   │   └── 001_initial_schema.sql# Safe, idempotent database schema
│   ├── scripts/
│   │   ├── migrate.js            # Database migration CLI runner
│   │   ├── setup-admin.js        # Admin credentials setup script
│   │   └── test-backend.js       # 40-point automated backend test suite
│   ├── package.json              # Backend dependencies
│   └── .env.example              # Backend environment template
│
├── scripts/
│   ├── dev.js                    # Concurrent local development runner
│   └── test-verification.mjs     # 65-point odontogram & numbering test suite
├── render.yaml                   # Render Blueprint deployment specification
├── vercel.json                   # Vercel deployment & rewrite configuration
├── .env.example                  # Root environment template
└── README.md                     # Complete documentation & deployment guide
```

---

## 2. Technology Stack

- **Frontend:** React 18, Vite 6, Lucide React, HTML5 Canvas 2D vector rendering, CSS3 variables.
- **Backend:** Node.js (ES Modules), Express 4, Helmet security headers, CORS with credentials, Cookie-Parser, JSON Web Tokens (JWT), BcryptJS password hashing.
- **Database:** Neon Serverless PostgreSQL with connection pooling (`pg.Pool` & `@neondatabase/serverless`).
- **Hosting:**
  - **Backend:** Render (Node.js Web Service with automatic migrations and `/api/health` monitoring).
  - **Frontend:** Vercel (Fast Global Edge CDN configured with `VITE_API_URL`).

---

## 3. Database Schema (Neon PostgreSQL)

### A. `admin_users`
Stores administrative user accounts with bcrypt-hashed passwords.
- `id` (VARCHAR(36) PRIMARY KEY)
- `username` (VARCHAR(100) UNIQUE NOT NULL)
- `password_hash` (VARCHAR(255) NOT NULL)
- `role` (VARCHAR(50) DEFAULT 'admin' NOT NULL)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ DEFAULT NOW())
- `last_login` (TIMESTAMPTZ)

### B. `doctors`
Maintains the laboratory's regular doctor directory.
- `id` (VARCHAR(36) PRIMARY KEY)
- `doctor_name` (VARCHAR(255) UNIQUE NOT NULL)
- `is_active` (BOOLEAN DEFAULT TRUE NOT NULL)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ DEFAULT NOW())

### C. `inquiries`
Stores customer dental laboratory inquiries and prescriptions (strictly non-billing).
- `id` (VARCHAR(36) PRIMARY KEY)
- `inquiry_number` (INTEGER UNIQUE NOT NULL)
- `inquiry_date` (VARCHAR(10) NOT NULL, format: `YYYY-MM-DD`)
- `doctor_id` (VARCHAR(36) REFERENCES doctors(id) ON DELETE SET NULL)
- `doctor_name_snapshot` (VARCHAR(255) NOT NULL)
- `patient_name` (VARCHAR(255) NOT NULL)
- `tooth_shade` (VARCHAR(50))
- `upper_jaw_teeth` (JSONB DEFAULT '[]'::jsonb NOT NULL)
- `lower_jaw_teeth` (JSONB DEFAULT '[]'::jsonb NOT NULL)
- `lab_instructions` (JSONB DEFAULT '[]'::jsonb NOT NULL)
- `trial_requirements` (JSONB DEFAULT '[]'::jsonb NOT NULL)
- `note` (TEXT)
- `status` (VARCHAR(50) DEFAULT 'Draft' NOT NULL)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ DEFAULT NOW())

### D. `app_settings`
Stores laboratory business details and WhatsApp destination number.
- `id` (VARCHAR(36) PRIMARY KEY)
- `setting_key` (VARCHAR(100) UNIQUE NOT NULL)
- `setting_value` (TEXT NOT NULL)
- `updated_at` (TIMESTAMPTZ DEFAULT NOW())

### E. `audit_logs`
Tracks audit events (inquiry creation, updates, deletes) for compliance.
- `id` (VARCHAR(36) PRIMARY KEY)
- `action` (VARCHAR(100) NOT NULL)
- `entity_type` (VARCHAR(50) NOT NULL)
- `entity_id` (VARCHAR(255))
- `details` (JSONB)
- `performed_by` (VARCHAR(100) NOT NULL)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())

---

## 4. Tooth Chart & Odontogram System

The application strictly implements standard Palmer notation matching dental paper prescriptions:

- **Upper Jaw (Maxillary):** `8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8`
- **Lower Jaw (Mandibular):** `8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8`
- **Viewer Orientation:**
  - Viewer's Left = Patient's Right (`8` down to `1` towards the midline).
  - Viewer's Right = Patient's Left (`1` up to `8` away from the midline).
  - Midline separation clearly marked between `1` and `1`.
  - Occlusal plane divider between Upper and Lower jaws.

Each tooth type has an anatomically distinct vector silhouette:
1. **Central Incisor (#1):** Broad shovel/chisel cutting edge.
2. **Lateral Incisor (#2):** Slender with rounded distal angle.
3. **Canine (#3):** Prominent pointed cusp spearhead shape.
4. **First Premolar (#4):** Bicuspid with dual cusps and central groove.
5. **Second Premolar (#5):** Oval contour with crescentic/Y-groove pattern.
6. **First Molar (#6):** Large rhomboid/trapezoidal multi-cusp table with oblique ridges.
7. **Second Molar (#7):** 4 distinct cusps with cruciform (`+`) cross groove.
8. **Third Molar (#8):** Rounded heart-shaped wisdom crown.

The exact same anatomical odontogram with selected tooth highlights is embedded in the high-resolution generated prescription image sent to the laboratory via WhatsApp.

---

## 5. Local Setup & Running

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Step 1: Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
npm --prefix backend install

# Install frontend dependencies
npm --prefix frontend install
```

### Step 2: Configure Environment Variables
Create `backend/.env` with your Neon database connection string:
```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@YOUR_ENDPOINT-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require
NODE_ENV=development
PORT=5000
JWT_SECRET=your_secure_jwt_secret_key_at_least_32_characters
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:5173
```

### Step 3: Run Database Migrations
```bash
npm run migrate
```

### Step 4: Start the Full-Stack Dev Server
```bash
npm run dev
```
- **Frontend App:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health
- **Default Login:** Username `admin` | Password `admin123`

---

## 6. Render Backend Deployment Guide

Deploy your backend as a **Web Service** on [Render](https://render.com):

1. **Sign in to Render** and click **New +** > **Web Service**.
2. **Connect your GitHub Repository**: Select `Piyushbadjate6298/dental`.
3. **Configure the Web Service Settings**:
   - **Name:** `shital-dental-backend`
   - **Region:** Ohio (US East) or your preferred region close to Neon.
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
     *(This installs dependencies and automatically runs migrations `001_initial_schema.sql` on Neon).*
   - **Start Command:** `npm start`
   - **Plan:** Free
4. **Configure Environment Variables** in Render:
   | Variable | Value | Description |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://neondb_owner:...-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require` | Your Neon pooled connection string |
   | `NODE_ENV` | `production` | Production mode |
   | `JWT_SECRET` | *Click "Generate" or enter random 32+ char key* | Secret for signing tokens |
   | `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` | Your Vercel frontend URL |
   | `ADMIN_USERNAME` | `admin` | Administrator username |
   | `ADMIN_PASSWORD` | `YourSecurePassword2026!` | Initial administrator password |
5. **Set Health Check Path:**
   - Under **Advanced**, set **Health Check Path** to: `/api/health`
6. Click **Create Web Service**.
7. Once deployed, note down your Render backend URL (e.g. `https://shital-dental-backend.onrender.com`).

---

## 7. Vercel Frontend Deployment Guide

Your frontend is hosted on [Vercel](https://vercel.com):

1. **Go to your Vercel Project Dashboard**.
2. Navigate to **Settings** > **Environment Variables**.
3. Add the following environment variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend.onrender.com/api` (or `https://your-backend.onrender.com`)
   - **Environments:** Production, Preview, Development (all checked).
4. Click **Save**.
5. Trigger a redeploy on Vercel (**Deployments** > **...** > **Redeploy**).

Now your Vercel frontend will automatically send all API calls (Authentication, Doctors, Inquiries, Settings, Dashboard) directly to your Render backend connected to Neon PostgreSQL!

---

## 8. API Endpoints Reference

### Public & Health Endpoints
- `GET /api/health` — Verifies server availability and live database connectivity.

### Authentication Endpoints
- `POST /api/auth/login` — Authenticates admin (`{ username, password }`), returns JWT and HttpOnly cookie.
- `GET /api/auth/me` — Returns the authenticated admin profile.
- `PUT /api/auth/change-password` — Updates admin password (`{ currentPassword, newPassword }`).
- `POST /api/auth/logout` — Clears authentication cookie/session.

### Doctor Directory Endpoints (Protected)
- `GET /api/doctors` — Retrieves active doctors from Neon.
- `POST /api/doctors` — Creates a new doctor record (`{ doctor_name }`).
- `PUT /api/doctors/:id` — Renames or activates/deactivates a doctor.
- `DELETE /api/doctors/:id` — Removes doctor from directory.

### Inquiry Management Endpoints (Protected)
- `GET /api/inquiries` — Retrieves inquiries with optional `?search=`, `?status=`, `?page=`, `?limit=`.
- `GET /api/inquiries/:id` — Retrieves a single inquiry by ID.
- `POST /api/inquiries` — Creates a new inquiry with tooth selections and auto-increments inquiry number.
- `PUT /api/inquiries/:id` — Updates existing inquiry details.
- `DELETE /api/inquiries/:id` — Deletes inquiry record.

### Application Settings (Protected)
- `GET /api/settings` — Returns WhatsApp number, lab name, address, phone.
- `PUT /api/settings` — Updates settings in Neon PostgreSQL.

### Dashboard (Protected)
- `GET /api/dashboard/stats` — Aggregates total inquiries, today's inquiries, patients, and recent records.

### Migration Utility (Protected)
- `POST /api/migrate/import-local` — Synchronizes legacy browser records to Neon PostgreSQL without overwriting.

---

## 9. Verification & Test Suites

The project includes two comprehensive test suites:

```bash
# 1. Run full 40-point backend database test suite against Neon:
node backend/scripts/test-backend.js

# 2. Run 65-point odontogram & Palmer notation test suite:
node scripts/test-verification.mjs

# 3. Test production frontend build:
npm run build
```

Both test suites pass with 100% success rate (0 failures).
