/** The forest floor, where nobody wants to be: one line, the buy, the address, and one sloth still holding on. */
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, XLogo } from "@phosphor-icons/react";
import { DEMO, X_URL, dexUrl, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { CHAIN, NAME, TICKER } from "../lib/brand";
import { BuyButton, CaCopy, useMedia } from "./Bits";
import { Hanger, Mark } from "./Sloth";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Floor({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const narrow = useMedia("(max-width: 760px)");
  const ca = DEMO ? "" : status?.tokenAddress;
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // the vine pays out as the page ends, lowering the last sloth into view; the line is said a word at a time
      gsap.from(".floor__vine", { yPercent: -70, ease: "none", scrollTrigger: { trigger: root.current, start: "top 90%", end: "bottom bottom", scrub: 0.6 } });
      gsap.from(".floor__h span", { yPercent: 70, opacity: 0, duration: 0.6, ease: "back.out(1.5)", stagger: 0.1, scrollTrigger: { trigger: ".floor__h", start: "top 86%" } });
    },
    { scope: root },
  );
  return (
    <footer className="sec floor" id="closing" ref={root} aria-label="Closing">
      <div className="floor__vine" aria-hidden="true">
        <Hanger traits={[1, 4, 0, 0]} />
      </div>
      <div className="wrap">
        <p className="floor__h">
          <span>Hang</span> <span>on.</span>
        </p>
        <div className="floor__acts">
          <BuyButton status={status} />
          <CaCopy status={status} compact={narrow} />
        </div>
        <nav className="floor__links" aria-label="Elsewhere">
          {X_URL ? (
            <a href={X_URL} target="_blank" rel="noreferrer">
              <XLogo weight="bold" aria-hidden="true" /> {NAME} on X <ArrowUpRight weight="bold" aria-hidden="true" />
            </a>
          ) : null}
          {ca ? (
            <a href={dexUrl(ca)} target="_blank" rel="noreferrer">
              Chart <ArrowUpRight weight="bold" aria-hidden="true" />
            </a>
          ) : null}
          <a href="#rules">Field notes</a>
          <a href="#rings">The rings</a>
        </nav>
        <p className="floor__sig">
          <Mark size={22} /> {NAME} · {TICKER} · {CHAIN}
        </p>
      </div>
    </footer>
  );
}
