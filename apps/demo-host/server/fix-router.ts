import { Router } from 'express';
import { generateFixPackage } from './fix-generator.js';
import type { Platform } from './platform-detector.js';

const router: Router = Router();

router.options('/', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).end();
});

router.post('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { platform, failingChecks, siteInfo } = req.body as {
    platform: Platform;
    failingChecks: { name: string; tip: string }[];
    siteInfo: {
      url: string;
      productName?: string;
      companyName?: string;
    };
  };

  if (!platform || !failingChecks || !siteInfo?.url) {
    res.status(400).json({
      error: 'platform, failingChecks, and siteInfo.url required',
    });
    return;
  }

  try {
    const fixPackage = generateFixPackage(
      platform,
      failingChecks,
      siteInfo,
    );
    res.json(fixPackage);
  } catch (err) {
    console.error('Fix generator error:', err);
    res.status(500).json({ error: 'Fix generation failed' });
  }
});

export default router;
