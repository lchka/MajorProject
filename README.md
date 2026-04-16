# 🌟 Lumiere — Major Project

A full-stack application built with a modern TypeScript-first architecture.

---

## 🧱 Tech Stack

### Server
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL

### Client
- Expo (React Native)

---

## ⚙️ 1. Prerequisites

Make sure you have the following installed:

- Node.js (v20 LTS recommended, v18+ minimum)
- npm (v10+)
- PostgreSQL
- Expo Go (for mobile testing)

### Optional
- Docker (for containerized environments)
- EAS CLI (for production mobile builds)

---

## 📦 2. Repository Setup

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

## 🔐 3. Environment Variables

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

---

### Client — `client/.env`

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
```

### Common Configurations

| Environment            | API URL                          |
|----------------------|----------------------------------|
| Physical Device      | http://YOUR_LOCAL_IP:3000/api     |
| Android Emulator     | http://10.0.2.2:3000/api         |
| iOS Simulator        | http://localhost:3000/api        |

---

### JSON-style Env (for some platforms)

```json
{
  "DATABASE_URL": "postgresql://USER:PASSWORD@HOST:5432/DB_NAME",
  "PORT": "3000",
  "JWT_SECRET": "your-secret",
  "SERPAPI_API_KEY": "your-serpapi-key"
}
```

---

## 🗄️ 4. Database Setup (Local)

Run from the `server/` directory:

```bash
npx prisma migrate dev
npm run seed
npx prisma studio
```

### Notes
- `npm run seed` is **required**
- `prisma studio` is optional but useful for inspection

---

## 🚀 5. Run Locally

### Start Server

```bash
cd server
npm run dev
```

### Start Client

```bash
cd client
npm run start
```

### Then

- Open Expo Go
- Scan QR code
- Ensure both devices are on the same Wi-Fi

---

## 🌍 6. Testing with Production Backend

### 1. Deploy Backend

Ensure:
- Database is reachable
- Migrations applied:

```bash
npx prisma migrate deploy
```

- Environment variables are set

---

### 2. Update Client `.env`

```env
EXPO_PUBLIC_API_URL=https://YOUR_PROD_DOMAIN/api
```

---

### 3. Run Client

```bash
cd client
npm run start
```

Scan QR and test flows.

---

## 🏗️ 7. Production Deployment

### Server Startup Sequence

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run build
npm start
```

### Notes
- Seeding is required on first deploy
- Keep seeding enabled unless managed externally

---

### 📱 Client Builds (EAS)

```bash
npm install -g eas-cli
eas login
eas build -p android
eas build -p ios
```

---

## 🔄 8. Updating Dependencies

### Check Outdated

```bash
# Root
npm outdated

# Server
cd server && npm outdated

# Client
cd client && npm outdated
```

---

### Update Server

```bash
cd server
npm install package-name@latest
npm run build
npm test
```

If Prisma changes:

```bash
npx prisma generate
```

---

### Update Client (Expo)

```bash
cd client
npx expo install --fix
npx expo-doctor
```

Then:

```bash
npm install package-name@latest
npm run start
```

### Important
- Keep Expo ecosystem versions aligned
- Prefer `expo install` when possible

---

## 🧰 9. Useful Commands

### Root

```bash
npm run build
npm start
```

---

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

---

### Client

```bash
npm run start
npm run android
npm run ios
npm run web
```

---

## 🛠️ 10. Troubleshooting

### 📡 Phone Cannot Reach Backend

- Use LAN IP (not localhost)
- Check firewall (port 3000)
- Test API in phone browser

---

### 🤖 Android Emulator Issues

```bash
http://10.0.2.2:3000/api
```

---

### 🍏 iOS Simulator Issues

```bash
http://localhost:3000/api
```

---

### ♻️ Clear Metro Cache

```bash
cd client
npx expo start -c
```

---

### 🧩 Prisma Errors

#### Check Environment
- Verify `DATABASE_URL`

#### Re-run Migrations

```bash
# Local
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

#### Ensure Seed Data Exists

```bash
cd server
npm run seed
```

---

## ✅ Final Notes

- Keep environment configs consistent across environments
- Always test after dependency updates
- Treat seed data as critical to system integrity

---

💡 *Tip: If something breaks, it's usually env vars, networking, or migrations — check those first.*