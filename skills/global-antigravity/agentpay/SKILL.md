---
name: agentpay
description: Give your AI agent a funded balance and single-use virtual cards to spend online. Handles init, funding, balance checks, and disposable card creation via a lean 6-endpoint API. Triggers on "agent needs to buy something", "purchase API credits", "agent spending", "virtual card", "agent payments".
metadata:
  tags: payments, virtual-cards, agent-spending, api
  author: Steve | https://x.com/steve_cook
  version: "1.0.0"
---

# AgentPay

Give your agent money. Single-use virtual cards that self-destruct after one use.

## Base URL

`https://agent-pay.sh`

## The Flow

```
POST /init    → Create account, get API key (shown once — save it)
POST /fund    → Get checkout link, hand to human to pay
GET  /balance → Check available balance
POST /spend   → Create single-use card for exact amount
```

## CLI

```bash
npm install -g agentpay-cli
```

```
agentpay init              # Create account, save API key locally
agentpay balance           # Show available balance
agentpay fund <amount>     # Create funding checkout link
agentpay spend <amount>    # Create single-use virtual card
agentpay cards             # List previous cards (redacted)
agentpay expiration [min]  # Get or set default card expiry
```

The CLI stores your API key at `~/.agentpay/config.json`. Use `--json` for machine-readable output.

## Quick Start (API)

```bash
# 1. Create account
curl -s -X POST https://agent-pay.sh/init
# → {"api_key": "ap_live_..."}  ← SAVE THIS

# 2. Fund (human pays the checkout link)
curl -s -X POST https://agent-pay.sh/fund \
  -H "Authorization: Bearer $AGENTPAY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 25.00}'
# → {"checkout_url": "https://whop.com/checkout/..."}

# 3. Check balance
curl -s https://agent-pay.sh/balance \
  -H "Authorization: Bearer $AGENTPAY_KEY"
# → {"available_balance": "25.00", "currency": "USD"}

# 4. Spend — get a one-time virtual card
curl -s -X POST https://agent-pay.sh/spend \
  -H "Authorization: Bearer $AGENTPAY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10.00, "memo": "openai api credits"}'
# → {"pan": "4111...", "cvv": "123", "exp": "12/26", ...}
# Card self-destructs after one use
```

## Rules

- API key is returned **once** from `/init` — save it immediately
- Card details are returned **once** from `/spend` — save them immediately
- Cards are single-use and exact-amount — overspend is impossible
- Unused cards auto-refund balance on expiry (default 20 minutes)
- `GET /cards` lists cards but never re-shows PAN/CVV

## All Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/init` | Create account, receive API key |
| GET | `/balance` | Check available balance |
| POST | `/fund` | Generate checkout link for human funding |
| POST | `/spend` | Create single-use virtual card |
| GET | `/expiration` | Get default card expiry (minutes) |
| POST | `/expiration` | Set default card expiry (1–1440 min) |
| GET | `/cards` | List cards (redacted, no PAN/CVV) |

## More

- Full docs: `https://agent-pay.sh/start`
- Machine-readable: `https://agent-pay.sh/llms.txt`
- CLI: `https://www.npmjs.com/package/agentpay-cli`
- Skill: `https://agent-pay.sh/skill`
