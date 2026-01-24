# Enma - AI Assistant Platform

A sleek, privacy-focused interface for open-source language models. Features a stunning black & white glassmorphism design with support for multiple AI models and customizable personas.

![Enma](public/enma-logo.svg)

## Features

- 🤖 **Multiple Models** - Switch between Gemini, GPT-5, and more
- 🎭 **Personas** - Specialized modes for coding, creative writing, analysis, tutoring, and more
- 🌊 **Real-time Streaming** - Watch AI responses flow in real-time
- 💾 **Conversation History** - Automatic saving with session persistence
- 🎨 **Elegant UI** - Pure black & white glassmorphism design
- 📱 **Mobile Ready** - Responsive design + native app support via Capacitor

---

## Running Locally

### Prerequisites
- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm))
- npm or bun

### Frontend Only (Demo Mode)

Run the app without a backend connection. AI responses will be simulated.

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
open http://localhost:5173
```

> **Note:** In demo mode, the app works with simulated AI responses. For real AI functionality, deploy via Lovable Cloud.

### With Full Backend

Deploy the project via [Lovable](https://lovable.dev) to enable:
- Real AI model responses (Gemini, GPT-5, etc.)
- User authentication
- Persistent conversation storage

---

## Building Native Apps

Enma can be built as a native iOS or Android app using Capacitor.

### Prerequisites

- **iOS:** macOS with Xcode 15+ installed
- **Android:** Android Studio with SDK 33+ installed

### Build Steps

```bash
# 1. Clone and install dependencies
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install

# 2. Build the web app
npm run build

# 3. Add native platforms
npx cap add ios      # For iOS
npx cap add android  # For Android

# 4. Sync web code to native projects
npx cap sync

# 5. Open in IDE and run
npx cap open ios     # Opens Xcode
npx cap open android # Opens Android Studio
```

### Running on Device/Emulator

```bash
# iOS (requires Mac + Xcode)
npx cap run ios

# Android (requires Android Studio)
npx cap run android
```

### Development Workflow

After making code changes:

```bash
npm run build    # Rebuild web app
npx cap sync     # Sync to native projects
npx cap run ios  # or android
```

---

## Desktop App

For a desktop native app, you can use Electron or Tauri. Here's a quick Electron setup:

```bash
# Install Electron
npm install electron electron-builder --save-dev

# Add main.js for Electron (see Electron docs)
# Configure in package.json

# Build desktop app
npm run electron:build
```

---

## Project Structure

```
├── src/
│   ├── components/     # React components
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ModelPopup.tsx
│   │   ├── PersonaPopup.tsx
│   │   └── ...
│   ├── data/
│   │   └── personas.ts # Persona definitions
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   └── utils/          # Utility functions
├── supabase/
│   └── functions/      # Edge functions (backend)
├── public/             # Static assets
└── capacitor.config.ts # Native app config
```

---

## Technologies

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **UI Components:** shadcn/ui, Framer Motion
- **Backend:** Supabase (via Lovable Cloud)
- **Native Apps:** Capacitor

---

## Learn More

- [Lovable Documentation](https://docs.lovable.dev/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
