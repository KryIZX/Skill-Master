# Payments

## Contents
- Pick the checkout surface
- Create a checkout configuration (server)
- Sell inside the Whop iframe
- Embedded checkout on your own site (Elements)
- Memberships
- Saved payment methods
- Refunds
- Platforms (connected accounts)

Whatever the surface, fulfil only after server-side confirmation: normally the verified `payment.succeeded` webhook ([webhooks.md](webhooks.md)), or an API read when reconciling. Gate ongoing access with `users.checkAccess`.

## Pick the Checkout Surface

| Where the buyer is | Use |
|---|---|
| Inside your app in the Whop iframe | `iframeSdk.inAppPurchase` (native Whop payment modal) |
| Your own website, embedded | Whop Elements `<Checkout>` + `<CheckoutElement/>` |
| Anywhere, simplest | Redirect to the `purchase_url` of a checkout configuration |
| Fully custom card form | Payment Elements + server `payments.create` with the `confirmation_token` (see https://docs.whop.com/developer/guides/payment-elements) |

`@whop/checkout` / `WhopCheckoutEmbed` is the old embed. Its docs link now redirects to the Elements Checkout page. Don't start new work with it.

## Create a Checkout Configuration (Server)

```ts
const config = await whop.checkoutConfigurations.create({
  account_id: companyId,
  plan: {
    product_id: "prod_xxx",
    title: "Pro",
    plan_type: "renewal",
    renewal_price: 10,
    billing_period: 30,
    currency: "usd",
  },
  metadata: { order_id: order.id, user_id: userId },
  redirect_url: "https://yourapp.com/thanks",
});
```

- **Variant:** pass `plan_id` for an existing variant, or an inline `plan` (they're mutually exclusive, and the API returns 400 if you send both). `plan_type` is `renewal` or `one_time`. `billing_period` is in days (30 monthly, 365 yearly). Prices are in the currency's major unit (10 = $10.00).
- **Inline `renewal` needs `plan.product_id`.** Without it the API returns 400 ("must pass in product details"). An inline `one_time` plan works without a product, but then the buyer gets only a payment (`membership_id` is `null`). Pass `product_id` when you need a membership (`completed` status) to gate on.
- **`initial_price` on a renewal plan without a trial is an extra first-charge fee**, added on top of `renewal_price`. Setting `initial_price: 10, renewal_price: 10` charges $20 on day one. For a plain $10/month plan, set only `renewal_price`. On `one_time`, `initial_price` is the price.
- **`metadata`** is copied onto the payment and membership. Treat it as a lookup hint, not proof: Elements lets the browser set or override it. Before fulfilling, load your server-side order and check the payment's account, variant, amount, currency, and that the order isn't already fulfilled.
- **`config.purchase_url`** is a hosted checkout link. `config.plan.id` and `config.id` feed `inAppPurchase`. After payment the buyer lands on `redirect_url` with `payment_id`, `receipt_id` and `status` appended, which is enough for UI but not proof of payment.

## Sell Inside the Whop Iframe

```tsx
"use client";
import { useIframeSdk } from "@whop/react";

export function UpgradeButton(props: { planId: string; checkoutId: string; onPaid: () => void }) {
  const iframeSdk = useIframeSdk();
  return (
    <button
      onClick={async () => {
        const res = await iframeSdk.inAppPurchase({ planId: props.planId, id: props.checkoutId });
        if (res.status === "ok") props.onPaid();
      }}
    >
      Upgrade
    </button>
  );
}
```

- **Response:** a success returns `{ status: "ok", data: { sessionId, receiptId } }` (the shipped types use camelCase, even though some docs show `receipt_id`).
- **Use it for UI only:** refresh or show a pending state from it. The webhook decides access.

## Embedded Checkout on Your Own Site (Elements)

```tsx
import { WhopElements, Checkout, CheckoutElement } from "@whop/elements-react";
import { loadWhop } from "@whop/elements";

<WhopElements elements={loadWhop()}>
  <Checkout plan="plan_xxx" metadata={{ order_id }} returnUrl={`https://site.com/return?order=${order_id}`}>
    <CheckoutElement />
  </Checkout>
</WhopElements>
```

- **No server code needed:** the variant sets the price. You can also pass `checkoutConfiguration={id}`, `promoCode`, or `affiliateCode`. Options passed beside `checkoutConfiguration` (including `metadata`) win over the configuration's copy.
- **No sandbox yet:** Elements can't point at the sandbox ([docs](https://docs.whop.com/developer/guides/sandbox)); the `environment="sandbox"` option is documented but not live. To exercise server code and webhooks with test cards, use the hosted `purchase_url` in the sandbox instead.
- **`returnUrl`** receives `payment` and `status` whatever the outcome.
- **`onComplete` can re-fire** on a restored checkout, so neither it nor `returnUrl` is proof of payment.
- **CSP:** allow `https://cdn.whop.com` in `frame-src` and `script-src`, and `https://api.whop.com` in `connect-src`. Without this, elements render blank with only a console error (`Failed to load https://cdn.whop.com/elements/amber/elements.js`). Apple Pay, Google Pay, PayPal and Plaid need more origins, so generate the full set with `contentSecurityPolicy()` from `@whop/elements` (`.merge(policy)`, `.applyTo(headers)`, `.toHtml(policy)`).

## Memberships

- **Statuses:**
  - `active`, `trialing`: grant access.
  - `past_due`: grace period.
  - `completed`: one-time purchase, keeps access.
  - `canceled`, `expired`: no access.
  - The SDK type also lists `unresolved`, `drafted` and `canceling`. Don't hand-roll access rules for these.
- **Cancel:** confirm with the user before cancelling anyone.
  - `memberships.cancel({ id, cancel_at_period_end: true })` keeps the status `active` with `cancel_at_period_end: true`, and fires `membership.updated` and `membership.cancel_at_period_end_changed`. Undo it with `memberships.update({ id, cancel_at_period_end: false })`.
  - Leaving the flag out revokes access **immediately**: the status becomes `canceled`, and it fires `membership.updated` and `membership.deactivated`.
- **Other changes:**
  - `extend({ id, days })` replaces `add_free_days` and pushes `current_period_end` out by `days`.
  - `pause({ id, until? })` pauses payment collection only, so the status stays `active`. `resume({ id })` restores billing. Don't expect a membership webhook from `pause`, `resume` or `extend`; re-fetch the membership instead.
  - `reactivate({ id, days? })` works only on a `canceled` or `expired` membership whose items are all one-time. A canceled renewal returns 400 ("does not contain only one-time items"), so sell it a new checkout instead.
  - `transfer({ id })` returns `{ url }`, a one-use claim URL. It doesn't move the membership directly.
- **Prefer `users.checkAccess`** over reading membership status yourself for gating.

## Saved Payment Methods

- **Collect:** use one of these, then confirm from the `setup_intent.succeeded` webhook. Webhooks pinned to `2026-09-22-1` or later carry `data.payment_method_id`; older and unpinned ones (every dashboard-created webhook) carry `data.payment_method.id`.
  - `<Payments accountId mode="setup" currency="usd">` with `<EmailElement />`, `<PaymentElement />` and `<BrandingElement />` (required, or the fields stay loading), then `createConfirmationToken({ billingDetails })`, then server `setupIntents.create({ account_id, confirmation_token })` with an idempotency key. If its status is `requires_action`, finish it in the browser with `WhopElements.payments.handleNextAction(…)` using the returned `client_secret`.
  - A `mode: "setup"` checkout configuration (`{ account_id, mode: "setup" }`, no plan or currency). Its `redirect_url` gets `setup_intent_id` and `payment_method_id` appended.
- **Charge later:** `payments.create({ account_id, plan_id, member_id, payment_method_id, off_session: true }, { idempotencyKey })` for charges the buyer isn't present for. Repeating a key returns the same payment. Run it only from a server path the business explicitly set up (such as their renewal schedule); never trigger a charge yourself.
  - The response is usually `status: "open"`, `substatus: "incomplete"`. Wait for `payment.succeeded`, or `payment.failed`, before you act.
  - If you get `payment.requires_action` (for example, a 3DS card), send the buyer `data.recovery_url`. It's in the webhook and in `payments.retrieve`, but `null` in list responses.

## Refunds

`payments.refund({ id, partial_amount? }, { idempotencyKey })` refunds in major units, and omitting `partial_amount` refunds everything. The payment keeps `status: "paid"`, and `substatus` becomes `refunded` or `partially_refunded`. Each refund fires `refund.created` with `data.payment.id`. Refunds move money, so confirm with the user first.

## Platforms (Connected Accounts)

For marketplaces where sellers get paid. This is a Stripe Connect–style flow:

1. **Onboard:** `accounts.create({ email, title, metadata: { external_id } })`, then `accountLinks.create({ account_id, use_case: "account_onboarding", refresh_url, return_url })` for identity verification.
   - `email` is required, and it must accept mail: an `@example.com` address returns 400.
   - The link returns `{ url, expires_at }` and expires in about an hour, so mint it when the seller clicks.
   - The SDK field is `account_id`, though the docs show `company_id`.
2. **Collect:** use either of these.
   - **Direct charges:** a checkout configuration on the connected account with `plan.application_fee_amount`.
   - **Transfers:** `transfers.create({ type: "balance", amount, currency, origin_id, destination_id, idempotence_key })` from your balance. The origin business must finish identity verification (KYC) and hold enough balance, or this returns 400 ("Please verify your business before transferring funds"). Fix the cause before retrying a failed transfer.
3. **Pay out:** Elements `<WithdrawElement />` inside `<Wallet accountId accessToken>` (authorize the user for that account first, and mint the token with explicit minimal `scoped_actions`; see [auth-and-access.md](auth-and-access.md#minted-access-tokens)), a hosted `payouts_portal` account link, or `payouts.create({ account_id, amount, payout_method_id })`.

Money movement is irreversible. Build transfers and payouts as server-side code paths that run only after an explicit, authenticated user action, with an idempotency key tied to your own ledger record. An agent should never trigger them on its own.

**`application_fee_amount`** goes on the inline `plan`, in major units (1.23 = $1.23). It must be less than the price. It works in `checkoutConfigurations.create` and `payments.create`, and the API rejects it unless the account is a connected account with a parent. `@whop/sdk` 2.5.0 types it only on `payments.create`'s plan, so the checkout configuration needs a cast, even though the API accepts it. The fee shows up as an "Application fee" line in `payments.listFees({ id })`.

**Connected-account events** don't reach your platform's webhooks by default. Create a separate webhook with `child_resource_events: true`: it then receives only the connected accounts' events, with their `account_id` in the envelope.

Guides:
- https://docs.whop.com/developer/platforms/enroll-connected-accounts
- https://docs.whop.com/developer/platforms/collect-payments-for-connected-accounts
- https://docs.whop.com/developer/platforms/render-payout-portal
