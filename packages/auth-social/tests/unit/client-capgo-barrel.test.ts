import { describe, it } from 'vitest';
import * as Capgo from '@varshylinc/auth-social/client/capgo';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';

describe('@varshylinc/auth-social/client/capgo barrel', () => {
  it('exports the expected named symbols', () => {
    expectNamedExport(Capgo, 'createCapgoSocialProvider', 'function');
  });

  it('does not export internal symbols', () => {
    expectNotOnBarrel(Capgo, 'configureAuth');
    expectNotOnBarrel(Capgo, 'SocialButtons');
    expectNotOnBarrel(Capgo, 'createMockSocialProvider');
  });
});
