import { describe, it } from 'vitest';
import * as Main from '@varshylinc/team-management';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';

describe('@varshylinc/team-management main barrel', () => {
  it('exports the expected named symbols', () => {
    expectNamedExport(Main, 'createServerModule', 'function');
    expectNamedExport(Main, 'runMigrations', 'function');
    expectNamedExport(Main, 'createTmPool', 'function');
    expectNamedExport(Main, 'tmSelfTest', 'function');
    expectNamedExport(Main, 'TmError', 'class');
    expectNamedExport(Main, 'DEFAULT_TM_CONNECTION_TIMEOUT_MS', 'const');
    expectNamedExport(Main, 'DEFAULT_TM_OPERATION_TIMEOUT_MS', 'const');
    expectNamedExport(Main, 'addOrgMember', 'function');
    expectNamedExport(Main, 'listOrgMembers', 'function');
    expectNamedExport(Main, 'getOrgHierarchy', 'function');
    expectNamedExport(Main, 'updateOrgMember', 'function');
    expectNamedExport(Main, 'removeOrgMember', 'function');
  });

  it('does not export internal symbols', () => {
    expectNotOnBarrel(Main, 'OrgPeoplePage');
    expectNotOnBarrel(Main, 'setTmApiBase');
    expectNotOnBarrel(Main, 'ROLE_HIERARCHY');
  });
});
