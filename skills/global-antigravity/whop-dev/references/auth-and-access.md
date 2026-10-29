# Auth and Access

## Contents
- Verify the current user (TypeScript)
- Check access
- Next.js page example
- TanStack Start (Whop CLI scaffold) example
- OAuth for external sites
- Minted access tokens

## Verify the Current User (TypeScript)

Whop's proxy adds a short-lived ES256 JWT in the `x-whop-user-token` header on same-origin requests from the iframe. `@whop/sdk` 1.0+ (including current 2.x) no longer ships `verifyUserToken`, and Whop's docs say the old TypeScript snippets won't run. The helper below reproduces the official logic from the last SDK that had it (`@whop/sdk@0.0.42`): Whop JWKS, issuer `urn:whopcom:exp-proxy`, ES256, `aud` = your app ID, `sub` = user ID. Python still ships `whop_sdk.lib.verify_user_token(headers, app_id=...)` (needs `pyjwt[crypto]`), and Ruby ships `WhopSDK::Helpers::VerifyUserToken.verify_user_token!`.

```ts
// lib/whop.ts (server only)
import { WhopClient } from "@whop/sdk";
import { createRemoteJWKSet, jwtVerify } from "jose";

export const whop = new WhopClient({
  token: process.env.WHOP_API_KEY ?? "whop-hosted",
  headers: process.env.WHOP_API_KEY ? { "x-whop-inject-key": "none" } : undefined,
});

export const appId =
  process.env.WHOP_APP_ID ?? process.env.APP_ID ?? process.env.NEXT_PUBLIC_WHOP_APP_ID!;

const jwks = createRemoteJWKSet(new URL("https://api.whop.com/.well-known/jwks.json"));

export async function verifyWhopUser(token: string | null | undefined) {
  if (!token) throw new Error("Missing x-whop-user-token");
  const { payload } = await jwtVerify(token, jwks, {
    issuer: "urn:whopcom:exp-proxy",
    algorithms: ["ES256"],
  });
  if (!payload.sub || typeof payload.aud !== "string" || payload.aud !== appId) {
    throw new Error("Invalid Whop user token");
  }
  return { userId: payload.sub };
}
```

On Whop hosting, leave `WHOP_API_KEY` unset and the outbound proxy swaps the placeholder for the app's own-business key. To act on businesses that installed your app, set an App API key as the `WHOP_API_KEY` secret; the `x-whop-inject-key: none` header stops the proxy replacing it. Self-hosted apps must set `WHOP_API_KEY`.

The token only exists on requests that pass through Whop's proxy (or the local dev proxy). Opening your deploy URL directly gives no token, which is expected.

Local dev: run `whop-proxy` from `@whop-apps/dev-proxy` in front of your dev server, then in the Whop iframe open the `</>` Dev mode panel, set Environment to `Localhost`, and set the proxy's port. The dev proxy remembers the last token and injects it into every request through its port, so a direct visit to the proxy port is authenticated as you. The upstream port gets no token. Dev tokens carry `isDev: true` and last 24 hours.

## Check Access

```ts
const access = await whop.users.checkAccess({ id: userId, resource_id: experienceId });
// { has_access: boolean, access_level: "customer" | "admin" | "no_access" }
```

`resource_id` can be an experience (`exp_`), product (`prod_`), or business (`biz_`). A business owner or team member gets `admin` on all three, a member with a valid membership gets `customer` (for an experience: a membership to any product connected to it; for a business: to any of its products), and anyone else gets `no_access`. Checking a business where your app isn't installed throws a 403 instead of returning `no_access`.

| View | Resource | Allow when |
|---|---|---|
| Experience | `exp_…` from the URL | `has_access` |
| Dashboard | `biz_…` from the URL | `access_level === "admin"` |
| Admin-only action inside an experience | `exp_…` | `access_level === "admin"` |

Run the check on the server for every page load, server function, and API route. Hiding a button is not authorization.

## Next.js Page Example

