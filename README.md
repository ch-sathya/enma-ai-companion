Feel free to tweak the changes
1. Enma is still incomplete the ai models present in the app are partially working and some are not. 
2. The load animation and the sidebar need to be tweaked.
3. The voice assistant and also the voice feedback is not working.
4. Need to fix all these things and also to add a katana as a logo of the app.






# Enma - AI Assistant Platform

A sleek, privacy-focused interface for open-source language models. Features a stunning black & white glassmorphism design with support for multiple AI models, customizable personas, and file attachments.

## Features

- 🤖 **Multiple Models** - Switch between Gemini, GPT-5, and more
- 🎭 **Personas** - Specialized modes for coding, creative writing, analysis, tutoring, and more
- 🎛️ **Fine-tuning** - Adjust temperature, top-p, and max tokens for precise control
- 📎 **File Attachments** - Upload images, PDFs, and documents for AI analysis
- 🌊 **Real-time Streaming** - Watch AI responses flow in real-time
- 💾 **Conversation History** - Automatic saving with session persistence
- 🎨 **Elegant UI** - Pure black & white glassmorphism design
- 🎤 **Voice Input** - Free browser-based speech recognition
- 🔊 **Voice Responses** - Natural text-to-speech with multiple voice options
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

## Building Desktop App

Enma can be built as a standalone desktop application using Electron or Tauri.

### Option 1: Electron (Cross-platform)

Electron creates native desktop apps for Windows, macOS, and Linux.

#### Prerequisites
- Node.js 18+
- npm or yarn

#### Setup Steps

```bash
# 1. Install Electron dependencies
npm install --save-dev electron electron-builder concurrently wait-on

# 2. Create electron/main.js
mkdir electron
```

Create `electron/main.js`:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset', // macOS frameless style
    backgroundColor: '#000000',
    icon: path.join(__dirname, '../public/favicon.ico'),
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

Add to `package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build && electron-builder"
  },
  "build": {
    "appId": "app.enma.assistant",
    "productName": "Enma",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

#### Build Commands

```bash
# Development mode with hot reload
npm run electron:dev

# Build for production
npm run electron:build

# Output locations:
# - macOS: release/Enma-x.x.x.dmg
# - Windows: release/Enma Setup x.x.x.exe
# - Linux: release/Enma-x.x.x.AppImage
```

---

### Option 2: Tauri (Lightweight, Rust-based)

Tauri creates smaller, faster desktop apps using Rust.

#### Prerequisites
- Node.js 18+
- Rust ([install from rustup.rs](https://rustup.rs))
- Platform-specific dependencies:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Visual Studio Build Tools
  - **Linux**: `sudo apt install libwebkit2gtk-4.0-dev build-essential`

#### Setup Steps

```bash
# 1. Install Tauri CLI
npm install --save-dev @tauri-apps/cli

# 2. Initialize Tauri
npx tauri init

# When prompted:
# - App name: Enma
# - Window title: Enma
# - Dev server URL: http://localhost:5173
# - Dev command: npm run dev
# - Build command: npm run build
# - Frontend dist: ../dist
```

#### Build Commands

```bash
# Development mode
npm run tauri dev

# Build for production
npm run tauri build

# Output: src-tauri/target/release/bundle/
```

---

## Building Mobile Apps (Android APK & iOS)

Enma uses Capacitor to create native mobile applications.

### Prerequisites

- Node.js 18+
- **Android**: Android Studio with SDK 33+ and Java JDK 17+
- **iOS**: macOS with Xcode 15+ (iOS only)

### Initial Setup

```bash
# 1. Clone and install dependencies
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install

# 2. Build the web app
npm run build

# 3. Add native platforms
npx cap add android    # For Android
npx cap add ios        # For iOS (macOS only)

# 4. Sync web code to native projects
npx cap sync
```

---

### Building Android APK

#### Debug APK (For Testing)

```bash
# 1. Open in Android Studio
npx cap open android

# 2. In Android Studio:
#    Build > Build Bundle(s) / APK(s) > Build APK(s)

# 3. APK location:
#    android/app/build/outputs/apk/debug/app-debug.apk
```

#### Command Line Build

```bash
# Navigate to android folder
cd android

# Build debug APK
./gradlew assembleDebug

# Build release APK (unsigned)
./gradlew assembleRelease

# APK locations:
# Debug: app/build/outputs/apk/debug/app-debug.apk
# Release: app/build/outputs/apk/release/app-release-unsigned.apk
```

#### Signed Release APK (For Google Play Store)

```bash
# 1. Generate a keystore (one-time)
keytool -genkey -v -keystore enma-release.keystore -alias enma -keyalg RSA -keysize 2048 -validity 10000

