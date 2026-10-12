/**
 * The opening: the top of the tree. Two boughs grow out of the trunk and the ten sloths hanging
 * from them are the live top ten: No. 1 asleep in the hammock, No. 1-5 on the top bough, No. 6-10
 * on the lower one. The toucan on the trunk is the dev wallet: it watches, never hangs, never paid.
 * Scrolling climbs down: the canopy slides up out of view and the leaves close over it.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDown } from "@phosphor-icons/react";
import { DEFAULT_STEPS, DEMO, STEP, type Pond, type Status } from "../lib/api";
import { nameFor } from "../lib/alias";
import { prefersReducedMotion } from "../lib/motion";
import { TICKER } from "../lib/brand";
import { BuyButton } from "./Bits";
import { Hammock, Hanger, slothOf, type Traits } from "./Sloth";
import { openTag } from "./Card";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** How far along its bough each rank hangs (0 = the tip, 1 = the trunk). No. 1 is nearest the trunk. */
const ALONG = [0.84, 0.6, 0.43, 0.27, 0.11, 0.88, 0.7, 0.52, 0.34, 0.16];

type Hang = { id: string; addr: string; name: string; traits: Traits };

function Bough({ low = false }: { low?: boolean }) {
  return (
    <div className={`bough ${low ? "is-low" : "is-top"}`} aria-hidden="true">
      <svg className="bough__wood" viewBox="0 0 100 10" preserveAspectRatio="none">
        <path d="M0 5 Q0 3.4 5 3 L100 0.6 V9.4 L5 7 Q0 6.6 0 5 Z" fill="#7a5a3c" stroke="#1c241a" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <path d="M14 4.6 H40 M52 3.9 H78 M30 6.1 H60 M70 6.6 H94" fill="none" stroke="#1c241a" strokeOpacity="0.35" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {(low ? [2, 24, 46, 71] : [1, 18, 38, 57, 76]).map((x, i) => (
        <svg key={x} className="bough__leaf" style={{ left: `${x}%`, rotate: `${[-28, 22, -14, 30, -20][i]}deg` }} viewBox="0 0 60 30">
          <path d="M2 15 C 16 0, 44 0, 58 15 C 44 30, 16 30, 2 15 Z" fill={i % 2 ? "#3f7d4a" : "#5d9a52"} stroke="#1c241a" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M6 15 H54" stroke="#1c241a" strokeOpacity="0.5" strokeWidth="1.8" />
        </svg>
      ))}
    </div>
  );
}

