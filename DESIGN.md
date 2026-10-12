---
name: Hang On — Field Journal
description: "$HANG on Robinhood Chain as a tree you climb down, kept like a naturalist's field journal: inked plates of sloths, typed labels, dotted rules, one mango orange."
colors:
  paper: "#f1ecdc"
  paper-light: "#faf6ea"
  ink: "#1c241a"
  sky: "#e2ebcf"
  leaf: "#3f7d4a"
  leaf-dark: "#234a2e"
  mango: "#f29a2e"
  bark: "#7a5a3c"
  bark-dark: "#3b2a1d"
  stump: "#e4cf9f"
  soil: "#17130f"
  red: "#b3402a"
typography:
  said:
    fontFamily: "Fraunces, Georgia, serif"
    fontWeight: "900 for headings, 400 for reading, italic for asides"
  measured:
    fontFamily: "Courier Prime, Courier New, monospace"
---

# Hang On — Field Journal

The page is one tree, top to bottom, and each part has its own ground: sky at the canopy, deep
leaf green among the branches, bark on the trunk, paper for the notes and the specimen card, the
pale cut stump for the rings, soil at the bottom.

Two voices in type. **Fraunces** is everything said: headlines heavy, reading text regular, asides
in italic. **Courier Prime** is everything measured or labelled: every number, address, name tag,
button and "Fig." caption, as if typed onto the plate afterwards.

## Colour meaning
- **Mango**: the one accent. The buy button, No. 1, fees in the channel, the reward amounts, the pen stroke under a note.
- **Red**: only for letting go (the fourth note, a sold wallet's stamp, the demo label).
- **Ink** outlines every drawing at one weight. Rules between rows are dotted, section rules are solid.

## Parts (src/tree/)
- **Canopy.tsx**: the hero. Two boughs off the trunk, the live top ten hanging from them, No. 1 in the hammock, the toucan (dev wallet). Beside the tree on wide screens, above it below 1100px.
- **Register.tsx**: the branches as a register. The hammock row, top branch and lower branch (the two reward tiers), climbing the trunk (11-50).
- **Trunk.tsx**: the loop as a figure. A channel down the middle, the two steps either side.
- **Rules.tsx**: four field notes, each underlined by a pen stroke.
- **Card.tsx**: the wallet check as a specimen card, and grooming (name, sloth, X).
- **Rings.tsx**: totals and every round with its transaction, on the stump.
- **Floor.tsx**: the close.
- **Header.tsx**: the bar, and the vine at the left edge with a sloth that slides down as you scroll (wide screens only).
- **Sloth.tsx**: the one head everything is drawn from, and the portrait traits.

## Motion
- The boughs grow out of the trunk on load; the sloths drop onto them and sway.
- Scroll 1: you climb down. The canopy slides up and big leaves close in from both sides until the screen is the green of the branches section.
- Scroll 2: fees fill the channel down the trunk; each step is lettered in when the flow reaches it.
- Scroll 3: the growth rings are inked in from the heart outward and the stump turns slowly.
- Throughout: a sloth on a vine keeps your place down the page; pen strokes draw under the notes; the last sloth is lowered into view at the bottom.
- Rank changes: sloths shuffle along the boughs and register rows glide to the new order. A wallet that sold lets go and falls.
- All of it is off under prefers-reduced-motion.

## Rules
- No shadows, no gradients as colour (only ruler ticks and bark, as hard-edged patterns), no emoji, no badges or chips: say it in a sentence.
- No em or en dashes in visible text. No yield or APY language.
- Anything GSAP moves is positioned with margins, never with the CSS `translate` property: GSAP takes over an element's whole transform and would drop it.
- Rank moves are measured with `offsetLeft` / `offsetTop`, never on-screen rectangles, so scrolling between two data updates is not animated as a move.
