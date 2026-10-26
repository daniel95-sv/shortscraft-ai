/**
 * AI Script & Content Engine
 * Generates viral vertical video scripts either via direct LLM APIs (Gemini, OpenAI, Groq)
 * or via built-in high-converting viral template generators (zero-cost, works offline with 0 API keys).
 */

export const VIRAL_TEMPLATES = {
  curiosities: {
    name: '🧠 Datos Asombrosos (Did You Know)',
    mood: 'epic',
    generator: (topic) => ({
      title: `3 Datos Perturbadores sobre ${topic || 'el Espacio y la Mente'} que nadie te cuenta`,
      scenes: [
        {
          id: 1,
          text: `¿Sabías que ${topic ? `el misterio de ${topic}` : 'un solo día en Venus dura más que un año entero'}?`,
          keyword: 'space planet cosmos',
          searchTerms: ['space', 'planet', 'cosmos'],
          durationSec: 4.0,
        },
        {
          id: 2,
          text: 'Venus rota tan lento sobre su propio eje que le toma 243 días terrestres completar un solo giro.',
          keyword: 'galaxy stars universe',
          searchTerms: ['galaxy', 'stars', 'universe'],
          durationSec: 4.8,
        },
        {
          id: 3,
          text: 'Además, los científicos descubrieron un planeta hecho casi en su totalidad de diamante sólido.',
          keyword: 'diamond planet nebula cosmic',
          searchTerms: ['cosmos', 'nebula', 'planet'],
          durationSec: 5.2,
        },
        {
          id: 4,
          text: 'Se llama 55 Cancri e, y tiene el doble del tamaño de nuestra Tierra.',
          keyword: 'futuristic telescope deep space',
          searchTerms: ['telescope', 'space', 'astronaut'],
          durationSec: 5.0,
        },
        {
          id: 5,
          text: 'Suscríbete y comenta si vivirías en un planeta de diamantes.',
          keyword: 'astronaut earth ocean globe',
          searchTerms: ['astronaut', 'earth', 'ocean'],
          durationSec: 3.8,
        },
      ],
      hashtags: ['#Shorts', '#DatosCuriosos', '#Espacio', '#Astronomia', '#ViralTikTok', '#AprendeEnTikTok'],
      description: `Datos asombrosos del universo sobre ${topic || 'el cosmos'}. ¡Comenta cuál te impresionó más!`,
    }),
  },

  productivity: {
    name: '⚡ Productividad & Deep Work',
    mood: 'upbeat',
    generator: (topic) => ({
      title: `Deja de Multitask si quieres lograr ${topic || 'tus Metas'} el doble de rápido`,
      scenes: [
        {
          id: 1,
          text: 'Deja de hacer multitarea si realmente quieres terminar tus objetivos el doble de rápido.',
          keyword: 'working laptop office focus',
          searchTerms: ['working', 'laptop', 'office'],
          durationSec: 4.2,
        },
        {
          id: 2,
          text: 'Bloques de trabajo profundo de 50 minutos entrenan a tu mente para entrar en estado de flujo sin esfuerzo.',
          keyword: 'clock focus writing time',
          searchTerms: ['clock', 'focus', 'writing'],
          durationSec: 5.0,
        },
        {
          id: 3,
          text: 'Aplica el método Pomodoro hoy y verás cómo tu rendimiento diario se dispara.',
          keyword: 'success city sunrise achievement',
          searchTerms: ['success', 'city', 'sunrise'],
          durationSec: 4.8,
        },
        {
          id: 4,
          text: 'Guarda este video y empieza tu primer bloque de 50 minutos ahora mismo.',
          keyword: 'focus fire warrior desk work',
          searchTerms: ['office', 'coffee', 'laptop'],
          durationSec: 3.8,
        },
      ],
      hashtags: ['#Productividad', '#Habitos', '#DeepWork', '#Enfoque', '#Disciplina', '#Shorts'],
      description: 'El hábito comprobado de trabajo profundo que transformará tu productividad.',
    }),
  },

  ai_future: {
    name: '🤖 Futuro de la IA & Código',
    mood: 'epic',
    generator: (topic) => ({
      title: `Herramientas de IA Open Source que reemplazarán suscripciones para ${topic || 'crear Videos'}`,
      scenes: [
        {
          id: 1,
          text: 'Las herramientas de inteligencia artificial de código abierto están reemplazando suscripciones caras.',
          keyword: 'technology code server futuristic',
          searchTerms: ['technology', 'code', 'server'],
          durationSec: 4.5,
        },
        {
          id: 2,
          text: 'Con voces TTS ultra realistas, subtítulos Whisper y renderizado en cliente, creas videos ilimitados gratis.',
          keyword: 'robot futuristic data cyberspace',
          searchTerms: ['robot', 'futuristic', 'data'],
          durationSec: 5.2,
        },
        {
          id: 3,
          text: 'Automatiza flujos de trabajo con Docker, MCP y APIs REST locales hoy mismo.',
          keyword: 'network digital globe connection',
          searchTerms: ['network', 'digital', 'globe'],
          durationSec: 4.8,
        },
        {
          id: 4,
          text: 'Sigue el canal para dominar la revolución de la inteligencia artificial autónoma.',
          keyword: 'subscribe neon glow code tech',
          searchTerms: ['technology', 'server', 'code'],
          durationSec: 3.8,
        },
      ],
      hashtags: ['#InteligenciaArtificial', '#OpenSource', '#Tech', '#Programacion', '#ShortsAI', '#Shorts'],
      description: 'Crea contenido con IA ilimitada y libre de costos con herramientas de código abierto.',
    }),
  },

  ocean: {
    name: '🌊 Océanos & Naturaleza Extrema',
    mood: 'epic',
    generator: (topic) => ({
      title: `Los Secretos más Oscuros del Fondo del Océano y ${topic || 'el Abismo Marino'}`,
      scenes: [
        {
          id: 1,
          text: 'Más del ochenta por ciento de nuestro fondo oceánico permanece completamente inexplorado.',
          keyword: 'ocean underwater waves mystery',
          searchTerms: ['ocean', 'underwater', 'waves'],
          durationSec: 4.6,
        },
        {
          id: 2,
          text: 'Criaturas bioluminiscentes generan su propia luz en la oscuridad absoluta de la Fosa de las Marianas.',
          keyword: 'jellyfish deep sea dark water glowing',
          searchTerms: ['jellyfish', 'deep sea', 'water'],
          durationSec: 5.4,
        },
        {
          id: 3,
          text: 'A diez mil metros de profundidad, la presión aplastaría un submarino de acero como una lata.',
          keyword: 'abyss deep submarine darkness',
          searchTerms: ['underwater', 'ocean', 'darkness'],
          durationSec: 4.8,
        },
        {
          id: 4,
          text: 'Nuestro planeta aún esconde miles de misterios esperando ser descubiertos.',
          keyword: 'nature earth forest ocean planet',
          searchTerms: ['nature', 'earth', 'ocean'],
          durationSec: 3.8,
        },
      ],
      hashtags: ['#Oceano', '#Naturaleza', '#Misterios', '#Ciencia', '#Abismo', '#Shorts'],
      description: 'Un vistazo a las profundidades inexploradas del océano. ¿Bajarías a la fosa?',
    }),
  },

  stoic: {
    name: '🏛️ Estoicismo & Mentalidad',
    mood: 'lofi',
    generator: (topic) => ({
      title: `La Regla Estoica de Marco Aurelio para Dominar ${topic || 'la Ansiedad'}`,
      scenes: [
        {
          id: 1,
          text: 'Si sufres por cosas fuera de tu control, esta lección de hace 2 mil años cambiará tu vida.',
          keyword: 'stoic marble statue ancient rome dramatic shadow',
          durationSec: 4.5,
        },
        {
          id: 2,
          text: 'Marco Aurelio escribió: Tienes poder sobre tu mente, no sobre los acontecimientos externos.',
          keyword: 'calm rain window city dark room',
          durationSec: 5.0,
        },
        {
          id: 3,
          text: 'El 90 por ciento de tus preocupaciones nunca ocurrirán; son solo sombras creadas por tu imaginación.',
          keyword: 'lone silhouette mountain summit sunset epic',
          durationSec: 5.2,
        },
        {
          id: 4,
          text: 'Deja de buscar aprobación ajena. El verdadero poder reside en tu disciplina interior.',
          keyword: 'focus fire flame warrior spirit',
          durationSec: 4.8,
        },
        {
          id: 5,
          text: 'Guarda este video para cuando necesites recordar quién tiene el control.',
          keyword: 'ancient books candle wisdom dark academia',
          durationSec: 3.8,
        },
      ],
      hashtags: ['#Estoicismo', '#Superacion', '#Mentalidad', '#MarcoAurelio', '#Motivacion', '#Shorts'],
      description: 'Una dosis de sabiduría estoica para superar el caos cotidiano y recuperar tu paz mental.',
    }),
  },

  reddit: {
    name: '💬 Historia / Confesión de Reddit',
    mood: 'suspense',
    generator: (topic) => ({
      title: `Confesiones de Reddit: Descubrí el Secreto más Oscuro de mi ${topic || 'Vecino'}`,
      scenes: [
        {
          id: 1,
          text: 'Nunca debí haber mirado por esa ventana a las 3 de la madrugada...',
          keyword: 'dark window night rain scary shadows',
          durationSec: 4.0,
        },
        {
          id: 2,
          text: 'Llevaba semanas notando luces parpadeantes en el sótano de la casa de enfrente.',
          keyword: 'creepy basement light flickering horror',
          durationSec: 4.8,
        },
        {
          id: 3,
          text: 'Esa noche decidí grabar con el teléfono para tener pruebas de lo que pasaba.',
          keyword: 'phone camera recording dark alley suspense',
          durationSec: 4.5,
        },
        {
          id: 4,
          text: 'Lo que la cámara captó me heló la sangre por completo: no había nadie humano ahí dentro.',
          keyword: 'glitch horror shadow terrifying face',
          durationSec: 5.0,
        },
        {
          id: 5,
          text: 'Dale like para la parte dos donde muestro el video original.',
          keyword: 'neon red question mark suspense',
          durationSec: 3.5,
        },
      ],
      hashtags: ['#RedditStories', '#HistoriasDeReddit', '#Terror', '#Misterio', '#StoryTime', '#Shorts'],
      description: 'Historia real compartida en Reddit. ¿Habrías grabado tú también?',
    }),
  },

  quiz: {
    name: '❓ Quiz Interactivo / Trivia',
    mood: 'upbeat',
    generator: (topic) => ({
      title: `Reto de Trivia: ¿Puedes acertar estas 3 preguntas de ${topic || 'Cultura General'}?`,
      scenes: [
        {
          id: 1,
          text: 'Pregunta número uno: ¿Cuál es el único mamífero capaz de volar verdaderamente?',
          keyword: 'flying bat night forest wildlife',
          durationSec: 4.5,
        },
        {
          id: 2,
          text: 'Tienes 3 segundos... ¡Exacto, el murciélago! La mayoría falla esta.',
          keyword: 'timer countdown 3 2 1 glowing numbers',
          durationSec: 4.2,
        },
        {
          id: 3,
          text: 'Segunda pregunta: ¿Qué planeta de nuestro sistema solar tiene más lunas descubiertas?',
          keyword: 'saturn rings deep space galaxy stars',
          durationSec: 4.8,
        },
        {
          id: 4,
          text: '¡Es Saturno con más de 140 lunas confirmadas!',
          keyword: 'cosmic explosion planets universe',
          durationSec: 3.8,
        },
        {
          id: 5,
          text: '¿Acertaste ambas? Escribe tu puntuación en los comentarios.',
          keyword: 'trophy golden victory celebration confetti',
          durationSec: 3.5,
        },
      ],
      hashtags: ['#Trivia', '#QuizTime', '#CulturaGeneral', '#Retos', '#Preguntas', '#Shorts'],
      description: 'Ponte a prueba con este quiz rápido. ¿Lograste el 100% de aciertos?',
    }),
  },

  tech: {
    name: '⚡ Trucos & Productividad',
    mood: 'upbeat',
    generator: (topic) => ({
      title: `El Secreto de ${topic || 'Inteligencia Artificial'} que te ahorrará 10 horas semanales`,
      scenes: [
        {
          id: 1,
          text: 'Si todavía haces esto de forma manual en 2025, estás perdiendo horas de tu vida.',
          keyword: 'typing keyboard high tech holographic code',
          durationSec: 4.2,
        },
        {
          id: 2,
          text: 'Existe una herramienta gratuita y directa en tu navegador que automatiza todo el proceso.',
          keyword: 'fast data streams cyberpunk screen interface',
          durationSec: 4.8,
        },
        {
          id: 3,
          text: 'Simplemente ingresas tu instrucción y en cuestión de segundos organiza toda la información.',
          keyword: 'artificial intelligence robot brain glowing tech',
          durationSec: 5.0,
        },
        {
          id: 4,
          text: 'Lo mejor es que funciona sin necesidad de instalar programas pesados ni suscripciones caras.',
          keyword: 'laptop desk modern coffee minimal workspace',
          durationSec: 4.8,
        },
        {
          id: 5,
          text: 'Sigue mi canal para más trucos diarios que multiplican tu productividad.',
          keyword: 'follow neon button rocket launch success',
          durationSec: 3.6,
        },
      ],
      hashtags: ['#Productividad', '#TechTips', '#InteligenciaArtificial', '#Trucos', '#HackDeVida', '#Shorts'],
      description: 'Multiplica tu eficiencia con este hack tecnológico esencial.',
    }),
  },
};

