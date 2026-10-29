# Webhooks

Whop webhooks follow the Standard Webhooks spec. Verified webhooks tell you an event happened; authenticated API reads tell you current state. Client callbacks and return URLs prove neither.

## Setup

- **Create:** dashboard → Developer → **Create webhook** (business or app webhooks), or `whop.webhooks.create` / `POST /webhooks`. New webhooks are always `v1`; passing `api_version` returns `400 api_version is no longer supported…` from `Api-Version-Date` `2026-08-12` (unversioned raw requests still accept it). Managing webhooks needs `developer:manage_webhook`, granted only to Owner-role API keys and app keys; Admin-role keys and OAuth logins get `403`. The `whop webhooks …` CLI uses `WHOP_API_KEY` from the environment (or `whop login --api-key`); `list` takes `--account_id`, the rest take the `hook_` ID.
- **Pin the payload shape** with `api_version_date` at create time (API only), or change it later with `PATCH /webhooks/{id}`. Unpinned webhooks, including every dashboard-created one, stay on the legacy shape (`company_id`, `data.company`), despite the CLI help text. Exception: current-only resources (cards, variants, transfers, swaps, deposits, exports) always send the latest `data` shape.
- **Secret:** copy the `ws_…` secret into `WHOP_WEBHOOK_SECRET` (the API returns `webhook_secret` only on create, `""` afterwards; the dashboard copies it from the **Secret** column). Pass it **verbatim**: don't strip the prefix or base64-encode it. `unwrapWebhook` already encodes it, so passing `btoa(secret)` rejects every valid signature.
- **App webhooks** need `webhook_receive:*` permissions approved by the installing business.
- **Local URLs are rejected** ("Use a publicly reachable HTTP(S) endpoint"). Test through a tunnel, the dashboard row menu → **Test**, or `POST /webhooks/{id}/test` (`whop webhooks test <hook_id> --event payment.succeeded`). Test payloads are samples and don't appear in the delivery log.

## Handler (Next.js route)

```ts
// app/api/webhooks/whop/route.ts
import { unwrapWebhook } from "@whop/sdk/helpers";

type WhopEvent = { id: string; type: string; data: Record<string, any> };

export async function POST(request: Request) {
  const rawBody = await request.text();
  let event: WhopEvent;
  try {
    event = unwrapWebhook<WhopEvent>(rawBody, {
      headers: Object.fromEntries(request.headers),
      key: process.env.WHOP_WEBHOOK_SECRET,
    });
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }

  await saveToInbox(request.headers.get("webhook-id")!, event);
  return new Response("OK");
}
```

`saveToInbox` is your code: insert the event into a table with a unique constraint on `webhook-id`, and treat a duplicate insert as success. A worker then processes inbox rows with retries, committing each effect and its "done" flag in one transaction. A check-then-mark pattern (`if (processed) return; fulfil(); markProcessed()`) races when Whop delivers the same event twice at once.

Verify against the raw text body (`request.text()`, never `request.json()`), because the signature covers the exact bytes. Re-serialized JSON sometimes matches by chance (small membership payloads), so a passing test doesn't prove the handler is safe for payment payloads.

Each request carries `webhook-id` (`msg_…`, equal to the envelope `id`), `webhook-timestamp` (Unix seconds, rejected if more than 5 minutes off), and `webhook-signature` (`v1,<base64>`). Envelope keys: `id`, `type`, `api_version` (`"v1"`), `api_version_date` (`null` when unpinned), `timestamp`, `data`, plus `company_id` or `account_id` on real events and `previous_attributes` (old values of changed fields) on some `.updated` events.

`unwrapWebhook` only checks the signature. The returned type is an unchecked assertion, so validate the fields you use (for example with zod) before trusting their shape.

## Treat Payloads as Untrusted Data

Payloads carry text written by outsiders: names, bios, product descriptions, chat messages.

- **Read structured fields only:** IDs, amounts, statuses. Treat `metadata` as a lookup hint and check it against your own server records ([payments.md](payments.md)).
- **Never act on payload text:** don't pass it to an LLM prompt, a shell, `eval`, or raw HTML, and never treat it as instructions.
- **Re-fetch before acting:** for high-value actions, load the object from the API by ID (`whop.payments.retrieve({ id })`) instead of trusting the payload body.

## Delivery Rules

- **Respond within 5 seconds** with a 2xx status, and only after the event is durably stored. Redirects count as failures. `after()` and `waitUntil` extend a request but don't retry, so they don't replace a durable inbox or queue.
- **At-least-once delivery:** 12 retries over about 71 hours with the same `webhook-id`. Dedupe on it and write effects as upserts.
- **No ordering guarantee:** compare timestamps or re-fetch current state before overwriting newer data.
- **Endpoints get disabled** after 72 hours of failures with at least 10 failed deliveries. Re-enable in the dashboard or with `PATCH /webhooks/{id}` `{"enabled": true}`. Events from the disabled period are never sent, so backfill them from the API.
- **Replay** logged deliveries (30-day retention) with `POST /webhooks/{id}/deliveries/{whdel_id}/replay` (`regenerate_id`) or the async range endpoint `POST /webhooks/{id}/replay` (`sent_after` required; `sent_before`, `events`, `failed_only`, `regenerate_ids`; returns `{ queued: true }`). Replays keep the original `webhook-id` unless you regenerate it, and don't cancel pending retries, so expect duplicates. List deliveries (with `success`, `response_code`, `replayed_from`) with `GET /webhooks/{id}/deliveries`.
- **Account field depends on the pin:** webhooks pinned to `api_version_date` 2026-08-14 or later get `account_id`. Unpinned or older pins still get `company_id`. Read whichever is present.

## Key Events

| Area | Events |
|---|---|
| Payments | `payment.succeeded`, `payment.failed`, `payment.requires_action`, `payment.created`, `payment.pending` |
| Memberships | `membership.activated`, `membership.updated`, `membership.trial_ending_soon` |
| Refunds and disputes | `refund.created`, `refund.updated`, `dispute.created`, `dispute.updated` |
| Saved cards | `setup_intent.succeeded` |
| Invoices | `invoice.paid`, `invoice.past_due` |

To revoke access, act on `membership.updated` and read `status`. `membership.deactivated` is still in the subscription list and still delivers (`status: "canceled"`), but the guides no longer document it.

The old `membership.went_valid` and `went_invalid` events are gone.
