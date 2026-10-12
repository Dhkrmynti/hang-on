/** The bar across the top: the name, the five parts of the tree and the way in. On wide screens a sloth on a vine keeps your place down the page. */
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { XLogo } from "@phosphor-icons/react";
import { X_URL, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { NAME, TICKER } from "../lib/brand";
import { BuyButton, ConnectButton } from "./Bits";
import { Mark, SlothHead } from "./Sloth";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export const NAV: [string, string][] = [
  ["branches", "The branches"],
  ["trunk", "The loop"],
  ["rules", "Field notes"],
  ["card", "Your sloth"],
  ["rings", "The rings"],
];

export function Header({ status }: { status: Status | null }) {
  const [on, setOn] = useState("");
  useEffect(() => {
    const st = NAV.map(([id]) => ScrollTrigger.create({ trigger: `#${id}`, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && setOn(id) }));
    const top = ScrollTrigger.create({ trigger: "#top", start: "top top", end: "bottom 55%", onToggle: (s) => s.isActive && setOn("") });
    return () => [...st, top].forEach((s) => s.kill());
  }, []);
  return (
    <header className="head">
      <a className="head__brand" href="#top" aria-label={`${NAME}, back to the top`}>
        <Mark size={34} />
        <span className="head__word">{NAME}</span>
        <span className="head__tick num">{TICKER}</span>
      </a>
      <nav className="nav" aria-label="Sections">
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`} className={on === id ? "is-on" : ""} aria-current={on === id ? "location" : undefined}>
            {label}
          </a>
        ))}
      </nav>
      <div className="head__acts">
        {X_URL ? (
          <a className="head__x" href={X_URL} target="_blank" rel="noreferrer noopener" aria-label={`${NAME} on X`} title={`${NAME} on X`}>
            <XLogo weight="bold" aria-hidden="true" />
          </a>
        ) : null}
        <ConnectButton />
        <BuyButton status={status} className="is-small" />
      </div>
    </header>
  );
}

/** A sloth sliding down a vine at the left edge: how far down the tree you are. Decoration, wide screens only. */
export function Vine() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const el = root.current!;
      gsap.to(".vine__sloth", { y: () => el.clientHeight - 44, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.4, invalidateOnRefresh: true } });
    },
    { scope: root },
  );
  return (
    <div className="vine" ref={root} aria-hidden="true">
      <svg className="vine__sloth" viewBox="0 0 100 100">
        <SlothHead traits={[0, 0, 0, 0]} />
      </svg>
    </div>
  );
}
