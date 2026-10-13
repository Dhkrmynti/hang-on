# Urn ($URN) · working name (13 Oct 2026)

A new lore, a new page and a new cycle on the engine that ran Capy Onsen ($ONSEN), Take a Seat ($SEAT) and Hang On ($HANG). Nothing on the page is carried over from those. Two parts of the mechanics are new too: a burn step, and a cut for each round's biggest buyer.

Urn is meant to sit in the same family as the owner's earlier project Grave (a human skull that goes into a grave): Grave was buried, Urn is cremated. The page only hints at it ("Some get a grave. Ash got an urn."). It does not say "from the makers of Grave"; add that line yourself if you want the claim made.

## Lore

**Ash** is a human skull who got cremated and now lives in an urn, wearing the lid as a hat. He is cheerful about it. He is hosting his own wake and **he pays people to stay**.

- **The urn**: every burn is a cremation. Part of every trading fee buys $URN and burns it, and the ash goes in his urn. An urn holds 5% of the supply; when it is full he starts another.
- **The front row**: the ten biggest holders who never sold. They are paid in ETH for staying. No. 1 is the **chief mourner**.
- **Biggest flowers**: whoever buys the most between two rewards brought the biggest flowers and takes a cut of the next reward.
- **Leaving early**: sell once and Ash has you cremated. That wallet is never paid again.

- Tagline: **"Rest in ashes."** One-line pitch: **"He's dead. He pays you to stay."**
- Voice: deadpan funeral humour, short lines, Ash treated as a person. Never yield, APY, passive income or promises of value.
- Original characters: not copies of any NFT collection, game or film.

| Room | Its line | What it shows |
|---|---|---|
| The parlour (opening) | Rest in ashes. | curtains part on Ash in his urn, the ten lined up in front, what is in the urn, paid so far, the next step filling |
| Inside the urn | Some get a grave. Ash got an urn. | tokens burned, how full the current urn is, the last burns |
| The front row | Front row gets paid. | the top ten on a pew you walk along sideways, then No. 11-50 standing at the back |
| The flower stand | Biggest flowers win. | this round's biggest buyer and its cut, on the sash of a wreath |
| The oven | Leave early, get cremated. | wallets that sold riding a belt into the fire, and the three rules as an order of service |
| The till | Who pays for the funeral. | the three steps printed as a bill |
| The cloakroom | Find your skull. | the wallet check; set a name, a skull or an X account |
| The guest book | It is all in the guest book. | totals and every round with its transaction |

| Word on the site | What it is in the engine |
|---|---|
| **the front row / a seat** | the top ten / a rank in it |
| **chief mourner** | No. 1 |
| **biggest flowers** | "the spark": the wallet that bought the most since the last reward; it takes 25% of the next one |
| **standing at the back** | ranks 11-50 |
| **at the door** | holding, but the first buy is not old enough yet |
| **cremated** | a burn (tokens) or a wallet that sold (out forever) |
| **the undertaker** | the dev wallet: no seat, never paid |
| **dressing** | setting a name, a skull, or an X account (a signed message, no transaction) |

Money always keeps its plain name: Reward, Burn, Treasury.

## The skulls

One cartoon human skull, flat colour with an ink outline (`src/skull/Skull.tsx`), reused for the seats, the portrait and the mark. Four traits, same counts as the engine validates (5, 5, 6, 6):

- Bone: Bone, Ash, Moss, Rose, Gilt
- Worn: bare, top hat, veil, candle, urn lid
- Face: plain, ember eyes, gold tooth, cracked, ember eyes + cracked, gold tooth + cracked
- Behind: parlour, candlelight, oven, lilies, midnight, paper

Ash himself (`AshUrn` in the same file) is the big one in the parlour: his eyes over the rim of the urn, both hands holding on, the lid on his head.

## Mechanics

1. Every 3 seconds the engine reads the Pons fee escrow. When it reaches the next step's size it claims it.
2. **Reward** (0.02 ETH) → ETH straight to holders. The biggest buyer since the last reward takes 25% (0.005). The other 75% goes to the top 10 by balance, by tier (No. 1-5 share 70%, No. 6-10 share 30%) and by balance inside each tier. With no buyer since the last reward the ten share all of it.
3. **Burn** (0.02 ETH) → the engine buys $URN with all of it and sends what it bought to the dead address.
4. **Treasury** (0.01 ETH) → the treasury wallet.
5. Again from 2. Over a full loop that is 40% to holders, 40% burned and 20% to the treasury, shown openly on the page.

The burn is the only time the engine buys, and it never sells.

To be in the front row: never sold, at least 100,000 $URN, and the hold time the server sets. To take the flowers cut: never sold, at least 100,000 $URN, and the biggest buy (from the curve or the pool) since the last reward that has not been moved on. Tokens received from another wallet do not count as bought.

## Where things are

Name and ticker: `src/lib/brand.ts` and `bot/brand.ts` (plus `index.html`, `public/favicon.svg`, `public/terms.html`, `public/privacy.html`, and the receipt header in `src/skull/Rooms.tsx`). The page: `src/skull/`. Styles: `src/styles/skull.css`. Motion: `src/lib/fx.ts` and `src/skull/Fx.tsx`. Step sizes and the flowers cut: `.env` (see `.env.example`, where it is `SPARK_PCT`). How much one urn holds: `URN_PCT` in `src/skull/Hero.tsx`.
