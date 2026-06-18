# @varshylinc/notifications

Reusable notifications **engine** for Varshyl Capacitor products — device token storage, FCM/APNs push send (Firebase Admin), local notification scheduling, and Hub-ready broadcast delivery.

No product domain concepts (projects, daily logs, inactivity, etc.) — those stay in the host app.

## Install

```bash
pnpm add @varshylinc/notifications firebase-admin pg
# Capacitor client (optional):
pnpm add @capacitor/push-notifications @capacitor/local-notifications @capacitor/core
```

## Subpath exports

| Import | Use for |
|--------|---------|
| `@varshylinc/notifications` | Types, `runMigrations`, `DeviceTokenStore` interface |
| `@varshylinc/notifications/server` | FCM send, token CRUD, Postgres store (**never import in client bundle**) |
| `@varshylinc/notifications/client` | Capacitor push registration + local notification scheduling |

## Server — migrations

```typescript
import { runMigrations } from '@varshylinc/notifications';

await runMigrations(pool);
```

Tables use the `nt_*` prefix (`nt_device_tokens`).

## Server — send to one user

```typescript
import {
  createPgDeviceTokenStore,
  sendPush,
} from '@varshylinc/notifications/server';

const store = createPgDeviceTokenStore(pool);

await sendPush(store, userId, orgId, {
  title: 'Hello',
  body: 'Something happened',
  route: '/settings',
  data: { type: 'announcement' },
});
```

Env (optional — push disabled when unset):

```
PUSH_ENABLED=true
FCM_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FCM_PROJECT_ID=your-project
```

## Server — Hub broadcast segment

```typescript
import {
  listEligibleTokens,
  sendPushToSegment,
  createPgDeviceTokenStore,
} from '@varshylinc/notifications/server';

const audience = await listEligibleTokens(pool, { announcementsOptIn: true });
const tokens = audience.map((row) => row.token);

const report = await sendPushToSegment(tokens, {
  title: 'New in Varshyl',
  body: 'Check out the latest update.',
  route: '/announcements',
}, { store: createPgDeviceTokenStore(pool) });

// report: { sent, failed, failedTokens[] }
```

## Client — push token registration

```typescript
import { registerForPushNotifications } from '@varshylinc/notifications/client';

await registerForPushNotifications({
  onToken: async (token, platform) => {
    await fetch('/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ token, platform }),
    });
  },
});
```

## Client — local notifications

```typescript
import {
  scheduleLocalNotifications,
  cancelLocalNotifications,
} from '@varshylinc/notifications/client';

await scheduleLocalNotifications([{
  id: 1,
  title: 'Reminder',
  body: 'Time to check in.',
  schedule: { on: { hour: 17, minute: 0 }, every: 'day', repeats: true },
  extra: { route: '/home' },
}]);
```

## Token schema

`DeviceToken`: `{ userId, orgId, platform, token, announcementsOptIn, createdAt }`

Transactional pushes ignore `announcementsOptIn`. Hub broadcast should filter `announcementsOptIn: true`.

## License

Apache-2.0
