/**
 * AI Script & Content Engine
 * Generates viral vertical video scripts either via direct LLM APIs (Gemini, OpenAI, Groq)
 * or via built-in high-converting viral template generators (zero-cost, works offline with 0 API keys).
 */

function makeAdaptedScenes(scenesPortrait, scenesLandscapeAddon, orientation) {
  const isLandscape = orientation === 'landscape';
  const list = isLandscape ? [...scenesPortrait, ...scenesLandscapeAddon] : scenesPortrait;
  return list.map((s, idx) => ({ ...s, id: idx + 1 }));
}

export const VIRAL_TEMPLATES = {
  curiosities: {
    name: '🧠 Datos Asombrosos (Did You Know)',
    mood: 'epic',
    generator: (topic, orientation = 'portrait') => {
      const isLand = orientation === 'landscape';
      const pScenes = [
        { text: `¿Sabías que ${topic ? `el misterio de ${topic}` : 'un solo día en el planeta Venus dura más que un año entero'}?`, keyword: 'space planet cosmos galaxy', searchTerms: ['space', 'planet', 'cosmos'], durationSec: 4.8 },
        { text: 'Venus rota tan lento sobre su propio eje que le toma doscientos cuarenta y tres días terrestres completar un solo giro.', keyword: 'galaxy stars universe slow motion', searchTerms: ['galaxy', 'stars', 'universe'], durationSec: 5.5 },
        { text: 'Pero la órbita de Venus alrededor del Sol solo dura doscientos veinticinco días.', keyword: 'sun solar system orbit planet', searchTerms: ['sun', 'solar system', 'planet'], durationSec: 5.2 },
        { text: 'Además, los astrónomos descubrieron un exoplaneta compuesto casi en su totalidad por diamante sólido.', keyword: 'diamond crystal luxury glow nebula', searchTerms: ['diamond', 'crystal', 'nebula'], durationSec: 5.4 },
        { text: 'Se llama 55 Cancri e, y su masa supera dos veces el tamaño de toda nuestra Tierra.', keyword: 'exoplanet deep space telescope discovery', searchTerms: ['planet', 'space', 'telescope'], durationSec: 5.2 },
        { text: 'En el espacio exterior no existe el sonido: el silencio absoluto reina a través de miles de millones de kilómetros.', keyword: 'silent dark space astronaut floating', searchTerms: ['astronaut', 'space', 'earth'], durationSec: 5.5 },
        { text: 'Si dos piezas del mismo metal se tocan en el vacío espacial, se sueldan instantáneamente para siempre.', keyword: 'metal steel fusion sparks technology', searchTerms: ['technology', 'metal', 'sparks'], durationSec: 5.6 },
        { text: 'Este fenómeno se conoce como soldadura en frío y desafía toda la física convencional.', keyword: 'science laboratory quantum physics glow', searchTerms: ['science', 'laboratory', 'physics'], durationSec: 5.2 },
        { text: 'El cerebro humano almacena más de dos punto cinco petabytes de información, equivalente a tres millones de horas de video.', keyword: 'human brain digital neurons thinking neural network', searchTerms: ['brain', 'neurons', 'technology'], durationSec: 5.8 },
        { text: 'Suscríbete ahora mismo y deja en comentarios cuál de estos datos cósmicos te impactó más.', keyword: 'subscribe rocket launch fire explosion success', searchTerms: ['rocket', 'success', 'launch'], durationSec: 5.0 },
      ];

      const lAddons = [
        { text: 'A nivel cuántico, las partículas pueden comunicarse entre sí a través del universo sin importar la distancia física.', keyword: 'quantum physics particles light energy', searchTerms: ['quantum', 'energy', 'light'], durationSec: 5.8 },
        { text: 'Albert Einstein bautizó este asombroso principio como acción fantasmal a la distancia.', keyword: 'einstein vintage chalkboard physics equations', searchTerms: ['blackboard', 'physics', 'equations'], durationSec: 5.6 },
        { text: 'Cerca del horizonte de sucesos de un agujero negro, el tiempo se ralentiza drásticamente debido a la inmensa gravedad.', keyword: 'black hole gravitational lens cosmos dark', searchTerms: ['black hole', 'space', 'gravity'], durationSec: 6.0 },
        { text: 'Un solo segundo cerca del centro equivaldría a miles de años para alguien que observa desde la Tierra.', keyword: 'clock ticking time warp futuristic dimension', searchTerms: ['clock', 'time', 'futuristic'], durationSec: 5.8 },
        { text: 'Nuestra Vía Láctea viaja a más de dos millones de kilómetros por hora hacia el Gran Atractor.', keyword: 'milky way galaxy spiral stars motion', searchTerms: ['milky way', 'galaxy', 'stars'], durationSec: 5.8 },
        { text: 'Aún no sabemos con certeza qué estructura colosal ejerce tanta atracción gravitacional.', keyword: 'deep cosmic void mystery question mark stars', searchTerms: ['stars', 'void', 'mystery'], durationSec: 5.5 },
        { text: 'Apenas hemos explorado una fracción microscópica de las maravillas que existen en el cosmos.', keyword: 'james webb space telescope golden mirrors deep', searchTerms: ['telescope', 'space', 'astronaut'], durationSec: 5.7 },
        { text: 'Comparte este video con tus amigos amantes de la ciencia y acompáñanos en el próximo viaje documental.', keyword: 'cinematic horizon sunrise earth orbit blue marble', searchTerms: ['earth', 'sunrise', 'space'], durationSec: 5.6 },
      ];

      return {
        title: isLand ? `El Universo y la Mente: Misterios Científicos Asombrosos sobre ${topic || 'el Cosmos'}` : `3 Datos Perturbadores sobre ${topic || 'el Espacio y la Mente'} que nadie te cuenta`,
        scenes: makeAdaptedScenes(pScenes, lAddons, orientation),
        hashtags: ['#Ciencia', '#Universo', '#DatosCuriosos', '#Astronomia', isLand ? '#Documental' : '#Shorts'],
        description: `Un recorrido fascinante por los misterios más intrigantes del universo y la mente sobre ${topic || 'el cosmos'}.`,
        musicMood: 'epic',
      };
    },
  },

  productivity: {
    name: '⚡ Productividad & Deep Work',
    mood: 'upbeat',
    generator: (topic, orientation = 'portrait') => {
      const isLand = orientation === 'landscape';
      const pScenes = [
        { text: 'Deja de hacer multitarea hoy mismo si realmente quieres alcanzar tus metas el doble de rápido.', keyword: 'person working laptop focused office clean desk', searchTerms: ['working', 'laptop', 'office'], durationSec: 4.8 },
        { text: 'La ciencia neurológica demuestra que cambiar constantemente de tarea reduce tu cociente intelectual temporalmente.', keyword: 'brain scan neuroscience focus concentration', searchTerms: ['brain', 'neuroscience', 'focus'], durationSec: 5.5 },
        { text: 'Implementa bloques de trabajo profundo de cincuenta minutos sin mirar notificaciones de tu teléfono.', keyword: 'timer clock modern desk plant coffee minimal', searchTerms: ['clock', 'timer', 'coffee'], durationSec: 5.4 },
        { text: 'Al eliminar las interrupciones, tu mente entra en el estado de flujo en menos de quince minutos.', keyword: 'meditation calm focused mental flow water stream', searchTerms: ['meditation', 'focus', 'water'], durationSec: 5.5 },
        { text: 'Aplica la regla de los dos minutos: si una tarea toma menos de ciento veinte segundos, ejecútala ya.', keyword: 'writing notebook checkmark list goal achieved', searchTerms: ['writing', 'notes', 'success'], durationSec: 5.4 },
        { text: 'Planifica tus tres prioridades más importantes cada noche antes de ir a descansar.', keyword: 'night city lights planner journal writing dark', searchTerms: ['night', 'planner', 'city'], durationSec: 5.2 },
        { text: 'Al despertar tendrás claridad absoluta y evitarás la fatiga por toma de decisiones.', keyword: 'morning sunrise window fresh coffee productive day', searchTerms: ['morning', 'coffee', 'sunrise'], durationSec: 5.4 },
        { text: 'El ochenta por ciento de tus resultados proviene de solo el veinte por ciento de tus esfuerzos.', keyword: 'financial chart growth analytics success graph', searchTerms: ['chart', 'analytics', 'growth'], durationSec: 5.5 },
        { text: 'Identifica esa única actividad palanca y dedícale tu primera hora del día.', keyword: 'chess piece king victory strategy business focus', searchTerms: ['chess', 'strategy', 'success'], durationSec: 5.2 },
        { text: 'Guarda este video y pon en práctica el primer bloque de trabajo profundo hoy mismo.', keyword: 'runner athlete finish line victory success sunrise', searchTerms: ['runner', 'victory', 'sunrise'], durationSec: 5.0 },
      ];

      const lAddons = [
        { text: 'La gestión de tu energía es mucho más importante que la gestión tradicional del tiempo.', keyword: 'sleeping deep rest health heart rate monitor', searchTerms: ['health', 'rest', 'energy'], durationSec: 5.6 },
        { text: 'Tu cuerpo opera en ritmos ultradianos de aproximadamente noventa a ciento veinte minutos.', keyword: 'sound waves biological rhythms pulse abstract light', searchTerms: ['pulse', 'light', 'energy'], durationSec: 5.6 },
        { text: 'Ignorar estos ciclos naturales genera agotamiento mental crónico y disminución de la creatividad.', keyword: 'exhausted worker taking break forest walking fresh air', searchTerms: ['nature', 'forest', 'break'], durationSec: 5.8 },
        { text: 'Aprende a programar pausas deliberadas: caminar diez minutos restablece tus redes neuronales.', keyword: 'walking green park trees sunny relaxed peaceful', searchTerms: ['park', 'walking', 'trees'], durationSec: 5.6 },
        { text: 'Elimina las distracciones digitales con intención: silenciar alertas multiplica tu capacidad creativa.', keyword: 'smartphone notifications off quiet clean minimal desk', searchTerms: ['smartphone', 'desk', 'minimal'], durationSec: 5.8 },
        { text: 'El éxito duradero no es el resultado de maratones agotadoras, sino de la constancia disciplinada diaria.', keyword: 'marathon finish line dedication mountain climb sunrise', searchTerms: ['mountain', 'climb', 'sunrise'], durationSec: 5.8 },
        { text: 'Mejorar tan solo un uno por ciento cada día te hace treinta y siete veces mejor al cabo de un año.', keyword: 'exponential growth curve golden ratio spiral math', searchTerms: ['growth', 'spiral', 'abstract'], durationSec: 5.8 },
        { text: 'Suscríbete al canal para dominar nuevos métodos de alta productividad y desarrollo personal.', keyword: 'modern architecture skyline glass skyscraper success', searchTerms: ['skyscraper', 'architecture', 'city'], durationSec: 5.5 },
      ];

      return {
        title: isLand ? `El Método Definitivo de Productividad y Enfoque Profundo para ${topic || 'alcanzar el Éxito'}` : `Deja de Multitask si quieres lograr ${topic || 'tus Metas'} el doble de rápido`,
        scenes: makeAdaptedScenes(pScenes, lAddons, orientation),
        hashtags: ['#Productividad', '#DeepWork', '#Habitos', '#Enfoque', '#Disciplina', isLand ? '#Exito' : '#Shorts'],
        description: `Aprende a optimizar tu rendimiento, concentración y hábitos diarios con este método comprobado sobre ${topic || 'productividad'}.`,
        musicMood: 'upbeat',
      };
    },
  },

  ocean: {
    name: '🌊 Océanos & Naturaleza Extrema',
    mood: 'epic',
    generator: (topic, orientation = 'portrait') => {
      const isLand = orientation === 'landscape';
      const pScenes = [
        { text: 'Más del ochenta por ciento de nuestros fondos oceánicos permanece completamente inexplorado.', keyword: 'deep dark ocean underwater mystery waves', searchTerms: ['ocean', 'underwater', 'waves'], durationSec: 5.0 },
        { text: 'Conocemos con mayor precisión la superficie de Marte y la Luna que las profundidades de nuestro propio mar.', keyword: 'mars surface red planet moon comparison ocean', searchTerms: ['mars', 'planet', 'ocean'], durationSec: 5.6 },
        { text: 'En la Fosa de las Marianas, a casi once mil metros bajo el agua, la presión aplastaría un tanque blindado.', keyword: 'submarine abyss deep darkness pressure underwater', searchTerms: ['submarine', 'underwater', 'abyss'], durationSec: 5.8 },
        { text: 'Allí habitan seres bioluminiscentes que generan su propia luz fosforescente en la oscuridad absoluta.', keyword: 'bioluminescent jellyfish glowing deep sea creature', searchTerms: ['jellyfish', 'glowing', 'underwater'], durationSec: 5.6 },
        { text: 'Criaturas con sangre anticongelante y adaptaciones extraordinarias desafían los límites de la biología.', keyword: 'strange deep sea fish monster alien underwater', searchTerms: ['fish', 'creature', 'underwater'], durationSec: 5.5 },
        { text: 'Bajo el lecho marino existen cascadas submarinas y ríos de salmuera densa que fluyen en las profundidades.', keyword: 'underwater waterfall brine pool surreal ocean floor', searchTerms: ['underwater', 'waterfall', 'ocean'], durationSec: 5.7 },
        { text: 'La cascada más gigantesca del planeta Tierra se encuentra sumergida bajo el estrecho de Dinamarca.', keyword: 'arctic ocean iceberg giant current cold water', searchTerms: ['iceberg', 'ocean', 'arctic'], durationSec: 5.5 },
        { text: 'El calamar colosal posee ojos del tamaño de un balón de baloncesto para detectar sombras en el abismo.', keyword: 'colossal squid tentacles giant eye dark sea', searchTerms: ['squid', 'tentacles', 'underwater'], durationSec: 5.6 },
        { text: 'El océano produce más del cincuenta por ciento de todo el oxígeno que respiras cada día.', keyword: 'phytoplankton microscopic ocean green blue glow oxygen', searchTerms: ['ocean', 'water', 'nature'], durationSec: 5.4 },
        { text: 'Suscríbete y comenta: ¿te atreverías a sumergirte en un submarino hacia el fondo de las Marianas?', keyword: 'deep sea research submarine diving blue ocean sunlight', searchTerms: ['submarine', 'ocean', 'diving'], durationSec: 5.2 },
      ];

      const lAddons = [
        { text: 'Los respiraderos hidrotermales del fondo oceánico expulsan agua a más de cuatrocientos grados centígrados.', keyword: 'hydrothermal vent black smoker deep sea volcanic heat', searchTerms: ['volcano', 'underwater', 'steam'], durationSec: 5.8 },
        { text: 'Sin embargo, la inmensa presión impide que el agua hierva, albergando ecosistemas únicos sin luz solar.', keyword: 'tube worms deep sea ecosystem volcanic warmth ocean', searchTerms: ['underwater', 'ocean', 'nature'], durationSec: 5.8 },
        { text: 'Muchos biólogos sospechan que la vida en la Tierra comenzó precisamente en estos respiraderos submarinos.', keyword: 'primordial soup origin of life cells molecules biology', searchTerms: ['biology', 'molecules', 'science'], durationSec: 5.8 },
        { text: 'Existe un punto en el océano Pacífico llamado Punto Nemo, el lugar más inaccesible y remoto del planeta.', keyword: 'point nemo remote ocean globe satellite view solitary', searchTerms: ['ocean', 'globe', 'satellite'], durationSec: 5.6 },
        { text: 'Los seres humanos más cercanos a ese punto son con frecuencia los astronautas de la Estación Espacial.', keyword: 'international space station orbiting earth blue horizon', searchTerms: ['iss', 'astronaut', 'earth'], durationSec: 5.8 },
        { text: 'Allí descansan cementerios de satélites y naves espaciales desactivadas a cuatro mil metros de profundidad.', keyword: 'sunken spacecraft titanium wreckage deep sea graveyard', searchTerms: ['submarine', 'ocean', 'wreckage'], durationSec: 5.8 },
        { text: 'El océano guarda secretos milenarios que apenas comenzamos a vislumbrar con la robótica moderna.', keyword: 'autonomous underwater vehicle explorer high tech ocean', searchTerms: ['robot', 'underwater', 'technology'], durationSec: 5.6 },
        { text: 'Sigue descubriendo los misterios más impresionantes de la naturaleza suscribiéndote a nuestro canal.', keyword: 'whale breach ocean sunset majestic nature spray', searchTerms: ['whale', 'ocean', 'sunset'], durationSec: 5.4 },
      ];

      return {
        title: isLand ? `El Abismo Oceánico: Explorando los Secretos Más Profundos de ${topic || 'los Mares Terrestres'}` : `Los Secretos más Oscuros del Fondo del Océano y ${topic || 'el Abismo Marino'}`,
        scenes: makeAdaptedScenes(pScenes, lAddons, orientation),
        hashtags: ['#Oceano', '#Naturaleza', '#MisteriosMarinos', '#Abismo', '#Ciencia', isLand ? '#Documental' : '#Shorts'],
        description: `Un viaje a las profundidades inexploradas del océano. Misterios marinos sobre ${topic || 'el abismo'}.`,
        musicMood: 'epic',
      };
    },
  },

  stoic: {
    name: '🏛️ Estoicismo & Mentalidad',
    mood: 'lofi',
    generator: (topic, orientation = 'portrait') => {
      const isLand = orientation === 'landscape';
      const pScenes = [
        { text: 'Si sufres por cosas fuera de tu control, esta lección estoica de hace dos mil años transformará tu vida.', keyword: 'stoic marble statue ancient rome dramatic shadow', searchTerms: ['statue', 'sculpture', 'rome'], durationSec: 5.0 },
        { text: 'Marco Aurelio escribió: Tienes poder sobre tu propia mente, no sobre los acontecimientos externos.', keyword: 'calm rain window city dark room introspective', searchTerms: ['rain', 'window', 'city'], durationSec: 5.4 },
        { text: 'Cuando comprendes esta simple verdad fundamental, encuentras una fortaleza indestructible.', keyword: 'warrior standing cliff mountain fog sunrise epic', searchTerms: ['mountain', 'warrior', 'fog'], durationSec: 5.2 },
        { text: 'Epicteto nos enseñó que no son las cosas las que nos perturban, sino el juicio que hacemos sobre ellas.', keyword: 'ancient philosopher writing papyrus candle light dark', searchTerms: ['candle', 'writing', 'books'], durationSec: 5.6 },
        { text: 'El noventa por ciento de tus preocupaciones cotidianas nunca llegarán a ocurrir en el mundo real.', keyword: 'foggy morning trees mist silhouette lone walking', searchTerms: ['fog', 'trees', 'mist'], durationSec: 5.4 },
        { text: 'Son simplemente sombras proyectadas por una mente no entrenada en el arte del discernimiento.', keyword: 'shadows lantern flame dark corridor introspective', searchTerms: ['shadows', 'lantern', 'flame'], durationSec: 5.2 },
        { text: 'Deja de buscar la validación ajena: quien vive para complacer a todos termina perdiéndose a sí mismo.', keyword: 'mirror reflection lone person quiet calm confidence', searchTerms: ['mirror', 'reflection', 'quiet'], durationSec: 5.5 },
        { text: 'Sé implacable con tu disciplina interior y compasivo con las debilidades de los demás.', keyword: 'samurai sword katana disciplined focus training', searchTerms: ['training', 'focus', 'swords'], durationSec: 5.2 },
        { text: 'Recuerda que cada obstáculo en tu camino es una oportunidad oculta para forjar tu carácter.', keyword: 'stone path mountain steep climb golden sunrise light', searchTerms: ['mountain', 'climb', 'sunrise'], durationSec: 5.5 },
        { text: 'Guarda este video y pon en práctica la serenidad estoica hoy mismo.', keyword: 'calm ocean waves gentle shore sunset peaceful horizon', searchTerms: ['ocean', 'waves', 'sunset'], durationSec: 4.8 },
      ];

      const lAddons = [
        { text: 'Séneca advertía: A menudo sufrimos más en la imaginación que en la realidad tangible.', keyword: 'ancient library scrolls books philosophy wisdom room', searchTerms: ['library', 'books', 'scrolls'], durationSec: 5.6 },
        { text: 'La práctica del Amor Fati te enseña no solo a tolerar lo que sucede, sino a amarlo como necesario.', keyword: 'fire burning wood hearth cozy warm glowing embers', searchTerms: ['fire', 'embers', 'warmth'], durationSec: 5.8 },
        { text: 'Todo lo que ocurre puede ser combustible para tu crecimiento, tal como el fuego devora todo a su paso.', keyword: 'bonfire flames rising into starry night sky spark', searchTerms: ['bonfire', 'flames', 'night'], durationSec: 5.6 },
        { text: 'El Memento Mori te recuerda que tu tiempo es finito y que este momento presente es irrepetible.', keyword: 'hourglass falling sand antique brass time running out', searchTerms: ['hourglass', 'sand', 'time'], durationSec: 5.8 },
        { text: 'No malgastes tus horas quejándote por lo que falta; agradece y actúa con rectitud aquí y ahora.', keyword: 'lone tree standing strong in field windy beautiful sky', searchTerms: ['tree', 'field', 'sky'], durationSec: 5.6 },
        { text: 'La verdadera libertad interior no depende de la riqueza material, sino del dominio de tus deseos.', keyword: 'minimalist stone garden zen quiet peaceful nature', searchTerms: ['zen', 'garden', 'nature'], durationSec: 5.8 },
        { text: 'Camina con la cabeza erguida frente a la tormenta, sabiendo que la calma reside en tu interior.', keyword: 'man standing calm in light breeze mountain overlook', searchTerms: ['mountain', 'breeze', 'calm'], durationSec: 5.6 },
        { text: 'Suscríbete para continuar profundizando en la filosofía estoica y el dominio de tu propia mente.', keyword: 'marble columns ancient temple sunbeam golden hour', searchTerms: ['temple', 'columns', 'sunbeam'], durationSec: 5.4 },
      ];

      return {
        title: isLand ? `Filosofía Estoica: Cómo Alcanzar Paz Mental y Fortaleza Interior según ${topic || 'los Grandes Maestros'}` : `La Regla Estoica de Marco Aurelio para Dominar ${topic || 'la Ansiedad'}`,
        scenes: makeAdaptedScenes(pScenes, lAddons, orientation),
        hashtags: ['#Estoicismo', '#Filosofia', '#MarcoAurelio', '#Mentalidad', '#PazMental', isLand ? '#Reflexion' : '#Shorts'],
        description: `Sabiduría estoica para cultivar serenidad, resiliencia y autocontrol ante el caos sobre ${topic || 'la vida'}.`,
        musicMood: 'lofi',
      };
    },
  },
};

