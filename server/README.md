# PatrolNet — Server

The Node.js/Express REST API backend for PatrolNet. Handles authentication, incident management, attendance, schedules, announcements, GIS data, and more. Connects to a MySQL database and listens on **port 3001**.

---

## Prerequisites

| Tool | Notes |
|------|-------|
| [Node.js](https://nodejs.org) ≥ 18 | Required |
| [MySQL](https://dev.mysql.com/downloads/) ≥ 8.0 | Database |
| **ffmpeg** _(optional)_ | Auto-installed via `ffmpeg-static`. Used to transcode uploaded videos for browser compatibility. The server works without it. |

---

## Installation

```bash
cd server
npm install
```

---

## Configuration

Create a `.env` file in the `server/` directory:

```env
# Database
DB_HOST=127.0.0.1
DB_USER=patrol_admin
DB_PASSWORD=patrolnet123
DB_NAME=patrolnet

# Email (Gmail only)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

> **Gmail App Password**: Go to [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords) and generate a 16-character app password. Do **not** use your regular Gmail password.

### Database Setup

Import the schema before starting the server for the first time:

```bash
mysql -u root -p < ../database/db_schema.sql
```

The server will auto-create missing columns and tables on startup (idempotent migrations run via `ensureAttendanceSchema`, `ensureFirewallTables`, `ensureIncidentReportSchema`).

---

## Running the Server

```bash
node server.js
```

The server starts at `http://0.0.0.0:3001` (accessible on your local network).

---

## Static Files

Uploaded media (profile images, incident photos, attendance proofs) are served statically:

```
GET /uploads/<filename>
GET /uploads/resolutions/<filename>
```

Files are stored in `server/uploads/`.

---

## API Reference

### Auth & Registration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/login` | Login (web or mobile). Body: `{ username, password, clientType, deviceId }` |
| `POST` | `/register` | Register a new user account |
| `POST` | `/pre-register-send-code` | Send email verification code before registration |
| `POST` | `/pre-register-verify-code` | Verify the email code |

### SOS

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/sos-report` | Submit an emergency SOS alert. Body: `{ userId, username, latitude, longitude, location }` |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | Get all users |
| `GET` | `/api/tanods` | Get all verified Tanod users |
| `GET` | `/api/user/:username` | Get a single user by username |
| `PUT` | `/api/users/:id` | Update user by ID (supports image upload) |
| `PUT` | `/api/user/:username` | Update user profile by username |
| `DELETE` | `/api/users/:id` | Delete user by ID |

### Incidents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/incidents` | Get all incidents |
| `GET` | `/api/incidents/complete/all` | Get all incidents including resolved (for analytics) |
| `GET` | `/api/incidents/:id` | Get a single incident |
| `GET` | `/api/incidents/assigned/:username` | Get incidents assigned to a tanod |
| `GET` | `/api/incidents/new-assignments/:username` | Get new (unseen) assignments for a tanod |
| `GET` | `/api/incidents/history/:username` | Get resolved incident history for a tanod |
| `GET` | `/api/incidents/reported/:username` | Get incidents reported by a user |
| `GET` | `/api/incidents/reports-history/:username` | Get report history for a user |
| `GET` | `/api/patrol/incidents` | Get active + recent resolved incidents for patrol map |
| `POST` | `/api/incidents` | Submit a new incident report (supports image upload) |
| `PUT` | `/api/incidents/:id/status` | Update incident status |
| `PUT` | `/api/incidents/:id/assign` | Assign a tanod to an incident |
| `PUT` | `/api/incidents/:id/resolve` | Resolve an incident (supports proof image upload) |
| `DELETE` | `/api/incidents/:id` | Delete an incident |

### Schedules

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/schedules` | Get all schedules |
| `GET` | `/api/schedules/count` | Get schedule count |
| `POST` | `/api/schedules` | Create a new schedule |
| `PUT` | `/api/schedules/:id` | Update a schedule |
| `DELETE` | `/api/schedules/:id` | Delete a schedule |
| `POST` | `/api/sync-tanods` | Sync tanod list for schedule management |

### Attendance & Time Records

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user-time-status/:username` | Get current time-in/out status for a user |
| `POST` | `/api/time-record` | Submit a time-in or time-out record |
| `POST` | `/api/upload-time-photo` | Upload attendance photo proof |
| `POST` | `/api/upload-time-media` | Upload attendance video proof |

### Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/logs` | Get all attendance logs |
| `GET` | `/api/logs/:user` | Get logs for a specific user |
| `GET` | `/api/logs_resident/:user` | Get resident activity logs |
| `GET` | `/api/logs_patrol` | Get all patrol logs |
| `GET` | `/api/logs_patrol/:user` | Get patrol logs for a specific user |
| `POST` | `/api/logs` | Create a new log entry |

### Announcements

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/announcements` | Get all announcements |
| `POST` | `/api/announcements` | Create an announcement (supports image upload) |
| `PUT` | `/api/announcements/:id` | Update an announcement |
| `DELETE` | `/api/announcements/:id` | Delete an announcement |

### Activities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/activities` | Get all activities |
| `POST` | `/api/activities` | Create an activity (supports image upload) |
| `PUT` | `/api/activities/:id` | Update an activity |
| `DELETE` | `/api/activities/:id` | Delete an activity |

### GIS & Firewall (and more)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/gis/count` | GIS incident count for map overlay |
| `GET` | `/api/firewall/access-logs` | Get IP access logs |
| `GET` | `/api/firewall/blocked-ips` | Get blocklist |
| `POST` | `/api/firewall/block-ip` | Block an IP address |
| `DELETE` | `/api/firewall/unblock-ip/:ip` | Unblock an IP address |

---

## Firewall

The server includes a built-in IP firewall middleware that:
- Loads blocked IPs from the `firewall_blocked_ips` MySQL table on startup.
- Refreshes the blocklist every **5 minutes**.
- Returns `403 Forbidden` for any request from a blocked IP.
- Logs all access attempts to `firewall_access_logs`.

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP server framework |
| `mysql2` | MySQL database client |
| `cors` | Cross-origin request handling |
| `multer` | File upload handling |
| `nodemailer` | Email sending (verification codes) |
| `dotenv` | Environment variable loading |
| `fluent-ffmpeg` + `ffmpeg-static` | Video transcoding for uploaded media |
| `bcrypt` | Password hashing (available, use as needed) |
| `jsonwebtoken` | JWT support (available, use as needed) |
