# Enma - AI Assistant Platform

A sleek, privacy-focused interface for open-source language models. Features a stunning black & white glassmorphism design with support for multiple AI models, customizable personas, and file attachments.

![Enma](public/enma-logo.svg)

## Features

- 🤖 **Multiple Models** - Switch between Gemini, GPT-5, and more
- 🎭 **Personas** - Specialized modes for coding, creative writing, analysis, tutoring, and more
- 🎛️ **Fine-tuning** - Adjust temperature, top-p, and max tokens for precise control
- 📎 **File Attachments** - Upload images, PDFs, and documents for AI analysis
- 🌊 **Real-time Streaming** - Watch AI responses flow in real-time
- 💾 **Conversation History** - Automatic saving with session persistence
- 🎨 **Elegant UI** - Pure black & white glassmorphism design
- 📱 **Mobile Ready** - Responsive design + native app support via Capacitor

---

## Running Locally

### Prerequisites
- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm))
- npm, bun, or yarn

### Quick Start

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
npm install
# or: bun install

# 3. Start development server
npm run dev

# 4. Open in browser
open http://localhost:5173
```

### Environment Setup

For local development with backend features, create a `.env.local` file:

```env
VITE_SUPABASE_URL=https://vypytimuqtvsyjthkeam.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

> **Note:** In demo mode (without backend), the app works with simulated AI responses. Deploy via Lovable Cloud for real AI functionality.

---

## Model Fine-Tuning

Enma includes a settings panel to adjust AI model behavior:

| Setting | Range | Description |
|---------|-------|-------------|
| **Temperature** | 0.0 - 2.0 | Controls randomness. Lower = focused, higher = creative |
| **Top P** | 0.0 - 1.0 | Nucleus sampling. Lower = more deterministic |
| **Max Tokens** | 256 - 8192 | Maximum response length |

### Accessing Settings
1. Click the model chip in the chat input (e.g., "G3-flash")
2. Click "Fine-tune Settings" to expand the panel
3. Adjust sliders as needed

Settings persist locally in your browser.

---

## File Attachments

Enma supports uploading files for AI analysis:

| Type | Extensions | Max Size | AI Processing |
|------|------------|----------|---------------|
| Images | jpg, png, webp, gif | 10MB | Vision analysis |
| Documents | pdf | 10MB | Context extraction |
| Text | txt, md | 5MB | Include in context |
| Office | doc, docx | 10MB | Text extraction |

### How to Attach Files
1. Click the "Attach" button (📎) in the chat input
2. Select one or more files
3. Files appear as chips above the text input
4. Send your message with the attached files

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
│   │   ├── FileAttachment.tsx
│   │   ├── ModelPopup.tsx
│   │   ├── ModelSettings.tsx
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
