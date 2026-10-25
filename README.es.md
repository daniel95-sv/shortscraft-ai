# ⚡ ShortsCraft AI — Generador Web Autónomo de Videos Cortos (Shorts, Reels, TikTok)

> **Estudio de creación de video vertical 100% nativo en el navegador, con costo cero de servidor, listo para almacenar en GitHub y desplegar en Cloudflare Pages.**  
> Diseñado y construido extrayendo e integrando las mejores capacidades de los 8 mejores repositorios de generación de video automatizado.

---

## 📋 Resumen del Proyecto

**ShortsCraft AI** resuelve el mayor problema de los generadores de shorts existentes (como MoneyPrinterTurbo o Remotion): **la necesidad de servidores pesados de Python, MoviePy, Docker o clusters de renderizado con GPU**.

En su lugar, **ShortsCraft AI** ejecuta toda la composición directamente en el navegador del usuario utilizando:
1. **HTML5 Canvas 60 FPS** a resolución vertical 9:16 (1080x1920).
2. **Web Audio API** con música procedural libre de copyright, efectos de sonido y **Auto-Ducking** (el volumen de la música baja automáticamente cuando el locutor habla).
3. **Web Speech API** para locución multilingüe gratuita y sin claves API.
4. **Subtítulos Cinéticos Palabra por Palabra** inspirados en Alex Hormozi y MrBeast.
5. **Editor de Escenas "Human-in-the-Loop"** (estilo Dark2C) para revisar, editar textos y cambiar videos escena por escena antes de exportar.
6. **Exportador In-Browser (MediaRecorder)**: compila y descarga el video MP4/WebM directamente en la computadora del usuario sin colas de procesamiento ni costos de servidor.

---

## 📊 Síntesis de los 8 Repositorios Analizados

| # | Repositorio | Qué aportó al nuevo proyecto |
|---|---|---|
| 1 | [`gyoridavid/short-video-maker`](https://github.com/gyoridavid/short-video-maker) | Arquitectura modular de capas visuales y línea de tiempo por escenas. |
| 2 | [`Cstrp/vml`](https://github.com/Cstrp/vml) | Tubería (pipeline) desacoplada y de alto rendimiento en módulos independientes. |
| 3 | [`harry0703/MoneyPrinterTurbo`](https://github.com/harry0703/MoneyPrinterTurbo) | Soporte multimodelo (Gemini, OpenAI, Groq), auto-ducking y personalización de subtítulos. |
| 4 | [`Chamanrajragu/purffle-shorts`](https://github.com/Chamanrajragu/purffle-shorts) | Fórmulas de plantillas virales (Curiosidades, Estoicismo, Reddit, Trivia, Tech Hacks) y generador de hashtags SEO. |
| 5 | [`Dark2C/Viral-Faceless-Shorts-Generator`](https://github.com/Dark2C/Viral-Faceless-Shorts-Generator) | **Editor Human-in-the-Loop**: tarjetas por escena para editar texto, duración y reemplazar clips antes de exportar. |
| 6 | [`expher510/eg-short-video-maker`](https://github.com/expher510/eg-short-video-maker) | Estética visual premium en modo oscuro, simulador de smartphone 9:16 y visualizador de audio en vivo. |
| 7 | [`itsPremkumar/Automated-Video-Generator`](https://github.com/itsPremkumar/Automated-Video-Generator) | Filosofía de **Costo Cero**: funciona al 100% gratis con Web Speech API y 5 fondos procedurales en Canvas. |
| 8 | [`bilalnaseer/free-video-maker`](https://github.com/bilalnaseer/free-video-maker) | Motor de subtítulos cinéticos con resalte de palabra activa (Hormozi, MrBeast, Neon, Clean Glass, Cyber). |

*El análisis técnico exhaustivo está detallado en [`REPOSITORIOS_ANALISIS.md`](./REPOSITORIOS_ANALISIS.md).*

---

## 🚀 Guía de Despliegue Paso a Paso

### Paso 1: Inicializar y Subir el Proyecto a GitHub

Abre tu terminal en la carpeta del proyecto (`c:\Users\MyPC\Documents\ShortWeb`) y ejecuta:

```bash
# 1. Inicializar git si aún no está inicializado
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el primer commit
git commit -m "feat: ShortsCraft AI - Estudio de video vertical autónomo"

# 4. Cambiar a rama principal main
git branch -M main

# 5. Conectar con tu repositorio nuevo de GitHub (reemplaza con tu usuario y repo)
git remote add origin https://github.com/TU_USUARIO/shortscraft-ai.git

# 6. Subir el código
git push -u origin main
```

---

### Paso 2: Desplegar en Cloudflare Pages

Tienes dos opciones sumamente fáciles:

#### Opción A: Conexión Automática desde el Panel de Cloudflare (Recomendada)
1. Entra a tu cuenta en [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. En el menú lateral, dirígete a **Workers & Pages** > **Overview** > haz clic en **Create application**.
3. Selecciona la pestaña **Pages** y pulsa **Connect to Git**.
4. Selecciona tu cuenta de GitHub y elige el repositorio `shortscraft-ai`.
5. En la pantalla de configuración:
   - **Project name**: `shortscraft-ai`
   - **Production branch**: `main`
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Haz clic en **Save and Deploy**.

En menos de 1 minuto, Cloudflare compilará y desplegará tu aplicación en una URL global de alta velocidad (ejemplo: `https://shortscraft-ai.pages.dev`).

#### Opción B: Despliegue Directo por Terminal con Wrangler CLI
Si prefieres desplegar directamente desde tu computadora con el CLI de Cloudflare:
```bash
# Compilar los archivos de producción
npm run build

# Desplegar a Cloudflare Pages
npx wrangler pages deploy dist --project-name=shortscraft-ai
```

---

## 🛠️ Ejecución Local

Para probar o seguir desarrollando localmente:
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo con recarga en caliente
npm run dev
```
La aplicación se abrirá en `http://localhost:3000/`.

---

## 🔒 Privacidad y Seguridad de API Keys

- Todas las claves de API (Google Gemini, OpenAI, Groq, Pexels) se almacenan de manera local y cifrada en el `localStorage` de tu navegador.
- Ningún dato ni guión pasa por servidores intermediarios; las peticiones van directamente desde tu navegador a los proveedores oficiales.
- La aplicación puede usarse de forma 100% gratuita y sin ninguna clave API utilizando el motor de plantillas y voces del navegador.
