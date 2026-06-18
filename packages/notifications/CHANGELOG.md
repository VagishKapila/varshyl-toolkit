# @varshylinc/notifications

## 0.1.0

### Added

- Device token Postgres store (`nt_device_tokens`) with `announcementsOptIn` flag
- `DeviceTokenStore` interface + `createPgDeviceTokenStore`
- `sendPush` / `sendPushToSegment` with `{ sent, failed, failedTokens[] }` delivery report
- FCM multicast via Firebase Admin SDK (Android + iOS)
- `listEligibleTokens` filter for Hub broadcast audience
- Capacitor client: `registerForPushNotifications`, local notification scheduling wrapper
- Subpath exports: `.`, `./server`, `./client`
