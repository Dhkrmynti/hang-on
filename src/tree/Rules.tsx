/**
 * The rules, as four field notes, and the count of wallets that let go so far.
 * Each note is underlined by hand as it comes into view.
 */
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { amount, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { TICKER } from "../lib/brand";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Rules({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const min = amount(status?.rules.minBalance ?? "100000");
  const out = status?.tokenAddress ? status.counts.hopped : 0;
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>(".note").forEach((el) =>
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 84%" } })
          .from(el, { y: 24, opacity: 0, duration: 0.5, ease: "power2.out" })
          .from(el.querySelector(".note__rule path"), { strokeDashoffset: 1, duration: 0.7, ease: "power2.inOut" }, "-=0.2"),
      );
    },
    { scope: root },
  );
  // one pen stroke under each note, a little different every time
  const stroke = (d: string) => (
    <svg className="note__rule" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} pathLength={1} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
  return (
    <section className="sec rules" id="rules" ref={root} aria-labelledby="rules-head">
      <div className="wrap">
        <div className="sec__head">
          <p className="fig">Field notes</p>
          <h2 className="h2" id="rules-head">
            Four things about this tree
          </h2>
        </div>
        <ol className="notes4">
          <li className="note">
            <b>
              Hold {min} {TICKER}
            </b>
            {stroke("M2 8 C 60 2, 120 12, 180 6 S 270 9, 298 5")}
            <span>to get a grip on the tree at all.</span>
          </li>
          <li className="note">
            <b>The biggest holder</b>
            {stroke("M2 6 C 70 11, 140 3, 200 8 S 280 5, 298 9")}
            <span>sleeps in the hammock.</span>
          </li>
          <li className="note">
            <b>The ten on the branches</b>
            {stroke("M2 9 C 50 4, 130 10, 190 5 S 260 10, 298 6")}
            <span>share every reward, in ETH.</span>
          </li>
          <li className="note is-red">
            <b>Never let go</b>
            {stroke("M2 7 C 80 2, 150 12, 210 6 S 275 4, 298 8")}
            <span>Sell once and you are on the ground. For good.</span>
          </li>
        </ol>
        <p className="rules__out">
          <b className="num">{out}</b> let go so far. Moving between your own wallets is not a sale.
        </p>
      </div>
    </section>
  );
}