export const AIEngine = {
  /**
   * Generates a video script using direct LLM APIs (Gemini, Groq, OpenAI) or built-in templates.
   * Calibrated for ~1 minute (10-12 scenes) on 9:16 vertical and ~2 minutes (18-22 scenes) on 16:9 horizontal.
   */
  async generateScript({ topic, templateKey, provider, apiKey, customPrompt, language = 'es', orientation = 'portrait' }) {
    const isLandscape = orientation === 'landscape';

    // If user selected a built-in template or has no API key, use the instant rich template engine
    if (provider === 'template' || !provider) {
      const template = VIRAL_TEMPLATES[templateKey] || VIRAL_TEMPLATES.curiosities;
      return template.generator(topic, orientation);
    }

    if (!apiKey) {
      if (provider === 'openai') {
        throw new Error('No has configurado una API Key de OpenAI. Puedes usar Google Gemini o Groq (gratuitos), o la Plantilla Inteligente Local sin APIs.');
      } else {
        throw new Error(`No has configurado la API Key para ${provider.toUpperCase()}. Configúrala en el botón "API Keys" o usa la Plantilla Inteligente Local.`);
      }
    }

    const systemPrompt = isLandscape
      ? `You are an expert documentary scriptwriter and video creator for widescreen YouTube videos (16:9 format).
Generate an in-depth, gripping 2-minute video script (between 110 and 120 seconds total duration) about: "${topic || customPrompt || 'curiosidades y ciencia'}".
Language: ${language === 'es' ? 'Spanish (Español)' : 'English'}.

Structure rules for 16:9 2-minute video:
1. Generate between 18 and 22 scenes (each scene durationSec between 5.0 and 6.0 seconds, totaling approx 110-120 seconds).
2. Scene 1: Cinematic hook introducing the premise.
3. Scenes 2-6: Background story and foundational context.
4. Scenes 7-12: Core revelations, surprising scientific or historical data, and vivid examples.
5. Scenes 13-17: Surprising twists, modern implications, or remarkable paradoxes.
6. Scenes 18-20: Meaningful summary, concluding insight, and call to action to subscribe.
7. Provide 3-4 specific visual search keywords in English for each scene (for B-roll video search).

You MUST reply ONLY with valid JSON following this exact structure, with no markdown code fences, backticks, or other text:
{
  "title": "Compelling YouTube Video Title",
  "scenes": [
    {
      "id": 1,
      "text": "Narrated voiceover text for scene 1 (clean, engaging sentence)",
      "keyword": "cinematic landscape drone mountains",
      "searchTerms": ["landscape", "nature", "mountains"],
      "durationSec": 5.5
    }
  ],
  "hashtags": ["#YouTube", "#Documental", "#Curiosidades", "#Ciencia"],
  "description": "Comprehensive YouTube description with chapters and keywords",
  "musicMood": "epic"
}`
      : `You are a world-class viral short-form video scriptwriter (for TikTok, YouTube Shorts, and Instagram Reels in 9:16 vertical format).
Generate a high-converting, gripping vertical video script calibrated for exactly 1 minute (~55-60 seconds total) about: "${topic || customPrompt || 'curiosidades asombrosas'}".
Language: ${language === 'es' ? 'Spanish (Español)' : 'English'}.

Structure rules for 9:16 1-minute video:
1. Generate between 10 and 12 scenes (each scene durationSec between 4.5 and 5.5 seconds, totaling approx 55-60 seconds).
2. Scene 1: Irresistible 3-second hook (curiosity gap, paradox, or counterintuitive statement).
3. Scenes 2-9: Rapid-fire succession of high-retention facts, twists, and mind-bending discoveries.
4. Scenes 10-12: Climax revelation and strong Call to Action (like, comment your answer, follow).
5. Provide 3-4 specific visual search keywords in English for each scene (for B-roll video search).

You MUST reply ONLY with valid JSON following this exact structure, with no markdown code fences, backticks, or other text:
{
  "title": "Viral Clickbait Title",
  "scenes": [
    {
      "id": 1,
      "text": "Narrated voiceover text for scene 1 (punchy, high-retention)",
      "keyword": "space galaxy nebula",
      "searchTerms": ["space", "galaxy", "nebula"],
      "durationSec": 4.8
    }
  ],
  "hashtags": ["#Shorts", "#Viral", "#TikTok", "#Curiosidades"],
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