# 2. Create android/keystore.properties
cat > android/keystore.properties << EOF
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=enma
storeFile=../enma-release.keystore
EOF

# 3. Update android/app/build.gradle to use the keystore
# Add this in the android { } block:

android {
    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("keystore.properties")
            def keystoreProperties = new Properties()
            keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}

# 4. Build signed APK
./gradlew assembleRelease

# Signed APK: app/build/outputs/apk/release/app-release.apk
```

---

### Building iOS App

> **Note:** iOS builds require macOS with Xcode installed.

```bash
# 1. Open in Xcode
npx cap open ios

# 2. In Xcode:
#    - Select your development team in Signing & Capabilities
#    - Choose your device or simulator
#    - Product > Build (Cmd+B)
#    - Product > Run (Cmd+R)

# 3. For App Store distribution:
#    - Product > Archive
#    - Window > Organizer > Distribute App
```

---

### Development Workflow

After making code changes:

```bash
# 1. Rebuild web app
npm run build

# 2. Sync to native projects
npx cap sync

# 3. Run on device/emulator
npx cap run android  # or
npx cap run ios
```

### Hot Reload (Development)

For faster development with hot reload:

```bash
# 1. Start dev server
npm run dev

# 2. Update capacitor.config.ts to use dev server:
# server: {
#   url: "http://YOUR_LOCAL_IP:5173",
#   cleartext: true
# }

# 3. Sync and run
npx cap sync
npx cap run android
```

---

## Model Fine-Tuning

Enma includes a settings panel to adjust AI model behavior:

| Setting | Range | Description |
|---------|-------|-------------|
| **Temperature** | 0.0 - 2.0 | Controls randomness. Lower = focused, higher = creative |
| **Top P** | 0.0 - 1.0 | Nucleus sampling. Lower = more deterministic |
| **Max Tokens** | 256 - 8192 | Maximum response length |

### Accessing Settings
1. Click the settings icon (⚙️) in the chat input
2. Select your model
3. Expand "Fine-tune Settings" to adjust sliders

Settings persist locally in your browser.

---

## Voice Features

Enma includes free voice capabilities using browser APIs:

### Voice Input (Speech-to-Text)
- Click the microphone icon to speak your message
- Works in Chrome, Edge, and Safari
- Completely free - no API keys needed

### Voice Output (Text-to-Speech)
- Enable in Settings to have Enma speak responses
- Multiple voice options available
- Preview voices before selecting
- Optimized for natural-sounding speech

### Wake Word Detection
- Enable in Settings
- Say "Enma" to activate voice input
- Hands-free operation

---

## File Attachments

| Type | Extensions | Max Size | AI Processing |
|------|------------|----------|---------------|
| Images | jpg, png, webp, gif | 10MB | Vision analysis |
| Documents | pdf | 10MB | Context extraction |
| Text | txt, md | 5MB | Include in context |
| Office | doc, docx | 10MB | Text extraction |

---

## Project Structure

```
├── src/
│   ├── components/     # React components
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ModelPopup.tsx
│   │   ├── SettingsPopup.tsx
│   │   └── ...
│   ├── hooks/          # Custom React hooks
│   │   ├── useVoice.ts
│   │   ├── useChat.ts
│   │   └── ...
│   ├── pages/          # Page components
│   └── utils/          # Utility functions
├── supabase/
│   └── functions/      # Edge functions (backend)
├── public/             # Static assets
├── android/            # Android native project (after cap add)
├── ios/                # iOS native project (after cap add)
├── electron/           # Electron main process (if using)
└── capacitor.config.ts # Native app config
```

---

## Technologies

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **UI Components:** shadcn/ui, Framer Motion
- **Backend:** Supabase (via Lovable Cloud)
- **Native Apps:** Capacitor
- **Desktop Apps:** Electron or Tauri (optional)
- **Voice:** Web Speech API (free)

---

## Troubleshooting

### Voice Not Working
- Ensure you're using Chrome, Edge, or Safari
- Grant microphone permissions when prompted
- Check that your system audio is working

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Clear build cache: `rm -rf node_modules/.vite dist`
- For Android: Ensure Java 17+ is installed

### Mobile App Issues
- Run `npx cap sync` after any code changes
- Ensure Android Studio / Xcode are up to date
- Check Capacitor logs: `npx cap run android --verbose`

---

## Learn More

- [Lovable Documentation](https://docs.lovable.dev/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Supabase Documentation](https://supabase.com/docs)
