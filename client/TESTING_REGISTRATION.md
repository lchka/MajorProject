# 🚀 Testing Your Registration

## Test the Backend First

Open a terminal and run:

```bash
cd server

# Test registration endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "testuser@example.com",
    "password": "Test123!@#",
    "c_password": "Test123!@#"
  }'
```

You should see a success response with a token!

## Update .env for iOS

Your `.env` file should have:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Important for iOS**: If `localhost` doesn't work, try:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api
```

## Restart Expo

After changing `.env`, **restart Expo completely**:

1. Press `Ctrl+C` to stop Expo
2. Run `npm start` again
3. Press `i` for iOS or `a` for Android

## Test Credentials

Use these test credentials in the app:

- **First Name**: Test
- **Last Name**: User
- **Email**: testuser2@example.com
- **Password**: Test123!@#
- **Confirm**: Test123!@#

## Password Requirements

Your password MUST have:
- ✅ At least 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (#?!@$%^&*-)

**Valid Examples**:
- `Test123!@#`
- `Password1!`
- `MyPass123#`

**Invalid Examples**:
- `password` (no uppercase, number, or special char)
- `Password1` (no special char)
- `Pass!@#` (too short, no number)

## Troubleshooting

### Still getting "Network Error"?

1. **Check backend is running**:
   ```bash
   curl http://localhost:3000
   ```
   Should return: `API running`

2. **For iOS Simulator** - Try these API URLs in order:
   ```env
   # Option 1 (try first)
   EXPO_PUBLIC_API_URL=http://localhost:3000/api

   # Option 2
   EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api

   # Option 3 (if using Mac)
   EXPO_PUBLIC_API_URL=http://$(ipconfig getifaddr en0):3000/api
   ```

3. **For Android Emulator**:
   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
   ```

4. **Always restart Expo after changing .env**

### Backend Errors?

If you see validation errors from the backend, check:
- All fields are filled in
- Password meets all requirements
- Email is valid format

## Success! 🎉

When registration works, you'll see:
- "Success!" alert
- "Your account has been created successfully"
- Form will clear
- Check your backend console for the new user!

You can verify in Prisma Studio:
```bash
cd server
npx prisma studio
```

Navigate to the `User` model to see your newly created user.
