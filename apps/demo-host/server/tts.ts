import { Router, type IRouter } from 'express';

const router: IRouter = Router();

// Cache so same phrases don't re-generate
const cache = new Map<string, Buffer>();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Soren's voice ID from ElevenLabs
// Default to "Adam" (ElevenLabs free voice) if not set
const SOREN_VOICE_ID = process.env.SOREN_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB';

router.options('/', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).end();
});

router.post('/', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { text, voiceId } = req.body as {
    text?: string;
    voiceId?: string;
  };

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  // Limit text length for cost control
  const cleanText = text.slice(0, 500).trim();

  if (!ELEVENLABS_API_KEY) {
    res.status(503).json({
      error: 'TTS not configured',
    });
    return;
  }

  // Check cache first
  const cacheKey = `${voiceId ?? SOREN_VOICE_ID}:${cleanText}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Cache', 'HIT');
    res.end(cached);
    return;
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId ?? SOREN_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('ElevenLabs error:', err);
      res.status(502).json({ error: 'TTS service error' });
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Cache (max 100 entries, evict oldest)
    if (cache.size >= 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }
    cache.set(cacheKey, buffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Cache', 'MISS');
    res.end(buffer);
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'Internal TTS error' });
  }
});

export default router;
