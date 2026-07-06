const GEO_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'anthropic-ai',
  'ChatGPT-User',
  'Bytespider',
  'YouBot',
];

export function generateRobotsTxt(): string {
  const lines: string[] = [];
  for (const bot of GEO_BOTS) {
    lines.push(`User-agent: ${bot}`);
    lines.push('Allow: /');
    lines.push('');
  }
  lines.push('User-agent: *');
  lines.push('Allow: /');
  return `${lines.join('\n')}\n`;
}
