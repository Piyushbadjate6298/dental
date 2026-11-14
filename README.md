# Shital Dental Services — Dental Laboratory Inquiry & Prescription Desk

A production-ready dental laboratory customer inquiry and prescription management platform built with React, Vite, Node.js REST API, and Neon PostgreSQL, designed for high-reliability serverless deployment on Vercel.

---

## 1. Project Architecture

The application is structured into two clearly separated modules:

```
shital-dental-services/
├── frontend/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/           # UI Components (Dashboard, InquiryForm, History, Doctors, Settings)
│   │   ├── services/             # API Client (auth, inquiries, doctors, settings)
│   │   ├── utils/                # Dental arch data, WhatsApp formatting, canvas report generator
│   │   ├── main.jsx              # Application Shell & State Management
│   │   └── styles.css            # Responsive, Mobile-First Design System
│   ├── public/                   # Static assets
│   ├── index.html                # HTML entry point
│   ├── vite.config.js            # Vite configuration with API proxy
│   └── package.json              # Frontend package configuration
│
├── backend/                      # Node.js Serverless-Ready Backend
│   ├── api/
│   │   └── index.js              # Serverless entry point for Vercel
│   ├── src/
│   │   ├── controllers/          # Route handlers (auth, doctors, inquiries, settings, dashboard)
│   │   ├── routes/               # Express REST API routes
│   │   ├── middleware/           # Auth (JWT/Cookie), Rate Limiting, Validation, Error Handling
│   │   ├── services/             # Business logic & SQL queries
│   │   ├── validators/           # Request body validation schemas
│   │   ├── database/             # Neon connection pool & query runner
│   │   ├── utils/                # Response helpers, logger, data mappers
│   │   ├── app.js                # Express app setup (CORS, Helmet, cookies, routes)
│   │   └── server.js             # Standalone local dev server
│   ├── migrations/
│   │   └── 001_initial_schema.sql # Versioned PostgreSQL migration
│   ├── scripts/
│   │   ├── migrate.js            # Database migration CLI runner
│   │   ├── setup-admin.js        # Admin account creation script
│   │   └── test-backend.js       # Automated 40-point backend test suite
│   └── package.json              # Backend package configuration
│
├── api/
│   └── index.js                  # Root Vercel serverless function router
├── vercel.json                   # Vercel deployment configuration
├── .env.example                  # Environment template
├── package.json                  # Root orchestration package
└── README.md                     # Documentation
```

---

## 2. Technology Stack

- **Frontend:** React 18, Vite 6, Lucide React, HTML5 Canvas API (graphic inquiry reports), CSS3 Custom Properties.
- **Backend:** Node.js (ES Modules), Express 4, Helmet, CORS, Cookie-Parser, JSON Web Tokens (JWT), BcryptJS.
- **Database:** Neon PostgreSQL with `@neondatabase/serverless` and `pg`.
- **Deployment:** Vercel (Frontend SPA + Serverless API Functions) & Neon (Serverless Cloud PostgreSQL).

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
Stores customer dental laboratory inquiries and prescriptions (exclusively non-billing).
- `id` (VARCHAR(36) PRIMARY KEY)
- `inquiry_number` (INTEGER UNIQUE NOT NULL)
- `inquiry_date` (VARCHAR(10) NOT NULL, format: `YYYY-MM-DD`)
- `doctor_id` (VARCHAR(36) REFERENCES doctors(id) ON DELETE SET NULL)
- `doctor_name_snapshot` (VARCHAR(255) NOT NULL)
- `patient_name` (VARCHAR(255) NOT NULL)
- `tooth_shade` (VARCHAR(50))
- `upper_jaw_teeth` (JSONB NOT NULL)
- `lower_jaw_teeth` (JSONB NOT NULL)
- `lab_instructions` (JSONB NOT NULL)
- `trial_requirements` (JSONB NOT NULL)
- `note` (TEXT)
- `status` (VARCHAR(50) DEFAULT 'Draft' NOT NULL)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ DEFAULT NOW())

### D. `app_settings`
Configurable laboratory contact details and WhatsApp destination.
- `id` (VARCHAR(36) PRIMARY KEY)
- `setting_key` (VARCHAR(100) UNIQUE NOT NULL)
- `setting_value` (TEXT NOT NULL)
- `updated_at` (TIMESTAMPTZ DEFAULT NOW())

### E. `audit_logs`
Tracks administrative updates for auditability.
- `id` (VARCHAR(36) PRIMARY KEY)
- `action` (VARCHAR(100) NOT NULL)
- `entity_type` (VARCHAR(50) NOT NULL)
- `entity_id` (VARCHAR(255))
- `details` (JSONB)
- `performed_by` (VARCHAR(100) NOT NULL)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())

