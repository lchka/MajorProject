# 🔧 NETWORK CONNECTION FIX

## Changes Made

I've updated your backend server to:
1. ✅ Accept requests from ANY origin (for development)
2. ✅ Listen on all network interfaces (0.0.0.0)

## Step-by-Step Fix

### Step 1: Restart Your Backend Server

**IMPORTANT**: You MUST restart your backend for the changes to take effect!

```bash
cd server

# Stop the server (Ctrl+C if running)
# Then start it again:
npm run dev
```

You should see:
```
Server running on port 3000
Local: http://localhost:3000
Network: http://127.0.0.1:3000
```

### Step 2: Choose the Right API URL for Your .env

Your computer's IP address is: **192.168.1.9**

Update `client/.env` with **ONE** of these options:

#### Option 1: Using Your Computer's IP (RECOMMENDED for iOS Simulator)
```env
EXPO_PUBLIC_API_URL=http://192.168.1.9:3000/api
```

#### Option 2: Using 127.0.0.1
```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api
```

#### Option 3: Using localhost
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Try Option 1 first!**

### Step 3: Restart Expo

After changing `.env`, **RESTART Expo completely**:

```bash
cd client

# Stop Expo (Ctrl+C)
# Then start it again:
npm start
```

Press `i` for iOS Simulator

### Step 4: Test Registration

Use these test credentials:
- **First Name**: John
- **Last Name**: Doe
- **Email**: john.doe123@example.com
- **Password**: Test1234#
- **Confirm**: Test1234#

---

## Still Not Working?

### Verify Backend is Running

Open a new terminal and run:
```bash
curl http://localhost:3000
```

Should return: `API running`

### Test the Registration Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "password": "Test1234#",
    "c_password": "Test1234#"
  }'
```

Should return a success response with a token.

### Check Your Firewall

Make sure your firewall isn't blocking port 3000:
- Windows: Check Windows Defender Firewall
- Temporarily disable to test if that's the issue

### Alternative: Use Android Emulator

If iOS continues to have issues, try Android:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

Then press `a` in Expo to open Android emulator.

---

## Quick Reference

| Environment | API URL |
|-------------|---------|
| iOS Simulator | `http://192.168.1.9:3000/api` |
| Android Emulator | `http://10.0.2.2:3000/api` |
| Physical Device (same WiFi) | `http://192.168.1.9:3000/api` |

---

## After It Works

Once registration works, you can tighten security by updating `server/index.ts`:

```typescript
app.use(cors({
  origin: ['http://localhost:8081', 'http://192.168.1.9:8081'],
  credentials: true
}));
```

But for now, leave it open for development!
