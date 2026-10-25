/**
 * Caption Animator
 * Renders viral word-by-word kinetic subtitles directly onto the 9:16 Canvas.
 * Supports Alex Hormozi style, MrBeast pop style, TikTok Neon, Clean Minimal, and Cyberpunk.
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
      strokeWidthRatio: 0.16,
      scaleActive: 1.18,
      uppercase: true,
      shadowBlur: 10,
      shadowColor: 'rgba(0, 0, 0, 0.8)',
    },

    mrbeast: {
      name: '💥 MrBeast (Punchy Slant & Badge)',
      fontFamily: "'Outfit', 'Impact', sans-serif",
      fontWeight: '900',
      activeColor: '#38BDF8', // Cyan
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidthRatio: 0.18,
      scaleActive: 1.22,
      uppercase: true,
      hasBadge: true,
      badgeColor: '#E11D48', // Vibrant red
      shadowBlur: 15,
      shadowColor: 'rgba(0,0,0,0.9)',
    },

    neon: {
      name: '⚡ TikTok Neon Glow',
      fontFamily: "'Outfit', sans-serif",
      fontWeight: '800',
      activeColor: '#22D3EE', // Electric cyan
      textColor: '#F8FAFC',
      strokeColor: '#0F172A',
      strokeWidthRatio: 0.1,
      scaleActive: 1.12,
      uppercase: true,
      shadowBlur: 25,
      shadowColor: '#06B6D4',
    },

    clean: {
      name: '✨ Minimalist Clean Glass',
      fontFamily: "'Inter', sans-serif",
      fontWeight: '700',
      activeColor: '#60A5FA',
      textColor: '#FFFFFF',
      strokeColor: 'rgba(0, 0, 0, 0.6)',
      strokeWidthRatio: 0.08,
      scaleActive: 1.08,
      uppercase: false,
      hasPill: true,
      shadowBlur: 8,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
    },

    cyber: {
      name: '👾 Cyberpunk Glitch',
      fontFamily: "monospace, 'Outfit'",
      fontWeight: '800',
      activeColor: '#4ADE80',
      textColor: '#F3F4F6',
      strokeColor: '#1E1B4B',
      strokeWidthRatio: 0.14,
      scaleActive: 1.15,
      uppercase: true,
      shadowBlur: 18,
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
  }) {
    if (!words || words.length === 0) return;

    const style = this.styles[styleKey] || this.styles.hormozi;
    const activeColor = customColors?.highlightColor || style.activeColor;
    const primaryColor = customColors?.primaryColor || style.textColor;
    const strokeColor = customColors?.strokeColor || style.strokeColor;
    const strokeWidth = fontSize * style.strokeWidthRatio;

    // Determine currently spoken word index
    let activeWordIndex = -1;
    for (let i = 0; i < words.length; i++) {
      if (sceneElapsedSec >= words[i].startSec && sceneElapsedSec <= words[i].endSec) {
        activeWordIndex = i;
        break;
      }
    }
    // If past all words, highlight last
    if (activeWordIndex === -1 && sceneElapsedSec > (words[words.length - 1]?.endSec || 0)) {
      activeWordIndex = words.length - 1;
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Group words into short visual chunks (e.g. 3-4 words per display chunk for fast reading)
    const chunkSize = 4;
    const currentChunkIndex = activeWordIndex >= 0 ? Math.floor(activeWordIndex / chunkSize) : 0;
    const chunkWords = words.slice(currentChunkIndex * chunkSize, (currentChunkIndex + 1) * chunkSize);

    const centerY = canvasHeight * (yPercent / 100);

    // Measure total width of chunk
    ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
    const wordSpacings = 18;

    const measuredWords = chunkWords.map((item, localIdx) => {
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

    const totalChunkWidth =
      measuredWords.reduce((sum, w) => sum + w.width, 0) + (measuredWords.length - 1) * wordSpacings;

    // Draw frosted glass pill backdrop if enabled
    if (style.hasPill) {
      const pillPadX = 35;
      const pillPadY = 22;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.beginPath();
      ctx.roundRect(
        canvasWidth / 2 - totalChunkWidth / 2 - pillPadX,
        centerY - fontSize * 0.7 - pillPadY / 2,
        totalChunkWidth + pillPadX * 2,
        fontSize * 1.4 + pillPadY,
        30
      );
      ctx.fill();
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
      }

      ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      ctx.shadowBlur = isActive ? style.shadowBlur * 1.5 : style.shadowBlur;
      ctx.shadowColor = isActive ? style.shadowColor : 'rgba(0, 0, 0, 0.7)';

      // Active badge background for MrBeast style
      if (isActive && style.hasBadge) {
        ctx.fillStyle = style.badgeColor;
        ctx.beginPath();
        ctx.roundRect(-width / 2 - 12, -fontSize * 0.65, width + 24, fontSize * 1.3, 12);
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

    ctx.restore();
  },
};
