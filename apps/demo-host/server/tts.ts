import { Router, type IRouter } from 'express';

const router: IRouter = Router();
const cache = new Map<string, Buffer>();

const INWORLD_API_KEY = process.env.INWORLD_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
  ?? process.env.elevenlabs;

// Default Soren voice — Adrian on Inworld (calm, confident AI)
const SOREN_VOICE_ID = process.env.SOREN_VOICE_ID ?? 'Adrian';
const INWORLD_MODEL = 'inworld-tts-1.5-mini';
const ELEVENLABS_VOICE_FALLBACK = 'pNInz6obpgDQGcFmaJgB';

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

  const cleanText = text.slice(0, 500).trim();
  const voice = voiceId ?? SOREN_VOICE_ID;

  if (!INWORLD_API_KEY && !ELEVENLABS_API_KEY) {
    res.status(503).json({ error: 'TTS not configured' });
    return;
  }

  const cacheKey = `${voice}:${cleanText}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Cache', 'HIT');
    res.end(cached);
    return;
  }

  try {
    let audioBuffer: Buffer;

    if (INWORLD_API_KEY) {
      const response = await fetch(
        'https://api.inworld.ai/tts/v1/voice:synthesize',
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${INWORLD_API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: cleanText,
            voiceId: voice,
            modelId: INWORLD_MODEL,
          }),
        },
      );

      if (!response.ok) {
        const err = await response.text();
        console.error('Inworld TTS error:', response.status, err);
        throw new Error(`Inworld error ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
    } else if (ELEVENLABS_API_KEY) {
      const elVoice = voiceId ?? ELEVENLABS_VOICE_FALLBACK;
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elVoice}`,
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
        console.error('ElevenLabs TTS error:', err);
        throw new Error('ElevenLabs TTS error');
      }

      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error('No TTS provider configured');
    }

    if (cache.size >= 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }
    cache.set(cacheKey, audioBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Provider', INWORLD_API_KEY ? 'inworld' : 'elevenlabs');
    res.end(audioBuffer);
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

export default router;
