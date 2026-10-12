/**
 * The sloth. One head, drawn flat in SVG, used everywhere: the plate on a specimen card, the ten
 * hanging from the branches, the one in the hammock, the mark. Every wallet gets one generated
 * from its address; holders can groom their own.
 * Part counts must match MUGSHOT_PARTS in bot/byline.ts (the slot keys are kept for the engine).
 */
import { type CSSProperties } from "react";

export const PARTS = { fur: 5, hat: 5, acc: 6, bg: 6 } as const;
export type Traits = [fur: number, hat: number, acc: number, bg: number];

/** fur = coat, hat = what sits on the head, acc = eyewear and a blade of grass, bg = what is behind. */
export const PART_NAMES = {
  fur: ["Sandy", "Mossy", "Ash", "Cocoa", "Ginger"],
  hat: ["Bare head", "Leaf hat", "Hibiscus", "Moth", "Sprout"],
  acc: ["Nothing", "Monocle", "Sleep mask", "Blade of grass", "Monocle + grass", "Sleep mask + grass"],
  bg: ["Canopy", "Dawn", "Dusk", "Rain", "Night", "Plate paper"],
};

export const FUR = ["#bfa784", "#93a06a", "#9b9a93", "#7d5d44", "#c98443"];
const BEHIND = ["#b9d48b", "#f6dcae", "#e59a6c", "#b9cfd4", "#1f2a3a", "#f1ecdc"];
const INK = "#1c241a";
const LEAF = "#3f7d4a";
const MANGO = "#f29a2e";
const hasMonocle = (acc: number) => acc === 1 || acc === 4;
const hasMask = (acc: number) => acc === 2 || acc === 5;
const hasGrass = (acc: number) => acc >= 3;

