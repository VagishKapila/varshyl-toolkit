import { describe, it } from 'vitest';
import * as ReactBarrel from '@varshylinc/ui-inputs/react';
import { expectNamedExport } from '../../../../vitest/barrel-contract-helpers.js';

describe('@varshylinc/ui-inputs/react barrel', () => {
  it('exports all Varshyl input components', () => {
    expectNamedExport(ReactBarrel, 'VarshylTextInput', 'function');
    expectNamedExport(ReactBarrel, 'VarshylEmailInput', 'function');
    expectNamedExport(ReactBarrel, 'VarshylAddressInput', 'function');
    expectNamedExport(ReactBarrel, 'VarshylSearchInput', 'function');
    expectNamedExport(ReactBarrel, 'VarshylPasswordInput', 'function');
  });
});
