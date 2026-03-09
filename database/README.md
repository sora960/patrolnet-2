# PatrolNet — Database

This directory contains the MySQL/MariaDB schema for PatrolNet. The database backs all three sub-projects: the Node.js server, the React web client, and the Expo mobile app.

---

## Requirements

| Option | Tool | Download |
|--------|------|----------|
| **Recommended** | XAMPP (includes MySQL + phpMyAdmin) | [apachefriends.org](https://www.apachefriends.org) |
| Alternative | MySQL Server (standalone) | [dev.mysql.com/downloads](https://dev.mysql.com/downloads/mysql/) |

> PatrolNet was developed against **MariaDB 12.2 / MySQL 8.0**. Either works fine.

---

## Setup with XAMPP (Recommended)

XAMPP is the easiest way to get MySQL running locally, especially on Windows.

### Step 1 — Install & Start XAMPP

1. Download and install XAMPP from [apachefriends.org](https://www.apachefriends.org).
2. Open the **XAMPP Control Panel**.
3. Start the **MySQL** module (and Apache if you want to use phpMyAdmin in a browser).

### Step 2 — Create the Database

**Option A: Using phpMyAdmin (GUI)**

1. Open your browser and go to [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
2. Click **"New"** in the left sidebar.
3. Enter `patrolnet` as the database name, set collation to `utf8mb4_general_ci`, and click **Create**.
4. Select the `patrolnet` database from the left sidebar.
5. Click the **Import** tab at the top.
6. Click **Choose File** and select `database/db_schema.sql`.
7. Click **Go** at the bottom. The schema and seed data will be imported.

**Option B: Using the Terminal / Command Line**

```bash
# On Windows (from the XAMPP mysql/bin directory):
cd C:\xampp\mysql\bin
mysql.exe -u root -p -e "CREATE DATABASE patrolnet CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql.exe -u root -p patrolnet < path\to\PatrolNet\database\db_schema.sql

# On Linux/macOS:
mysql -u root -p -e "CREATE DATABASE patrolnet CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -u root -p patrolnet < database/db_schema.sql
```

### Step 3 — Create a Database User (Recommended)

Instead of using `root` directly, create a dedicated user to match the server's `.env` defaults:

```sql
CREATE USER 'patrol_admin'@'localhost' IDENTIFIED BY 'patrolnet123';
GRANT ALL PRIVILEGES ON patrolnet.* TO 'patrol_admin'@'localhost';
FLUSH PRIVILEGES;
```

Run this in the **phpMyAdmin SQL tab** or in the MySQL shell.

> If you prefer to use `root`, just update `server/.env` to set `DB_USER=root` and leave `DB_PASSWORD` blank (XAMPP's default).

---

## Schema Overview

The database contains **13 tables**:

```
patrolnet
├── users                    # All user accounts (Admin, Tanod, Resident)
├── schedules                # Tanod shift assignments (FK → users.ID)
├── logs                     # Attendance clock-in/out records
├── logs_patrol              # Tanod patrol activity logs
├── logs_resident            # Resident notification/activity logs
├── incident_report          # All submitted incident and SOS reports
├── incident_types           # Lookup table: incident categories + icons
├── announcements            # Barangay-wide announcements
├── activities               # Community activities/events
├── contact_messages         # Contact form submissions (with reply threads)
├── tourist_spots            # Local tourist spot listings
├── firewall_access_logs     # Login/access audit trail
└── firewall_blocked_ips     # IP blocklist for firewall middleware
```

---

## Table Reference

### `users`

Stores all registered accounts.

| Column | Type | Notes |
|--------|------|-------|
| `ID` | int PK AI | Unique user ID |
| `USER` | varchar(255) | Username (login credential) |
| `PASSWORD` | varchar(255) | Plain text (hash recommended for production) |
| `NAME` | varchar(255) | Full name |
| `ADDRESS` | varchar(255) | Home address |
| `ROLE` | varchar(255) | `Admin`, `Tanod`, or `Resident` |
| `STATUS` | varchar(255) | `Pending` (default) or `Verified` — only `Verified` users can log in |
| `IMAGE` | varchar(255) | Profile image filename (served from `server/uploads/`) |
| `EMAIL` | varchar(255) | Used for email verification |
| `push_token` | varchar(255) | Expo push notification token |
| `email_verification_code` | varchar(10) | Temporary 6-digit OTP |
| `email_verification_code_expires_at` | datetime | OTP expiry |

**Seed accounts included in the schema:**

| Username | Password | Role | Status |
|----------|----------|------|--------|
| `admin` | `admin` | Admin | Verified |
| `admin_tanod` | `password123` | Tanod | Verified |
| `test_resident` | `password123` | Resident | Verified |

> ⚠️ Change these passwords before deploying to any shared or production environment.

---

### `incident_report`

All incident and SOS reports submitted via the web or mobile app.

| Column | Type | Notes |
|--------|------|-------|
| `id` | int(4) PK | 4-digit randomly generated incident ID |
| `incident_type` | varchar(255) | e.g. `Fire`, `Crime`, `Accident`, `SOS` |
| `reported_by` | varchar(255) | Username of the reporter |
| `location` | varchar(255) | Human-readable address |
| `latitude` / `longitude` | double | GPS coordinates for GIS map |
| `status` | varchar(255) | `New`, `Under Review`, `Resolved` |
| `datetime` | datetime | Submission timestamp (GMT+8) |
| `image` | longtext | Uploaded evidence image filename |
| `assigned` | varchar(255) | Tanod username assigned to this incident |
| `resolved_by` | varchar(255) | Who resolved it |
| `resolved_at` | datetime(6) | Resolution timestamp |
| `resolution_image_path` | varchar(255) | Proof image from resolution |

---

### `incident_types`

Lookup table for incident categories shown in the web dashboard and mobile app.

Pre-seeded values:

| Name | Icon | Color |
|------|------|-------|
| Fire | 🔥 | `#ff4444` |
| Medical Emergency | 🚑 | `#ff6b6b` |
| Accident | 🚗 | `#ffa500` |
| Theft | 🔒 | `#9b59b6` |
| Violence | ⚠️ | `#e74c3c` |
| Noise Complaint | 🔊 | `#3498db` |
| Suspicious Activity | 👁️ | `#f39c12` |
| Other | 📋 | `#95a5a6` |

---

### `logs`

Attendance records for tanod clock-in / clock-out.

| Column | Notes |
|--------|-------|
| `USER` | Tanod username |
| `TIME` | Record timestamp |
| `TIME_IN` / `TIME_OUT` | Clock-in / clock-out timestamps |
| `LOCATION` | GPS or address at time of record |
| `ACTION` | `On Duty` or `Off Duty` |
| `time_in_photo` / `time_out_photo` | Photo proof filenames |
| `time_in_video` / `time_out_video` | Video proof filenames |

---

### `logs_patrol`

Activity logs written when tanods are assigned to or resolve incidents.

| Column | Notes |
|--------|-------|
| `USER` | Tanod username |
| `incident_id` | References `incident_report.id` (soft link) |
| `ACTION` | Describes what happened (assignment, resolution, etc.) |
| `status` | `unread` (shown as new notification) or `Resolved` |
| `resolution_image_path` | Proof image filename |

---

### `schedules`

Tanod shift schedules. One schedule per tanod (enforced by `UNIQUE KEY user_id`).

| Column | Notes |
|--------|-------|
| `user_id` | FK → `users.ID` (CASCADE on delete/update) |
| `DAY` | Comma-separated days, e.g. `Sunday, Monday` |
| `START_TIME` / `END_TIME` | Shift time range |
| `MONTH` | `All` or specific month |
| `STATUS` | e.g. `On Duty` |

---

### `firewall_access_logs`

Logs every login attempt (success, failure, blocked). Used by the Admin → Firewall page.

---

### `firewall_blocked_ips`

IP addresses blocked by the admin. The server middleware checks this table on every request (refreshed every 5 minutes).

---

## Auto-Migrations

The server automatically adds missing columns to existing tables on every startup. This means:

- You can import the base schema and the server will fill in any newer columns.
- The migrations are **idempotent** — safe to run repeatedly.

Tables and columns auto-managed by the server:

| Table | Auto-added columns |
|-------|--------------------|
| `logs` | `time_in_photo`, `time_out_photo`, `time_in_video`, `time_out_video` |
| `incident_report` | `resolution_image_path` |
| `firewall_access_logs` | Created if missing |
| `firewall_blocked_ips` | Created if missing |
| `logs_resident` | Created if missing |

---

## Connecting the Server

After setting up the database, update `server/.env`:

```env
DB_HOST=127.0.0.1
DB_USER=patrol_admin
DB_PASSWORD=patrolnet123
DB_NAME=patrolnet
```

If you are using XAMPP's default `root` user with no password:

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=patrolnet
```

---

## Resetting the Database

To wipe all data and re-import from scratch:

```bash
# In MySQL shell or phpMyAdmin SQL tab:
DROP DATABASE patrolnet;
CREATE DATABASE patrolnet CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

# Then re-import:
mysql -u patrol_admin -p patrolnet < database/db_schema.sql
```