function fnv(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The sloth a wallet gets until its owner grooms one. */
export function traitsFor(addr: string): Traits {
  const h = fnv(addr.toLowerCase() + ":mugshot");
  return [h % PARTS.fur, Math.floor(h / 7) % PARTS.hat, Math.floor(h / 53) % PARTS.acc, Math.floor(h / 419) % PARTS.bg];
}

export function validTraits(t: unknown): t is Traits {
  const max = [PARTS.fur, PARTS.hat, PARTS.acc, PARTS.bg];
  return Array.isArray(t) && t.length === 4 && t.every((v, i) => Number.isInteger(v) && v >= 0 && v < max[i]);
}

/** A wallet's sloth: the parts it picked, else the ones its address generates. */
export function slothOf(addr: string, pp?: number[] | null): Traits {
  return validTraits(pp) ? pp : traitsFor(addr);
}

/** Mixes a hex colour toward another by k (0..1). */
function mix(a: string, b: string, k: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}

const line = { stroke: INK, strokeWidth: 2.6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/**
 * The head alone, in a 100 by 100 box. `asleep` closes the eyes (the one in the hammock);
 * `startled` is the face of a wallet that just let go.
 */
export function SlothHead({ traits, asleep = false, startled = false }: { traits: Traits; asleep?: boolean; startled?: boolean }) {
  const [f, hat, acc] = traits;
  const fur = FUR[f] ?? FUR[0];
  const pale = mix(fur, "#fff5df", 0.66);
  const mask = mix(fur, "#1c1712", 0.62);
  return (
    <g>
      <path d="M41 19 l4 -9 l4 8 l4 -9 l4 9 l4 -7 l1 9 Z" fill={fur} {...line} />
      <circle cx="50" cy="53" r="36" fill={fur} {...line} />
      <ellipse cx="50" cy="57" rx="27" ry="24" fill={pale} />
      <path d="M43 49 C 34 45, 23 52, 19 64 C 28 64, 38 60, 45 54 Z" fill={mask} />
      <path d="M57 49 C 66 45, 77 52, 81 64 C 72 64, 62 60, 55 54 Z" fill={mask} />
      {startled
        ? [39, 61].map((x) => (
            <g key={x}>
              <circle cx={x} cy="51" r="5.6" fill="#fffaf0" {...line} strokeWidth={2} />
              <circle cx={x} cy="51" r="1.9" fill={INK} />
            </g>
          ))
        : asleep || hasMask(acc)
          ? [39, 61].map((x) => <path key={x} d={`M${x - 4.5} 51 q4.5 4 9 0`} fill="none" stroke="#fffaf0" strokeWidth="2.2" strokeLinecap="round" />)
          : [39, 61].map((x) => (
              <g key={x}>
                <circle cx={x} cy="51.5" r="3.2" fill={INK} />
                <circle cx={x + 1} cy="50.4" r="1" fill="#fffaf0" />
              </g>
            ))}
      <ellipse cx="50" cy="61" rx="5.2" ry="3.7" fill={mix(mask, "#000000", 0.25)} />
      <path d="M42 67 Q50 73.5 58 67" fill="none" {...line} strokeWidth={2.2} />
      {hasGrass(acc) ? <path d="M56 68.5 C 66 70, 78 66, 88 56" fill="none" stroke={LEAF} strokeWidth="3" strokeLinecap="round" /> : null}
      {hasMonocle(acc) ? (
        <g fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round">
          <circle cx="61" cy="51.5" r="8.2" fill="#fffaf0" fillOpacity="0.3" />
          <path d="M67 57.5 C 72 66, 71 76, 66 84" strokeWidth="1.6" />
        </g>
      ) : null}
      {hasMask(acc) ? (
        <g>
          <path d="M22 46 Q50 38 78 46 L78 57 Q50 50 22 57 Z" fill="#35518f" {...line} strokeWidth={2.2} />
          <path d="M35 49.5 q4 3.4 8 0 M57 49.5 q4 3.4 8 0" fill="none" stroke="#fffaf0" strokeWidth="2" strokeLinecap="round" />
        </g>
      ) : null}
      {hat === 1 ? (
        <path d="M18 30 C 30 6, 70 4, 86 22 C 70 34, 40 38, 18 30 Z M22 29 C 44 26, 66 22, 84 22" fill={LEAF} {...line} strokeWidth={2.2} fillRule="evenodd" />
      ) : hat === 2 ? (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="27" cy="13" rx="6" ry="9" fill="#d94a3a" {...line} strokeWidth={1.8} transform={`rotate(${a} 27 23)`} />
          ))}
          <circle cx="27" cy="23" r="3.6" fill={MANGO} {...line} strokeWidth={1.6} />
        </g>
      ) : hat === 3 ? (
        <g {...line} strokeWidth={1.8}>
          <path d="M50 18 C 40 4, 28 6, 30 16 C 31 22, 42 22, 50 18 Z" fill="#d8c7a3" />
          <path d="M50 18 C 60 4, 72 6, 70 16 C 69 22, 58 22, 50 18 Z" fill="#d8c7a3" />
          <ellipse cx="50" cy="15" rx="2.4" ry="6" fill="#7d5d44" />
          <path d="M49 9 l-3 -5 M51 9 l3 -5" fill="none" strokeWidth={1.4} />
        </g>
      ) : hat === 4 ? (
        <g {...line} strokeWidth={2}>
          <path d="M50 20 V8" fill="none" />
          <path d="M50 9 C 44 0, 34 2, 34 8 C 40 13, 46 12, 50 9 Z" fill="#7fbf5a" />
          <path d="M50 9 C 56 0, 66 2, 66 8 C 60 13, 54 12, 50 9 Z" fill="#7fbf5a" />
        </g>
      ) : null}
    </g>
  );
}

/** A sloth hanging by both arms. The branch it grips is at the very top of its 100 by 156 box. */
export function Hanger({ traits, startled = false, className = "" }: { traits: Traits; startled?: boolean; className?: string }) {
  const fur = FUR[traits[0]] ?? FUR[0];
  const pale = mix(fur, "#fff5df", 0.6);
  return (
    <svg className={`hanger ${className}`} viewBox="0 0 100 156" aria-hidden="true">
      <g className="hanger__sway">
        {["M33 78 L27 9", "M67 78 L73 9"].map((d) => (
          <g key={d} fill="none" strokeLinecap="round">
            <path d={d} stroke={INK} strokeWidth="18" />
            <path d={d} stroke={fur} strokeWidth="12.8" />
          </g>
        ))}
        <path d="M20 10 q-1 -10 6 -9 M26 10 q0 -10 6 -8 M67 10 q0 -10 7 -9 M74 10 q1 -10 7 -8" fill="none" {...line} strokeWidth={3} />
        <ellipse cx="50" cy="110" rx="28" ry="35" fill={fur} {...line} />
        <ellipse cx="50" cy="116" rx="16" ry="23" fill={pale} />
        {[33, 67].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="144" rx="10.5" ry="7.5" fill={fur} {...line} />
            <path d={`M${x - 5} 149 v4 M${x} 150 v4 M${x + 5} 149 v4`} fill="none" {...line} strokeWidth={2.2} />
          </g>
        ))}
        <g transform="translate(18 42) scale(0.64)">
          <SlothHead traits={traits} startled={startled} />
        </g>
      </g>
    </svg>
  );
}

