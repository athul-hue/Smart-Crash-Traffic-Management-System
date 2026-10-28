# Smart Crash & Traffic Management System

> Full-stack local prototype: crash reporting, admin verification, live map markers, and dashboard statistics backed by **Flask + MySQL**.

---

## Architecture

```
Browser (localhost:3000)
         │
         │  fetch() — JSON
         ▼
Flask API (127.0.0.1:5000)
         │
         │  Parameterized SQL
         ▼
MySQL — database: smart_traffic
         │
         ├── crash_reports
         │       │
         │       ├── Pending  ──► Admin reviews
         │       ├── Verified ──► Map + Statistics
         │       └── Rejected ──► Hidden
```

---

## Quick Start (step by step)

### STEP 1 — Start MySQL (requires Administrator)

**Option A — Services panel:**
1. Press `Win` → type `Services` → Run as Administrator
2. Find **MYSQL80** → Right-click → **Start**

**Option B — Admin Command Prompt:**
```
net start MYSQL80
```

---

### STEP 2 — Create the database

Open **MySQL Workbench** (or any MySQL client) and run:

```sql
SOURCE C:/Users/abhin/.gemini/antigravity/scratch/smart-traffic-system/database/schema.sql;
```

Or paste the contents of [`database/schema.sql`](database/schema.sql) directly.

**Verify it worked:**
```sql
SHOW TABLES IN smart_traffic;
-- Should show: crash_reports
```

---

### STEP 3 — Configure credentials

Edit [`backend/.env`](backend/.env):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_traffic
```

*(Leave DB_PASSWORD blank if your MySQL root has no password)*

---

### STEP 4 — Start Flask backend

Open a terminal in the `backend/` folder:

```bash
cd C:\Users\abhin\.gemini\antigravity\scratch\smart-traffic-system\backend

# (Optional) Create virtual environment:
python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

Flask starts at: **http://127.0.0.1:5000**

**Test it:**
```
http://127.0.0.1:5000
```
Expected:
```json
{"message": "Smart Crash & Traffic Management System backend is running", "status": "ok"}
```

---

### STEP 5 — Start the frontend

The frontend server is already running on port 3000. If it stopped:

```bash
cd C:\Users\abhin\.gemini\antigravity\scratch\smart-traffic-system
python -m http.server 3000
```

Open: **http://localhost:3000**

---

## Test Procedure

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Open `http://127.0.0.1:5000` | JSON health message |
| 2 | Open `http://127.0.0.1:5000/api/crash-reports` | `{"success":true,"count":0,"reports":[]}` |
| 3 | Open `http://localhost:3000/#report-crash` | Report Crash form |
| 4 | Fill and submit form | Success banner with `Report ID: CR-0001` |
| 5 | MySQL: `SELECT * FROM crash_reports;` | Submitted row appears |
| 6 | Open `http://localhost:3000/#admin-reports` | Report shown with status `Pending` |
| 7 | Click **Verify** | Status changes to `Verified` |
| 8 | Open `http://localhost:3000/#traffic` | Red 🚨 marker appears on the map |
| 9 | Open `http://localhost:3000/#dashboard` | Stats pulled from MySQL |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Health check |
| `GET`  | `/api/health` | Health check (JSON) |
| `POST` | `/api/crash-reports` | Submit crash report → status: Pending |
| `GET`  | `/api/crash-reports` | All reports (newest first) |
| `GET`  | `/api/crash-reports?status=Pending` | Filter by status |
| `GET`  | `/api/crash-reports?status=Verified` | Verified only (used by map) |
| `GET`  | `/api/crash-statistics` | Aggregated counts for dashboard |
| `PUT`  | `/api/crash-reports/<id>/verify` | Mark report Verified |
| `PUT`  | `/api/crash-reports/<id>/reject` | Mark report Rejected |

---

## POST /api/crash-reports — Request body

```json
{
    "reporter_name":  "Ramesh Kumar",
    "location":       "Hosur Road",
    "report_date":    "2026-10-02",
    "report_time":    "15:30",
    "crash_type":     "Vehicle Collision",
    "severity":       "High",
    "road_condition": "Wet",
    "description":    "Two vehicles collided near the signal."
}
```

**Success (201):**
```json
{
    "success":   true,
    "message":   "Crash report submitted successfully.",
    "report_id": 1,
    "status":    "Pending"
}
```

---

## GET /api/crash-statistics — Response

```json
{
    "success": true,
    "statistics": {
        "total":             8,
        "high":              3,
        "medium":            3,
        "low":               2,
        "pending":           2,
        "verified":          8,
        "rejected":          1,
        "total_submissions": 11
    }
}
```

> `total` = verified reports only (used in official statistics).

---

## Status Workflow

```
User submits → Pending
       │
  Admin reviews (#admin-reports)
       │
  ┌────┴────┐
  Verified  Rejected
      │
  Appears on Traffic Map
  Counted in Dashboard Statistics
```

---

## Database

```sql
-- All reports:
SELECT * FROM smart_traffic.crash_reports ORDER BY created_at DESC;

-- Count by status:
SELECT status, COUNT(*) AS cnt FROM smart_traffic.crash_reports GROUP BY status;

-- Manually verify report #1:
UPDATE smart_traffic.crash_reports SET status = 'Verified' WHERE report_id = 1;

-- Reset all to Pending (testing):
UPDATE smart_traffic.crash_reports SET status = 'Pending';
```

---

## Project Structure

```
smart-traffic-system/
│
├── index.html          ← Vite HTML entrypoint for React SPA
├── src/                ← React + Pure Tailwind CSS components
│   ├── main.jsx        ← React entrypoint (imports Leaflet third-party CSS & index.css)
│   ├── index.css       ← Tailwind entrypoint (@tailwind directives only, zero custom CSS)
│   ├── App.jsx         ← Root application container & view manager
│   ├── components/     ← 100% Tailwind utility-styled React views & panels
│   └── services/       ← API & OSRM routing modules
├── tailwind.config.js  ← Theme configuration (colors, shadows, keyframes)
├── backend/            ← Flask REST API & telemetry endpoints
├── database/           ← Schema & migrations
└── README.md
```

---

## Files Changed

| File | Change |
|------|--------|
| `backend/app.py` | Created — 6 Flask endpoints |
| `backend/database.py` | Created — MySQL helper |
| `backend/requirements.txt` | Created |
| `backend/.env` | Created — fill in DB_PASSWORD |
| `backend/start_backend.bat` | Created — one-click launcher |
| `database/schema.sql` | Created — DB + table |
| `index.html` | Added Admin nav link + admin page + detail modal |
| `style.css` | Appended admin + modal CSS |
| `app.js` | Section 6 replaced (fetch instead of localStorage) + admin/map/dashboard module appended |
| `.gitignore` | Created |
| `README.md` | Created |
