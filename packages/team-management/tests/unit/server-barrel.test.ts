import { describe, it } from 'vitest';
import * as Server from '@varshylinc/team-management/server';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';

describe('@varshylinc/team-management/server barrel', () => {
  it('exports the expected named symbols', () => {
    expectNamedExport(Server, 'createServerModule', 'function');
    expectNamedExport(Server, 'runMigrations', 'function');
    expectNamedExport(Server, 'createTmPool', 'function');
    expectNamedExport(Server, 'tmSelfTest', 'function');
    expectNamedExport(Server, 'TmError', 'class');
    expectNamedExport(Server, 'DEFAULT_TM_CONNECTION_TIMEOUT_MS', 'const');
    expectNamedExport(Server, 'DEFAULT_TM_OPERATION_TIMEOUT_MS', 'const');
    expectNamedExport(Server, 'addOrgMember', 'function');
    expectNamedExport(Server, 'listOrgMembers', 'function');
    expectNamedExport(Server, 'getOrgHierarchy', 'function');
    expectNamedExport(Server, 'updateOrgMember', 'function');
    expectNamedExport(Server, 'removeOrgMember', 'function');
  });

  it('does not export internal symbols', () => {
    expectNotOnBarrel(Server, 'seedSuperAdmin');
    expectNotOnBarrel(Server, 'OrgPeoplePage');
    expectNotOnBarrel(Server, 'createHealthRouter');
  });
});
