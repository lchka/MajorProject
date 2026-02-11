# Major Project - Full Stack Application

A full-stack application with Node.js/Express backend and Prisma ORM.

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm

### Installation & Setup

1. **Clone or download the repository**
```bash
git clone <repository-url>
cd MajorProject
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**

Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
PORT=3000
JWT_SECRET="your-secret-key"
```

4. **Setup database**
```bash
npx prisma migrate dev
```

5. **Seed database (optional)**
```bash
npm run seed
```

6. **Run the server**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Project Structure

```
MajorProject/
├── server/              # Backend application
│   ├── controllers/     # Request handlers
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── repositories/    # Database access layer
│   ├── middleware/      # Express middleware
│   ├── lib/            # Database client & utilities
│   ├── utils/          # Helper functions & validators
│   └── types/          # TypeScript type definitions
├── prisma/             # Database schema & migrations
├── generated/          # Auto-generated Prisma client
└── uploads/            # File upload directory
```

## Folder Descriptions

- **server/** - Main backend application with all server-side code
- **controllers/** - Handle HTTP requests and responses
- **routes/** - Define API endpoints
- **services/** - Business logic and data processing
- **repositories/** - Database queries and data access
- **middleware/** - Authentication, validation, error handling
- **lib/** - Shared utilities and Prisma client
- **utils/** - Helper functions, validators, and database seeders
- **types/** - TypeScript type definitions
- **prisma/** - Database schema and migration files
- **uploads/** - User uploaded files storage

## Available Commands

### Running the Server
- `npm run dev` - Start development server with hot-reload
- `npm start` - Start production server

### Database
- `npm run seed` - Seed roles and users
- `npm run seed:roles` - Seed roles only
- `npm run seed:users` - Seed users only
- `npx prisma studio` - Open database GUI
- `npx prisma migrate dev` - Run migrations

### Docker
```bash
docker-compose up
```

## Technology Stack

- Node.js & Express
- TypeScript
- PostgreSQL & Prisma ORM
- JWT Authentication
- bcrypt for password hashing