---
name: Urn — Ash's Funeral Home
description: "$URN on Robinhood Chain as a funeral home you walk down through: velvet curtains on a chapel, the inside of an urn, a pew walked along sideways, a wreath, an oven with a belt, a till printing a bill, a guest book. Flat colour and one ink outline, like a sticker sheet."
colors:
  ink: "#17121c"
  paper: "#f3ead8"
  paper-light: "#fffaf0"
  plum: "#3a2550"
  velvet: "#8c2433"
  gold: "#e9b53c"
  ember: "#ff6a1a"
  flame: "#ffd35a"
  ash: "#cfc6b8"
  moss: "#3f6b4a"
  coal: "#1b1517"
  wood: "#b07a48"
  lavender: "#d9cfe6"
  red: "#c62f22"
typography:
  said:
    fontFamily: "Grenze Gotisch, serif"
    fontWeight: "900 for headlines, 700 for names"
  plain:
    fontFamily: "Hanken Grotesk, sans-serif"
  measured:
    fontFamily: "JetBrains Mono, monospace"
---

# Urn — Ash's Funeral Home

The page is one building and every room is a place, with its own ground colour: plum wallpaper and
velvet in the parlour, ash inside the urn, cream wallpaper along the pew, moss at the flower stand,
coal at the oven, a wooden counter at the till, lavender in the cloakroom, plum again for the guest
book and the way out. Things are drawn flat with one ink outline; things you can pick up (signs,
cards, buttons, the bill) have a hard ink shadow.

## Colour meaning
- **Ember**: the buy button, No. 1, the number that matters in a room, a meter filling.
- **Flame yellow**: the next reward, the window behind Ash, a highlight on paper.
- **Velvet and gold**: the curtains only (the bar at the top is their pelmet).
- **Red**: selling, and the stamp on the bill.

## Rooms (src/skull/)
- **Hero.tsx — the parlour**: curtains, the headline on a felt letter board, Ash in his urn on a pedestal under the window, a paper sign on an easel each side (the pitch and the buttons; today's numbers), and the ten along the bottom like a family photograph, No. 1 in the middle. Phones: the pitch goes under the board and the ten stand in two rows.
- **Rooms.tsx**
  - `Inside`: one huge burned number and a glass urn that fills to the current urn's level.
  - `FrontRow`: a pew longer than the screen. The section is as tall as the pew is long; scrolling down walks you along it. Each seat is a mourner behind the bench and a place card on it. No. 11-50 stand at the far end.
  - `Flowers`: a wreath with the leader's name on its sash.
  - `Oven`: a belt carrying the ones who left into the fire, the count, and the rules as a three-panel order of service.
  - `Bill`: the three steps printed on a till receipt, the step being filled marked.
- **Card.tsx — the cloakroom**: the wallet check and dressing (name, skull, X).
- **Close.tsx**: the guest book (totals on the left page, rounds on the right) and the way out.
- **Skull.tsx**: the skull and what it wears, the mourner, Ash in his urn, the candle, the flower.

## Motion (GSAP; each room owns its own scenes)
- Arriving: the curtains part, the board drops on its cords, Ash pops up, the signs are wheeled in, the ten file in from below.
- Scroll 1 (parlour, pinned): the curtains pull out, the board lifts, the signs leave, the ten sink, Ash ducks, the view pushes into the mouth of the urn and a circle of ash opens until it is the next room.
- Scroll 2 (inside): the ash dunes drift up from the floor and the glass urn fills to today's level; the number counts up.
- Scroll 3 (front row, pinned): the pew slides sideways under you; each mourner sits up and each place card lands as it comes into view.
- Scroll 4 (flowers): the wreath blooms flower by flower and turns while it is on screen.
- Scroll 5 (oven): the belt runs faster the faster you scroll; the order of service unfolds panel by panel.
- Scroll 6 (till): the bill prints out of the slot, then is stamped.
- Scroll 7 (guest book, way out): the book falls open and the lines are written in; the curtains draw in again and Ash looks out.
- Mouse: the parlour leans toward it; pressing Ash makes him jump and throw his lid; cards lean; buttons are pulled; embers rise over the page, trail the mouse and burst on a click.
- Rank changes: mourners shuffle along to their new places. A wallet that sold drops through the floor and Ash jumps.
- All of it is off under prefers-reduced-motion, where the pew becomes an ordinary sideways scroller.

## Rules
- No gradients as colour (only hard-edged stripes and checks), no blur, no emoji, no badges or chips: say it in a sentence. No yield or APY language. No em or en dashes in visible text.
- Money keeps its plain name: Reward, Burn, Treasury.
- Anything GSAP moves is centred with margins, not a CSS transform. SVG parts that scale or turn use `svgOrigin`, never a percentage origin.
- The ten are drawn in a fixed order (by wallet) and placed by rank, so a rank change moves an element instead of reordering the list; that is what lets the CSS transition run.
- A counted number sits in its own `span`: style the wrapper's direct children (`>`), never every `span` inside it.
