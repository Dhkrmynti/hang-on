/** The bar across the top: the name, the rooms, and the way in. */
import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { XLogo } from "@phosphor-icons/react";
import { X_URL, type Status } from "../lib/api";
import { NAME, TICKER } from "../lib/brand";
import { BuyButton, ConnectButton } from "./Bits";
import { Mark } from "./Skull";

/** The rooms of the funeral home, in the order you walk through them: [section id, name]. */
export const ROOMS: [string, string][] = [
  ["urn", "The urn"],
  ["row", "Front row"],
  ["flowers", "Flowers"],
  ["oven", "The oven"],
  ["bill", "The bill"],
  ["card", "Your skull"],
  ["book", "Guest book"],
];

export function Header({ status }: { status: Status | null }) {
  const [on, setOn] = useState("");
  useEffect(() => {
    const st = ROOMS.map(([id]) => ScrollTrigger.create({ trigger: `#${id}`, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && setOn(id) }));
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
      <nav className="nav" aria-label="Rooms">
        {ROOMS.map(([id, label]) => (
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
