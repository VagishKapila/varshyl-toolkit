/**
 * @varshylinc/soren/server — the engine-side bridge.
 *
 * Node-only. Turns a product {@link SorenAdapter} into engine-ready
 * `SorenSkillTool`s and manages per-job context. The engine wires
 * `productId` → adapter selection and wraps each room job in `runSorenJob`.
 */
export type {
  SorenAdapter,
  SorenCapabilities,
  SorenVerbContext,
  SorenVerbResult,
} from './adapter';
export { implementedVerbs } from './adapter';
export { ok, fail, infoResult, resultCard, type ResultCardInput } from './result';
export {
  runSorenJob,
  getSorenContext,
  tryGetSorenContext,
  type SorenJobContext,
} from './jobContext';
export { verbInputSchema, verbDescription } from './schemas';
export { buildSorenSkills, type SorenSkillTool } from './skills';
