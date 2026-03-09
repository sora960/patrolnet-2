# PatrolNet — Web Client

The React-based web dashboard for PatrolNet. Designed for **Admins**, **Tanod officers**, and **Residents** to manage patrol operations, incidents, schedules, and more.

---

## Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- The **PatrolNet server** must be running on `http://localhost:3001` (see [`server/`](../server/))

---

## Installation

```bash
cd client
npm install
```

---

## Running the App

### Development Mode (hot reload)

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000). The page reloads automatically when you save changes.

### Production Build

Build the optimized static bundle:

```bash
npm run build
```

Serve the production build locally:

```bash
npx serve -s build
```

The app will be available at [http://localhost:3000](http://localhost:3000) (or whichever port `serve` assigns).

---

## Features by Role

### 🔴 Admin
| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview stats and live activity |
| **Accounts** | Manage all user accounts and roles |
| **Incident Reports** | View, assign, and resolve all incidents |
| **GIS Mapping** | Live patrol map with incident markers |
| **Schedule Assignment** | Assign tanod shifts and schedules |
| **Patrol Logs** | Full log history of tanod patrols |
| **Attendance** | Monitor tanod check-ins and proof |
| **Announcements** | Post and manage barangay-wide notices |
| **Barangay Reports** | Generate and download reports |
| **Community Hub** | Manage community content |
| **Firewall** | IP blocklist and access log management |
| **Tourist Spots** | Manage local tourist spot listings |

### 🟡 Tanod
| Feature | Description |
|---------|-------------|
| **Incident Reports** | View and respond to assigned incidents |
| **GIS Map** | View patrol area and incident locations |
| **Patrol Logs** | Log patrol activities |
| **Attendance** | Time-in / time-out with proof upload |
| **Schedule** | View assigned schedules |
| **Announcements** | Read barangay notices |

### 🟢 Resident
| Feature | Description |
|---------|-------------|
| **Incident Reports** | Submit new incident reports |
| **Announcements** | Read barangay notices |
| **Community Hub** | View community content |
| **Tourist Spots** | Browse local attractions |

---

## Project Structure

```
client/
├── public/
└── src/
    ├── components/       # All page components and modals
    │   ├── Login.jsx
    │   ├── Dashboard.jsx
    │   ├── GISmapping.jsx
    │   ├── Incident_Report.jsx
    │   ├── Attendance.jsx
    │   ├── ScheduleAssignment.jsx
    │   ├── Patrollogs.jsx
    │   ├── Announcements.jsx
    │   ├── Firewall.jsx
    │   ├── BarangayReport.jsx
    │   └── ...
    └── App.js
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle to `build/` |
| `npx serve -s build` | Serve the production build statically |
