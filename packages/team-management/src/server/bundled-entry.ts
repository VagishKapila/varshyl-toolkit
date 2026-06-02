/** Slim server entry for bundled-runtime tests (no Express router graph). */
export { runMigrations, type RunMigrationsOptions } from './migrations.js';
export {
  tmSelfTest,
  type TmSelfTestResult,
  type TmSelfTestOptions,
} from './selfTest.js';
export {
  createTmPool,
  DEFAULT_TM_CONNECTION_TIMEOUT_MS,
  DEFAULT_TM_OPERATION_TIMEOUT_MS,
  type CreateTmPoolOptions,
} from './pool.js';
export { TmError, type TmErrorCode } from './errors.js';
