/**
 * The opening: the parlour of Ash's funeral home. Velvet curtains part on the chapel: Ash looks
 * out of his urn on a pedestal under the window, the headline hangs on a letter board, and the ten
 * biggest holders are the front row, lined up along the bottom like a family photograph with No. 1
 * (the chief mourner) in the middle. A wallet that sells drops through the floor. Ash can be
 * poked: the whole urn is a button, and a speech bubble beside him says so.
 * Scrolling clears the room, Ash ducks, and the view goes down into the mouth of his urn, which
 * opens onto the next room.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDown } from "@phosphor-icons/react";
import { DEFAULT_STEPS, DEMO, STEP, amount, compact, eth, type Pond, type Status } from "../lib/api";
import { nameFor } from "../lib/alias";
import { prefersReducedMotion } from "../lib/motion";
import { sparks } from "../lib/fx";
import { TICKER } from "../lib/brand";
import { BuyButton, Words, useMedia } from "./Bits";
import { Count } from "./Fx";
import { AshUrn, Candle, Mourner, skullOf, type Traits } from "./Skull";
import { openTag } from "./Card";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Seat = { id: string; addr: string; name: string; traits: Traits; balance: string };

/** How much of the supply one urn holds, in percent. When it is full, Ash starts another. */
export const URN_PCT = 5;

/** What Ash says when he is poked, in turn. */
const REPLIES = ["Ow.", "Again?", "I'm dead, not deaf.", "Mind the lid.", "That tickles.", "Still dead.", "Buy something."];

/** Which place along the row each rank stands in on a wide screen: No. 1 in the middle, then out to both sides. */
const SLOT = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];
/** On a phone the ten stand in two rows of five: [x %] for the front five, then the five behind. */
const NARROW_X = [50, 30, 70, 11, 89, 32, 68, 14, 86, 50];

function place(rank: number, narrow: boolean): CSSProperties {
  if (narrow) return { left: `${NARROW_X[rank]}%`, bottom: rank < 5 ? "1%" : "14%", "--s": rank === 0 ? 1.15 : rank < 5 ? 1 : 0.82, zIndex: rank < 5 ? 3 : 2 } as CSSProperties;
  return { left: `${15 + SLOT[rank] * 7.8}%`, bottom: "2%", "--s": rank === 0 ? 1.2 : rank < 5 ? 1.04 : 0.9, zIndex: 10 - rank } as CSSProperties;
}