export const AIEngine = {
  /**
   * Generates a short script using either direct LLM API or fallback template.
   */
  async generateScript({ topic, templateKey, provider, apiKey, customPrompt, language = 'es' }) {
    // If user selected a built-in template or has no API key, use the instant rich template engine
    if (provider === 'template' || !provider) {
      const template = VIRAL_TEMPLATES[templateKey] || VIRAL_TEMPLATES.curiosities;
      return template.generator(topic);
    }

    if (!apiKey) {
      if (provider === 'openai') {
        throw new Error('No has configurado una API Key de OpenAI. Puedes usar Google Gemini o Groq (gratuitos), o la Plantilla Inteligente Local sin APIs.');
      } else {
        throw new Error(`No has configurado la API Key para ${provider.toUpperCase()}. Configúrala en el botón "API Keys" o usa la Plantilla Inteligente Local.`);
      }
    }

    const systemPrompt = `You are a world-class viral short-form video scriptwriter (for TikTok, YouTube Shorts, and Instagram Reels).
Generate a high-converting, gripping 9:16 vertical video script about: "${topic || customPrompt || 'curiosidades asombrosas'}".
Language: ${language === 'es' ? 'Spanish (Español)' : 'English'}.
Strictly follow the Viral Hook formula:
1. Hook in the first 3 seconds (curiosity gap, controversial statement, or suspense).
2. 3 to 4 concise scenes delivering value, twists, or punchy points.
3. Strong Call to Action (like, comment, or subscribe) in the final scene.

You MUST reply ONLY with valid JSON following this exact structure, with no markdown code fences, backticks, or other text:
{
  "title": "Viral Clickbait Title",
  "scenes": [
    {
      "id": 1,
      "text": "Narrated voiceover text for scene 1 (keep it punchy, 1-2 short sentences)",
      "keyword": "space galaxy nebula",
      "searchTerms": ["space", "galaxy", "nebula"],
      "durationSec": 4.0
    }
  ],
  "hashtags": ["#Shorts", "#Viral", "#TopicTag"],
  "description": "Engaging description for YouTube / TikTok with SEO keywords",
  "musicMood": "epic"
}`;

    try {
      let rawText = '';

      if (provider === 'gemini') {
        // Cascade through active models in Google AI Studio
        const geminiModels = [
          'gemini-3.5-flash',
          'gemini-3.8-flash',
          'gemini-flash-latest',
          'gemini-3.1-flash-lite',
          'gemini-2.5-flash',
          'gemini-1.5-flash'
        ];

        let lastErr = null;
        for (const model of geminiModels) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 16000);

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                  contents: [{ parts: [{ text: systemPrompt }] }],
                  generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
                }),
              }
            );
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const textPart = data.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === 'string');
              rawText = textPart?.text || '';
              if (rawText) break;
            } else {
              const errData = await response.json().catch(() => ({}));
              lastErr = new Error(errData.error?.message || `Gemini status ${response.status}`);
            }
          } catch (e) {
            lastErr = e;
          }
        }

        if (!rawText) {
          throw lastErr || new Error('No se pudo obtener respuesta de ningún modelo de Gemini');
        }
      } else if (provider === 'groq') {
        // Supported models for Groq free accounts
        const groqModels = [
          'qwen/qwen3.8-27b',
          'allam-2-7b',
          'openai/gpt-oss-120b',
          'llama-3.3-70b-versatile',
          'llama-3.1-8b-instant'
        ];

        let lastErr = null;
        for (const model of groqModels) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 16000);

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              signal: controller.signal,
              body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: systemPrompt }],
                temperature: 0.75,
                response_format: { type: 'json_object' },
              }),
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              rawText = data.choices?.[0]?.message?.content || '';
              if (rawText) break;
            } else {
              const errData = await response.json().catch(() => ({}));
              lastErr = new Error(errData.error?.message || `Groq status ${response.status}`);
            }
          } catch (e) {
            lastErr = e;
          }
        }

        if (!rawText) {
          throw lastErr || new Error('No se pudo obtener respuesta de los modelos de Groq');
        }
      } else if (provider === 'openai') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 16000);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            temperature: 0.8,
            response_format: { type: 'json_object' },
          }),
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `OpenAI status ${response.status}`);
        }
        const data = await response.json();
        rawText = data.choices?.[0]?.message?.content || '';
      }

      // Clean and parse JSON
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Validate structure & guarantee searchTerms
      if (Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
        parsed.scenes.forEach((s) => {
          if (!s.searchTerms || !Array.isArray(s.searchTerms) || s.searchTerms.length === 0) {
            s.searchTerms = (s.keyword || 'nature').split(/\s+/).filter(Boolean);
          }
        });
        return parsed;
      }
      throw new Error('Incomplete JSON structure received from LLM');
    } catch (err) {
      console.warn('AI API Call failed, falling back to local viral generator:', err);
      // Fallback seamlessly to local template generator
      const template = VIRAL_TEMPLATES[templateKey] || VIRAL_TEMPLATES.curiosities;
      const fallbackResult = template.generator(topic);
      fallbackResult.fallbackNotice = `(Generado con plantilla inteligente de respaldo: ${err.message})`;
      return fallbackResult;
    }
  },
};
