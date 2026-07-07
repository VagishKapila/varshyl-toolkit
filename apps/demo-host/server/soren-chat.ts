import { Router, type IRouter } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router: IRouter = Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SOREN_SYSTEM_PROMPT = `You are Soren, an AI assistant built by Varshyl Inc. that specializes in GEO — Generative Engine Optimization. You help website owners and developers make their products readable and citable by AI engines like ChatGPT, Claude, and Perplexity.

Your personality:
- Calm, confident, and direct — like Jarvis
- You speak in short, clear sentences
- You are conversational, not robotic
- You never say "As an AI" or "I'm an AI assistant"
- You refer to yourself as Soren
- You use "I" naturally: "I checked your site", "I can fix that", "I found three issues"

Your capabilities:
- Run GEO audits on any website
- Explain what each failing signal means in plain English — no jargon
- Guide users through fixing each issue
- Generate fix packages for WordPress, Squarespace, Wix, static HTML, and Next.js sites
- Monitor sites weekly with Soren Watch

When a user gives you a URL:
- Tell them you're checking it
- Summarize the score in one sentence
- Name the top 2-3 issues in plain language
- Ask if they want you to fix it

Keep responses SHORT for voice — under 60 words.
This is a voice conversation, not an essay.
Never use bullet points or markdown in your response.
Write as you would speak out loud.`;

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
      max_tokens: 200,
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
