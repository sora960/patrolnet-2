# PatrolNet Full Stack Application

PatrolNet is a comprehensive barangay incident reporting platform containing a Node/Express backend Server, a React Web Client, an Expo Mobile App, and a MySQL Database.

This documentation serves to help developers quickly start up the full suite of applications on any new computer.

---

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
- **Node.js**: (v18 or higher recommended)
- **XAMPP** or a local MySQL server
- **Git**
- **Ngrok Account** (Required for the Mobile app tunneling)

---

## 1. Database Setup (`/database`)

The application relies on a MySQL database to store users, reports, and logs.
1. Start your local **MySQL Server** (e.g., via the XAMPP Control Panel).
2. Open phpMyAdmin (usually `http://localhost/phpmyadmin`) or your preferred MySQL client.
3. Create a new database named `db`.
4. Import the `database/db_schema.sql` file into the `db` database to construct all necessary tables.

---

## 2. Server Setup (`/server`)

The backend is a Node.js Express API that the Web Client and Mobile App communicate with.
1. Open a terminal and navigate to the server folder:
   ```bash
   cd server
   ```
2. Install the server dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   - Rename `server/.env.example` to `server/.env`.
   - Update the variables if your MySQL credentials differ (default is `root` with no password).
4. Start the server:
   ```bash
   npm start
   ```
   *(The server should now be running on `http://localhost:3001`)*

---

## 3. Web Client Setup (`/client`)

The web client is a React application providing a dashboard for admins and users.
1. Open a **new terminal** and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install the client dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
   *(Note: The legacy-peer-deps flag is required to bypass an older `react-scripts` conflict with ESLint dependencies).*
3. Set up your environment variables:
   - Rename `client/.env.example` to `client/.env`.
   - If your server is hosted elsewhere or on a different IP, update the `REACT_APP_BASE_URL` inside the file.
4. Start the web client:
   ```bash
   npm start
   ```
   *(The React app should now be running on `http://localhost:3000`)*

---

## 4. Mobile App Setup (`/mobile`)

The mobile application is built using Expo Go and is meant to be scanned by your phone.
1. Open a **new terminal** and navigate to the mobile folder:
   ```bash
   cd mobile
   ```
2. Install the mobile dependencies:
   ```bash
   npm install
   ```
3. Set up your Ngrok Tunnel Authtoken (Required once):
   - By default, Expo tries to use your local LAN IP to serve the bundle to your phone. To prevent "Network Errors" when scanning the QR code from different networks, we use Ngrok tunneling.
   - Go to [ngrok.com](https://ngrok.com/) and create a free account.
   - Copy your authtoken from the Ngrok dashboard and run:
     ```bash
     npx ngrok config add-authtoken <YOUR_TOKEN>
     ```
4. Start the Expo server using the tunnel script:
   ```bash
   npm run start:tunnel
   ```
5. Grab your phone, install **Expo Go** from the App Store or Play Store, and scan the QR code generated in your terminal or browser preview. 

*(Note: In `/mobile/config.js`, the app dynamically determines the backend URL. If the server is not on the same machine/network as the phone's Expo Go app, you may need to explicitly define `EXPO_PUBLIC_API_URL=http://<YOUR_API_IP>:3001` in a `mobile/.env` file).*
