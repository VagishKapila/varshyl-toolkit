import { createSubscriptionStore } from './server/create-store.js';
import { runMigrations, MIGRATIONS_DIR } from './server/migrations.js';
import { assertCanWrite, getAccessModeForUser } from './server/access.js';
import { createRevenueCatWebhookHandler } from './server/revenuecat-webhook.js';
import { createMockSubscriptionStore } from './server/mock-store.js';
import { emitSubscriptionEvent } from './server/events.js';
import { assignBuyerSeat } from './server/seats.js';

export {
  createSubscriptionStore,
  runMigrations,
  MIGRATIONS_DIR,
  assertCanWrite,
  getAccessModeForUser,
  createRevenueCatWebhookHandler,
  createMockSubscriptionStore,
  emitSubscriptionEvent,
  assignBuyerSeat,
};

export type { SubscriptionStore } from './server/store.js';
export type { PaymentsConfig, ProductPaymentsConfig, ClientPaymentsConfig } from './config.js';
export type {
  SubscriptionStatus,
  SubscriptionState,
  SubscriptionRecord,
  AccessMode,
  NormalizedEvent,
  SeatAssignment,
  Offering,
  OfferingPackage,
} from './types.js';
