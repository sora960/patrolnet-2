# PatrolNet — Barangay Emergency Response System

PatrolNet is a full-stack emergency response and patrol management system built for barangay-level use. It connects **admins**, **tanod officers**, and **residents** through a web dashboard, a mobile app, and a shared backend API.

---

## System Architecture

```
┌─────────────────────┐     HTTP/REST       ┌──────────────────────┐
│  Web Client (React) │ ──────────────────► │  Server (Node/Express)│
│  port 3000 / serve  │                     │  port 3001            │
└─────────────────────┘                     │                       │
                                            │  MySQL Database       │
┌─────────────────────┐     HTTP/REST       │  (patrolnet)          │
│  Mobile App (Expo)  │ ──────────────────► │                       │
│  React Native       │                     └──────────────────────┘
└─────────────────────┘
```

| Sub-project | Tech Stack            | Location    |
|-------------|-----------------------|-------------|
| **Server**  | Node.js, Express, MySQL | `server/` |
| **Client**  | React (Create React App) | `client/` |
| **Mobile**  | Expo, React Native    | `mobile/`   |

---

## Prerequisites

Make sure the following are installed before getting started:

| Tool | Version | Notes |
|------|---------|-------|
| [Node.js](https://nodejs.org) | ≥ 18 | Required by all three sub-projects |
| [MySQL](https://dev.mysql.com/downloads/) | ≥ 8.0 | Database backend |
| [Expo CLI](https://docs.expo.dev/get-started/installation/) | Latest | For the mobile app |
| [Android Studio](https://developer.android.com/studio) | Latest | For running an Android emulator (optional if using a physical device) |

---

## Quick Start

### 1. Set Up the Database

Import the schema into MySQL:

```bash
mysql -u root -p < database/db_schema.sql
```

Create a dedicated MySQL user (or adjust `server/.env` to match your existing credentials).

---

### 2. Configure Environment Variables

**Server** — create `server/.env`:

```env
DB_HOST=127.0.0.1
DB_USER=patrol_admin
DB_PASSWORD=patrolnet123
DB_NAME=patrolnet

EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

> **Gmail App Password**: Go to [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords) to generate one. Do **not** use your regular Gmail password.

**Mobile** — create `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://<your-local-ip>:3001
```

Replace `<your-local-ip>` with the IP address of the machine running the server (e.g. `192.168.1.32`). The mobile device and the server must be on the same network.

---

### 3. Start the Server

```bash
cd server
npm install
node server.js
```

The API will be available at `http://localhost:3001`.

---

### 4. Start the Web Client

See [`client/README.md`](client/README.md) for full details.

```bash
cd client
npm install
npm start          # development mode (hot reload)
# — or —
npm run build && npx serve -s build   # production-like static serve
```

---

### 5. Start the Mobile App

See [`mobile/README.md`](mobile/README.md) for full details.

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code in your terminal with the **Expo Go** app on your Android or iOS device.

---

## User Roles

| Role     | Access |
|----------|--------|
| **Admin**    | Web only — full dashboard, accounts, firewall, reports |
| **Tanod**    | Web + Mobile — patrol logs, incident response, attendance, schedules |
| **Resident** | Web + Mobile — incident reporting, SOS, announcements |

---

## Project Structure

```
PatrolNet/
├── server/          # Node.js/Express REST API + MySQL
├── client/          # React web dashboard (Admin, Tanod, Resident)
├── mobile/          # Expo React Native app (Tanod, Resident)
└── database/
    └── db_schema.sql
```

---

## Key Features

- 🗺️ **GIS Mapping** — live patrol map with incident pins
- 🚨 **SOS Button** — emergency alert sent from mobile login screen
- 📋 **Incident Reports** — submit, assign, and resolve incidents
- 🕐 **Attendance** — clock-in/out with photo and video proof
- 📅 **Schedule Assignment** — tanod shift scheduling
- 📢 **Announcements** — barangay-wide notices
- 🔐 **Firewall** — IP blocklist management for the web admin
- 📊 **Barangay Reports** — downloadable PDF/CSV reports