export function Canopy({ status, pond, offline }: { status: Status | null; pond: Pond | null; offline: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const live = !!status?.tokenAddress;
  const top = live ? (pond?.rows ?? []).slice(0, 10) : [];
  const rows: Hang[] = useMemo(() => top.map((r) => ({ id: r.addr.toLowerCase(), addr: r.addr, name: nameFor(r.addr, r.nickname, r.x).name, traits: slothOf(r.addr, r.pp) })), [pond, live]);
  const house = live ? pond?.house : null;
  // the token is live but the board has not arrived yet: say nothing about empty branches until it has
  const empty = rows.length === 0 && !(live && !pond);

  // everyone the engine ever reported as sold stays in the set, so a late board update still drops the right sloth
  const soldSet = useRef(new Set<string>());
  for (const a of pond?.sold ?? []) soldSet.current.add(a.toLowerCase());
  for (const o of pond?.out ?? []) soldSet.current.add(o.addr.toLowerCase());

  // a sloth that sold and dropped off the ten gets one last moment: it lets go and falls
  const prev = useRef<{ row: Hang; at: number }[]>([]);
  const [falling, setFalling] = useState<{ row: Hang; at: number }[]>([]);
  const alive = useRef(true);
  useEffect(() => () => void (alive.current = false), []);
  useEffect(() => {
    const now = new Set(rows.map((r) => r.id));
    const gone = prev.current.filter((p) => !now.has(p.row.id) && soldSet.current.has(p.row.id));
    prev.current = rows.map((row, at) => ({ row, at }));
    if (!gone.length) return;
    setFalling((l) => [...l, ...gone]);
    // not cleared when the board updates again: a second update must not leave the sloth hanging in mid-air
    window.setTimeout(() => alive.current && setFalling((l) => l.filter((x) => !gone.includes(x))), 1700);
  }, [rows]);

  const steps = status?.cycle.steps ?? DEFAULT_STEPS;
  const next = status ? steps[status.cycle.index] ?? steps[0] : steps[0];
  const escrow = live ? parseFloat(status?.escrowETH ?? "0") : 0;
  const target = parseFloat(next.thresholdETH);
  const pct = target > 0 ? Math.max(0, Math.min(1, escrow / target)) : 0;

  // When ranks move, each sloth shuffles along to its new grip (FLIP, keyed by wallet). Measured by
  // offset inside the scene, never on screen, so scrolling or a resize is not read as a move.
  const last = useRef(new Map<string, { x: number; y: number; w: number }>());
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const now = new Map<string, { x: number; y: number; w: number }>();
    const w = el.querySelector<HTMLElement>(".hangs")?.offsetWidth ?? 0;
    el.querySelectorAll<HTMLElement>(".hang[data-key]").forEach((n) => {
      const b = { x: n.offsetLeft, y: n.offsetTop, w };
      now.set(n.dataset.key!, b);
      const a = last.current.get(n.dataset.key!);
      if (!a || a.w !== b.w || prefersReducedMotion() || (Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2)) return;
      gsap.fromTo(n, { x: a.x - b.x, y: a.y - b.y }, { x: 0, y: 0, duration: 1.6, ease: "power2.inOut", clearProps: "transform" });
    });
    last.current = now;
  });

  // once the leaves have closed over the canopy it stops moving
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    const on = () => setCovered(window.scrollY > window.innerHeight * 0.9);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // arriving: the boughs grow out of the trunk, then the copy settles
      gsap
        .timeline({ delay: 0.1 })
        .from(".bough", { scaleX: 0, transformOrigin: "100% 50%", duration: 0.9, ease: "power3.out", stagger: 0.15 })
        .from(".canopy__text > *", { y: 22, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.08 }, "-=0.5");
      // leaving: we climb down, so the canopy slides up, and the leaves close in from both sides
      gsap
        .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: wrap.current, start: "top top", end: "bottom bottom", scrub: 0.5 } })
        .to(".scene", { yPercent: -34, duration: 0.7 }, 0)
        .to(".canopy__text", { yPercent: -60, opacity: 0, duration: 0.4 }, 0)
        .to(".trunk", { backgroundPositionY: "-260px", duration: 1 }, 0)
        .fromTo(".leaves i.is-l", { xPercent: -120, rotate: -18 }, { xPercent: 0, rotate: 0, duration: 0.5, stagger: 0.07 }, 0.3)
        .fromTo(".leaves i.is-r", { xPercent: 120, rotate: 18 }, { xPercent: 0, rotate: 0, duration: 0.5, stagger: 0.07 }, 0.34)
        .fromTo(".leaves__fill", { opacity: 0 }, { opacity: 1, duration: 0.14 }, 0.86);
    },
    { scope: wrap },
  );

  useGSAP(
    () => {
      if (prefersReducedMotion() || !rows.length) return;
      // Each sloth drops onto the bough together with its label. On first load they wait for the boughs to
      // grow; when the live board arrives later, the boughs are already there and they come at once.
      gsap.from(".hang > button", { y: -46, opacity: 0, duration: 0.6, ease: "bounce.out", stagger: 0.05, delay: performance.now() < 1400 ? 0.7 : 0.05 });
    },
    { scope: wrap, dependencies: [rows.length > 0] },
  );

  return (
    <div className="canopywrap" ref={wrap}>
      <section className={`canopy ${covered ? "is-covered" : ""}`} id="top" aria-label="The top of the tree">
        <div className="trunk" aria-hidden="true" />
        <div className="scene">
          <Bough />
          <Bough low />
          <ol className="hangs" aria-label="The ten on the branches">
            {ALONG.map((p, i) => {
              const r = rows[i];
              const tier = i < 5 ? "is-top" : "is-low";
              const style = { "--p": p, "--d": `${-(i * 0.61).toFixed(2)}s` } as CSSProperties;
              return r ? (
                <li key={r.id} data-key={r.id} className={`hang ${tier} ${i === 0 ? "is-one" : ""}`} style={style}>
                  <button type="button" onClick={() => openTag(r.addr)} aria-label={`No. ${i + 1}, ${r.name}. Open the card`}>
                    {i === 0 ? <Hammock traits={r.traits} /> : <Hanger traits={r.traits} />}
                    <span className="hang__tag">
                      <b>No. {i + 1}</b>
                      <span>{r.name}</span>
                    </span>
                  </button>
                </li>
              ) : (
                <li key={`open-${i}`} className={`hang ${tier} is-open ${i === 0 ? "is-one" : ""}`} style={style}>
                  <span className="hang__tag">
                    <b>No. {i + 1}</b>
                    <span>free</span>
                  </span>
                </li>
              );
            })}
            {falling.map(({ row, at }) => (
              <li key={`out-${row.id}`} className={`hang ${at < 5 ? "is-top" : "is-low"} is-falling`} style={{ "--p": ALONG[at] ?? 0.5 } as CSSProperties} aria-hidden="true">
                <Hanger traits={row.traits} startled />
              </li>
            ))}
          </ol>
          {house ? (
            <button type="button" className="toucan" onClick={() => openTag(house.addr)} aria-label={`The toucan, ${nameFor(house.addr, house.nickname, house.x).name}. Open the card`}>
              <svg viewBox="0 0 96 78" aria-hidden="true">
                <path d="M96 62 H40" stroke="#1c241a" strokeWidth="11" strokeLinecap="round" />
                <path d="M96 62 H42" stroke="#7a5a3c" strokeWidth="6" strokeLinecap="round" />
                <path d="M64 50 L84 70 L74 52 Z" fill="#1c241a" />
                <ellipse cx="56" cy="40" rx="15" ry="19" fill="#1c241a" />
                <ellipse cx="50" cy="38" rx="8" ry="12" fill="#fffaf0" />
                <circle cx="50" cy="20" r="11" fill="#1c241a" />
                <path d="M42 15 C 24 10, 6 16, 2 30 C 16 30, 32 30, 43 26 Z" fill="#f29a2e" stroke="#1c241a" strokeWidth="2.6" strokeLinejoin="round" />
                <path d="M12 21 C 6 23, 3 26, 2 30 C 8 30, 12 30, 16 29.5 Z" fill="#b3402a" />
                <circle cx="49" cy="18" r="4" fill="#fffaf0" />
                <circle cx="48.4" cy="18" r="1.7" fill="#1c241a" />
                <path d="M52 58 v5 M58 58 v5" stroke="#f29a2e" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="toucan__tag">
                The toucan <b>{nameFor(house.addr, house.nickname, house.x).name}</b>
              </span>
            </button>
          ) : null}
        </div>

        <div className="canopy__text">
          <h1 className="canopy__h">{empty ? <>The branches are free.</> : <>Don't let go.</>}</h1>
          <p className="canopy__sub">
            {offline
              ? "The tree is offline for a moment."
              : empty
                ? live
                  ? `The first holder of 100,000 ${TICKER} takes the hammock.`
                  : `Opens at launch. The first holder of 100,000 ${TICKER} takes the hammock.`
                : `The ten biggest holders of ${TICKER} hang on the top two branches and are paid in ETH from trading fees. Let go once and you are on the ground for good.`}
            {DEMO ? <em className="demo"> Demo data.</em> : null}
          </p>
          <div className="ripen" role="status">
            <span className="ripen__k">
              Ripening <b>{STEP[next.kind].name}</b>
            </span>
            <span className="ripen__rule" role="meter" aria-valuemin={0} aria-valuemax={target} aria-valuenow={escrow} aria-label={`Fees collected toward the next ${STEP[next.kind].name.toLowerCase()}`}>
              <i style={{ width: `${pct * 100}%` }} />
            </span>
            <span className="ripen__read num">
              {escrow.toFixed(4)} / {next.thresholdETH} ETH
            </span>
          </div>
          <div className="canopy__acts">
            <BuyButton status={status} />
            <a className="btn is-line" href="#branches">
              <span className="btn__long">See the branches</span>
              <span className="btn__short">Branches</span> <ArrowDown weight="bold" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="leaves" aria-hidden="true">
          {["is-l", "is-r", "is-l", "is-r", "is-l", "is-r"].map((side, i) => (
            <i key={i} className={side} style={{ top: `${[-8, 6, 26, 40, 58, 70][i]}%`, color: ["#3f7d4a", "#2f6a3b", "#2f6a3b", "#3f7d4a", "#234a2e", "#234a2e"][i] }}>
              <svg viewBox="0 0 200 100" preserveAspectRatio="none">
                <path d={side === "is-l" ? "M0 0 H110 C 170 10, 200 40, 200 50 C 200 60, 170 90, 110 100 H0 Z" : "M200 0 H90 C 30 10, 0 40, 0 50 C 0 60, 30 90, 90 100 H200 Z"} fill="currentColor" stroke="#1c241a" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                <path d={side === "is-l" ? "M0 50 H196" : "M200 50 H4"} stroke="#1c241a" strokeOpacity="0.4" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </i>
          ))}
          <b className="leaves__fill" />
        </div>
      </section>
    </div>
  );
}