/** No. 1: asleep in the hammock strung from the top branch. 160 by 132 box, ropes meet the branch at the top. */
export function Hammock({ traits, className = "" }: { traits: Traits; className?: string }) {
  const fur = FUR[traits[0]] ?? FUR[0];
  return (
    <svg className={`hanger is-hammock ${className}`} viewBox="0 0 160 132" aria-hidden="true">
      <g className="hanger__sway">
        <path d="M14 2 L20 58 M146 2 L140 58" fill="none" {...line} strokeWidth={3} />
        <ellipse cx="94" cy="64" rx="36" ry="15" fill={fur} {...line} />
        <path d="M16 56 Q80 128 144 56 Q80 92 16 56 Z" fill={MANGO} {...line} />
        <path d="M38 76 Q80 106 122 76 M60 98 Q80 104 100 98" fill="none" stroke={INK} strokeOpacity="0.45" strokeWidth="2" />
        <g fill="none" strokeLinecap="round">
          <path d="M112 70 C 120 84, 120 98, 116 110" stroke={INK} strokeWidth="15" />
          <path d="M112 70 C 120 84, 120 98, 116 110" stroke={fur} strokeWidth="10" />
        </g>
        <path d="M110 114 v6 M116 116 v6 M122 114 v6" fill="none" {...line} strokeWidth={2.4} />
        <g transform="translate(22 14) scale(0.6)">
          <SlothHead traits={traits} asleep />
        </g>
        <path d="M84 30 l8 0 l-8 9 l8 0 M100 14 l6 0 l-6 7 l6 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** The plate on a card: head and shoulders, whatever the holder chose behind. */
export function Portrait({ traits, size = 40, className = "", title, style }: { traits: Traits; size?: number; className?: string; title?: string; style?: CSSProperties }) {
  const b = traits[3];
  const fur = FUR[traits[0]] ?? FUR[0];
  return (
    <svg className={`portrait ${className}`} viewBox="0 0 100 100" width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={style}>
      <rect width="100" height="100" fill={BEHIND[b] ?? BEHIND[0]} />
      {b === 0 ? (
        <g fill={LEAF}>
          <ellipse cx="12" cy="14" rx="18" ry="9" transform="rotate(-24 12 14)" />
          <ellipse cx="88" cy="10" rx="18" ry="9" transform="rotate(20 88 10)" />
          <ellipse cx="94" cy="44" rx="14" ry="7" transform="rotate(64 94 44)" />
        </g>
      ) : b === 1 ? (
        <circle cx="76" cy="26" r="13" fill="#f29a2e" />
      ) : b === 2 ? (
        <circle cx="24" cy="30" r="13" fill="#b3402a" />
      ) : b === 3 ? (
        <path d="M14 6 l-6 16 M34 2 l-6 16 M56 8 l-6 16 M78 2 l-6 16 M94 14 l-6 16 M22 34 l-6 16 M88 40 l-6 16" stroke="#5f8a95" strokeWidth="2.4" strokeLinecap="round" />
      ) : b === 4 ? (
        <g fill="#fffaf0">
          <circle cx="78" cy="20" r="9" fill="#f1ecdc" />
          <circle cx="18" cy="14" r="1.3" />
          <circle cx="36" cy="28" r="1" />
          <circle cx="54" cy="10" r="1.3" />
        </g>
      ) : (
        <path d="M0 20 H100 M0 40 H100 M0 60 H100 M0 80 H100" stroke={INK} strokeOpacity="0.14" strokeWidth="1.2" />
      )}
      <ellipse cx="50" cy="108" rx="38" ry="26" fill={fur} {...line} />
      <g transform="translate(9 6) scale(0.82)">
        <SlothHead traits={traits} />
      </g>
      <rect x="1" y="1" width="98" height="98" fill="none" stroke={INK} strokeWidth="2" />
    </svg>
  );
}

/** The mark: a sloth's face on a leaf-green disc. */
export function Mark({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={`mark ${className}`} viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill={LEAF} stroke={INK} strokeWidth="6" />
      <g transform="translate(15 13) scale(0.9)">
        <SlothHead traits={[0, 0, 0, 0]} />
      </g>
    </svg>
  );
}
