import { createSubscriptionStore } from './server/create-store.js';
import { assertCanWrite, getAccessModeForUser } from './server/access.js';
import { createRevenueCatWebhookHandler } from './server/revenuecat-webhook.js';
import { createMockSubscriptionStore } from './server/mock-store.js';
import { emitSubscriptionEvent } from './server/events.js';
import { assignBuyerSeat } from './server/seats.js';
import {
  runMigrations,
  BOOTSTRAP_SQL,
  createMpPool,
  mpSelfTest,
  MpError,
  DEFAULT_MP_CONNECTION_TIMEOUT_MS,
  DEFAULT_MP_OPERATION_TIMEOUT_MS,
  grantsRouter,
  hasGrantedAccess,
  grantAccess,
  revokeAccess,
  listGrants,
  createPromoCode,
  redeemPromoCode,
  listPromoCodes,
} from './server/index.js';

export {
  createSubscriptionStore,
  runMigrations,
  BOOTSTRAP_SQL,
  assertCanWrite,
  getAccessModeForUser,
  createRevenueCatWebhookHandler,
  createMockSubscriptionStore,
  emitSubscriptionEvent,
  assignBuyerSeat,
  createMpPool,
  mpSelfTest,
  MpError,
  DEFAULT_MP_CONNECTION_TIMEOUT_MS,
  DEFAULT_MP_OPERATION_TIMEOUT_MS,
  grantsRouter,
  hasGrantedAccess,
  grantAccess,
  revokeAccess,
  listGrants,
  createPromoCode,
  redeemPromoCode,
  listPromoCodes,
};

export type { SubscriptionStore } from './server/store.js';
export type { PaymentsConfig, ProductPaymentsConfig, ClientPaymentsConfig } from './config.js';
export type {
  RunMigrationsOptions,
  CreateMpPoolOptions,
  MpSelfTestResult,
  MpSelfTestOptions,
  MpErrorCode,
} from './server/index.js';
export type {
  SubscriptionStatus,
  SubscriptionState,
  SubscriptionRecord,
  AccessMode,
  NormalizedEvent,
  SeatAssignment,
  Offering,
  OfferingPackage,
  GrantRecord,
  PromoCode,
} from './types.js';
