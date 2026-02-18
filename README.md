# 🛡️ PatrolNet: Barangay Incident Management System

**PatrolNet** is a comprehensive dispatch and command center system designed for Barangay Tanods. It prioritizes real-time situation awareness, geospatial risk analysis, and personnel accountability over standard administrative tasks.

## 🚀 Key Features

### 🚨 Command & Control (Patrol Core)
* **GIS Incident Mapping:** Real-time visualization of active cases using Leaflet. Features "Heatmap Mode" for identifying high-risk density zones.
* **Incident Dispatch:** Centralized database for logging, tracking, and resolving incidents (Fire, Crime, Accident, etc.).
* **Official Reporting:** Auto-generates printable, ISO-aligned Incident Reports with official letterheads and data tables.
* **Real-time Dashboard:** Instant view of active cases, tanods on duty, and recent alerts.

### 👮 Personnel Management
* **Digital Logbook:** Tamper-proof Time-In/Time-Out logging for Tanods.
* **Automated Scheduling:** Shift management and rostering.
* **Audit Trail:** Complete history of who resolved which case and when.

## 🛠️ Tech Stack
* **Frontend:** React.js, Leaflet (Maps), Recharts (Analytics)
* **Backend:** Node.js, Express.js
* **Database:** MariaDB / MySQL
* **Hardware:** Optimized for Desktop Command Centers & Mobile Patrol Units

## 📦 Installation Guide

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/your-username/patrolnet-system.git](https://github.com/your-username/patrolnet-system.git)
    cd patrolnet-system
    ```

2.  **Setup Database**
    * Create a database named `db`.
    * Import the `db_schema.sql` file provided in this repo.

3.  **Install Dependencies**
    ```bash
    # Install Server
    cd server
    npm install

    # Install Client
    cd ../client
    npm install --legacy-peer-deps
    ```

4.  **Run the System**
    * **Server:** `cd server && node server.js`
    * **Client:** `cd client && npm start`