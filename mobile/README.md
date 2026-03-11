# PatrolNet — Mobile App

The Expo/React Native mobile application for PatrolNet. Available to **Tanod officers** and **Residents**.

---

## Prerequisites

| Tool | Notes |
|------|-------|
| [Node.js](https://nodejs.org) ≥ 18 | Required |
| [Expo Go](https://expo.dev/go) | Install on your Android/iOS device for quick testing |

> The mobile app and the server **must be on the same Wi-Fi network** so the device can reach the API.

---

## Installation

```bash
cd mobile
npm install
```

---

## Configuration

Create a `.env` file in the `mobile/` directory:

```env
EXPO_PUBLIC_API_URL=http://<your-local-ip>:3001
```

Replace `<your-local-ip>` with the **local IP address** of the machine running the server (e.g. `192.168.1.32`). Do **not** use `localhost` — it won't work on a physical device or emulator.

**Finding your local IP:**
- **Linux/macOS:** `ip addr` or `ifconfig`
- **Windows:** `ipconfig`

---

## Running the App

### With Expo Go (Recommended for first-time setup)

```bash
npm run start:go
```

A QR code will appear in the terminal. Scan it with the **[Expo Go](https://expo.dev/go)** app on your phone.

> ⚠️ **Do not use `npx expo start` directly** — this project has `expo-dev-client` installed, which changes the QR code format to one that requires a pre-built custom APK. Use `npm run start:go` to generate a standard Expo Go-compatible QR code instead.

### Android Emulator

Make sure Android Studio is open with an emulator running, then press `a` in the Expo terminal, or:

```bash
npm run android
```

### iOS Simulator (macOS only)

Press `i` in the Expo terminal, or:

```bash
npm run ios
```

---

## Features

### 🟡 Tanod
| Feature | Description |
|---------|-------------|
| **Attendance** | Clock-in / clock-out with photo & video proof |
| **Incident Reports** | View assigned incidents, update status |
| **Patrol Logs** | Log patrol activities with location |
| **Schedule** | View shift assignments |
| **Announcements** | Read barangay notices |
| **Messaging** | In-app communication |

### 🟢 Resident
| Feature | Description |
|---------|-------------|
| **Incident Reports** | Submit new incident reports with location |
| **SOS** | One-tap emergency alert from the login screen |
| **Announcements** | Read barangay notices |
| **Community Hub** | View community content |

---

## Testing the SOS Feature

The **SOS button** is visible on the **Login screen** — no login required.

1. Open the app to the Login screen.
2. **Log in at least once first** to store your user data locally (the SOS uses your saved `userId` and `username`).
3. Log out or navigate back to Login.
4. Tap the red **SOS** circle button.
5. Grant location permission when prompted.
6. The app will fetch your GPS coordinates, reverse-geocode the address, and send a `POST /sos-report` request to the server.
7. A success alert confirms the report was saved. You can verify the incident in the web admin dashboard.

**To test the backend directly without the app:**

```bash
curl -X POST http://<server-ip>:3001/sos-report \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "1",
    "username": "test_user",
    "latitude": 14.5995,
    "longitude": 120.9842,
    "location": "Test Location, Manila"
  }'
```

---

## Project Structure

```
mobile/
├── app/
│   └── (tabs)/
│       ├── Login.tsx          # Login + SOS button
│       ├── Home.tsx           # Main dashboard
│       ├── IncidentReport.tsx # Submit/view incidents
│       ├── Attendance.tsx     # Clock-in / clock-out
│       └── ...
├── components/
├── config.js                  # BASE_URL resolution (reads EXPO_PUBLIC_API_URL)
├── .env                       # Your local server IP
└── app.config.js
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server — scan QR with the **Expo Go** app |
| `npm run android` | Build dev client and launch on Android (requires Android Studio) |
| `npm run ios` | Build dev client and launch on iOS simulator (macOS only) |
| `npm run web` | Run as a web app in the browser |
