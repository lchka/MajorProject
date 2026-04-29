#  Lumiere Admin Panel

The **Lumiere Admin Panel** is a web-based dashboard for managing core application data including allergens, conditions, preferences, and users.

Built with a modern stack for speed, clarity, and maintainability.

---

##  Tech Stack

- React
- TypeScript
- Vite
- TailwindCSS

---

##  Structure

```
admin/
├── src/
│   ├── pages/          # Admin pages (Allergens, Conditions, etc.)
│   ├── components/     # Reusable UI components (Banner, Badge, etc.)
│   ├── services/       # API calls
│   └── utils/
├── public/
├── index.html
├── package.json
└── vite.config.ts
```

---

## ⚙️ Setup

From the root of the project:

```bash
cd admin
npm install
```

---

##  Environment Variables

Create a `.env` file in `/admin`:

```
VITE_API_URL=http://localhost:3000/api
```

### Example (Production)

```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

##  Running Locally

```bash
npm run dev
```

Then open:

```
http://localhost:5173
```

---

##  Build for Production

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

---

##  Deploying (Render)

### 1. Create Static Site

- Go to Render Dashboard
- Click **New → Static Site**
- Connect your repo

---

### 2. Configure

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

### 3. Environment Variables

Add:

```
VITE_API_URL=https://your-backend-url/api
```

---

### 4. Deploy

Click **Create Static Site**

---

##  Features

###  Data Management
- Allergens
- Conditions
- Preferences

###  CRUD Operations
- Create
- Edit
- Delete (with safety checks)

### Safe Deletion Logic
- Items **cannot be deleted if in use**
- Usage shown via badge:
```
In use (3)
```

###  User Management
- View users
- Soft delete (disable)
- Restore users
- Permanent delete

###  UI Features
- Dark glassmorphism design
- Gradient backgrounds
- Usage badges
- Inline editing
- Pagination

###  Feedback System
- Success / error banners
- Auto-dismiss notifications

---

##  Important Notes

- Admin relies entirely on backend API
- Ensure backend is running before using admin
- All data validation happens server-side

---

##  Troubleshooting

### API not working
- Check `VITE_API_URL`
- Ensure backend is running

---

### Build issues
```bash
rm -rf node_modules
npm install
npm run build
```

---

### Changes not updating
```bash
npm run dev
# then hard refresh browser
```

---

##  Development Notes

- Uses service layer (`/services`) for API calls
- UI is component-based (Banner, UsageBadge, etc.)
- Designed for scalability and admin workflows

---

## Tips

- If delete isn’t working → check `usedCount`
- If nothing loads → API URL is wrong
- If UI looks off → Tailwind not loaded properly

---

##  Summary

This admin panel is designed to:

- Provide **safe data management**
- Prevent **breaking relational data**
- Give **clear visual feedback**
- Stay **fast and simple to extend**

---

Built as part of the Lumiere Major Project.