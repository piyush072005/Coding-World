# UsTunes

UsTunes is a Spotify-inspired web music player focused on one core feature: exactly two friends can listen together in real-time.

## Stack

- Frontend: React + Vite + Tailwind CSS (v4)
- Backend: Node.js + Express + Socket.io
- Database: SQLite via better-sqlite3

## Features

- Auto-generated unique 10-digit user ID
- Login by 10-digit ID
- Google login with automatic 10-digit ID creation
- Add friends by 10-digit ID only
- Send friend invites for Listen Together mode
- Real-time synchronized playback actions for both listeners:
  - Play / Pause
  - Skip next / previous
  - Seek (scrub timeline)
  - Shared track selection

## Project Structure

- `client/` React app
- `server/` API + WebSocket server
- `DESIGN.md` UI design reference used for styling

## Run Locally

1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

2. Configure backend environment

```bash
cd ../server
copy .env.example .env
```

Add your Google OAuth client ID to both the server and client environments:

```bash
# server/.env
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

# client/.env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

3. Start backend

```bash
npm run dev
```

4. Start frontend in a new terminal

```bash
cd ../client
npm run dev
```

5. Open the frontend URL shown by Vite (typically http://localhost:5173).

## Two-user Test Flow

1. User A creates profile and copies their 10-digit ID.
2. User B creates profile and copies their 10-digit ID.
3. Each adds the other by ID.
4. User A invites User B from Friends panel.
5. User B accepts invite.
6. Both users now share synchronized controls and timeline.