---

## 4. REST API Endpoints

### Authentication
- `POST /api/auth/login` — Sign in with username & password (rate-limited, returns JWT & sets HttpOnly cookie).
- `POST /api/auth/logout` — Invalidate session and clear cookie.
- `GET /api/auth/me` — Retrieve current authenticated admin profile *(Protected)*.
- `PUT /api/auth/change-password` — Change password *(Protected)*.

### Doctors
- `GET /api/doctors` — List all registered doctors (query `?active_only=true` for form dropdown).
- `GET /api/doctors/:id` — Get single doctor details.
- `POST /api/doctors` — Add a new doctor *(Protected)*.
- `PUT /api/doctors/:id` — Update doctor name or active state *(Protected)*.
- `DELETE /api/doctors/:id` — Deactivate / remove doctor *(Protected)*.

### Inquiries
- `GET /api/inquiries` — List inquiries with search, status filters, and pagination *(Protected)*.
- `GET /api/inquiries/:id` — View single inquiry *(Protected)*.
- `POST /api/inquiries` — Submit new inquiry (atomic reference number generation).
- `PUT /api/inquiries/:id` — Update inquiry record *(Protected)*.
- `DELETE /api/inquiries/:id` — Delete inquiry record *(Protected)*.

### Laboratory Settings
- `GET /api/settings` — Get lab details & WhatsApp destination number.
- `PUT /api/settings` — Update lab details & WhatsApp destination *(Protected)*.

### Dashboard & Analytics
- `GET /api/dashboard/stats` — Aggregate metrics: Total inquiries, today's inquiries, unique patients, sent inquiries *(Protected)*.

### Database Migration
- `POST /api/migrate/import-local` — Safely transfer legacy browser `localStorage` records into Neon database with duplicate protection *(Protected)*.

### Healthcheck
- `GET /api/health` — Check server status & database connection.

---

## 5. Local Development Setup

### Prerequisites
- Node.js 18 or newer
- npm 9 or newer

### Installation
```bash
# Clone or navigate to the project directory
cd "Shital Dental Service/Dental_services"

# Install root dependencies
npm install

# Install frontend dependencies
npm run build:frontend
```

### Environment Configuration
Create a `.env` file in the project root (and/or in `backend/`):
```ini
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@ShitalDental2026!
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

> **Note:** If `DATABASE_URL` is omitted during local development, the backend automatically operates in a memory-safe developer fallback mode.

### Running Locally
```bash
# Option A: Start both Backend (Port 5000) and Frontend (Port 5173) concurrently:
npm run dev

# Option B: Run backend and frontend separately:
# Terminal 1:
npm run dev:backend

# Terminal 2:
npm run dev:frontend
```

Open `http://localhost:5173` in your browser.

### Running Backend Automated Tests
```bash
node backend/scripts/test-backend.js
```

---

## 6. Neon PostgreSQL Database Setup

1. Log into your [Neon Console](https://console.neon.tech).
2. Create a new project named `shital-dental-services`.
3. In the Neon dashboard, navigate to **Dashboard** -> **Connection Details**.
4. Copy the connection string (with **Pooled connection** or direct connection).
5. Set `DATABASE_URL` in your `.env` file:
   ```ini
   DATABASE_URL=postgresql://neondb_owner:xxxx@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
6. Run the database migration script:
   ```bash
   npm run migrate
   ```
7. Verify table creation and initialize the admin account:
   ```bash
   npm run setup-admin
   ```

---

## 7. Vercel Deployment Instructions

### Deploying via Vercel CLI or Dashboard (Single Project)

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New...** -> **Project**.
3. Select your repository.
4. Framework Preset: **Vite** (detected automatically).
5. Root Directory: `./` (leave default).
6. Build and Output Settings:
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`
7. In **Environment Variables**, add:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `JWT_SECRET`: A secure random string (minimum 32 characters).
   - `ADMIN_USERNAME`: Desired administrator username (e.g., `admin`).
   - `ADMIN_PASSWORD`: Secure administrator password.
   - `NODE_ENV`: `production`
8. Click **Deploy**.

Vercel will build the React frontend into `frontend/dist` and deploy the REST API endpoints as Serverless Functions routed through `/api/*`.

---

## 8. Data Migration (Browser to Cloud)

If you have existing inquiries or doctors previously created in your browser's local storage:
1. Sign into the application on your browser.
2. Navigate to **Settings** in the sidebar.
3. Scroll to **Cloud database migration**.
4. Click **Start data migration**.
5. All local records are verified, deduplicated, and securely written into your Neon PostgreSQL database.
