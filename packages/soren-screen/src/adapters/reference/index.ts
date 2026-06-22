import type { SorenConfig } from '../../types.js';
import { REFERENCE_QA } from './qa.js';
import { referenceSkills } from './skills.js';

export { REFERENCE_QA, referenceSkills };

export const referenceConfig: SorenConfig = {
  productId: 'reference',
  productName: 'Soren Reference',
  avatarEmoji: '🤖',
  titleOptions: ['Mr.', 'Ms.', 'Demo User'],
  greeting: (user) => `Hello, ${user.firstName}. This is the reference Soren screen.`,
  actions: [
    { id: 'demo-log', icon: '📋', title: 'Demo Log', subtitle: 'No-op route', onTap: '/demo/log' },
    { id: 'portfolio', icon: '🏆', title: 'Portfolio', subtitle: 'Demo stats', onTap: 'portfolio-builder' },
    { id: 'notify', icon: '🔔', title: 'Notify', subtitle: 'Demo flow', onTap: 'client-notification' },
    { id: 'qa', icon: '❓', title: 'Ask Soren', subtitle: '20 demo Q&As', onTap: 'qa' },
  ],
  qaAdapter: 'reference',
  portfolio: {
    enabled: true,
    pdfTemplate: 'construction-superintendent',
    shareTargets: ['linkedin'],
  },
};
