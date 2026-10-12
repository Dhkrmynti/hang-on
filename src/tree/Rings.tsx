/**
 * The rings: every step the engine ran, newest first, each with the transaction that proves it.
 * Drawn on the cut face of the trunk: the growth rings are inked in as you scroll.
 */
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { STEP, dateWib, demoRounds, eth, txUrl, usePoll, type RoundRow, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { useMedia } from "./Bits";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Nine rings, none quite round: [rx, ry, tilt]. */
const RINGS: [number, number, number][] = [
  [14, 12, 0],
  [34, 30, 8],
  [56, 51, -6],
  [79, 73, 4],
  [103, 96, -3],
  [128, 120, 6],
  [154, 145, -5],
  [181, 171, 3],
  [209, 198, -2],
];

export function Rings({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const live = !!status?.tokenAddress;
  const { data: rounds } = usePoll<RoundRow[]>(live ? "/api/rounds" : null, 30000, demoRounds);
  const narrow = useMedia("(max-width: 760px)");
  const [more, setMore] = useState(false);
  const all = (rounds ?? []).filter((r) => r.stage !== "failed" && STEP[r.kind]).slice(0, 12);
  const shown = more ? all : all.slice(0, narrow ? 4 : 6);
  const t = status?.totals;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // one ring after another, from the heart outward, as the section is read
      gsap.fromTo(".stump ellipse", { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", stagger: 0.12, scrollTrigger: { trigger: root.current, start: "top 70%", end: "center 40%", scrub: 0.6 } });
      gsap.to(".stump", { rotate: 24, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    },
    { scope: root },
  );

  return (
    <section className="sec rings" id="rings" ref={root} aria-labelledby="rings-head">
      <svg className="stump" viewBox="-220 -220 440 440" aria-hidden="true">
        {RINGS.map(([rx, ry, tilt], i) => (
          <ellipse key={i} rx={rx} ry={ry} transform={`rotate(${tilt})`} pathLength={1} fill="none" />
        ))}
        <path d="M0 0 L150 -128" fill="none" />
      </svg>
      <div className="wrap">
        <div className="sec__head">
          <p className="fig">Fig. 3</p>
          <h2 className="h2" id="rings-head">
            The rings
          </h2>
        </div>
        <p className="totals">
          <span>
            <b className="num">{eth(t?.fedETH ?? "0")}</b> paid to the ten on the branches
          </span>
          <span>
            <b className="num">{eth(t?.keeperETH ?? "0")}</b> to the treasury
          </span>
        </p>
        {shown.length ? (
          <ol className="entries">
            {shown.map((r) => {
              const done = r.stage === "done";
              const what = r.kind === "feeding" ? `paid to ${r.recipients || 10} holders` : "to the treasury wallet";
              const value = r.kind === "feeding" && done ? r.fedETH : r.spentETH;
              const tx = r.kind === "feeding" ? r.claimTx : r.treasuryTx;
              return (
                <li key={r.n} className={`entry is-${r.kind} ${done ? "" : "is-open"}`}>
                  <span className="entry__n num">#{r.n}</span>
                  <span className="entry__what">
                    <b>{STEP[r.kind].name}</b> {what}
                  </span>
                  <span className="entry__eth num">{parseFloat(value).toFixed(4)} ETH</span>
                  <span className="entry__when num">{dateWib(r.at)}</span>
                  {done && tx ? (
                    <a className="entry__tx num" href={txUrl(tx)} target="_blank" rel="noreferrer">
                      {tx.slice(0, 8)}… <ArrowUpRight weight="bold" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="entry__tx is-pending num">pending</span>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="rings__empty">No rings yet. The first reward runs when the creator fees reach {status?.cycle.steps[0].thresholdETH ?? "0.02"} ETH.</p>
        )}
        {all.length > shown.length ? (
          <button type="button" className="btn is-line rings__more" onClick={() => setMore(true)}>
            Show {all.length - shown.length} earlier
          </button>
        ) : null}
      </div>
    </section>
  );
}
