/**
 * Caption Animator
 * Renders viral word-by-word kinetic subtitles directly onto the 9:16 Canvas.
 * Supports Alex Hormozi style, MrBeast pop style, TikTok Neon, Clean Minimal, and Cyberpunk.
 * 
 * Optimized for high performance and fluid 60 FPS rendering.
 */

export const CaptionAnimator = {
  styles: {
    hormozi: {
      name: '👑 Alex Hormozi (Bold Pop & Stroke)',
      fontFamily: "'Outfit', 'Montserrat', sans-serif",
      fontWeight: '900',
      activeColor: '#FACC15', // Vibrant yellow
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidthRatio: 0.11, // Calibrated so letters stay crisp without overlapping
      scaleActive: 1.15,
      uppercase: true,
      shadowBlur: 6,
      shadowColor: 'rgba(0, 0, 0, 0.8)',
    },

    mrbeast: {
      name: '💥 MrBeast (Punchy Slant & Badge)',
      fontFamily: "'Outfit', 'Impact', sans-serif",
      fontWeight: '900',
      activeColor: '#38BDF8', // Cyan
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidthRatio: 0.12,
      scaleActive: 1.16,
      uppercase: true,
      hasBadge: true,
      badgeColor: '#E11D48', // Vibrant red
      shadowBlur: 8,
      shadowColor: 'rgba(0,0,0,0.9)',
    },

    neon: {
      name: '⚡ TikTok Neon Glow',
      fontFamily: "'Outfit', sans-serif",
      fontWeight: '800',
      activeColor: '#22D3EE', // Electric cyan
      textColor: '#F8FAFC',
      strokeColor: '#0F172A',
      strokeWidthRatio: 0.08,
      scaleActive: 1.12,
      uppercase: true,
      shadowBlur: 10,
      shadowColor: '#06B6D4',
    },

    clean: {
      name: '✨ Minimalist Clean Glass',
      fontFamily: "'Inter', sans-serif",
      fontWeight: '700',
      activeColor: '#60A5FA',
      textColor: '#FFFFFF',
      strokeColor: 'rgba(0, 0, 0, 0.6)',
      strokeWidthRatio: 0.06,
      scaleActive: 1.08,
      uppercase: false,
      hasPill: true,
      shadowBlur: 4,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
    },

    fire: {
      name: '🔥 Fuego Rojo / Naranja Viral',
      fontFamily: "'Anton', 'Montserrat', sans-serif",
      fontWeight: '900',
      activeColor: '#FF3B00',
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidthRatio: 0.11,
      scaleActive: 1.15,
      uppercase: true,
      shadowBlur: 18,
      shadowColor: '#FF5500',
    },

    box: {
      name: '🎬 Caja Cineasta Oscura',
      fontFamily: "'Montserrat', 'Anton', sans-serif",
      fontWeight: '900',
      activeColor: '#FFE600',
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidthRatio: 0.10,
      scaleActive: 1.10,
      uppercase: true,
      hasPill: true,
      pillBgColor: 'rgba(0, 0, 0, 0.88)',
      pillBorderColor: 'rgba(255, 255, 255, 0.15)',
    },

    cyber: {
      name: '👾 Cyberpunk Glitch',
      fontFamily: "monospace, 'Outfit'",
      fontWeight: '800',
      activeColor: '#4ADE80',
      textColor: '#F3F4F6',
      strokeColor: '#1E1B4B',
      strokeWidthRatio: 0.10,
      scaleActive: 1.14,
      uppercase: true,
      shadowBlur: 8,
      shadowColor: '#10B981',
    },
  },

  /**
   * Draws kinetic captions for current scene and elapsed time
   */
  drawCaptions({
    ctx,
    canvasWidth,
    canvasHeight,
    words,
    sceneElapsedSec,
    styleKey = 'hormozi',
    fontSize = 58,
    yPercent = 70, // 70% from top (ideal 9:16 Shorts viewing zone)
    customColors = null,
    fontFamilyOverride = null,
    activeWordIndexOverride = -1,
  }) {
    if (!words || words.length === 0) return;

    const style = this.styles[styleKey] || this.styles.hormozi;
    const activeColor = customColors?.highlightColor || style.activeColor;
    const primaryColor = customColors?.primaryColor || style.textColor;
    const strokeColor = customColors?.strokeColor || style.strokeColor;
    const scale = canvasWidth / 1080;

    // 1. SYNCHRONIZATION: Only hold before first word if no active boundary is currently speaking
    const firstWordStart = words[0]?.startSec ?? 0;
    if (activeWordIndexOverride < 0 && sceneElapsedSec < Math.max(0, firstWordStart - 0.05)) {
      return; // Clean canvas before audio starts
    }

    // Determine currently spoken word index
    let activeWordIndex = -1;
    if (activeWordIndexOverride >= 0 && activeWordIndexOverride < words.length) {
      activeWordIndex = activeWordIndexOverride;
    } else {
      for (let i = 0; i < words.length; i++) {
        if (sceneElapsedSec >= words[i].startSec && sceneElapsedSec <= words[i].endSec) {
          activeWordIndex = i;
          break;
        }
      }
      // If between words or in trailing pause before scene end, highlight active or last spoken
      if (activeWordIndex === -1 && sceneElapsedSec >= firstWordStart) {
        for (let i = words.length - 1; i >= 0; i--) {
          if (sceneElapsedSec >= words[i].endSec) {
            activeWordIndex = i;
            break;
          }
        }
        if (activeWordIndex === -1) activeWordIndex = 0;
      }
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Group words into punchy 2-3 word visual chunks for high-retention readability
    const chunkSize = 3;
    const currentChunkIndex = activeWordIndex >= 0 ? Math.floor(activeWordIndex / chunkSize) : 0;
    const chunkWords = words.slice(currentChunkIndex * chunkSize, (currentChunkIndex + 1) * chunkSize);

    const centerY = canvasHeight * (yPercent / 100);

    // Initial font measurement
    let currentFontSize = fontSize;
    const effectiveFontFamily = fontFamilyOverride ? `'${fontFamilyOverride}', ${style.fontFamily}` : style.fontFamily;
    ctx.font = `${style.fontWeight} ${Math.round(currentFontSize)}px ${effectiveFontFamily}`;

    // Generous letter spacing so letters in condensed fonts (like Anton/Montserrat) never touch or overlap
    const letterSpacingPx = Math.max(2, Math.round(currentFontSize * 0.045));
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = `${letterSpacingPx}px`;
    }

    // Proportional word spacing + clearance buffer for the active word pop-in scale animation
    const scaleFactor = style.scaleActive || 1.15;
    const baseWordSpacing = Math.round(currentFontSize * 0.42);
    const activeExpansionClearance = Math.round(currentFontSize * (scaleFactor - 1.0) * 0.85);
    const wordSpacings = baseWordSpacing + activeExpansionClearance;

    let measuredWords = chunkWords.map((item, localIdx) => {
      const globalIdx = currentChunkIndex * chunkSize + localIdx;
      const isActive = globalIdx === activeWordIndex;
      const textToMeasure = style.uppercase ? item.word.toUpperCase() : item.word;
      const width = ctx.measureText(textToMeasure).width;
      return {
        item,
        globalIdx,
        isActive,
        text: textToMeasure,
        width,
      };
    });

    let totalChunkWidth =
      measuredWords.reduce((sum, w) => sum + w.width, 0) + (measuredWords.length - 1) * wordSpacings;

    // MARGIN SAFETY GUARANTEE: Never exceed 86% of canvas width (leaves >= 7% margin on each side)
    const maxSafeWidth = canvasWidth * 0.86;
    if (totalChunkWidth > maxSafeWidth && totalChunkWidth > 0) {
      const shrinkFactor = maxSafeWidth / totalChunkWidth;
      currentFontSize = Math.max(Math.round(fontSize * shrinkFactor), Math.round(18 * scale));
      ctx.font = `${style.fontWeight} ${Math.round(currentFontSize)}px ${effectiveFontFamily}`;
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = `${Math.max(1, Math.round(currentFontSize * 0.04))}px`;
      }

      // Recalculate with scaled font
      measuredWords = chunkWords.map((item, localIdx) => {
        const globalIdx = currentChunkIndex * chunkSize + localIdx;
        const isActive = globalIdx === activeWordIndex;
        const textToMeasure = style.uppercase ? item.word.toUpperCase() : item.word;
        const width = ctx.measureText(textToMeasure).width;
        return {
          item,
          globalIdx,
          isActive,
          text: textToMeasure,
          width,
        };
      });

      totalChunkWidth =
        measuredWords.reduce((sum, w) => sum + w.width, 0) + (measuredWords.length - 1) * wordSpacings;
    }

    const strokeWidth = currentFontSize * (style.strokeWidthRatio || 0.11);

    // Draw frosted glass pill or cineasta box backdrop if enabled
    if (style.hasPill) {
      const pillPadX = 30 * scale;
      const pillPadY = 18 * scale;
      ctx.fillStyle = style.pillBgColor || 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.roundRect(
        canvasWidth / 2 - totalChunkWidth / 2 - pillPadX,
        centerY - currentFontSize * 0.7 - pillPadY / 2,
        totalChunkWidth + pillPadX * 2,
        currentFontSize * 1.4 + pillPadY,
        Math.max(8, 20 * scale)
      );
      ctx.fill();
      if (style.pillBorderColor) {
        ctx.strokeStyle = style.pillBorderColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Render each word
    let startX = canvasWidth / 2 - totalChunkWidth / 2;

    measuredWords.forEach(({ text, isActive, width }) => {
      const wordCenterX = startX + width / 2;

      ctx.save();
      ctx.translate(wordCenterX, centerY);

      // Pop-in scale animation for active word
      if (isActive) {
        ctx.scale(style.scaleActive, style.scaleActive);
        if (style.shadowBlur) {
          ctx.shadowBlur = style.shadowBlur;
          ctx.shadowColor = style.shadowColor || 'rgba(0, 0, 0, 0.8)';
        }
      } else {
        ctx.shadowBlur = 0;
      }

      // Active badge background for MrBeast style
      if (isActive && style.hasBadge) {
        ctx.fillStyle = style.badgeColor;
        ctx.beginPath();
        ctx.roundRect(-width / 2 - 12 * scale, -fontSize * 0.65, width + 24 * scale, fontSize * 1.3, 10 * scale);
        ctx.fill();
      }

      // Draw stroke
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(text, 0, 0);

      // Draw fill
      ctx.fillStyle = isActive ? activeColor : primaryColor;
      ctx.fillText(text, 0, 0);

      ctx.restore();
      startX += width + wordSpacings;
    });

    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = '0px';
    }
    ctx.restore();
  },
};
