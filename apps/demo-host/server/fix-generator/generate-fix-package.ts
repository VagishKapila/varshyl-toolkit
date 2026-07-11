import type { FixFile, GeoAudit, SiteMetadata } from './types.js';
import { CHECK_TEMPLATES } from './file-templates/index.js';
import { buildPrompt } from './prompt-template.js';
import { buildReadme } from './readme-template.js';

export interface GenerateFixPackageInput {
  audit: GeoAudit;
  siteMetadata: SiteMetadata;
}

export function generateFixPackage(
  input: GenerateFixPackageInput,
): { files: FixFile[]; readme: string; prompt: string } {
  const { audit, siteMetadata } = input;
  const files: FixFile[] = [];

  for (const check of audit.checks) {
    if (check.passed || check.info) continue;
    const template = CHECK_TEMPLATES[check.name];
    if (!template) continue;
    const file = template(siteMetadata);
    if (!file) continue;
    if (files.some((f) => f.filename === file.filename)) continue;
    files.push(file);
  }

  const readme = buildReadme(audit, siteMetadata, files);
  const prompt = buildPrompt(audit, siteMetadata, files);

  return { files, readme, prompt };
}
