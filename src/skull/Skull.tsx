/**
 * The skulls. One cartoon skull, flat colour with an ink outline, used everywhere: the mourners in
 * the parlour and on the pew, the plate on a card, the mark. Every wallet gets one generated from
 * its address; holders can dress their own. Ash himself (the skull who lives in the urn) is drawn
 * here too.
 * Part counts must match MUGSHOT_PARTS in bot/byline.ts (the slot keys are kept for the engine).
 */
import { type CSSProperties } from "react";

export const PARTS = { fur: 5, hat: 5, acc: 6, bg: 6 } as const;
export type Traits = [fur: number, hat: number, acc: number, bg: number];

/** fur = the bone, hat = what is worn to the wake, acc = the eyes, a gold tooth, a crack, bg = what is behind. */
export const PART_NAMES = {
  fur: ["Bone", "Ash", "Moss", "Rose", "Gilt"],
  hat: ["Bare", "Top hat", "Veil", "Candle", "Urn lid"],
  acc: ["Plain", "Ember eyes", "Gold tooth", "Cracked", "Ember eyes, cracked", "Gold tooth, cracked"],
  bg: ["Parlour", "Candlelight", "Oven", "Lilies", "Midnight", "Paper"],
};

export const BONE = ["#f3ead8", "#c9c4bb", "#bcd0a0", "#f0c2c0", "#f0c85a"];
const BEHIND = ["#3a2550", "#ffd35a", "#ff6a1a", "#7fb069", "#1d2440", "#fffaf0"];
export const INK = "#17121c";
const EMBER = "#ff6a1a";
const FLAME = "#ffd35a";
const GOLD = "#e9b53c";
const SUIT = "#4a3d55";
const URN = "#e8662a";
const URN_D = "#b8451a";
const hasEmbers = (acc: number) => acc === 1 || acc === 4;
const hasTooth = (acc: number) => acc === 2 || acc === 5;
const hasCrack = (acc: number) => acc >= 3;

