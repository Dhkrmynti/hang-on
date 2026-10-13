/**
 * The rooms of the funeral home, in the order you walk through them after the parlour:
 * inside the urn (the burn), the front row (the ten who are paid, walked along sideways), the
 * flower stand (this round's biggest buyer), the oven (the wallets that sold, and the rules), and
 * the till (where every fee goes, printed as a bill).
 */
import { useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { DEFAULT_STEPS, DEFAULT_TIERS, STEP, addrUrl, amount, compact, dateWib, eth, short, splitInheritance, stepShare, txUrl, usd, type Pond, type RoundKind, type RoundRow, type Status } from "../lib/api";
import { nameFor } from "../lib/alias";
import { prefersReducedMotion } from "../lib/motion";
import { TICKER } from "../lib/brand";
import { Who, Words } from "./Bits";
import { Count } from "./Fx";
import { URN_PCT } from "./Hero";
import { Bloom, Mourner, skullOf } from "./Skull";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DEAD = "0x000000000000000000000000000000000000dEaD";
const INK = "#17121c";

/* ───────── inside the urn ───────── */

const GLASS = "M76 30 H184 C 184 54, 236 78, 236 150 C 236 250, 196 330, 176 360 H84 C 64 330, 24 250, 24 150 C 24 78, 76 54, 76 30 Z";

export function Inside({ status, rounds }: { status: Status | null; rounds: RoundRow[] | null }) {
  const root = useRef<HTMLElement>(null);
  const t = status?.totals;
  const burned = parseFloat(t?.burnedTokens ?? "0");
  const supply = parseFloat(status?.supply ?? "0");
  const pct = supply > 0 ? (burned / supply) * 100 : 0;
  const urn = Math.floor(pct / URN_PCT) + 1;
  const fill = (pct % URN_PCT) / URN_PCT;
  const burns = (rounds ?? []).filter((r) => r.kind === "burn" && r.stage === "done").slice(0, 4);
  const size = status?.cycle.steps.find((s) => s.kind === "burn")?.thresholdETH ?? "0.02";

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // the ash drifts up from the floor of the urn as you come down into it, and the glass fills to today's level
      gsap.fromTo(".dunes path", { yPercent: 100 }, { yPercent: 0, ease: "none", stagger: 0.08, scrollTrigger: { trigger: root.current, start: "top 60%", end: "bottom bottom", scrub: 0.6 } });
      gsap.fromTo(".gauge__ash", { scaleY: 0, svgOrigin: "130 364" }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".gauge", start: "top 80%", end: "center 45%", scrub: 0.6 } });
      gsap.from(".inside .h2 .w", { yPercent: 60, opacity: 0, rotate: 6, duration: 0.7, ease: "back.out(1.6)", stagger: 0.06, scrollTrigger: { trigger: ".inside .h2", start: "top 82%" } });
      gsap.from(".strata li", { xPercent: -8, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.09, scrollTrigger: { trigger: ".strata", start: "top 86%" } });
    },
    { scope: root },
  );

  return (
    <section className="scene inside" id="urn" ref={root} aria-labelledby="urn-head">
      <div className="wrap inside__grid">
        <div>
          <p className="kick">Inside the urn</p>
          <h2 className="h2" id="urn-head">
            <Words text="Some get a grave. Ash got an urn." />
          </h2>
          <p className="lead">
            Every time {size} ETH of trading fees has built up for it, the engine buys {TICKER} on the open market and cremates it: what it bought goes to the dead address, and nobody can take it back out. The ash is his. There is less {TICKER} after every burn.
          </p>
          <p className="inside__big">
            <b className="num">
              <Count value={burned} format={amount} />
            </b>
            <span>
              {TICKER} cremated{pct > 0 ? `, ${pct < 0.01 ? "under 0.01" : pct.toFixed(2)}% of all there is,` : ""} bought with {eth(t?.burnETH ?? "0")}
            </span>
          </p>
        </div>
        <figure className="gauge">
          <svg viewBox="0 0 300 400" aria-hidden="true">
            <defs>
              <clipPath id="gauge-glass">
                <path d={GLASS} />
              </clipPath>
            </defs>
            <path d="M92 360 H168 L182 392 H78 Z" fill="#b8451a" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
            <path d={GLASS} fill="#fffaf0" />
            <g clipPath="url(#gauge-glass)">
              <g className="gauge__ash">
                <rect x="0" y={360 - fill * 310} width="260" height={fill * 310 + 4} fill="#8f8477" />
                <path d={`M0 ${360 - fill * 310 + 10} Q 40 ${360 - fill * 310 - 12} 80 ${360 - fill * 310 + 6} T 160 ${360 - fill * 310 + 4} T 260 ${360 - fill * 310 + 8} V${360 - fill * 310 - 14} H0 Z`} fill="#fffaf0" />
                <path d={`M0 ${360 - fill * 310 + 10} Q 40 ${360 - fill * 310 - 12} 80 ${360 - fill * 310 + 6} T 160 ${360 - fill * 310 + 4} T 260 ${360 - fill * 310 + 8}`} fill="none" stroke={INK} strokeWidth="4" />
                {[54, 104, 150, 196].map((x, i) => (
                  <circle key={x} cx={x} cy={360 - fill * 310 + 34 + i * 16} r="4" fill={i % 2 ? "#ffd35a" : "#ff6a1a"} />
                ))}
              </g>
            </g>
            <path d={GLASS} fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
            <rect x="66" y="16" width="128" height="18" rx="7" fill="#b8451a" stroke={INK} strokeWidth="5" />
            {[1, 2, 3, 4, 5].map((k) => (
              <g key={k}>
                <path d={`M244 ${360 - k * 62} H264`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
                <text x="270" y={365 - k * 62} className="gauge__tick">
                  {k}%
                </text>
              </g>
            ))}
          </svg>
          <figcaption>
            <b>
              Urn No. {urn} is {Math.round(fill * 100)}% full.
            </b>{" "}
            Each urn holds {URN_PCT}% of all {TICKER}. When this one is full, Ash starts another.
          </figcaption>
        </figure>
      </div>
      <div className="wrap">
        {burns.length ? (
          <ol className="strata" aria-label="The last burns">
            {burns.map((r) => (
              <li key={r.n}>
                <span className="num">#{r.n}</span>
                <b className="num">
                  {compact(r.burnedTokens ?? "0")} {TICKER}
                </b>
                <span className="num">{parseFloat(r.spentETH).toFixed(4)} ETH</span>
                <span className="num strata__when">{dateWib(r.at)}</span>
                {r.tx ? (
                  <a className="num" href={txUrl(r.tx)} target="_blank" rel="noreferrer">
                    proof <ArrowUpRight weight="bold" aria-hidden="true" />
                  </a>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="quiet">The urn is empty. The first burn follows the first reward.</p>
        )}
      </div>
      <svg className="dunes" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 200 V110 Q 150 40 300 100 T 600 90 T 900 110 T 1200 80 V200 Z" fill="#b9ae9e" />
        <path d="M0 200 V150 Q 200 90 400 140 T 800 130 T 1200 150 V200 Z" fill="#8f8477" />
      </svg>
    </section>
  );
}

/* ───────── the front row ───────── */

export function FrontRow({ status, pond }: { status: Status | null; pond: Pond | null }) {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const live = !!status?.tokenAddress;
  const rows = live ? (pond?.rows ?? []).slice(0, 50) : [];
  const tiers = status?.rules.tiers ?? DEFAULT_TIERS;
  const reward = parseFloat(status?.cycle.steps.find((s) => s.kind === "feeding")?.thresholdETH ?? "0.02");
  const sparkPct = status?.rules.sparkPct ?? 25;
  const spark = live ? pond?.spark ?? null : null;
  // with nobody buying this round nobody brought flowers, and the ten share the whole reward
  const share = splitInheritance(spark ? reward * (1 - sparkPct / 100) : reward, rows.filter((r) => r.inTop).map((r) => parseFloat(r.balance)), tiers);
  const px = status?.price?.tokenUSD ?? 0;
  const worth = (b: string) => (px > 0 ? usd(parseFloat(b) * px) : "");
  const bar = rows.length >= 10 ? parseFloat(rows[9].balance) : 0;
  const ten = Array.from({ length: 10 }, (_, i) => rows[i]);
  const far = rows.slice(10);
  const min = amount(status?.rules.minBalance ?? "100000");

  // The pew is longer than the screen. The section is made as tall as the pew is long, the pew stays
  // put, and scrolling down walks you along it. Without motion it is an ordinary sideways scroller.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const el = wrap.current!;
      const tr = track.current!;
      const far = () => Math.max(0, tr.scrollWidth - window.innerWidth);
      const size = () => (el.style.height = `${window.innerHeight + far()}px`);
      size();
      const walk = gsap.to(tr, { x: () => -far(), ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true, onRefreshInit: size } });
      // each mourner sits up as they come into view
      gsap.utils.toArray<HTMLElement>(".place").forEach((p) => {
        gsap.from(p.querySelector(".mourner"), { yPercent: 55, duration: 0.6, ease: "back.out(2)", scrollTrigger: { trigger: p, containerAnimation: walk, start: "left 88%", toggleActions: "play none none reverse" } });
        gsap.from(p.querySelector(".place__card"), { y: 40, opacity: 0, rotate: -4, duration: 0.5, ease: "back.out(1.6)", scrollTrigger: { trigger: p, containerAnimation: walk, start: "left 80%", toggleActions: "play none none reverse" } });
      });
      return () => {
        el.style.height = "";
      };
    },
    { scope: wrap, dependencies: [rows.length], revertOnUpdate: true },
  );

  return (
    <section className="pewwrap" id="row" ref={wrap} aria-labelledby="row-head">
      <div className="pew">
        <div className="pew__track" ref={track}>
          <div className="pew__intro">
            <p className="kick">The front row</p>
            <h2 className="h2" id="row-head">
              Front row gets paid.
            </h2>
            <p className="lead">
              Ash is hosting his own wake, and he pays people to stay. The ten biggest wallets that never sold get the front row, and every {reward} ETH reward goes straight to them in ETH. Seats 1 to 5 share {tiers[0]?.eth ?? "0.0105"}, seats 6 to 10 share {tiers[1]?.eth ?? "0.0045"}, by size. Hold more than the wallet in a seat and the seat is yours.
            </p>
            <p className="pew__hint num">
              Walk along the pew <ArrowRight weight="bold" aria-hidden="true" />
            </p>
          </div>

          <ol className="pew__seats">
            {ten.map((r, i) => (
              <li key={r?.addr ?? `open-${i}`} className={`place ${r ? "" : "is-open"} ${i === 0 ? "is-one" : ""}`}>
                <div className="place__sit">{r ? <Mourner traits={skullOf(r.addr, r.pp)} lit={i === 0} /> : <span className="place__gap" />}</div>
                <div className="place__bench" aria-hidden="true" />
                <div className="place__card">
                  <span className="place__n">{i + 1}</span>
                  {r ? (
                    <>
                      <Who addr={r.addr} nickname={r.nickname} pp={r.pp} x={r.x} size={0} />
                      <span className="place__bal num">
                        {compact(r.balance)}
                        {worth(r.balance) ? ` · ${worth(r.balance)}` : ""}
                      </span>
                      <span className="place__next num">+{(share[i] ?? 0).toFixed(4)} ETH</span>
                      <span className="place__role">{i === 0 ? "Chief mourner" : "next reward"}</span>
                    </>
                  ) : (
                    <span className="place__open">Free seat. {bar > 0 ? "Hold more than seat 10 to take it." : `Hold ${min} ${TICKER} to take it.`}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="pew__back">
            <h3 className="h3">Standing at the back</h3>
            {far.length ? (
              <ol className="crowd" start={11} aria-label="No. 11 to 50">
                {far.map((r) => {
                  const gap = bar - parseFloat(r.balance);
                  return (
                    <li key={r.addr}>
                      <span className="crowd__n num">{r.rank}</span>
                      <Who addr={r.addr} nickname={r.nickname} pp={r.pp} x={r.x} size={0} />
                      <span className="crowd__gap num">{gap > 0 ? `${compact(gap + 1)} short` : "next in"}</span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="quiet">{live ? "Nobody yet. Anyone past the tenth seat stands here." : "Opens at launch."}</p>
            )}
            {live && (pond?.house || pond?.waiting?.length) ? (
              <div className="asides">
                {pond?.waiting?.length ? (
                  <p>
                    <b>Still at the door</b>
                    {pond.waiting.map((w) => (
                      <Who key={w.addr} addr={w.addr} nickname={w.nickname} pp={w.pp} x={w.x} size={0} />
                    ))}
                  </p>
                ) : null}
                {pond?.house ? (
                  <p>
                    <b>The undertaker</b>
                    <Who addr={pond.house.addr} nickname={pond.house.nickname} pp={pond.house.pp} x={pond.house.x} size={0} />
                    <span>
                      is the dev wallet. It holds <span className="num">{compact(pond.house.balance)}</span>, has no seat and is never paid.
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── the flower stand ───────── */

const PETALS = ["#fffaf0", "#f0a8b8", "#ffd35a", "#fffaf0", "#ff8a4a", "#f0a8b8", "#fffaf0"];

export function Flowers({ status, pond }: { status: Status | null; pond: Pond | null }) {
  const root = useRef<HTMLElement>(null);
  const live = !!status?.tokenAddress;
  const reward = parseFloat(status?.cycle.steps.find((s) => s.kind === "feeding")?.thresholdETH ?? "0.02");
  const sparkPct = status?.rules.sparkPct ?? 25;
  const sparkETH = status?.rules.sparkETH ?? String((reward * sparkPct) / 100);
  const spark = live ? pond?.spark ?? null : null;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // the wreath blooms flower by flower as you come to it, and turns slowly while it is on screen
      gsap.fromTo(".bloom", { scale: 0, rotate: -90, svgOrigin: "0 0" }, { scale: 1, rotate: 0, ease: "back.out(2)", stagger: 0.06, scrollTrigger: { trigger: ".wreath", start: "top 82%", end: "center 50%", scrub: 0.8 } });
      gsap.to(".wreath__ring", { rotate: 40, svgOrigin: "220 220", ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.8 } });
      gsap.from(".sash", { scaleX: 0, duration: 0.8, ease: "elastic.out(1, 0.6)", scrollTrigger: { trigger: ".wreath", start: "center 70%" } });
      gsap.from(".flowers .h2 .w", { yPercent: 60, opacity: 0, rotate: -6, duration: 0.7, ease: "back.out(1.6)", stagger: 0.07, scrollTrigger: { trigger: ".flowers .h2", start: "top 82%" } });
    },
    { scope: root },
  );

  if (!(sparkPct > 0)) return null;
  return (
    <section className="scene flowers" id="flowers" ref={root} aria-labelledby="flowers-head">
      <div className="wrap flowers__grid">
        <div>
          <p className="kick">The flower stand</p>
          <h2 className="h2" id="flowers-head">
            <Words text="Biggest flowers win." />
          </h2>
          <p className="lead">
            Between two rewards, the wallet that buys the most {TICKER} brought the biggest flowers. It takes {sparkETH} ETH off the top of the next reward, whatever its seat and however small it is. Then the count starts again from zero. Flowers passed over from another wallet do not count: only a buy does.
          </p>
        </div>
        <div className={`wreath ${spark ? "" : "is-bare"}`}>
          <svg viewBox="0 0 440 440" aria-hidden="true">
            <g className="wreath__ring">
              <circle cx="220" cy="220" r="150" fill="none" stroke="#2c4a34" strokeWidth="46" />
              <circle cx="220" cy="220" r="150" fill="none" stroke={INK} strokeWidth="3" strokeDasharray="3 11" strokeLinecap="round" />
              {spark
                ? Array.from({ length: 14 }, (_, i) => {
                    const a = (i / 14) * Math.PI * 2;
                    return <Bloom key={i} x={220 + Math.cos(a) * 150} y={220 + Math.sin(a) * 150} r={i * 31} s={i % 3 === 0 ? 1.25 : 0.95} color={PETALS[i % PETALS.length]} />;
                  })
                : null}
            </g>
          </svg>
          <div className="sash">
            <p className="sash__k">Biggest flowers, this round</p>
            {spark ? (
              <>
                <Who addr={spark.addr} nickname={spark.nickname} pp={spark.pp} x={spark.x} size={0} />
                <p className="sash__amt">
                  <b className="num">{compact(spark.bought)}</b> {TICKER} bought · <b className="num">+{sparkETH} ETH</b> if nobody buys more
                </p>
              </>
            ) : (
              <p className="sash__amt">{live ? "Nobody has brought flowers since the last reward. The next buy takes it. Until then the front row shares the whole reward." : "Opens at launch."}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── the oven ───────── */

export function Oven({ status, pond }: { status: Status | null; pond: Pond | null }) {
  const root = useRef<HTMLElement>(null);
  const live = !!status?.tokenAddress;
  const min = amount(status?.rules.minBalance ?? "100000");
  const out = live ? status!.counts.hopped : 0;
  const gone = live ? pond?.out ?? [] : [];

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // the order of service opens out, one fold at a time, as you reach it
      const mm = gsap.matchMedia();
      mm.add("(min-width: 901px)", () => {
        gsap
          .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: ".program", start: "top 85%", end: "top 30%", scrub: 0.6 } })
          .from(".fold.is-l", { rotateY: 105, transformOrigin: "100% 50%" }, 0)
          .from(".fold.is-r", { rotateY: -105, transformOrigin: "0% 50%" }, 0.15);
      });
      mm.add("(max-width: 900px)", () => {
        gsap.from(".fold", { y: 40, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: ".program", start: "top 84%" } });
      });
      // the belt runs faster the faster you scroll
      const belt = gsap.to(".belt__run", { xPercent: 50, ease: "none", duration: 16, repeat: -1 });
      ScrollTrigger.create({ trigger: root.current, start: "top bottom", end: "bottom top", onUpdate: (s) => gsap.to(belt, { timeScale: 1 + Math.min(6, Math.abs(s.getVelocity()) / 400), duration: 0.3, overwrite: true }) });
      gsap.from(".oven__count", { scale: 0.6, opacity: 0, transformOrigin: "0% 100%", duration: 0.8, ease: "back.out(1.6)", scrollTrigger: { trigger: ".oven__count", start: "top 86%" } });
    },
    { scope: root },
  );

  return (
    <section className="scene oven" id="oven" ref={root} aria-labelledby="oven-head">
      <div className="belt" aria-hidden="true">
        {/* two copies of the same run, so the loop has no seam */}
        <div className="belt__run">
          {[0, 1].map((k) => (
            <div className="belt__half" key={k}>
              {[3, 0, 4, 1, 2, 0].map((b, i) => (
                <Mourner key={i} traits={[b, 0, 3, 0]} spent />
              ))}
            </div>
          ))}
        </div>
        <svg className="belt__mouth" viewBox="0 0 220 240">
          <path d="M10 240 V110 C 10 30, 210 30, 210 110 V240 Z" fill="#3a2b2e" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
          <path d="M40 240 V120 C 40 66, 180 66, 180 120 V240 Z" fill={INK} />
          <g className="lit">
            <path d="M52 240 C 40 190, 76 180, 70 130 C 92 160, 100 150, 110 100 C 124 150, 132 160, 150 132 C 146 182, 182 190, 168 240 Z" fill="#ff6a1a" />
            <path d="M82 240 C 76 206, 98 198, 100 166 C 112 190, 120 190, 126 170 C 132 200, 146 208, 140 240 Z" fill="#ffd35a" />
          </g>
          <path d="M20 96 H200" stroke="#e9b53c" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>
      <div className="wrap">
        <p className="kick">The oven</p>
        <h2 className="h2" id="oven-head">
          Leave early, get cremated.
        </h2>
        <p className="oven__count">
          <b className="num">
            <Count value={out} format={(n) => String(Math.round(n))} />
          </b>
          <span>wallets left early. Ash had them cremated. None is ever paid again.</span>
        </p>
        <ol className="program">
          <li className="fold is-l">
            <span className="fold__n">I</span>
            <b>Sell once, out for good.</b>
            <span>A wallet that sells any {TICKER} loses its place and every future reward. Buying back does not undo it.</span>
          </li>
          <li className="fold">
            <span className="fold__n">II</span>
            <b>Hold {min} to count.</b>
            <span>Smaller wallets are welcome at the wake but are not ranked, seated or paid.</span>
          </li>
          <li className="fold is-r">
            <span className="fold__n">III</span>
            <b>Moving is not selling.</b>
            <span>Sending {TICKER} between your own wallets is fine. Sending it to the curve, a pool or any contract is a sale.</span>
          </li>
        </ol>
        {gone.length ? (
          <p className="oven__gone">
            <b>Cremated lately</b>
            {gone.map((w) => (
              <s key={w.addr}>{nameFor(w.addr, w.nickname, w.x).name}</s>
            ))}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ───────── the till ───────── */

export function Bill({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const steps = status?.cycle.steps ?? DEFAULT_STEPS;
  const tiers = status?.rules.tiers ?? DEFAULT_TIERS;
  const sparkETH = status?.rules.sparkETH ?? "0.005";
  const live = !!status?.tokenAddress;
  const at = live ? status!.cycle.index : -1;
  const escrow = parseFloat(status?.escrowETH ?? "0");
  const treasury = live ? status?.treasuryAddress : "";
  const does = (kind: RoundKind) =>
    kind === "feeding"
      ? `ETH straight to holders: ${sparkETH} for the biggest flowers, then ${tiers[0]?.eth ?? "0.0105"} across seats 1 to 5 and ${tiers[1]?.eth ?? "0.0045"} across seats 6 to 10.`
      : kind === "burn"
        ? `Buys ${TICKER} and cremates it: it goes to the dead address.`
        : "ETH to the treasury wallet.";

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // the bill comes out of the till as you scroll, then it is stamped
      gsap.fromTo(".receipt", { clipPath: "inset(0 0 100% 0)", yPercent: -6 }, { clipPath: "inset(0 0 0% 0)", yPercent: 0, ease: "none", scrollTrigger: { trigger: ".till", start: "top 78%", end: "bottom 78%", scrub: 0.6 } });
      gsap.fromTo(".stamp", { scale: 3, opacity: 0, rotate: 30 }, { scale: 1, opacity: 1, rotate: -11, duration: 0.35, ease: "power4.in", scrollTrigger: { trigger: ".receipt", start: "bottom 80%", toggleActions: "play none none reverse" } });
      gsap.from(".bill .h2 .w", { yPercent: 60, opacity: 0, rotate: 6, duration: 0.7, ease: "back.out(1.6)", stagger: 0.07, scrollTrigger: { trigger: ".bill .h2", start: "top 82%" } });
    },
    { scope: root },
  );

  return (
    <section className="scene bill" id="bill" ref={root} aria-labelledby="bill-head">
      <div className="wrap bill__grid">
        <div>
          <p className="kick">The till</p>
          <h2 className="h2" id="bill-head">
            <Words text="Who pays for the funeral." />
          </h2>
          <p className="lead">Each trade's creator fee collects in the Pons fee escrow. When it reaches the size of the next step, the engine claims it and spends all of it on that step. Then the next, then round again.</p>
          <p className="plain">
            The burn is the only time the engine buys {TICKER}, and it never sells. Burned tokens sit at{" "}
            <a href={addrUrl(DEAD)} target="_blank" rel="noreferrer" className="num">
              {short(DEAD)} <ArrowUpRight weight="bold" aria-hidden="true" />
            </a>
            {treasury ? (
              <>
                . Treasury wallet:{" "}
                <a href={addrUrl(treasury)} target="_blank" rel="noreferrer" className="num">
                  {short(treasury)} <ArrowUpRight weight="bold" aria-hidden="true" />
                </a>
              </>
            ) : (
              "."
            )}
          </p>
        </div>
        <div className="till">
          <div className="till__slot" aria-hidden="true" />
          <div className="receipt">
            <p className="receipt__top">Ash's funeral home</p>
            <p className="receipt__sub num">every fee, itemised</p>
            <ol className="receipt__lines">
              {steps.map((s, i) => {
                const now = at === i;
                const level = parseFloat(s.thresholdETH);
                return (
                  <li key={i} className={`item is-${s.kind} ${now ? "is-now" : ""}`} style={{ "--fill": now ? Math.min(1, escrow / level) : 0 } as CSSProperties} aria-current={now ? "step" : undefined}>
                    <p className="item__head">
                      <b>{STEP[s.kind].name}</b>
                      <span className="item__dots" aria-hidden="true" />
                      <b className="num">
                        <Count value={stepShare(steps, s.kind)} format={(n) => `${Math.round(n)}%`} />
                      </b>
                    </p>
                    <p className="item__does">{does(s.kind)}</p>
                    <p className="item__state num">
                      {level} ETH a turn · {now ? `filling now: ${escrow.toFixed(4)} / ${level}` : live ? "waiting its turn" : "starts at launch"}
                    </p>
                    {now ? (
                      <span className="item__bar">
                        <i />
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <p className="receipt__end num">thank you for staying</p>
            <span className="stamp" aria-hidden="true">
              No refunds
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