```tsx
// app/experiences/[experienceId]/page.tsx
import { Suspense } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import { whop, verifyWhopUser } from "@/lib/whop";

type Props = { params: Promise<{ experienceId: string }> };

export default function Page({ params }: Props) {
  return <Suspense fallback={null}><Experience params={params} /></Suspense>;
}

async function Experience({ params }: Props) {
  await connection();
  const { experienceId } = await params;
  const { userId } = await verifyWhopUser((await headers()).get("x-whop-user-token"));
  const [access, user] = await Promise.all([
    whop.users.checkAccess({ id: userId, resource_id: experienceId }),
    whop.users.retrieve({ id: userId }),
  ]);
  if (!access.has_access) return <p>You need access to this experience.</p>;
  return <h1>Hi {user.name ?? user.username}</h1>;
}
```

`create-next-app@latest` (Next 16.4) turns on `cacheComponents`. Under that setting, a page that awaits the JWKS fetch or the SDK outside `<Suspense>` fails `next build` ("uncached data during prerendering"). The `<Suspense>` + `await connection()` shape above builds whether `cacheComponents` is on or off. Use the same shape for `/dashboard/[companyId]`.

Route handlers and server actions follow the same pattern: verify, check, then act.

## TanStack Start (Whop CLI Scaffold) Example

```ts
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { whop, verifyWhopUser } from "~/lib/whop";

export const loadExperience = createServerFn({ method: "GET" })
  .validator((value: unknown) => {
    if (typeof value !== "string" || !value.startsWith("exp_")) throw new Error("Invalid experience ID");
    return value;
  })
  .handler(async ({ data: experienceId }) => {
    const { userId } = await verifyWhopUser(getRequestHeader("x-whop-user-token"));
    const access = await whop.users.checkAccess({ id: userId, resource_id: experienceId });
    if (!access.has_access) throw new Error("Forbidden");
    return { userId, isAdmin: access.access_level === "admin" };
  });
```

Type-checked against `@tanstack/react-start@1.169`, which uses `.validator` (`.inputValidator` does not exist there). TanStack Start APIs move fast, so check the scaffold's installed version.

## OAuth for External Sites

"Sign in with Whop" for apps outside the iframe uses OAuth 2.1 + PKCE + OIDC:

- **Endpoints:** `https://api.whop.com/oauth/authorize`, `/token`, `/userinfo`, `/revoke`.
- **Client:** the `client_id` is the `app_` ID. Redirect URIs must match exactly. New apps default to `oauth_client_type: "confidential"`, so the token exchange fails with `client_secret is required` unless you send the client secret from the dashboard from your server. For a browser or mobile PKCE-only flow, set the app to `public` (`whop apps update <app_id> --oauth_client_type public`).
- **Discovery:** `https://api.whop.com/.well-known/openid-configuration` (issuer `https://api.whop.com`, S256 only).
- **Callback and tokens:** bind a single-use random `state` and the PKCE verifier to the user's session, and reject a callback whose `state` doesn't match. Access tokens last 1 hour; refresh tokens rotate, so store the new one atomically and keep tokens server-side.
- Pass the access token straight to `new WhopClient({ token })` to act as that user.

Docs: https://docs.whop.com/developer/guides/oauth

## Minted Access Tokens

`whop.accessTokens.create({ account_id, user_id?, scoped_actions, expires_at? })` mints a short-lived token for Elements or chat. It lasts 1 hour by default, and an `expires_at` more than 3 hours out is rejected. The SDK type names the field `account_id` and rejects `company_id`. The REST API accepts either name.

- Always list `scoped_actions` explicitly. An empty list inherits **every** permission of the minting key. Each action must also be granted to that key, or the call returns 400.
- A user token (`user_id`) also requires `account_id` and a non-empty `scoped_actions`.
- Mint them on the server only after authenticating the caller: take `user_id` from the verified Whop token, check the caller may act on that account, and pick scopes from a fixed server-side list. Hand only the token to the browser.
