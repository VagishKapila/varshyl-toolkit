import { describe, it } from 'vitest';
import * as Main from '@varshylinc/notifications';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';

describe('@varshylinc/notifications main barrel', () => {
  it('exports shared types and migrations without server send symbols', () => {
    expectNamedExport(Main, 'runMigrations', 'function');
    expectNamedExport(Main, 'BOOTSTRAP_SQL', 'const');
    expectNamedExport(Main, 'NtError', 'class');
    expectNotOnBarrel(Main, 'sendPush');
    expectNotOnBarrel(Main, 'sendPushToSegment');
    expectNotOnBarrel(Main, 'sendFcmMulticast');
    expectNotOnBarrel(Main, 'registerForPushNotifications');
  });
});
