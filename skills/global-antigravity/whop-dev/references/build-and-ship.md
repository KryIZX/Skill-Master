# Build and Ship a Whop App

## Contents
- Discovery
- Path A: Whop CLI + Whop hosting (default)
- Path B: Next.js, self-hosted
- App settings: views, permissions, keys
- Publishing

## Discovery

Before writing code, pin down three things. Ask in plain language if the user is non-technical, or confirm quickly if they already know.

1. **Who uses it?** Members of a whop → `b2c_app` with an experience view. Only the business owner or team → dashboard view only (`b2b_app`; `init` only offers `b2c_app`/`website`, so switch later with `whop apps update app_xxx --app_type b2b_app`).
2. **What data?** None, Whop-native (forums, chat, files, notifications via the API), or the app's own database.
3. **Core loop:** the 2–3 things a user does. Apply [design-principles.md](design-principles.md) here.

Summarize the plan (type, features, storage, hosting path) and wait for a yes before scaffolding.

## Path A: Whop CLI + Whop hosting (default)

The user needs the `whop` CLI installed (see https://docs.whop.com/cli/overview) and signed in with `whop login`. Have them run the login step themselves. The CLI has no sandbox mode, so every command acts on their real Whop account.

| Step | Command | Notes |
|---|---|---|
| Create | `whop apps init --name "My App" --app_type b2c_app --company_id biz_xxx` | Claims `<name>.whop.site`, registers the app, then scaffolds Vite + TanStack Start + React on Cloudflare Workers and writes `whop.app.json`. Confirm with the user first: it creates a real app on their account. A `website` can never become an app again. |
| Dev | `whop apps dev` | Runs the dev server with `WHOP_APP_ID`, `WHOP_ACCOUNT_ID`, a short-lived `WHOP_API_KEY`, and stored secrets injected. No `x-whop-user-token` locally. |
| Secrets | `whop apps secrets set --secret NAME=value` | Have the user run it privately: the value lands in shell history and `set`/`list` print values in plain text. Never collect or repeat values. Secrets become env vars in dev and production. |
| Preview | `whop apps deploy --preview` | Uploads a build (`apbu_…`) without promoting it. CLI 0.27.0 returns no preview URL; promoting makes it production. |
| Production | `whop apps deploy` | Confirm with the user first. Exactly one build is live; roll back with `whop apps builds promote <build_id>` on an older build (takes up to ~1 min to serve). |
| Logs | `whop apps logs app_xxx` | 7 days of runtime `console` output; filter with `--level`, `--query`. |

Flags change between CLI releases, so check `whop apps <command> --help` instead of guessing.

**Gotchas:**
- `init` registers the app **before** writing files. If it fails after that, run the `whop apps init --app app_xxx` command the error prints. Rerunning with the same flags fails (`DOMAIN_IN_USE`) because the domain already serves the new app.
- Non-interactive shells need `--app_type` (`APP_TYPE_REQUIRED`, nothing created). `DOMAIN_UNAVAILABLE` mentioning the `domain:read` scope means an old login: have the user rerun `whop login`.
- Deploy needs a Vite app (`NOT_A_VITE_APP`) whose build outputs `dist/client` and/or `dist/server` (server output needs an `index.js`; client-only is fine). The `whop()` plugin from `@whop/cli/vite` packs them into `dist/whop-build.zip`; without it deploy fails with `NO_BUILD_ARCHIVE`. Keep it in `vite.config.ts` (init puts it first).
- The scaffold has one `/` route and no Whop auth or views. Add `@whop/sdk`, `@whop/react`, and `jose`, add routes matching the view paths, then follow [auth-and-access.md](auth-and-access.md).
- In production the runtime sets `APP_ID`, `BUILD_ID`, `WHOP_ACCOUNT_ID`, `WHOP_API_ORIGIN`, and your secrets, but **no `WHOP_API_KEY`** (dev sets `WHOP_APP_ID` instead of `APP_ID`). Read both app ID names.
- In production, Whop's outbound proxy signs every server-side request to the Whop API with the app's own key, replacing any `Authorization` header. `new WhopClient({ token: undefined })` throws, so pass a placeholder: `token: process.env.WHOP_API_KEY ?? "whop-hosted"`. That key acts as your business, never as the visitor, and cannot move money. It has no stored version pin, so raw `fetch` calls must send `Api-Version-Date` (the SDK does this automatically). To act on businesses that installed your app, store an App API key as a secret and send `x-whop-inject-key: none` on those requests so the proxy leaves your key alone.
- Inside Whop, a hosted `b2c_app` receives `x-whop-user-token` on the document request and same-origin `fetch` calls (issuer `urn:whopcom:exp-proxy`, `aud` = `APP_ID`), and the jose helper in auth-and-access.md verifies it. Opening `<name>.whop.site` directly sends no token.

## Path B: Next.js, self-hosted

Use this when the user wants Next.js or already has one. Whop's `whop-nextjs-app-template` repo is out of date (it pins `@whop/sdk` 0.0.3 and uses `btoa` on the webhook secret). If you start from it, upgrade the SDK and replace its auth and webhook code with this skill's patterns.

- **Env vars** (user fills `.env.local`): `WHOP_API_KEY`, `NEXT_PUBLIC_WHOP_APP_ID`, `WHOP_WEBHOOK_SECRET`.
- **Local iframe dev:** the `@whop-apps/dev-proxy` dev dependency injects the user token locally. Set the script to `"dev": "whop-proxy --command 'next dev --turbopack'"`. In Whop, open the app, click the `</>` (Dev mode) button at its top right, and set **Environment** to **Localhost**.
- **Config:** wrap `next.config.ts` with `withWhopAppConfig` from `@whop/react/next.config` so server actions accept the Whop origin.
- **Deploy:** any Node host, such as Vercel. Set **Base URL** in the developer dashboard's Hosting section to the deployed domain.

## App Settings: Views, Permissions, Keys

**Views** (set paths in the developer dashboard's **Hosting** section, or `whop apps update app_xxx --experience_path … --dashboard_path …`; new apps default to the experience path only):

| View | Path | Who | Gate |
|---|---|---|---|
| Experience | `/experiences/[experienceId]` | Members | `checkAccess(exp_…)`, `has_access` |
| Dashboard | `/dashboard/[companyId]` | Business admins | `checkAccess(biz_…)`, `access_level === "admin"` |

Append `/[restPath]` to a path for deep links, e.g. `/experiences/[experienceId]/[restPath]` → `/experiences/exp_123/lessons/1`. Avoid a first segment of `posts`: `whop.com/…/app/posts/…` opens Whop's own post page instead of your app.

**Permissions:** every API call needs a matching permission. Declare each one in the app's Permissions tab, mark it required or optional, and add a justification. Set them in the dashboard: `whop apps permissions` returns 403 with both an OAuth login and an account API key (`developer:update_app_authorization`). Creators approve them at install, including when you test on your own account, using `https://whop.com/apps/app_xxx/install` (an app with no permissions installs with no prompt). Permissions added later show existing installs an **Approve permissions** banner, and calls needing them fail until each creator approves. Receiving webhooks needs `webhook_receive:*` permissions. The hosted proxy key needs no declared permissions to act on your own business.

**Keys:**
- **App API key:** acts on every business that installed the app. Use it for multi-tenant apps.
- **Account API key:** acts only on your own business.
- Prefer the narrowest permissions that work, and never expose either key to the browser.

## Publishing

An app needs a name, icon, and description to go live. `status` is `live`, `unlisted` (the default for new apps), or `hidden`, set with `whop apps update --status` or the dashboard's **Publish app** button. App Store listing goes through review (`marketplace_status`: `not_available`, `pending_review`, `live_marketplace`). Whop hasn't published review criteria, so don't invent a checklist. Point the user to the developer dashboard instead.
