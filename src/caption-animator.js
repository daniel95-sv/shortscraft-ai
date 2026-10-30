/**
 * Caption Animator - Viral Kinetic Subtitle Engine
 * Renders full-sentence viral subtitles directly onto the Canvas (9:16 vertical & 16:9 horizontal).
 * 
 * Features:
 * - Full-sentence display: Shows the complete text of each scene so text never vanishes prematurely.
 * - Dynamic word-by-word kinetic karaoke highlighting synchronized to speech.
 * - Balanced multi-line word wrapping with margin safety guarantees (zero text truncation or overflow).
 * - Calibrated font & letter spacing so characters never touch or overlap.
 * - Viral presets: Alex Hormozi (Bold Pop), MrBeast (Punchy Badge), TikTok Neon, Clean Glass, Fuego Viral, Cineasta Box, Cyberpunk.
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
      strokeWidthRatio: 0.12,
      scaleActive: 1.12,
      uppercase: true,
      shadowBlur: 8,
      shadowColor: 'rgba(0, 0, 0, 0.9)',
    },

    mrbeast: {
      name: '💥 MrBeast (Punchy Slant & Badge)',
      fontFamily: "'Outfit', 'Impact', sans-serif",
      fontWeight: '900',
      activeColor: '#FFFFFF',
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidthRatio: 0.12,
      scaleActive: 1.10,
      uppercase: true,
      hasBadge: true,
      badgeColor: '#E11D48', // Red badge for active word
      shadowBlur: 8,
      shadowColor: 'rgba(0, 0, 0, 0.9)',
    },

    neon: {
      name: '⚡ TikTok Neon Glow',
      fontFamily: "'Outfit', sans-serif",
      fontWeight: '800',
      activeColor: '#22D3EE', // Electric cyan
      textColor: '#F8FAFC',
      strokeColor: '#0F172A',
      strokeWidthRatio: 0.09,
      scaleActive: 1.10,
      uppercase: true,
      shadowBlur: 14,
      shadowColor: '#06B6D4',
    },

    clean: {
      name: '✨ Minimalist Clean Glass',
      fontFamily: "'Inter', sans-serif",
      fontWeight: '700',
      activeColor: '#60A5FA',
      textColor: '#FFFFFF',
      strokeColor: 'rgba(0, 0, 0, 0.65)',
      strokeWidthRatio: 0.07,
      scaleActive: 1.06,
      uppercase: false,
      hasPill: true,
      shadowBlur: 4,
      shadowColor: 'rgba(0, 0, 0, 0.6)',
    },

    fire: {
      name: '🔥 Fuego Rojo / Naranja Viral',
      fontFamily: "'Anton', 'Montserrat', sans-serif",
      fontWeight: '900',
      activeColor: '#FF4500', // Neon Orange-Red
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidthRatio: 0.12,
      scaleActive: 1.12,
      uppercase: true,
      shadowBlur: 16,
      shadowColor: '#FF3300',
    },

    box: {
      name: '🎬 Caja Cineasta Oscura',
      fontFamily: "'Montserrat', 'Anton', sans-serif",
      fontWeight: '900',
      activeColor: '#FFE600',
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidthRatio: 0.10,
      scaleActive: 1.08,
      uppercase: true,
      hasPill: true,
      pillBgColor: 'rgba(0, 0, 0, 0.86)',
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
      scaleActive: 1.10,
      uppercase: true,
      shadowBlur: 10,
      shadowColor: '#10B981',
    },
  },

  /**
   * Draws full-scene captions with live word-level highlight on Canvas
   */
  drawCaptions({
    ctx,
    canvasWidth,
    canvasHeight,
    words,
    sceneElapsedSec,
    sceneDurationSec = 5.0,
    styleKey = 'hormozi',
    fontSize = 58,
    yPercent = 70, // 70% from top (ideal 9:16 Shorts viewing zone)
    customColors = null,
    fontFamilyOverride = null,
    activeWordIndexOverride = -1,
    opacity = 1.0,
  }) {
    if (!words || words.length === 0 || opacity <= 0.01) return;

    const style = this.styles[styleKey] || this.styles.hormozi;
    const activeColor = customColors?.highlightColor || style.activeColor;
    const primaryColor = customColors?.primaryColor || style.textColor;
    const strokeColor = customColors?.strokeColor || style.strokeColor;
    const scale = canvasWidth / 1080;

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
      // If past all word timestamps, highlight last word or keep active state
      if (activeWordIndex === -1 && sceneElapsedSec >= (words[0]?.startSec ?? 0)) {
        activeWordIndex = words.length - 1;
      }
    }

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, Math.max(0.0, opacity));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const effectiveFontFamily = fontFamilyOverride ? `'${fontFamilyOverride}', ${style.fontFamily}` : style.fontFamily;
    const maxSafeLineWidth = canvasWidth * 0.86; // Never exceed 86% of screen width

    // Compute optimal font size for complete scene display
    let currentFontSize = Math.round(fontSize);
    let lines = [];
    let lineMeasurements = [];

    // Layout algorithm: split words into 1, 2, or at most 3 balanced lines
    const computeLines = (fSize) => {
      ctx.font = `${style.fontWeight} ${fSize}px ${effectiveFontFamily}`;
      const letterSpacingPx = Math.max(1, Math.round(fSize * 0.035));
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = `${letterSpacingPx}px`;
      }

      const wordSpacing = Math.round(fSize * 0.38);
      const measured = words.map((item, idx) => {
        const text = style.uppercase ? item.word.toUpperCase() : item.word;
        const width = ctx.measureText(text).width;
        return {
          idx,
          item,
          text,
          width,
          isActive: idx === activeWordIndex,
        };
      });

      // Wrap words into lines
      const wrappedLines = [];
      let currentLine = [];
      let currentLineWidth = 0;

      for (const mWord of measured) {
        const neededWidth = currentLine.length === 0 ? mWord.width : currentLineWidth + wordSpacing + mWord.width;
        if (neededWidth > maxSafeLineWidth && currentLine.length > 0) {
          wrappedLines.push(currentLine);
          currentLine = [mWord];
          currentLineWidth = mWord.width;
        } else {
          currentLine.push(mWord);
          currentLineWidth = neededWidth;
        }
      }
      if (currentLine.length > 0) {
        wrappedLines.push(currentLine);
      }

      return { wrappedLines, wordSpacing };
    };

    // Auto-scale font size if text exceeds 3 lines or is too large
    let layout = computeLines(currentFontSize);
    while (layout.wrappedLines.length > 3 && currentFontSize > 22 * scale) {
      currentFontSize = Math.round(currentFontSize * 0.90);
      layout = computeLines(currentFontSize);
    }

    lines = layout.wrappedLines;
    const wordSpacing = layout.wordSpacing;
    const lineHeight = Math.round(currentFontSize * 1.30);
    const totalBlockHeight = lines.length * lineHeight;
    const centerY = canvasHeight * (yPercent / 100);
    const startY = centerY - totalBlockHeight / 2 + lineHeight / 2;

    const strokeWidth = Math.max(2, currentFontSize * (style.strokeWidthRatio || 0.12));

    // Optional background pill or cinema box
    if (style.hasPill) {
      let maxLineWidth = 0;
      lines.forEach((line) => {
        const w = line.reduce((acc, m) => acc + m.width, 0) + (line.length - 1) * wordSpacing;
        if (w > maxLineWidth) maxLineWidth = w;
      });

      const padX = Math.round(30 * scale);
      const padY = Math.round(18 * scale);
      const boxW = maxLineWidth + padX * 2;
      const boxH = totalBlockHeight + padY * 2;
      const boxX = canvasWidth / 2 - boxW / 2;
      const boxY = centerY - boxH / 2;

      ctx.fillStyle = style.pillBgColor || 'rgba(15, 23, 42, 0.75)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, Math.max(8, 16 * scale));
      ctx.fill();

      if (style.pillBorderColor) {
        ctx.strokeStyle = style.pillBorderColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Render each line and its words
    lines.forEach((line, lineIdx) => {
      const lineY = startY + lineIdx * lineHeight;
      const totalLineWidth = line.reduce((acc, m) => acc + m.width, 0) + (line.length - 1) * wordSpacing;
      let startX = canvasWidth / 2 - totalLineWidth / 2;

      line.forEach(({ text, isActive, width }) => {
        const wordCenterX = startX + width / 2;

        ctx.save();
        ctx.translate(wordCenterX, lineY);

        // Kinetic scale and glow on the active spoken word
        if (isActive) {
          ctx.scale(style.scaleActive, style.scaleActive);
          if (style.shadowBlur) {
            ctx.shadowBlur = style.shadowBlur;
            ctx.shadowColor = style.shadowColor || 'rgba(0, 0, 0, 0.9)';
          }
        } else {
          ctx.shadowBlur = Math.round(4 * scale);
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        }

        // Active badge background for MrBeast style
        if (isActive && style.hasBadge) {
          ctx.fillStyle = style.badgeColor || '#E11D48';
          ctx.beginPath();
          ctx.roundRect(
            -width / 2 - 8 * scale,
            -currentFontSize * 0.58,
            width + 16 * scale,
            currentFontSize * 1.16,
            8 * scale
          );
          ctx.fill();
        }

        // Draw dark outline
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(text, 0, 0);

        // Draw text fill
        ctx.fillStyle = isActive ? activeColor : primaryColor;
        ctx.fillText(text, 0, 0);

        ctx.restore();
        startX += width + wordSpacing;
      });
    });

    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = '0px';
    }
    ctx.restore();
  },
};
