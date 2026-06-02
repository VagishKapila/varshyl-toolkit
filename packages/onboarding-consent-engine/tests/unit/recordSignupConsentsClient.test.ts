import { describe, it, expect } from 'vitest';
import { recordSignupConsents } from '../../src/client/actions.js';

describe('recordSignupConsents (client)', () => {
  it('throws when ToS or Privacy not granted before calling the API', async () => {
    await expect(
      recordSignupConsents({
        userId: 'u1',
        tosGranted: false,
        privacyGranted: true,
        aiTrainingGranted: false,
      }),
    ).rejects.toThrow('Terms of Service and Privacy Policy must be granted at signup');
  });
});
