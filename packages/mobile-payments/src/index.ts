import { createSubscriptionStore } from './server/create-store.js';
import { assertCanWrite, getAccessModeForUser } from './server/access.js';
import { createRevenueCatWebhookHandler } from './server/revenuecat-webhook.js';
import { createMockSubscriptionStore } from './server/mock-store.js';
import { emitSubscriptionEvent } from './server/events.js';
import { assignBuyerSeat } from './server/seats.js';
import { runMigrations, BOOTSTRAP_SQL } from './server/migrations.js';
import {
  createMpPool,
  DEFAULT_MP_CONNECTION_TIMEOUT_MS,
  DEFAULT_MP_OPERATION_TIMEOUT_MS,
} from './server/pool.js';
import { mpSelfTest } from './server/selfTest.js';
import { MpError } from './server/errors.js';
import {
  hasGrantedAccess,
  grantAccess,
  revokeAccess,
  listGrants,
  createPromoCode,
  redeemPromoCode,
  listPromoCodes,
} from './server/grants.js';

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
export type { RunMigrationsOptions } from './server/migrations.js';
export type { CreateMpPoolOptions } from './server/pool.js';
export type { MpSelfTestResult, MpSelfTestOptions } from './server/selfTest.js';
export type { MpErrorCode } from './server/errors.js';
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