export function Hero({ status, pond, offline }: { status: Status | null; pond: Pond | null; offline: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const narrow = useMedia("(max-width: 900px)");
  const live = !!status?.tokenAddress;
  const top = live ? (pond?.rows ?? []).slice(0, 10) : [];
  const seats: Seat[] = useMemo(() => top.map((r) => ({ id: r.addr.toLowerCase(), addr: r.addr, name: nameFor(r.addr, r.nickname, r.x).name, traits: skullOf(r.addr, r.pp), balance: r.balance })), [pond, live]);
  // the token is live but the board has not arrived yet: say nothing about an empty row until it has
  const empty = seats.length === 0 && !(live && !pond);
  const min = amount(status?.rules.minBalance ?? "100000");

  // everyone the engine ever reported as sold stays in the set, so a late board update still drops the right mourner
  const soldSet = useRef(new Set<string>());
  for (const a of pond?.sold ?? []) soldSet.current.add(a.toLowerCase());
  for (const o of pond?.out ?? []) soldSet.current.add(o.addr.toLowerCase());

  // a wallet that sold and lost its place gets one last moment: the floor opens under it
  const prev = useRef<{ seat: Seat; at: number }[]>([]);
  const [leaving, setLeaving] = useState<{ seat: Seat; at: number }[]>([]);
  const alive = useRef(true);
  useEffect(() => () => void (alive.current = false), []);
  useEffect(() => {
    const now = new Set(seats.map((s) => s.id));
    const gone = prev.current.filter((p) => !now.has(p.seat.id) && soldSet.current.has(p.seat.id));
    prev.current = seats.map((seat, at) => ({ seat, at }));
    if (!gone.length) return;
    setLeaving((l) => [...l, ...gone]);
    window.setTimeout(() => alive.current && wake(44), 700);
    window.setTimeout(() => alive.current && setLeaving((l) => l.filter((x) => !gone.includes(x))), 1400);
  }, [seats]);

  const steps = status?.cycle.steps ?? DEFAULT_STEPS;
  const next = status ? steps[status.cycle.index] ?? steps[0] : steps[0];
  const escrow = live ? parseFloat(status?.escrowETH ?? "0") : 0;
  const target = parseFloat(next.thresholdETH);
  const pct = target > 0 ? Math.max(0, Math.min(1, escrow / target)) : 0;
  const t = status?.totals;
  const burned = parseFloat(t?.burnedTokens ?? "0");
  const supply = parseFloat(status?.supply ?? "0");
  const burnedPct = supply > 0 ? (burned / supply) * 100 : 0;
  const paid = parseFloat(t?.fedETH ?? "0") + parseFloat(t?.sparkETH ?? "0");

  // The ten are drawn in a fixed order (by wallet) and placed by rank, so when ranks change the same
  // element only changes its position and shuffles along to its new place.
  const drawn = seats.map((seat, rank) => ({ seat, rank })).sort((a, b) => (a.seat.id < b.seat.id ? -1 : 1));

  /** Ash jumps in his urn, his lid flies up and sparks fly. Pressing him does this; so does a sale. */
  const wake = (n = 36) => {
    const el = wrap.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.querySelector(".ash")!.getBoundingClientRect();
    sparks(r.left + r.width / 2, r.top + r.height * 0.3, n);
    gsap.fromTo(el.querySelector(".ash__skull"), { y: -52 }, { y: 0, duration: 0.9, ease: "elastic.out(1, 0.35)", overwrite: "auto" });
    gsap.fromTo(el.querySelector(".ash__lid"), { y: -40, rotate: 16, svgOrigin: "150 62" }, { y: 0, rotate: 0, duration: 1.1, ease: "bounce.out", overwrite: "auto" });
    gsap.fromTo(el.querySelectorAll(".ash__hand"), { y: -8 }, { y: 0, duration: 0.5, ease: "back.out(3)", overwrite: "auto" });
  };

  // Poking Ash: he jumps and answers back, a different line each time.
  const pokes = useRef(0);
  const [said, setSaid] = useState("");
  const hush = useRef(0);
  const poke = () => {
    wake();
    setSaid(REPLIES[pokes.current++ % REPLIES.length]);
    window.clearTimeout(hush.current);
    hush.current = window.setTimeout(() => alive.current && setSaid(""), 1800);
    if (!prefersReducedMotion()) gsap.fromTo(wrap.current!.querySelector(".poke"), { scale: 1.35 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
  };
  /** The urn rocks when the mouse comes over it, so it is plain that it can be pressed. */
  const nudge = () => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(wrap.current!.querySelector(".ash"), { rotate: -3.5 }, { rotate: 0, transformOrigin: "50% 92%", duration: 0.8, ease: "elastic.out(1, 0.3)", overwrite: "auto" });
  };

  // The arrival animations still running (the room opening, the ten filing in), so they can be finished early.
  const arrival = useRef<gsap.core.Animation[]>([]);

  // The room leans toward the mouse: the altar follows it a little, the board swings, the curtains sway.
  const lean = useRef<((x: number, y: number) => void) | null>(null);
  const onMove = (e: ReactPointerEvent) => {
    if (e.pointerType !== "mouse" || !lean.current) return;
    lean.current(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
  };

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // The arrival is only for someone who is at the top. If the page opens further down (a refresh,
      // a link to a room) or they scroll off before it is over, it is finished at once.
      const settle = () => {
        arrival.current.forEach((a) => a.progress() < 1 && a.progress(1));
      };

      // leaving: the room clears, Ash ducks, and we go down into the mouth of the urn
      gsap
        // Every step names where it starts as well as where it ends, and this scene is set up before the
        // arrival below, while the room is still at rest. So what it returns to when you scroll back up is
        // always the room at rest, never a half-finished arrival.
        .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: wrap.current, start: "top top", end: "bottom bottom", scrub: 0.6, onUpdate: (s) => s.progress > 0.005 && settle() } })
        // the bubble stays while the room clears and only goes when Ash himself ducks
        .fromTo(".poke", { opacity: 1 }, { opacity: 0, duration: 0.05 }, 0.17)
        .fromTo(".drape.is-l", { xPercent: 0 }, { xPercent: -14, duration: 0.3 }, 0)
        .fromTo(".drape.is-r", { xPercent: 0 }, { xPercent: 14, duration: 0.3 }, 0)
        .fromTo(".board", { yPercent: 0 }, { yPercent: -190, duration: 0.3 }, 0)
        .fromTo(".sign.is-l", { xPercent: 0 }, { xPercent: -150, duration: 0.3 }, 0)
        .fromTo(".sign.is-r", { xPercent: 0 }, { xPercent: 150, duration: 0.3 }, 0)
        .fromTo(".row", { yPercent: 0 }, { yPercent: 130, duration: 0.32 }, 0.02)
        .fromTo(".ash__skull", { y: 0 }, { y: 150, duration: 0.18, ease: "power2.in" }, 0.2)
        .fromTo(".altar", { scale: 1 }, { scale: 9, duration: 0.6, ease: "power2.in" }, 0.3)
        .fromTo(".iris", { scale: 0 }, { scale: 1, duration: 0.42, ease: "power2.in" }, 0.52);

      // arriving: the curtains part, the board drops on its cords, Ash pops up, the signs are wheeled in
      const intro = gsap
        .timeline({ delay: 0.2, defaults: { ease: "power3.out" } })
        .from(".drape.is-l", { xPercent: 88, duration: 1.5, ease: "power3.inOut" }, 0)
        .from(".drape.is-r", { xPercent: -88, duration: 1.5, ease: "power3.inOut" }, 0)
        .from(".board", { yPercent: -160, rotate: -9, duration: 1.1, ease: "elastic.out(1, 0.6)" }, 0.7)
        .from(".board .w", { opacity: 0, yPercent: 40, duration: 0.5, stagger: 0.09 }, 1.05)
        .from(".ash__skull", { y: 150, duration: 0.9, ease: "back.out(2.2)" }, 1.1)
        .from(".sign.is-l", { xPercent: -140, rotate: -8, duration: 0.9, ease: "back.out(1.3)" }, 1.1)
        .from(".sign.is-r", { xPercent: 140, rotate: 8, duration: 0.9, ease: "back.out(1.3)" }, 1.2)
        .from(".poke", { scale: 0, duration: 0.6, ease: "back.out(2.4)" }, 2);
      arrival.current.push(intro);
      if (window.scrollY > 10) settle();

      // while he waits, his fingers drum on the rim
      gsap.to(".ash__hand rect", { y: -5, duration: 0.14, ease: "power1.out", yoyo: true, repeat: 1, stagger: { each: 0.09, repeat: -1, repeatDelay: 2.2 }, delay: 2.4 });

      const to = {
        ax: gsap.quickTo(".altar__in", "x", { duration: 0.8, ease: "power3" }),
        ay: gsap.quickTo(".altar__in", "y", { duration: 0.8, ease: "power3" }),
        br: gsap.quickTo(".board__in", "rotate", { duration: 1.2, ease: "power3" }),
        dl: gsap.quickTo(".drape.is-l .drape__in", "skewX", { duration: 1.2, ease: "power3" }),
        dr: gsap.quickTo(".drape.is-r .drape__in", "skewX", { duration: 1.2, ease: "power3" }),
      };
      lean.current = (x, y) => {
        to.ax(x * 22);
        to.ay(y * 14);
        to.br(x * 4);
        to.dl(x * 3);
        to.dr(x * 3);
      };
    },
    { scope: wrap },
  );

  useGSAP(
    () => {
      if (prefersReducedMotion() || !seats.length) return;
      // the ten file in from below, the chief mourner first
      const order = gsap.utils.toArray<HTMLElement>(".seat[data-rank]").sort((a, b) => Number(a.dataset.rank) - Number(b.dataset.rank));
      const filing = gsap.from(order.map((s) => s.firstElementChild), { yPercent: 130, duration: 0.7, ease: "back.out(1.6)", stagger: 0.07, delay: performance.now() < 1800 ? 1.5 : 0.05 });
      arrival.current.push(filing);
      // not for someone who is already further down the page
      if (window.scrollY > 10) filing.progress(1);
    },
    { scope: wrap, dependencies: [seats.length > 0] },
  );

  return (
    <div className="herowrap" ref={wrap}>
      <section className="hero" id="top" aria-label="The parlour" onPointerMove={onMove}>
        <div className="hero__floor" aria-hidden="true" />

        <div className="altar">
          <div className="altar__in">
            <svg className="altar__set" viewBox="0 0 600 760" aria-hidden="true">
              <path d="M130 520 V230 C 130 84, 470 84, 470 230 V520 Z" fill="#ffd35a" stroke="#17121c" strokeWidth="6" strokeLinejoin="round" />
              <path d="M170 520 V240 C 170 130, 430 130, 430 240 V520 Z" fill="#fff3bf" />
              <path d="M300 122 V520 M130 330 H470 M214 150 L300 330 L386 150" fill="none" stroke="#17121c" strokeOpacity="0.3" strokeWidth="5" />
              <rect x="214" y="546" width="172" height="214" fill="#e6dcc8" stroke="#17121c" strokeWidth="5" />
              <path d="M250 546 V760 M300 546 V760 M350 546 V760" stroke="#17121c" strokeOpacity="0.25" strokeWidth="4" />
              <path d="M190 546 H410 L300 646 Z" fill="#8c2433" stroke="#17121c" strokeWidth="5" strokeLinejoin="round" />
              <path d="M212 566 L300 646 L388 566" fill="none" stroke="#e9b53c" strokeWidth="5" strokeLinejoin="round" />
              <rect x="184" y="518" width="232" height="30" rx="6" fill="#fffaf0" stroke="#17121c" strokeWidth="5" />
            </svg>
            <Candle className="is-l" />
            <Candle className="is-r" />
            <AshUrn />
            {/* the whole urn is the button, and the speech bubble says so */}
            <button type="button" className="altar__wake" onClick={poke} onPointerEnter={nudge} aria-label="Poke Ash">
              <span className={`poke ${said ? "is-said" : ""}`} aria-live="polite">
                {said || "Poke me"}
              </span>
            </button>
          </div>
        </div>

        <div className="board">
          <div className="board__in">
            <h1 className="board__h">
              <Words text={empty ? "The front row is empty." : "Rest in ashes."} />
            </h1>
          </div>
        </div>

        <div className="sign is-l">
          <p className="sign__k">Now showing</p>
          <p className="sign__say">
            {offline
              ? "The parlour is closed for a moment."
              : empty
                ? live
                  ? `The first wallet holding ${min} ${TICKER} takes the first seat.`
                  : `Opens at launch. The first wallet holding ${min} ${TICKER} takes the first seat.`
                : `Ash got cremated. He lives in an urn now, he is hosting his own wake, and he pays the ten who stay closest. Every trade burns more ${TICKER} into his urn. Leave early and you are next in the oven.`}
            {DEMO ? <em className="demo"> Demo data.</em> : null}
          </p>
          <div className="sign__acts">
            <BuyButton status={status} />
            <a className="btn is-line" href="#urn">
              Step inside <ArrowDown weight="bold" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="sign is-r">
          <p className="sign__k">Today's service</p>
          <dl>
          <div>
            <dt>In the urn</dt>
            <dd className="num">
              <Count value={burned} format={amount} />
            </dd>
            <dd className="sign__small">
              {TICKER} burned{burnedPct > 0 ? `, ${burnedPct < 0.01 ? "under 0.01" : burnedPct.toFixed(2)}% of all there is` : ""}
            </dd>
          </div>
          <div>
            <dt>Paid to the front row</dt>
            <dd className="num">
              <Count value={paid} format={(n) => eth(String(n))} />
            </dd>
          </div>
          <div role="status">
            <dt>
              Next up: <b>{STEP[next.kind].name}</b>
            </dt>
            <dd>
              <span className="meter" role="meter" aria-valuemin={0} aria-valuemax={target} aria-valuenow={escrow} aria-label={`Fees collected toward the next ${STEP[next.kind].name.toLowerCase()}`}>
                <i style={{ width: `${pct * 100}%` }} />
              </span>
              <span className="num sign__small">
                {escrow.toFixed(4)} / {next.thresholdETH} ETH in fees
              </span>
            </dd>
          </div>
          </dl>
        </div>

        <ol className="row" aria-label="The ten in the front row">
          {drawn.map(({ seat, rank }) => (
            <li key={seat.id} data-rank={rank} className={`seat ${rank === 0 ? "is-one" : ""}`} style={place(rank, narrow)}>
              <button type="button" onClick={() => openTag(seat.addr)} aria-label={`Seat ${rank + 1}, ${seat.name}, holds ${compact(seat.balance)}. Open the card`}>
                <Mourner traits={seat.traits} lit={rank === 0} />
                <span className="seat__tag">
                  <b className="num">{rank + 1}</b>
                  <span>{seat.name}</span>
                  <i className="num">{compact(seat.balance)}</i>
                </span>
              </button>
            </li>
          ))}
          {Array.from({ length: 10 }, (_, i) => i)
            .filter((i) => !seats[i])
            .map((i) => (
              <li key={`open-${i}`} className="seat is-open" style={place(i, narrow)}>
                <span className="seat__chair" />
                <span className="seat__tag">
                  <b className="num">{i + 1}</b>
                  <span>free</span>
                </span>
              </li>
            ))}
          {leaving.map(({ seat, at }) => (
            <li key={`out-${seat.id}`} className="seat is-leaving" style={place(at, narrow)} aria-hidden="true">
              <Mourner traits={seat.traits} spent />
            </li>
          ))}
        </ol>

        <div className="drape is-l" aria-hidden="true">
          <div className="drape__in" />
        </div>
        <div className="drape is-r" aria-hidden="true">
          <div className="drape__in" />
        </div>
        <div className="valance" aria-hidden="true" />
        <div className="iris" aria-hidden="true" />
      </section>
    </div>
  );
}
