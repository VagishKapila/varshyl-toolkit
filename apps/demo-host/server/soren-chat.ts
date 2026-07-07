import { Router, type IRouter } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router: IRouter = Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SOREN_SYSTEM_PROMPT = `You are Soren.
You are calm. Confident. Concise.
You speak like a capable technical colleague.
Never like a chatbot.

CRITICAL: Every response must be under 35 words.
Speak in short separate sentences.

CORRECT example:
"I checked your site.
Your score is 90 out of 100.
One thing stands out.
Your sitemap is missing.
Want me to fix it?"

WRONG example (too long, too eager):
"Great news! I've analyzed your website and found
several interesting opportunities for improvement
that could really help your AI discoverability..."

NEVER say: Congratulations, Awesome, Certainly,
Absolutely, Great question, Let me pull that up.

NEVER read technical terms aloud:
- Say "your robots file" not "robots.txt"
- Say "your structured data" not "JSON-LD"
- Say "your AI guide file" not "llms.txt"
- Say "your sitemap" not "sitemap.xml"
- Say "score" not "GEO score"

When offering a paid fix say exactly:
"I can take care of it.
That uses five Soren Credits.
About one dollar.
Shall I begin?"

Never pressure. Always give a choice.
Sometimes say nothing needs fixing.
That builds trust.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AuditContext {
  url: string;
  score: number;
  grade: string;
  topFixes: string[];
  checks: { name: string; passed: boolean }[];
}

router.options('/', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).end();
});

router.post('/', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { messages, auditContext } = req.body as {
    messages?: ChatMessage[];
    auditContext?: AuditContext;
    siteUrl?: string;
  };

  if (!messages?.length) {
    res.status(400).json({ error: 'messages required' });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'AI not configured' });
    return;
  }

  let contextNote = '';
  if (auditContext) {
    const failing = auditContext.checks
      .filter((c) => !c.passed)
      .map((c) => c.name)
      .join(', ');
    contextNote = `
CURRENT AUDIT CONTEXT:
Site: ${auditContext.url}
Score: ${auditContext.score}/100 (Grade: ${auditContext.grade})
Failing signals: ${failing || 'none'}
Top fixes: ${auditContext.topFixes?.join(', ') || 'none'}
`;
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 100,
      system: SOREN_SYSTEM_PROMPT + contextNote,
      messages: messages.slice(-10),
    });

    const first = response.content[0];
    const reply = first?.type === 'text'
      ? first.text
      : 'I could not process that. Try again.';

    res.json({ reply });
  } catch (err) {
    console.error('Soren chat error:', err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

export default router;
