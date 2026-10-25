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
      title: `3 Datos Perturbadores sobre ${topic || 'el Cerebro Humano'} que nadie te cuenta`,
      scenes: [
        {
          id: 1,
          text: `¿Sabías que ${topic ? `el misterio de ${topic}` : 'tu propio cerebro'} te engaña todos los días?`,
          keyword: 'mysterious brain optical illusion',
          durationSec: 4.0,
        },
        {
          id: 2,
          text: 'Número uno: El 80 por ciento de tus pensamientos diarios son repeticiones del día anterior.',
          keyword: 'deep thinking futuristic neon mind',
          durationSec: 4.8,
        },
        {
          id: 3,
          text: 'Número dos: Cuando recuerdas un evento pasado, en realidad recuerdas la última vez que lo recordaste.',
          keyword: 'time warp clock universe stars',
          durationSec: 5.2,
        },
        {
          id: 4,
          text: 'Y el último te sorprenderá: Tu subconsciente toma decisiones 7 segundos antes de que te des cuenta.',
          keyword: 'lightning neural electric network',
          durationSec: 5.5,
        },
        {
          id: 5,
          text: 'Comenta si ya conocías esto y suscríbete para no perderte el próximo dato.',
          keyword: 'subscribe button neon futuristic glow',
          durationSec: 3.8,
        },
      ],
      hashtags: ['#Shorts', '#DatosCuriosos', '#Psicologia', '#Misterio', '#ViralTikTok', '#AprendeEnTikTok'],
      description: `3 datos que pondrán a prueba tu mente sobre ${topic || 'curiosidades del mundo'}. ¡Comenta cuál te impresionó más!`,
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
    if (!apiKey || provider === 'template' || !provider) {
      const template = VIRAL_TEMPLATES[templateKey] || VIRAL_TEMPLATES.curiosities;
      return template.generator(topic);
    }

    const systemPrompt = `You are a world-class viral short-form video scriptwriter (for TikTok, YouTube Shorts, and Instagram Reels).
Generate a high-converting, gripping 9:16 vertical video script about: "${topic || customPrompt}".
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
      "keyword": "2-4 english stock footage search terms for background (e.g. dark stormy night)",
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
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
            }),
          }
        );
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Gemini API error (${response.status})`);
        }
        const data = await response.json();
        rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else if (provider === 'openai' || provider === 'groq') {
        const endpoint =
          provider === 'groq'
            ? 'https://api.groq.com/openai/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';
        const model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: systemPrompt }],
            temperature: 0.8,
            response_format: { type: 'json_object' },
          }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `${provider} API error (${response.status})`);
        }
        const data = await response.json();
        rawText = data.choices?.[0]?.message?.content || '';
      }

      // Clean and parse JSON
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Validate structure
      if (Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
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
