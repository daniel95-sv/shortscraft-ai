# ⚡ ShortsCraft AI — Automated Vertical Video Creator for the Web

> **A 100% Client-Side, Zero-Cost, Web-Native Video Generation Studio for TikTok, YouTube Shorts, and Instagram Reels.**  
> Built from the ground up by analyzing and extracting the best architecture from the top 8 open-source video generation repositories.  
> **Optimized for direct deployment on Cloudflare Pages and version control on GitHub.**

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Built with HTML5 & Canvas 60FPS](https://img.shields.io/badge/Render-Canvas%2060FPS-06B6D4?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-8B5CF6?style=for-the-badge)](LICENSE)

---

## 🌟 Why ShortsCraft AI?

Existing automated short video makers (like MoneyPrinterTurbo, Remotion-based tools, or Python MoviePy scripts) require heavy Python/FFmpeg servers, Docker containers, or expensive GPU/Node.js rendering clusters.

**ShortsCraft AI solves this completely**:
- **0 Server Costs**: The entire rendering pipeline runs in the user's browser using HTML5 Canvas, Web Audio API, and MediaRecorder.
- **Instant Deployment**: Deploy globally to **Cloudflare Pages** in seconds with 0 backend servers to maintain.
- **Zero-Cost / Free-First**: Operates 100% free with browser-native Web Speech API and 5 built-in procedural 60 FPS motion graphics—no paid API keys required.
- **BYOK (Bring Your Own Key)**: Optionally connect Google Gemini, OpenAI GPT-4o-mini, Groq Llama 3, or Pexels API. All keys are stored safely in client `localStorage` and never touch an intermediate server.

---

## 📊 Technical Analysis of the 8 Repositories

We systematically reviewed and extracted the best capabilities from each repository in `ListaRepositorios.txt`:

| # | Repository | Core Strength Extracted | How ShortsCraft AI Implements It |
|---|---|---|---|
| 1 | [`gyoridavid/short-video-maker`](https://github.com/gyoridavid/short-video-maker) | Modular composition pipeline & REST/MCP data models | Clean layer structure (`background`, `contrast vignette`, `kinetic captions`, `top progress bar`, `audio mixer`). |
| 2 | [`Cstrp/vml`](https://github.com/Cstrp/vml) | Decoupled pipeline & high performance | Pure modular JavaScript ES modules (`ai-engine`, `tts-engine`, `compositor`, `audio-mixer`, `recorder`). |
| 3 | [`harry0703/MoneyPrinterTurbo`](https://github.com/harry0703/MoneyPrinterTurbo) | Multi-LLM provider & audio auto-ducking | Multi-model script generation (Gemini, OpenAI, Groq) + real-time **Web Audio Auto-Ducking** (music lowers 80% when voice speaks). |
| 4 | [`Chamanrajragu/purffle-shorts`](https://github.com/Chamanrajragu/purffle-shorts) | High-converting viral templates & SEO hashtags | 5 built-in viral templates (Facts, Stoic, Reddit stories, Quiz/Trivia, Tech Hacks) + 1-click hashtag & description copy. |
| 5 | [`Dark2C/Viral-Faceless-Shorts-Generator`](https://github.com/Dark2C/Viral-Faceless-Shorts-Generator) | **Human-in-the-Loop Scene Editor** | Full scene card editor: edit text, tweak duration, upload custom B-roll, or search Pexels per individual scene before exporting. |
| 6 | [`expher510/eg-short-video-maker`](https://github.com/expher510/eg-short-video-maker) | Modern sleek UI/UX & preview player | Dark glassmorphism studio, realistic 9:16 smartphone simulator, live audio visualizer, responsive timeline. |
| 7 | [`itsPremkumar/Automated-Video-Generator`](https://github.com/itsPremkumar/Automated-Video-Generator) | Zero-cost philosophy & offline fallbacks | Operates without forced paid subscriptions using Web Speech API + 5 procedural 60 FPS canvas motion graphic loops. |
| 8 | [`bilalnaseer/free-video-maker`](https://github.com/bilalnaseer/free-video-maker) | Kinetic Word-by-Word Viral Subtitles | Live Alex Hormozi (yellow pop + black outline), MrBeast badge pop, TikTok Neon, Clean Glass, and Cyberpunk subtitle engines. |

*Full in-depth technical analysis available in [`REPOSITORIOS_ANALISIS.md`](./REPOSITORIOS_ANALISIS.md).*

---

## 🚀 Key Features

- **📱 9:16 Smartphone Simulator**: Real-time 60 FPS live preview with timeline scrubber, play/pause, rewind, and audio waveform indicator.
- **👑 Kinetic Viral Subtitles**: Word-by-word animated highlights (Alex Hormozi, MrBeast, TikTok Neon, Clean Glass, Cyberpunk).
- **🎙️ Dual Voiceover System**:
  - **Native Web Speech API**: 100% free, zero keys, multilingual (Spanish, English, Portuguese, etc.), customizable rate and pitch.
  - Precise word-level cadence calculations for kinetic subtitle synchronization.
- **🎵 Web Audio Mixer & Auto-Ducking**: Procedural royalty-free background tracks (Lofi, Epic, Upbeat, Suspense) + sound effects (Whoosh, Pop, Ding) with dynamic gain ducking during speech.
- **🎨 5 Procedural 60 FPS Canvas Backgrounds**: Cyberpunk Grid & Retro Sun, Deep Space Starfield, Aurora Borealis Wave, Matrix Cyber Code, and Satisfying Isometric Cubes.
- **🎬 Per-Scene Media Customization**: Drag and drop your own MP4, WebM, PNG, JPG, or GIF for any individual scene.
- **⚡ In-Browser Exporter**: High-resolution 1080x1920 video export using `MediaRecorder` + `canvas.captureStream(60)`. Direct download to your machine with 0 server rendering queues.

---

## 🛠️ Project Structure

```
ShortWeb/
├── .github/
│   └── workflows/
│       └── deploy-cloudflare.yml  # Automated GitHub Actions deployment to Cloudflare Pages
├── src/
│   ├── ai-engine.js               # Multi-LLM provider + 5 built-in viral template packs
│   ├── app.js                     # Main controller & Human-in-the-Loop scene editor
│   ├── audio-mixer.js             # Web Audio API mixer with auto-ducking & sound FX
│   ├── caption-animator.js        # Kinetic word-by-word subtitle rendering engine
│   ├── compositor.js              # 9:16 1080x1920 Canvas 60 FPS compositor & timeline
│   ├── media-service.js           # Pexels API search & 5 procedural motion graphic engines
│   ├── recorder.js                # MediaRecorder client-side video compilation & download
│   ├── storage.js                 # LocalStorage persistence for settings & API keys
│   └── tts-engine.js              # Web Speech API & cadence timestamp calculator
├── styles/
│   ├── editor.css                 # Scene cards, subtitle styles, and modals
│   ├── main.css                   # Dark glassmorphism theme & design system
│   └── player.css                 # 9:16 smartphone preview simulator & timeline
├── _headers                       # Cloudflare Pages security & performance headers
├── index.html                     # Main application layout
├── package.json                   # Vite dev server & build scripts
├── vite.config.js                 # Vite bundler configuration
├── wrangler.toml                  # Cloudflare Pages configuration
├── ListaRepositorios.txt          # Original repository reference list
├── REPOSITORIOS_ANALISIS.md       # Full comparative analysis document
└── README.md                      # Documentation
```

---

## 💻 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/shortscraft-ai.git
   cd shortscraft-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000/` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```
   Production-ready files will be generated in the `dist/` directory.

---

## ☁️ Deployment to Cloudflare Pages

### Option 1: Automatic Deployment via GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: Initial commit of ShortsCraft AI"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/shortscraft-ai.git
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   - Select your GitHub repository (`shortscraft-ai`).
   - Configure build settings:
     - **Framework preset**: `Vite` (or `None`)
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
   - Click **Save and Deploy**.

Cloudflare will deploy your site to a global edge URL (e.g. `https://shortscraft-ai.pages.dev`) in under 60 seconds with automatic SSL and zero server maintenance!

---

### Option 2: Deploy using Wrangler CLI

If you prefer deploying directly from your terminal:
```bash
npm run build
npx wrangler pages deploy dist --project-name=shortscraft-ai
```

---

## 🔒 Privacy & Security

- **100% Client-Side**: No audio, video, or script is sent to an external server unless you configure an API key.
- **Secure Key Storage**: API keys (Gemini, OpenAI, Groq, Pexels) are stored strictly in your browser's `localStorage`.
- **No Tracking**: Free of third-party trackers or telemetry.

---

## 📄 License

This project is licensed under the [MIT License](./package.json).
