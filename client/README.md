# Gemini Image Analyzer - Expo App

React Native app that uses Google Gemini AI to analyze images from camera or gallery.

## Setup

1. Install dependencies:
```bash
cd client
npm install
```

2. Get a Gemini API key:
   - Go to https://aistudio.google.com/apikey
   - Create a new API key
   - Copy the API key

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your API key to `.env`:
```
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

5. Update [App.tsx](App.tsx#L14) to use the environment variable:
```typescript
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
```

## Run

```bash
npm start
```

Then:
- Press `a` for Android
- Press `i` for iOS
- Press `w` for web
- Or scan QR code with Expo Go app

## Features

- 📷 Take photos with camera
- 🖼️ Pick images from gallery
- 🤖 AI analysis with Google Gemini
- 📱 Native mobile experience

## Required Permissions

- Camera access
- Photo library access
