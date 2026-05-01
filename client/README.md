# Gemini Image Analyzer - Expo App

A React Native (Expo) mobile application that uses Google Gemini AI to analyse images from the camera or photo library.

---

## Setup

1. Install dependencies:

    cd client
    npm install

2. Generate a Gemini API key:

- Visit: https://aistudio.google.com/apikey  
- Create a new API key  
- Copy the generated key  

3. Create an environment file:

    cp .env.example .env

4. Add your API key to `.env`:

    EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here

Environment variables prefixed with `EXPO_PUBLIC_` are accessible within the application.

5. Use the API key in your application:

    const genAI = new GoogleGenerativeAI(
      process.env.EXPO_PUBLIC_GEMINI_API_KEY || ""
    );

---

## Running the App

    npm start

Then choose a platform:

- Press `a` for Android  
- Press `i` for iOS  
- Press `w` for web  
- Or scan the QR code using the Expo Go app  

---

## Features

- Capture images using the device camera  
- Select images from the photo library  
- AI-powered image analysis using Google Gemini  
- Cross-platform support (iOS, Android, Web)  

---

## Required Permissions

- Camera access  
- Photo library access  

---

## Notes

- Ensure the API key is valid and active  
- Restart the application after updating environment variables  