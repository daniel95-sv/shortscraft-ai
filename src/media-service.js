/**
 * Media Service
 * Manages background videos, procedural motion graphics, and stock footage search.
 * Provides 5 built-in 60 FPS procedural canvas motion graphics (Zero API keys needed),
 * Pexels API search, and direct user video/image upload support.
 */

export const MediaService = {
  videoCache: new Map(),
  customMedia: new Map(), // sceneId -> HTMLVideoElement or HTMLImageElement

  /**
   * Search stock videos from Pexels API
   */
  async searchPexelsVideos(query, pexelsApiKey, perPage = 5) {
    if (!pexelsApiKey) {
      return { error: 'Se requiere una API Key de Pexels para búsqueda en vivo.', results: [] };
    }

    try {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=medium&per_page=${perPage}`;
      const res = await fetch(url, {
        headers: { Authorization: pexelsApiKey },
      });
      if (!res.ok) throw new Error(`Pexels error ${res.status}`);
      const data = await res.json();

      const results = (data.videos || []).map((v) => {
        // Pick best portrait HD or SD video file
        const file = v.video_files.find((f) => f.quality === 'hd' && f.width <= 1080) || v.video_files[0];
        return {
          id: v.id,
          thumbnail: v.image,
          url: file?.link || '',
          duration: v.duration,
          author: v.user?.name || 'Pexels Creator',
        };
      });

      return { results };
    } catch (err) {
      console.warn('Pexels search failed:', err);
      return { error: err.message, results: [] };
    }
  },

  /**
   * Sets custom media (video or image) uploaded by the user for a specific scene
   */
  setCustomMediaForScene(sceneId, file) {
    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video');

    if (isVideo) {
      const vid = document.createElement('video');
      vid.src = objectUrl;
      vid.crossOrigin = 'anonymous';
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.play().catch(() => {});
      this.customMedia.set(sceneId, { type: 'video', element: vid, url: objectUrl });
    } else {
      const img = new Image();
      img.src = objectUrl;
      this.customMedia.set(sceneId, { type: 'image', element: img, url: objectUrl });
    }
  },

  getCustomMedia(sceneId) {
    return this.customMedia.get(sceneId) || null;
  },

  /**
   * Procedural Motion Graphics Generators (Render directly onto canvas at 60 FPS)
   */
  proceduralBackgrounds: {
    'cyber-grid': {
      name: '🌆 Cyberpunk Grid & Sun',
      draw(ctx, w, h, time) {
        // Dark purple gradient sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#0a001a');
        skyGrad.addColorStop(0.45, '#1e0538');
        skyGrad.addColorStop(0.55, '#3b0764');
        skyGrad.addColorStop(1, '#05010d');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        const horizon = h * 0.55;

        // Retro Glowing Sun
        const sunRadius = w * 0.28;
        const sunY = horizon - sunRadius * 0.35;
        const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, horizon);
        sunGrad.addColorStop(0, '#facc15');
        sunGrad.addColorStop(0.5, '#ec4899');
        sunGrad.addColorStop(1, '#9333ea');

        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fillStyle = sunGrad;
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 40;
        ctx.fill();

        // Sun horizontal scanline bars
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0a001a';
        for (let i = 0; i < 7; i++) {
          const barY = sunY - sunRadius * 0.2 + i * (sunRadius * 0.16);
          const barH = 4 + i * 3.5;
          ctx.fillRect(w / 2 - sunRadius, barY, sunRadius * 2, barH);
        }
        ctx.restore();

        // 3D Perspective Grid
        ctx.save();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 15;

        // Perspective converging lines
        const vanishingX = w / 2;
        const cols = 16;
        for (let i = -cols; i <= cols; i++) {
          const bottomX = vanishingX + i * (w / 6);
          ctx.beginPath();
          ctx.moveTo(vanishingX, horizon);
          ctx.lineTo(bottomX, h);
          ctx.stroke();
        }

        // Animated moving horizontal lines
        const speed = 140; // pixels per sec
        const offset = (time * speed) % 80;
        for (let y = horizon; y <= h; y += 40) {
          const perspectiveY = horizon + Math.pow((y - horizon + offset) / (h - horizon), 1.8) * (h - horizon);
          if (perspectiveY <= h) {
            ctx.beginPath();
            ctx.moveTo(0, perspectiveY);
            ctx.lineTo(w, perspectiveY);
            ctx.stroke();
          }
        }
        ctx.restore();
      },
    },

    'deep-space': {
      name: '🌌 Deep Space Starfield & Nebula',
      stars: null,
      draw(ctx, w, h, time) {
        // Deep void background
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, w, h);

        // Nebula cloud glow
        const nebulaGrad = ctx.createRadialGradient(
          w * 0.4 + Math.sin(time * 0.5) * 80,
          h * 0.45 + Math.cos(time * 0.4) * 100,
          20,
          w * 0.5,
          h * 0.5,
          w * 0.8
        );
        nebulaGrad.addColorStop(0, 'rgba(147, 51, 234, 0.4)');
        nebulaGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.25)');
        nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, w, h);

        // Initialize 300 stars once
        if (!this.stars) {
          this.stars = Array.from({ length: 280 }, () => ({
            x: (Math.random() - 0.5) * 2000,
            y: (Math.random() - 0.5) * 2000,
            z: Math.random() * 1000 + 1,
            size: Math.random() * 2 + 1,
          }));
        }

        // Warp stars towards camera
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        const cx = w / 2;
        const cy = h / 2;
        const speed = 400;

        for (const s of this.stars) {
          s.z -= speed * 0.016;
          if (s.z <= 0) {
            s.z = 1000;
            s.x = (Math.random() - 0.5) * 2000;
            s.y = (Math.random() - 0.5) * 2000;
          }

          const k = 400 / s.z;
          const px = s.x * k + cx;
          const py = s.y * k + cy;

          if (px >= 0 && px <= w && py >= 0 && py <= h) {
            const alpha = Math.min(1, (1000 - s.z) / 400);
            const radius = s.size * k * 0.8;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      },
    },

    'aurora-wave': {
      name: '🌈 Aurora Borealis Wave',
      draw(ctx, w, h, time) {
        // Deep indigo night
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(0.7, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Dynamic fluid aurora ribbon layers
        const layers = [
          { color: 'rgba(16, 185, 129, 0.45)', speed: 1.0, freq: 0.003, yOffset: h * 0.35 },
          { color: 'rgba(6, 182, 212, 0.45)', speed: 1.3, freq: 0.004, yOffset: h * 0.45 },
          { color: 'rgba(168, 85, 247, 0.4)', speed: 0.8, freq: 0.0025, yOffset: h * 0.55 },
        ];

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        layers.forEach((layer) => {
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 15) {
            const wave1 = Math.sin(x * layer.freq + time * layer.speed) * 90;
            const wave2 = Math.cos(x * 0.007 - time * 0.6) * 60;
            const y = layer.yOffset + wave1 + wave2;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();

          const ribbonGrad = ctx.createLinearGradient(0, layer.yOffset - 100, 0, layer.yOffset + 300);
          ribbonGrad.addColorStop(0, layer.color);
          ribbonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = ribbonGrad;
          ctx.shadowColor = layer.color;
          ctx.shadowBlur = 35;
          ctx.fill();
        });
        ctx.restore();
      },
    },

    'matrix-rain': {
      name: '💻 Matrix Cyber Code',
      columns: null,
      draw(ctx, w, h, time) {
        // Dark trail fade
        ctx.fillStyle = 'rgba(5, 5, 10, 0.3)';
        ctx.fillRect(0, 0, w, h);

        const colWidth = 28;
        const totalCols = Math.floor(w / colWidth);

        if (!this.columns || this.columns.length !== totalCols) {
          this.columns = Array.from({ length: totalCols }, () => Math.random() * -100);
        }

        ctx.save();
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';

        const chars = '0123456789ABCDEFΞΨΩ⚡✦★010110';

        this.columns.forEach((y, i) => {
          const x = i * colWidth + colWidth / 2;
          const char = chars[Math.floor(Math.random() * chars.length)];

          // Lead glowing character
          ctx.fillStyle = '#a7f3d0';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12;
          ctx.fillText(char, x, y);

          // Update position
          this.columns[i] += 12;
          if (this.columns[i] > h && Math.random() > 0.96) {
            this.columns[i] = 0;
          }
        });
        ctx.restore();
      },
    },

    'satisfying-blocks': {
      name: '🧊 Satisfying Isometric Cubes',
      draw(ctx, w, h, time) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const gridSize = 7;
        const tileSize = 60;

        ctx.save();
        ctx.translate(cx, cy);

        for (let x = -gridSize; x <= gridSize; x++) {
          for (let y = -gridSize; y <= gridSize; y++) {
            const dist = Math.sqrt(x * x + y * y);
            const height = Math.sin(dist * 0.7 - time * 2.5) * 45;

            // Isometric projection
            const isoX = (x - y) * tileSize * 0.866;
            const isoY = (x + y) * tileSize * 0.5 - height;

            // Draw 3D top face
            ctx.beginPath();
            ctx.moveTo(isoX, isoY - 20);
            ctx.lineTo(isoX + 25, isoY - 5);
            ctx.lineTo(isoX, isoY + 10);
            ctx.lineTo(isoX - 25, isoY - 5);
            ctx.closePath();

            const hue = (dist * 25 + time * 40) % 360;
            ctx.fillStyle = `hsl(${hue}, 85%, 60%)`;
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
        ctx.restore();
      },
    },
  },
};
