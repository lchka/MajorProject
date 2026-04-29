# ⭐ Lumiere — Major Project

A full-stack TypeScript-first application for ingredient/allergen evaluation and product management.

---

## Tech Stack

**Server:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL  
**Client:** Expo (React Native), TypeScript  
**Admin:** React, Vite, TypeScript, TailwindCSS  

---

## Project Structure

```
MajorProject/
├── server/   # Backend (API, Prisma, database)
├── client/   # Mobile app (Expo / React Native)
├── admin/    # Web admin panel (React + Vite)
├── package.json
├── LICENCE.md
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
- Docker
- EAS CLI (`npm install -g eas-cli`)

---

## Repository Setup

```bash
git clone https://github.com/lchka/MajorProject.git
cd MajorProject

npm install

cd server && npm install
cd ../client && npm install
cd ../admin && npm install
```

---

## Environment Variables

### Server — `server/.env`

```
DATABASE_URL=your_db_url
JWT_SECRET=your_secret
```

---

### Client — `client/.env`

```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
```

---

### Admin — `admin/.env`

```
VITE_API_URL=http://localhost:3000/api
```

---

## Database Setup

```bash
cd server
npx prisma migrate dev
npm run seed
```

---

## Running Locally

### Start Backend

```bash
cd server
npm run dev
```

---

### Start Mobile App

```bash
cd client
npm run start
```

---

### Start Admin Panel

```bash
cd admin
npm run dev
```

---

## 🌐 Deploying Admin (Render)

### 1. Create Static Site

- Go to Render Dashboard
- Click **New → Static Site**
- Connect your repo

---

### 2. Configure Settings

- **Root Directory:**  
  `admin`

- **Build Command:**
```bash
npm install && npm run build
```

- **Publish Directory:**
```
dist
```

---

### 3. Add Environment Variable

```
VITE_API_URL=https://your-backend-url/api
```

---

### 4. Deploy

Click **Create Static Site**  
Render will build and deploy automatically.

---

## 🧠 Admin Features

- Manage allergens, conditions, preferences
- Usage tracking (prevents deletion if in use)
- Clean dashboard UI with pagination
- Safe delete protections
- Banner feedback system

---

## Production Backend Setup

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run build
npm start
```

---

## Useful Commands

### Server
```bash
npm run dev
npm run build
npm test
npm run seed
```

### Client
```bash
npm run start
npm run android
npm run ios
```

### Admin
```bash
npm run dev
npm run build
npm run preview
```

---

## Troubleshooting

### API not reachable
- Use LAN IP instead of localhost
- Check firewall (port 3000)

### Prisma issues
```bash
npx prisma migrate dev
npm run seed
```

### Clear cache
```bash
cd client
npx expo start -c
```

---

## Final Notes

- Keep env variables consistent
- Always seed database
- Most issues = env, networking, or migrations

💡 Tip: If something breaks — check API URL first.