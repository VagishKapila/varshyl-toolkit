import { describe, it } from 'vitest';
import * as Main from '@varshylinc/ui-inputs';
import { expectNamedExport } from '../../../../vitest/barrel-contract-helpers.js';

describe('@varshylinc/ui-inputs main barrel', () => {
  it('exports VERSION and all Varshyl input components', () => {
    expectNamedExport(Main, 'VERSION', 'const');
    expectNamedExport(Main, 'VarshylTextInput', 'function');
    expectNamedExport(Main, 'VarshylEmailInput', 'function');
    expectNamedExport(Main, 'VarshylAddressInput', 'function');
    expectNamedExport(Main, 'VarshylSearchInput', 'function');
    expectNamedExport(Main, 'VarshylPasswordInput', 'function');
  });
});
