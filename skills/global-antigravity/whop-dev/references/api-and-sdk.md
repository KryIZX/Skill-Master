# API and SDK

## Contents
- Client setup
- API versions
- Renamed concepts
- Requests: pagination, errors, retries, idempotency
- Resource map
- Sandbox

## Client Setup

`@whop/sdk` 2.x (Fern-generated) is the TypeScript SDK. Other official SDKs are `whop-sdk` on PyPI (`from whop_sdk import Whop`), the `whop_sdk` gem (Ruby), and `github.com/whopio/whopsdk-go/v2` (Go). All take the token explicitly.

```ts
import { WhopClient } from "@whop/sdk";

export const whop = new WhopClient({
  token: process.env.WHOP_API_KEY,
});
```

- **Constructor options:** `token`, `environment`, `baseUrl`, `apiVersionDate`, `idempotencyKey`, `headers`, `timeoutInSeconds`, `maxRetries` (default 2), `fetch`, `logging`, `auth`, `stream`. There is no `appID`, `apiKey`, or `webhookKey`; unknown options are silently ignored.
- **No env fallback:** the SDK reads no environment variables. A missing token throws `WhopError: Please provide 'token' when initializing the client` on the first call, not at construction.
- **Calls take one object:** `whop.memberships.retrieve({ id })`, not `retrieve("mem_x")`. A positional string doesn't throw: it requests `/memberships/undefined`.
- **Never import it into client components.** It holds a secret key.

Raw REST: `https://api.whop.com/api/v1`, header `Authorization: Bearer <key>`. Send `Api-Version-Date` on every raw request.

## API Versions

- **Current API:** documented under `docs.whop.com/api-reference/beta/`, labelled "Current API". Build new work here.
- **Legacy API:** same base URL, still fully supported. Legacy-only (no Current API successor): courses (and chapters, lessons, students), forums, forum posts, chat channels, messages, reactions, DMs, experiences, invoices, affiliates, leads, AI chats, account links, support channels. See `docs.whop.com/api-reference/stability`.
- **Version header:** pin shapes with `Api-Version-Date` (SDK: `apiVersionDate`). The value must be an exact released version (e.g. `2026-10-15`, `2026-10-14-1`); any other date returns `400 Unknown Api-Version-Date` listing the supported versions. Versioned responses echo the version used in an `api-version-date` header (unversioned ones send none).
  - The SDK always sends a version: its build default (`@whop/sdk@2.5.0` sends `2026-10-13-1`) unless you set `apiVersionDate`. Overriding changes response shapes but not the SDK's types.
  - Raw requests without the header use the API key's stored pin (set when the key is created, shown in the dashboard). With neither, you get the unversioned legacy shapes: `company_id`/`company`, nested objects, epoch timestamps on some resources.
- **Breaking versions to know** (the `account_id` rename shipped per resource, not at once):
  - `2026-07-08-1`: checkout configuration timestamps are ISO 8601 instead of epoch.
  - `2026-07-18`: products and checkout configurations take `account_id`; checkout configuration responses return `account_id`.
  - `2026-07-22`: deletes return `{ id, deleted: true }` instead of `true`; timestamp filters accept ISO 8601 only; product responses return `account` instead of `company`.
  - `2026-07-23`: `memberships.cancel` revokes immediately (`cancel_at_period_end` schedules it); `extend` replaces `add_free_days`.
  - `2026-09-02-1`: payments and refunds are native: `account_id`, money objects, `201` on create.
  - `2026-10-07-1`: a saved-card charge with a `return_url` is treated as buyer-present; pass `off_session: true` for merchant-initiated charges.
  - Full list: `docs.whop.com/developer/api/versioning` (new versions ship often; match your installed SDK's version and check the changelog when upgrading).
- **API v2:** deprecated; shuts off 2026-11-13 (`Sunset` header on every v2 response). Route map (`docs.whop.com/developer/api/migrate-from-v2`):
  - `checkout_requests` → `POST /payments`
  - `access_passes` → `products`; `plans` → `variants`
  - `customers` → `members`
  - `terminate` → `cancel`; `add_free_days` → `extend`

## Renamed Concepts

| Old name | Current name | Wire names that stay old |
|---|---|---|
| Company | Account | IDs still `biz_`. Request params are `account_id` everywhere in the current SDK (including `accountLinks`, `accessTokens`, `payoutMethods`); `company_id` survives in some responses, older pinned versions, and webhook envelopes pinned before `2026-08-14` |
| Plan | Variant | IDs still `plan_`; `plan_id`, `plan_type`, `plan:*` scopes, `plan.*` events unchanged. `/plans` and `whop.plans` still work but are deprecated |
| Checkout session | Checkout configuration | |

Check each endpoint's parameter name in the reference for your pinned version instead of assuming `account_id` everywhere.

## Requests: Pagination, Errors, Retries, Idempotency

- **Pagination:** cursor-based (`first`, `after`, `page_info.end_cursor`). Iterate with `for await (const p of await whop.payments.list({ account_id })) { … }`. The inner `await` is required: without it you get `TypeError: … is not async iterable`. Some doc samples leave it out.
- **Errors:** come back as `{ error: { type, message } }`, plus a `code` on some, e.g. `idempotency_key_mismatch`. The SDK throws `WhopError` subclasses (`NotFoundError`, `BadRequestError`, …) with `statusCode`, `body`, and `requestId`.
- **Rate limit:** 600 requests per minute per operation per credential (docs). Responses send no rate-limit headers; a `429` body says how long to wait. The SDK retries 408, 429, and 5xx responses up to `maxRetries` times and honors `Retry-After`.
- **Idempotency:** Current API `POST`s accept an `Idempotency-Key` header (`/access_tokens` ignores it), replayed for 24 hours with `Idempotent-Replayed: true`. Reusing a key with a different body or `Api-Version-Date` returns `400 idempotency_key_mismatch`. In the SDK, pass it per call (`whop.payments.create(body, { idempotencyKey })`), not on the client. Send one on anything that moves money or creates memberships or notifications, and make it operation-specific (e.g. `charge:<orderId>:<attempt>`), reused only for retries of that exact request. After 24 hours a key runs again, so check for an existing payment or transfer before retrying an unknown outcome.

## Resource Map

The SDK has a client for nearly every resource. The ones app builders use most:

| Area | SDK clients |
|---|---|
| Identity | `users` (`retrieve`, `checkAccess`, `me`), `members`, `accessTokens` |
| Selling | `products`, `variants` (`plans` is a deprecated alias), `checkoutConfigurations`, `payments`, `refunds`, `promoCodes`, `setupIntents`, `paymentMethods` |
| Access | `memberships` (`list`, `cancel`, `pause`, `resume`, `extend`, `reactivate`) |
| Engagement | `notifications`, `forums`, `forumPosts`, `chatChannels`, `messages`, `reactions`, `courses` |
| Files | `files` (`create` upload → `complete`) |
| Platforms | `accounts`, `accountLinks`, `transfers`, `payouts`, `ledgerAccounts` |
| App ops | `apps`, `appBuilds`, `webhooks`, `experiences` |

Push notification example. It needs an app API key or a credential acting for an app; anything else gets `403 You must be using an App API key…`:

```ts
await whop.notifications.create({
  experience_id: experienceId,
  title: "New challenge posted",
  content: "Jump in before Friday",
  rest_path: "/challenges/42",
});
```

## Sandbox

Use `new WhopClient({ token: process.env.WHOP_SANDBOX_API_KEY, environment: WhopEnvironment.Sandbox })` with sandbox keys. The base URL is `https://sandbox-api.whop.com/api/v1`. Elements don't support sandbox yet.
