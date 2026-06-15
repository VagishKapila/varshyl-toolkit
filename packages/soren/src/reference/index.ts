/**
 * @varshylinc/soren/reference — the EXAMPLE adapter.
 *
 * A complete, browser-safe implementation of all 5 verbs over a simple
 * in-memory store. Use it as the end-to-end test harness and as the template
 * for a real product adapter. NOT a product.
 */
export { createReferenceAdapter, type ReferenceAdapterOptions } from './adapter';
export { SorenMemoryStore, seedReferenceStore, type SorenRecord, type SorenStore } from './store';
