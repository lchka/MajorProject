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
├── MajorProject.postman_collection
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
PLEASE VIEW ENV.EXAMPLE FOR ALL REQUIRED VARIABLES 
DATABASE_URL=your_db_url
JWT_SECRET=your_secret
```

---

### Client — `client/.env`

```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api - local
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=683522806244-6q8iufjsv3s3v2f479ld0ott6qav9j8l.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=683522806244-0qap73na4tmnd18csclf9pcq77p4c34l.apps.googleusercontent.com
EXPO_PUBLIC_GITHUB_CLIENT_ID=0v23IiyDcxC60JIgAt3Y
EXPO_PUBLIC_API_URL=https://majorproject-1toi.onrender.com/api - hosted
```

---

### Admin — `admin/.env`

```
VITE_API_URL=http://localhost:3000/api
VITE_API_URL=https://majorproject-1toi.onrender.com/api
```

---

## Database Setup

```bash
cd server
npx prisma generate
npx prisma migrate dev
npm run seed
```

---

## Running Locally
### 🐳Docker Installation
- To run the server locally, Docker must be installed. A container is created using a Dockerfile and managed using Docker Compose.

```
/server
  ├── Dockerfile
  ├── docker-compose.yml
  ├── package.json
  ├── src/
```
### Creating the Required Files
- Create a Dockerfile in the /server directory and add the following:

#### Docker File
```bash
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

```
#### Docker Compose File
- Create a docker-compose.yml file in the /server directory:
```bash
version: "3.9"

services:
  postgres:
    image: postgres:16
    container_name: postgres_db

    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: my_backend_db

    ports:
      - "5432:5432"

    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```
#### Running the Application

```bash
cd server
docker compose up -d --build
```
#### Closing the Application

```bash
docker compose down
```


### Start Backend

```bash
cd server
npm run dev
```

---

#### Start Mobile App

```bash
cd client
npx expo start --clear  
```

---

#### Start Admin Panel

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
VITE_API_URL=https://majorproject-1toi.onrender.com/api
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