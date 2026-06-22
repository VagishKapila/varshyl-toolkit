import type { SorenConfig } from '../../types.js';
import { timeOfDay } from '../../utils/timeOfDay.js';
import { JOBSITE_QA } from './qa.generated.js';
import { jobsiteSkills } from './skills.js';

export { JOBSITE_QA, jobsiteSkills };

export const jobsiteConfig: SorenConfig = {
  productId: 'jobsite-intel',
  productName: 'JobSite Intel AI',
  avatarEmoji: '👷',
  titleOptions: ['Mr.', 'Mrs.', 'Ms.', 'Superintendent', 'Foreman', 'PM', 'Owner'],
  greeting: (user) => {
    const tod = timeOfDay();
    return `Good ${tod}, ${user.firstName}. Ready to document today's work?`;
  },
  actions: [
    {
      id: 'daily-log',
      icon: '📋',
      title: 'Daily Log',
      subtitle: "Start today's report",
      onTap: '/log/new',
    },
    {
      id: 'portfolio',
      icon: '🏆',
      title: 'My Portfolio',
      subtitle: 'Build your pro resume',
      onTap: 'portfolio-builder',
    },
    {
      id: 'notify-client',
      icon: '🔔',
      title: 'Notify Client',
      subtitle: 'Send a project update',
      onTap: 'client-notification',
    },
    {
      id: 'ask-soren',
      icon: '❓',
      title: 'Ask Soren',
      subtitle: 'JobSite questions',
      onTap: 'qa',
    },
  ],
  qaAdapter: 'jobsite',
  portfolio: {
    enabled: true,
    pdfTemplate: 'construction-superintendent',
    shareTargets: ['linkedin', 'tiktok', 'instagram'],
  },
};
