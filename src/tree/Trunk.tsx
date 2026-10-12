/**
 * The trunk: the loop the engine runs, drawn as a figure. Trading fees run down the channel in
 * the middle; at the first level the ten on the branches are paid, at the next the treasury is,
 * then round again. No buyback, no burn: the engine never buys or destroys the token.
 * The channel fills as you scroll; the step being filled now is marked.
 */
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { DEFAULT_STEPS, DEFAULT_TIERS, STEP, addrUrl, short, stepShare, type RoundKind, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { TICKER } from "../lib/brand";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const P = "#f1ecdc";
const pen = { stroke: P, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Plate({ kind }: { kind: RoundKind }) {
  if (kind === "feeding")
    return (
      <svg className="feed__plate" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M60 16 V30" fill="none" {...pen} />
        <path d="M60 22 C 74 8, 94 12, 96 24 C 84 32, 70 30, 60 22 Z" fill="#5d9a52" {...pen} />
        <path d="M60 30 C 92 30, 102 62, 90 86 C 80 106, 52 110, 38 92 C 22 72, 30 32, 60 30 Z" fill="#f29a2e" {...pen} />
        <path d="M46 52 C 42 62, 42 72, 46 80" fill="none" stroke={P} strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg className="feed__plate" viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="62" rx="46" ry="50" fill="#7a5a3c" {...pen} />
      <ellipse cx="60" cy="64" rx="26" ry="30" fill="#1c1712" {...pen} />
      <path d="M22 40 C 30 24, 46 14, 60 12 M98 84 C 90 100, 76 110, 62 112" fill="none" stroke={P} strokeOpacity="0.5" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M60 60 l11 -14 l11 14 l-11 14 Z" transform="translate(-11 14)" fill="#f29a2e" {...pen} strokeWidth={2.4} />
    </svg>
  );
}

export function Trunk({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const steps = status?.cycle.steps ?? DEFAULT_STEPS;
  const tiers = status?.rules.tiers ?? DEFAULT_TIERS;
  const live = !!status?.tokenAddress;
  const at = live ? status!.cycle.index : -1;
  const escrow = parseFloat(status?.escrowETH ?? "0");
  const treasury = live ? status?.treasuryAddress : "";

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // the fees run down the channel as you read; each step is lettered in when the flow reaches it
      gsap.fromTo(".sap__channel i", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".sap", start: "top 78%", end: "bottom 62%", scrub: 0.5 } });
      gsap.utils.toArray<HTMLElement>(".feed").forEach((el, i) =>
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 76%" } })
          .from(el.querySelector(".feed__node"), { scale: 0, duration: 0.4, ease: "back.out(2.4)" })
          .from(el.querySelectorAll(".feed__body > *"), { x: i % 2 ? -26 : 26, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.07 }, "-=0.15"),
      );
    },
    { scope: root },
  );

  const line = (kind: RoundKind) =>
    kind === "feeding"
      ? `ETH straight to the ten on the branches. No. 1-5 split ${tiers[0]?.eth ?? "0.014"}, No. 6-10 split ${tiers[1]?.eth ?? "0.006"}, by balance on each branch.`
      : "ETH to the treasury wallet. Every transfer is in the rings below.";

  return (
    <section className="sec trunksec" id="trunk" ref={root} aria-labelledby="trunk-head">
      <div className="wrap">
        <div className="sec__head">
          <p className="fig">Fig. 2</p>
          <h2 className="h2" id="trunk-head">
            Every trade feeds the tree.
          </h2>
          <p className="deck">Each trade's creator fee builds up in the Pons fee escrow. When it reaches the next step's level, the engine collects it and runs that step. Then the other one, then round again.</p>
        </div>
        <div className="sap">
          <div className="sap__channel" aria-hidden="true">
            <i />
          </div>
          <ol className="sap__steps">
            {steps.map((s, i) => {
              const now = at === i;
              const level = parseFloat(s.thresholdETH);
              const fill = now ? Math.min(1, escrow / level) : 0;
              return (
                <li key={i} className={`feed is-${s.kind} ${now ? "is-now" : ""}`} aria-current={now ? "step" : undefined}>
                  <span className="feed__node" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="feed__body">
                    <Plate kind={s.kind} />
                    <h3 className="feed__name">{STEP[s.kind].name}</h3>
                    <p className="feed__eth num">{level} ETH</p>
                    <p className="feed__line">{line(s.kind)}</p>
                    {now ? (
                      <p className="feed__meter" role="img" aria-label={`${escrow.toFixed(4)} of ${level} ETH collected`}>
                        <span className="feed__bar">
                          <i style={{ width: `${fill * 100}%` }} />
                        </span>
                        <span className="num">
                          Filling now: {escrow.toFixed(4)} / {level} ETH
                        </span>
                      </p>
                    ) : (
                      <p className="feed__wait num">{live ? "Waiting its turn." : "Starts at launch."}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="sum">
          Over one full loop: <b className="num">{stepShare(steps, "feeding")}%</b> to the ten on the branches, <b className="num">{stepShare(steps, "keeper")}%</b> to the treasury.
        </p>
        <p className="plain">
          No buyback and no burn: the engine never buys, sells or destroys {TICKER}.
          {treasury ? (
            <>
              {" "}
              Treasury wallet:{" "}
              <a href={addrUrl(treasury)} target="_blank" rel="noreferrer" className="num">
                {short(treasury)} <ArrowUpRight weight="bold" aria-hidden="true" />
              </a>
            </>
          ) : null}
        </p>
      </div>
    </section>
  );
}
