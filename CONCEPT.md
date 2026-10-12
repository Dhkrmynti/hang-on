# Hang On ($HANG) · working name (12 Oct 2026)

A new lore on the same engine as Capy Onsen ($ONSEN) and Take a Seat ($SEAT). Mechanics and tokenomics are unchanged; the name, ticker, characters, UI and words are new.

## Lore

A tree full of sloths. Holding is literal here: you hang on.

The ten biggest holders hang from the top two branches. **No. 1 gets the hammock** and sleeps in it. Overtake someone and you shuffle along the branch past them. **Sell once and you have let go**: you fall, and you are on the forest floor for good. The dev wallet is **the toucan** on the trunk: it watches, never hangs, never paid.

- Tagline: **"Don't let go."** Closing line: **"Hang on."**
- Voice: a naturalist's field journal that happens to be about a memecoin. Deadpan, short, a little dry. Never yield, APY, passive income or promises of value.
- Original characters: not copies of any NFT collection or film.

| Word on the site | What it is in the engine |
|---|---|
| **the branches** | the leaderboard |
| **the hammock** | No. 1 |
| **top branch / lower branch** | the two reward tiers (No. 1-5 share 0.014 ETH, No. 6-10 share 0.006 ETH of every 0.02 ETH reward) |
| **climbing the trunk** | ranks 11-50 |
| **reaching up** | holding, but the first buy is not old enough yet |
| **let go** | sold: out forever |
| **the toucan** | the dev wallet |
| **your sloth / specimen card** | the wallet check |
| **grooming** | setting a name, a sloth, or an X account (a signed message, no transaction) |
| **the loop** | the cycle: Reward, then Treasury, then again |
| **ripening** | the fee escrow filling toward the next step |
| **the rings** | the log of every round, with its transaction |

Money always keeps its plain name: Reward, Treasury.

## The sloth

One head drawn in flat SVG (`src/tree/Sloth.tsx`), reused for the hanging figure, the hammock, the portrait and the mark. Four traits, same counts as the engine validates (5, 5, 6, 6):

- Coat: Sandy, Mossy, Ash, Cocoa, Ginger
- On the head: bare, leaf hat, hibiscus, moth, sprout
- Extras: nothing, monocle, sleep mask, blade of grass, monocle + grass, sleep mask + grass
- Behind: canopy, dawn, dusk, rain, night, plate paper

## Mechanics (unchanged)

1. Every 3 seconds the engine reads the Pons fee escrow. When it reaches the next step's size it claims it.
2. **Reward** (0.02 ETH) → ETH straight to the top 10 by balance, by tier and by balance inside each tier.
3. **Treasury** (0.025 ETH) → the treasury wallet.
4. Again from 2. Over a full loop that is 44% to the ten and 56% to the treasury, shown openly on the page.

No buyback and no burn: the engine never buys, sells or destroys $HANG.

To be on a branch: never sold, at least 100,000 $HANG, and the hold time the server sets.

## Where things are

Name and ticker: `src/lib/brand.ts` (plus the engine logs in `bot/`, the signed text in `bot/byline.ts`, `index.html`, `public/favicon.svg`). The page: `src/tree/`. Styles: `src/styles/tree.css`.