function fnv(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The skull a wallet gets until its owner dresses one. */
export function traitsFor(addr: string): Traits {
  const h = fnv(addr.toLowerCase() + ":mugshot");
  return [h % PARTS.fur, Math.floor(h / 7) % PARTS.hat, Math.floor(h / 53) % PARTS.acc, Math.floor(h / 419) % PARTS.bg];
}

export function validTraits(t: unknown): t is Traits {
  const max = [PARTS.fur, PARTS.hat, PARTS.acc, PARTS.bg];
  return Array.isArray(t) && t.length === 4 && t.every((v, i) => Number.isInteger(v) && v >= 0 && v < max[i]);
}

/** A wallet's skull: the parts it picked, else the ones its address generates. */
export function skullOf(addr: string, pp?: number[] | null): Traits {
  return validTraits(pp) ? pp : traitsFor(addr);
}

/** Mixes a hex colour toward another by k (0..1). */
function mix(a: string, b: string, k: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}

const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const SKULL = "M50 6 C 76 6, 92 24, 92 46 C 92 60, 86 68, 78 72 L78 84 C 78 90, 74 94, 68 94 L32 94 C 26 94, 22 90, 22 84 L22 72 C 14 68, 8 60, 8 46 C 8 24, 24 6, 50 6 Z";

/** A flame, its base at (x, y), `s` times the usual size. */
function Flame({ x, y, s = 1, className = "" }: { x: number; y: number; s?: number; className?: string }) {
  return (
    <g className={className} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C -10 -6, -10 -16, -3 -22 C -3 -16, 2 -16, 1 -28 C 10 -20, 12 -7, 0 0 Z" fill={EMBER} {...line} strokeWidth={2.4 / s} />
      <path d="M0 -3 C -4.5 -7, -4.5 -12, 0 -17 C 4.5 -12, 4.5 -7, 0 -3 Z" fill={FLAME} />
    </g>
  );
}

/** The bare skull, face on, in a 100 by 100 box. `eyes` is what looks out of the sockets; `charred` is a wallet that sold. */
function Bare({ bone, acc = 0, charred = false, eyes = "glint" }: { bone: string; acc?: number; charred?: boolean; eyes?: "glint" | "fire" }) {
  const pale = mix(bone, "#ffffff", 0.55);
  const shade = mix(bone, INK, 0.2);
  return (
    <g>
      <path d={SKULL} fill={bone} {...line} />
      <path d="M78 72 C 86 68, 92 60, 92 46 C 92 34, 87 22, 78 14 C 84 26, 86 40, 82 54 C 80 62, 78 66, 78 72 Z" fill={shade} />
      <ellipse cx="33" cy="48" rx="12" ry="13" fill={INK} />
      <ellipse cx="67" cy="48" rx="12" ry="13" fill={INK} />
      {charred ? null : eyes === "fire" || hasEmbers(acc) ? (
        [33, 67].map((x) => (
          <g key={x} className={eyes === "fire" ? "ash__eye" : undefined}>
            <path d={`M${x} 58 C ${x - 9} 53, ${x - 9} 44, ${x - 3} 39 C ${x - 3} 44, ${x + 2} 44, ${x + 1} 35 C ${x + 9} 41, ${x + 10} 53, ${x} 58 Z`} fill={EMBER} />
            <path d={`M${x} 56 C ${x - 4} 52, ${x - 4} 48, ${x} 44 C ${x + 4} 48, ${x + 4} 52, ${x} 56 Z`} fill={FLAME} />
          </g>
        ))
      ) : (
        <g fill={pale}>
          <circle cx="37" cy="44" r="3.4" />
          <circle cx="71" cy="44" r="3.4" />
        </g>
      )}
      <path d="M50 61 C 47 66, 44 70, 47 71 C 49 71.5, 50 70, 50 70 C 50 70, 51 71.5, 53 71 C 56 70, 53 66, 50 61 Z" fill={INK} />
      <rect x="30" y="76" width="40" height="12" rx="2" fill={pale} {...line} strokeWidth={2.4} />
      {hasTooth(acc) && !charred ? <rect x="46" y="76" width="8" height="12" fill={GOLD} {...line} strokeWidth={2.4} /> : null}
      <path d="M38 76 V88 M46 76 V88 M54 76 V88 M62 76 V88" fill="none" {...line} strokeWidth={2.4} />
      {hasCrack(acc) || charred ? <path d="M64 9 l-5 10 l7 5 l-5 11" fill="none" {...line} strokeWidth={2.2} /> : null}
      {charred ? <path d="M26 18 L38 30 L32 40" fill="none" {...line} strokeWidth={2.2} /> : null}
    </g>
  );
}

/**
 * A holder's skull with what it wears, in a 100 by 100 box (hats rise above it). `lit` puts a
 * flame over No. 1; `spent` is the skull of a wallet that just sold.
 */
export function SkullHead({ traits, lit = false, spent = false }: { traits: Traits; lit?: boolean; spent?: boolean }) {
  const [b, hat, acc] = traits;
  const bone = spent ? "#5a4f4a" : BONE[b] ?? BONE[0];
  return (
    <g>
      <Bare bone={bone} acc={acc} charred={spent} />
      {spent ? null : hat === 1 ? (
        <g>
          <path d="M30 -18 H70 L68 12 H32 Z" fill={SUIT} {...line} />
          <path d="M31 2 H69 L68 12 H32 Z" fill={EMBER} {...line} strokeWidth={2.4} />
          <rect x="16" y="11" width="68" height="8" rx="4" fill={SUIT} {...line} />
        </g>
      ) : hat === 2 ? (
        <g>
          <path d="M12 14 Q50 2 88 14 L92 52 Q50 62 8 52 Z" fill={INK} fillOpacity="0.3" stroke={INK} strokeWidth="1.8" strokeDasharray="2 4" strokeLinecap="round" />
          <rect x="34" y="0" width="32" height="13" rx="3" fill={SUIT} {...line} />
        </g>
      ) : hat === 3 ? (
        <g>
          <path d="M36 9 H64 L62 16 L55 13 L51 20 L47 13 L39 16 Z" fill="#fffaf0" {...line} strokeWidth={2.4} />
          <rect x="44" y="-14" width="12" height="24" rx="2" fill="#fffaf0" {...line} strokeWidth={2.4} />
          <Flame x={50} y={-13} s={0.8} className="lit" />
        </g>
      ) : hat === 4 ? (
        <g transform="rotate(-9 50 10)">
          <path d="M22 15 H78 L74 6 Q50 -8 26 6 Z" fill={URN} {...line} />
          <circle cx="50" cy="-6" r="6" fill={GOLD} {...line} strokeWidth={2.4} />
        </g>
      ) : null}
      {lit ? <Flame x={50} y={hat === 0 ? 5 : -20} className="lit" /> : null}
    </g>
  );
}

/** A mourner: the skull resting on a dark suit and a bow tie, seated. 100 by 150 box, hats and flames rise above it. */
export function Mourner({ traits, lit = false, spent = false, className = "" }: { traits: Traits; lit?: boolean; spent?: boolean; className?: string }) {
  return (
    <svg className={`mourner ${className}`} viewBox="0 -30 100 180" aria-hidden="true">
      <path d="M8 150 C 8 116, 28 102, 50 102 C 72 102, 92 116, 92 150 Z" fill={spent ? "#2a2326" : SUIT} {...line} />
      <path d="M38 103 L50 124 L62 103 Z" fill="#fffaf0" {...line} strokeWidth={2.4} />
      {spent ? null : <path d="M50 110 L40 104 V116 Z M50 110 L60 104 V116 Z" fill={EMBER} {...line} strokeWidth={2.2} />}
      {/* the jaw sits on the collar: no gap for whatever is behind to show through */}
      <g className="mourner__head" transform="translate(10 27) scale(0.8)">
        <SkullHead traits={traits} lit={lit} spent={spent} />
      </g>
    </svg>
  );
}

/** The plate on a card: the skull, whatever the holder chose behind. */
export function Portrait({ traits, size = 40, className = "", title, style }: { traits: Traits; size?: number; className?: string; title?: string; style?: CSSProperties }) {
  const b = traits[3];
  const mark = b === 0 || b === 4 ? "#f3ead8" : INK;
  return (
    <svg className={`portrait ${className}`} viewBox="0 0 100 100" width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={style}>
      <rect width="100" height="100" fill={BEHIND[b] ?? BEHIND[0]} />
      {b === 0 ? (
        <path d="M10 0 V100 M30 0 V100 M50 0 V100 M70 0 V100 M90 0 V100" stroke="#4a3466" strokeWidth="8" />
      ) : b === 1 ? (
        <circle cx="50" cy="52" r="44" fill="#fff3bf" />
      ) : b === 2 ? (
        <path d="M0 100 V62 C 10 50, 14 66, 22 48 C 30 62, 36 40, 46 58 C 54 44, 62 62, 70 46 C 78 60, 86 44, 100 60 V100 Z" fill={FLAME} />
      ) : b === 3 ? (
        <g fill="#fffaf0" stroke={INK} strokeWidth="1.6">
          <circle cx="10" cy="14" r="6" />
          <circle cx="90" cy="12" r="6" />
          <circle cx="92" cy="60" r="5" />
          <circle cx="8" cy="64" r="5" />
        </g>
      ) : b === 4 ? (
        <g fill={mark}>
          <circle cx="88" cy="12" r="8" />
          <circle cx="10" cy="12" r="1.4" />
          <circle cx="6" cy="50" r="1.1" />
        </g>
      ) : (
        <path d="M0 20 H100 M0 40 H100 M0 60 H100 M0 80 H100" stroke={INK} strokeOpacity="0.14" strokeWidth="1.2" />
      )}
      <g transform="translate(14 26) scale(0.72)">
        <SkullHead traits={traits} />
      </g>
      <rect x="1.5" y="1.5" width="97" height="97" fill="none" stroke={INK} strokeWidth="3" />
    </svg>
  );
}

/** The mark: Ash's skull on an ember disc. */
export function Mark({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={`mark ${className}`} viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <circle cx="60" cy="60" r="55" fill={EMBER} stroke={INK} strokeWidth="6" />
      <g transform="translate(25 23) scale(0.7)">
        <Bare bone={BONE[0]} />
      </g>
    </svg>
  );
}

/**
 * Ash in his urn: his eyes and the top of his head over the rim, both hands holding on, the lid on
 * his head like a hat. 300 by 400 box. The parts that move have their own class: `ash__skull`
 * (he pops up), `ash__lid`, `ash__eye`, `ash__hand`.
 */
export function AshUrn({ className = "" }: { className?: string }) {
  return (
    <svg className={`ash ${className}`} viewBox="0 -30 300 430" aria-hidden="true">
      <defs>
        <clipPath id="ash-above">
          <rect x="-200" y="-400" width="700" height="546" />
        </clipPath>
        <clipPath id="ash-body">
          <path d="M96 150 H204 C 204 170, 250 190, 250 250 C 250 310, 214 350, 196 364 H104 C 86 350, 50 310, 50 250 C 50 190, 96 170, 96 150 Z" />
        </clipPath>
      </defs>
      {["M58 208 C 16 196, 16 268, 60 274", "M242 208 C 284 196, 284 268, 240 274"].map((d) => (
        <g key={d} fill="none" strokeLinecap="round">
          <path d={d} stroke={INK} strokeWidth="17" />
          <path d={d} stroke={URN_D} strokeWidth="10" />
        </g>
      ))}
      <path d="M100 362 H200 L214 390 H86 Z" fill={URN_D} {...line} strokeWidth={4} />
      <path d="M96 150 H204 C 204 170, 250 190, 250 250 C 250 310, 214 350, 196 364 H104 C 86 350, 50 310, 50 250 C 50 190, 96 170, 96 150 Z" fill={URN} {...line} strokeWidth={4} />
      <g clipPath="url(#ash-body)">
        <path d="M204 150 C 204 170, 250 190, 250 250 C 250 310, 214 350, 196 364 H170 C 196 340, 214 300, 214 250 C 214 200, 190 172, 184 150 Z" fill={URN_D} />
        <rect x="40" y="236" width="220" height="34" fill="#fffaf0" />
        <path d="M40 236 H260 M40 270 H260" stroke={INK} strokeWidth="4" />
        <path d="M52 262 l12 -18 l12 18 l12 -18 l12 18 l12 -18 l12 18 l12 -18 l12 18 l12 -18 l12 18 l12 -18 l12 18 l12 -18 l12 18 l12 -18 l12 18" fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </g>
      <path d="M74 232 C 74 204, 88 188, 102 178" fill="none" stroke="#fffaf0" strokeOpacity="0.7" strokeWidth="6" strokeLinecap="round" />

      {/* only what is above the rim shows, however far he pops up */}
      <g clipPath="url(#ash-above)">
        <g className="ash__skull">
          <g transform="translate(72 34) scale(1.56)">
            <Bare bone={BONE[0]} eyes="fire" />
          </g>
          <g className="ash__lid">
            <g transform="rotate(-8 150 50)">
              <path d="M96 62 H204 L196 44 Q150 14 104 44 Z" fill={URN_D} {...line} strokeWidth={4} />
              <circle cx="150" cy="22" r="10" fill={GOLD} {...line} strokeWidth={3.4} />
            </g>
          </g>
        </g>
      </g>

      <rect x="86" y="138" width="128" height="20" rx="8" fill={URN_D} {...line} strokeWidth={4} />
      {[92, 180].map((x) => (
        <g key={x} className="ash__hand">
          {[0, 10, 20].map((dx) => (
            <rect key={dx} x={x + dx} y="130" width="9" height="26" rx="4.5" fill={BONE[0]} {...line} strokeWidth={2.6} />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** A candle on a tall stand, its foot on the floor. 60 by 300 box. */
export function Candle({ className = "" }: { className?: string }) {
  return (
    <svg className={`candle ${className}`} viewBox="0 -40 60 340" aria-hidden="true">
      <path d="M30 96 V280" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      <path d="M30 96 V280" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
      <path d="M8 296 H52 L44 278 H16 Z" fill={GOLD} {...line} />
      <path d="M10 96 H50 L44 84 H16 Z" fill={GOLD} {...line} />
      <rect x="20" y="28" width="20" height="56" rx="3" fill="#fffaf0" {...line} />
      <Flame x={30} y={30} s={1.3} className="lit" />
    </svg>
  );
}

/** A flower seen from above: five petals round a gold heart. 60 by 60 box. */
export function Bloom({ x, y, r = 0, s = 1, color = "#fffaf0" }: { x: number; y: number; r?: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {/* the inner group is the one that is animated, so the placing above is never overwritten */}
      <g className="bloom">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-15" rx="10" ry="15" fill={color} {...line} strokeWidth={2.4} transform={`rotate(${a})`} />
        ))}
        <circle r="8" fill={GOLD} {...line} strokeWidth={2.4} />
      </g>
    </g>
  );
}
