# 🌟 Lumiere — Major Project

A full-stack TypeScript-first application for ingredient/allergen evaluation and product management.

---

## Tech Stack

**Server:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL

**Client:** Expo (React Native), TypeScript

---

## Project Structure

```
MajorProject/
├── server/   # Backend (API, Prisma, database)
├── client/   # Mobile app (Expo / React Native)
├── package.json  # Root config
└── README.md
```

---

## Prerequisites

Install **all** of the following:

- Node.js (v20 LTS recommended, v18+ minimum)
- npm (v10+)
- PostgreSQL (local or Docker)
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app (on your mobile device)

**Optional:**
- Docker (for PostgreSQL or server containerization)
- EAS CLI (`npm install -g eas-cli`) for production mobile builds

---

## Repository Setup

```bash
git clone YOUR_REPO_URL
cd MajorProject

# Install root dependencies
npm install

# Server setup
cd server
npm install

# Client setup
cd ../client
npm install
```

---

## Environment Variables

### Server — `server/.env`

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
PORT=3000
JWT_SECRET=your-secret

# Optional
SERPAPI_API_KEY=your-serpapi-key
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
```

### Client — `client/.env`

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
```

**API URL Reference:**

| Environment        | API URL                        |
|--------------------|-------------------------------|
| Physical Device    | http://YOUR_LOCAL_IP:3000/api  |
| Android Emulator   | http://10.0.2.2:3000/api       |
| iOS Simulator      | http://localhost:3000/api      |

---
## Database Setup (Local)

From `server/`:

```bash
npx prisma migrate dev
npm run seed
npx prisma studio # optional
```

**Notes:**
- `npm run seed` is **required** for initial data
- `prisma studio` is optional for DB inspection

---

## Running the App Locally

### 1. Start the Server

```bash
cd server
npm run dev
```

### 2. Start the Client

```bash
cd client
npm run start
```

### 3. Open the App

- Open Expo Go on your device
- Scan the QR code from the terminal/browser
- Ensure your device and computer are on the same Wi-Fi

---

## Testing

### Server Tests

```bash
cd server
npm test
```

### Client Tests

```bash
cd client
npm test
```

---

## Testing with Hosted/Production Backend

### 1. Deploy Backend

- Ensure your production database is reachable
- Apply migrations:

```bash
npx prisma migrate deploy
```

- Set all required environment variables on your server

### 2. Update Client `.env`

```env
EXPO_PUBLIC_API_URL=https://YOUR_PROD_DOMAIN/api
```

### 3. Run Client

```bash
cd client
npm run start
```

---

## 🐳 Docker (Optional)

**Files:**
- `server/docker-compose.yaml` (PostgreSQL)
- `server/Dockerfile` (Node server)

### Start PostgreSQL with Docker Compose

```bash
cd server
docker compose up -d
```

Set `server/.env` `DATABASE_URL` to match Docker credentials.

### Stop Docker services

```bash
cd server
docker compose down
# To remove DB volume:
docker compose down -v
```

### Run server in Docker (optional)

```bash
cd server
docker build -t lumiere-server .
docker run --env-file .env -p 3000:3000 lumiere-server
```

---

## Production Deployment

### Server Startup Sequence

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run build
npm start
```

### Client Builds (EAS)

```bash
npm install -g eas-cli
eas login
eas build -p android
eas build -p ios
```

---

## Updating Dependencies

### Check Outdated

```bash
# Root
npm outdated
# Server
cd server && npm outdated
# Client
cd client && npm outdated
```

### Update Server

```bash
cd server
npm install package-name@latest
npm run build
npm test
# If Prisma changes:
npx prisma generate
```

### Update Client (Expo)

```bash
cd client
npx expo install --fix
npx expo-doctor
npm install package-name@latest
npm run start
```

**Important:**
- Keep Expo ecosystem versions aligned
- Prefer `expo install` for Expo-managed packages

---

## Useful Commands

### Server

```bash
npm run dev
npm run build
npm start
npm test
# Seeding
npm run seed
npm run seed:roles
npm run seed:users
npm run seed:preferences
npm run seed:conditions
npm run seed:allergens
npm run seed:prompts
```

### Client

```bash
npm run start
npm run android
npm run ios
npm run web
npm test
```

---

## Troubleshooting & Common Issues

### Phone Cannot Reach Backend
- Use LAN IP (not localhost)
- Check firewall (port 3000)
- Test API in phone browser

### Android Emulator
- Use: `http://10.0.2.2:3000/api`

### iOS Simulator
- Use: `http://localhost:3000/api`

### Clear Metro Cache
```bash
cd client
npx expo start -c
```

### Prisma Errors
- Check `DATABASE_URL` in `.env`
- Re-run migrations:
  - Local: `npx prisma migrate dev`
  - Production: `npx prisma migrate deploy`
- Ensure seed data exists: `npm run seed`

### Propfill Issues (React Native)
If you see errors about missing `prop-types` or `@react-native/prop-types`, install:
```bash
cd client
npm install @react-native/prop-types
```
Or, if you see warnings about missing fonts (e.g., `RobotoMedium`), ensure your `app.json` or `expo.config.js` includes the correct font assets and you have run `expo install expo-font`.

---

## Final Notes

- Keep environment configs consistent across environments
- Always test after dependency updates
- Treat seed data as critical to system integrity

💡 *Tip: If something breaks, it's usually env vars, networking, or migrations — check those first.*