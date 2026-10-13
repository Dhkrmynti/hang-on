# Urn · $URN

Memecoin site + engine for **$URN · Urn** (Robinhood Chain 4663, to be launched on Pons). Creator fees run a three-step loop: ETH to holders (the **10 biggest wallets that never sold**, and the **spark**, the biggest buyer since the last reward), then a **buy and burn**, then the treasury, then again. Lore and vocabulary: `CONCEPT.md`. Design: `DESIGN.md`. The site calls the spark **the biggest flowers**; the engine and `.env` keep the name spark.

The engine in `bot/` grew out of the one behind Capy Onsen, Take a Seat and Hang On. The burn step and the spark are new here and have not run on mainnet.

## Run locally

```bash
npm install
npm run bot          # engine + API on 127.0.0.1:5023 (standby until /lotnok is filled)
npm run dev          # site on http://localhost:5183 (proxies /api to 5023)
```

- The local dev server always shows labelled demo data; `http://localhost:5183/?live` shows the real state (empty until the engine has a token). Never share demo screenshots as real numbers.
- `http://localhost:5183/lotnok` is the engine room (add `?live` in dev to see the engine's state).

## Engine (`bot/pads-engine.ts`)

| Step | What happens |
|---|---|
| Indexer | Follows every `$URN` Transfer from the mint block. Tracks balance, first-buy time, whether the wallet ever sold, and what it bought since the last reward. Contracts that relay tokens within one tx (routers) are recognised and never counted as holders. |
| Sold | A wallet that sends `$URN` to the Pons curve, a DEX, or any other contract is out forever. Wallet-to-wallet is fine. |
| Bought | Tokens that reach a wallet straight from the curve or a pool in `SELL_SINKS`, or through a router that got them there in the same tx. Tokens from any other wallet or contract are not a buy. Sending tokens on takes them off the wallet's tally. The tally restarts at every reward. |
| The cycle | Each time the Pons fee escrow reaches the current step's size, the engine claims it and spends all of it on that step, then moves on: **feeding** `FEEDING_ETH` (0.02) → `SPARK_PCT` (25%) to the spark, the rest to the top `FEEDING_TOP_N` (10) holders by balance, split by tier (`FEEDING_TIERS`: No. 1-5 share 70%, No. 6-10 share 30%) and by balance inside each tier · **burn** `BURN_ETH` (0.02) → buys the token and transfers exactly what that buy delivered to `0x…dEaD` · **keeper** `KEEPER_ETH` (0.01) → treasury · back to feeding. |
| Burn buy | On the Pons curve while it sells (quoted first, `BURN_SLIPPAGE_PCT` below the quote at most). After graduation it falls back to the Uniswap v4 template in `bot/uniswap-v4.ts`, which has no minimum out. Before claiming for a burn the engine checks that one of the two routes works; if neither does, it waits and the fees stay in the escrow. |
| Eligible | Top ten: never sold, balance ≥ `MIN_BALANCE` (100,000), first $URN at least `MIN_HOLD_HOURS` old. The spark: the same, minus the hold time. The code default for `MIN_HOLD_HOURS` is 1 hour when no `.env` sets it; `.env.example` sets 0. Decide which you want on the server. |
| Restarts | Every tx hash and its nonce are saved before it is awaited; a restart checks the chain and resumes the round. A reverted tx is sent again as a new one. A tx the node no longer knows is never blindly re-sent: if its nonce has been used the round waits for the node to show it, otherwise it is sent again with the same nonce, so only one of the two can land. A recipient that refuses ETH is skipped and its share stays with the engine. |
| The pool | The engine asks the Universal Router for the chain's Uniswap v4 PoolManager and keeps it in the sell sinks: never ranked or paid, sells into it are sells, buys out of it count for the spark. If the router does not answer, the log says so every ten minutes and `SELL_SINKS` has to be set by hand. |

Settings come from env or `bot-config.json` (see `.env.example`). Token, operator key and treasury are set in `/lotnok`; every save needs `ADMIN_SECRET`.

API: `GET /api/status`, `/api/pond?limit=`, `/api/wallet/:addr`, `/api/rounds`, `/api/byline/nonce?addr=`; `POST /api/byline`, `/api/x/*`, `/api/admin/save`.

## Not done yet

- No token, domain, X account or server exists for this lore. `scripts/`, `DEPLOY-VPS.md`, `public/terms.html` and `public/privacy.html` were carried over and still name an earlier project's domain and server. Change them before deploying.
- The engine has only been run in standby here. Claiming, sending ETH and the indexer were proven on mainnet by the earlier projects. **The burn (curve buy, token transfer to the dead address) and the spark have never run against a real token**: watch the first full cycle, and try it on a throwaway token first if you can.
- The v4 buy in `bot/uniswap-v4.ts` is a fixed calldata template from an earlier project (its pool fee, tick spacing and hook are baked in). Whether it fits this token's pool after graduation is unverified. If it does not, burns stop and wait until it is fixed; rewards wait behind them, because the cycle runs in order.
- The engine learns the pool (the v4 PoolManager) from the router by calling `poolManager()`. That call could not be tried from the dev machine (the RPC did not answer on 13 Oct 2026), so on the first start check the log for "Pool manager learnt from the router". If it says it couldn't, put the pool's address in `SELL_SINKS` yourself: without it the pool would be ranked as a holder and pool buys would not count for the spark.
- The spark can be won by buying big right before a reward and later moving the tokens to a second wallet to sell. That costs trading fees both ways and the buying wallet stays clean, so the rule slows it but does not stop it.

## Launch checklist

0. Start the server from a clean folder: no `bot-config.json`, `bot-state.json` or `bot-bylines.json` carried over from an earlier project. A saved `bot-config.json` wins over `.env`, so an old one would bring back the old step sizes (for example a 0.025 ETH treasury step) without saying so.

1. Launch $URN on Pons **from the wallet whose key goes into the engine** (creator fees only reach the launching wallet).
2. Put a little ETH in it for gas.
3. `/lotnok` → CA, key, treasury, admin secret → Save. Check `/api/status` shows the token and an indexed block.
4. The first reward runs once the escrow reaches 0.02 ETH and at least one wallet is eligible. The first burn follows at the next 0.02 ETH.
