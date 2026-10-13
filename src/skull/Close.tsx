/** The guest book (every step the engine ran, newest first, each with the transaction that proves it), and the way out, where the curtains close again. */
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, XLogo } from "@phosphor-icons/react";
import { DEMO, STEP, X_URL, compact, dateWib, dexUrl, eth, txUrl, type RoundRow, type Status } from "../lib/api";
import { prefersReducedMotion } from "../lib/motion";
import { CHAIN, NAME, TICKER } from "../lib/brand";
import { BuyButton, CaCopy, Words, useMedia } from "./Bits";
import { Count } from "./Fx";
import { AshUrn, Mark } from "./Skull";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function GuestBook({ status, rounds }: { status: Status | null; rounds: RoundRow[] | null }) {
  const root = useRef<HTMLElement>(null);
  const narrow = useMedia("(max-width: 760px)");
  const [more, setMore] = useState(false);
  const all = (rounds ?? []).filter((r) => r.stage !== "failed" && STEP[r.kind]).slice(0, 12);
  const shown = more ? all : all.slice(0, narrow ? 4 : 7);
  const t = status?.totals;
  const sum = (v?: string) => <Count value={parseFloat(v ?? "0")} format={(n) => eth(String(n))} />;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // the book falls open, then each line is written in from the left
      gsap.from(".book__page.is-l", { rotateY: 80, transformOrigin: "100% 50%", duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".book", start: "top 80%" } });
      gsap.from(".book__page.is-r", { rotateY: -80, transformOrigin: "0% 50%", duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".book", start: "top 80%" } });
      gsap.from(".entry", { clipPath: "inset(0 100% 0 0)", duration: 0.7, ease: "power2.out", stagger: 0.09, delay: 0.5, scrollTrigger: { trigger: ".book", start: "top 76%" } });
      gsap.from(".sums div", { y: 24, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.08, delay: 0.5, scrollTrigger: { trigger: ".book", start: "top 76%" } });
    },
    { scope: root, dependencies: [shown.length > 0] },
  );

  return (
    <section className="scene guest" id="book" ref={root} aria-labelledby="book-head">
      <div className="wrap">
        <div className="book">
          <div className="book__page is-l">
            <p className="kick">The guest book</p>
            <h2 className="h2" id="book-head">
              It is all in the guest book.
            </h2>
            <p className="lead">Every reward, burn and treasury transfer is a transaction anyone can open.</p>
            <dl className="sums">
              <div>
                <dt>Paid to the front row</dt>
                <dd className="num">{sum(t?.fedETH)}</dd>
              </div>
              <div>
                <dt>Paid for flowers</dt>
                <dd className="num">{sum(t?.sparkETH)}</dd>
              </div>
              <div>
                <dt>Spent on burns</dt>
                <dd className="num">{sum(t?.burnETH)}</dd>
              </div>
              <div>
                <dt>To the treasury</dt>
                <dd className="num">{sum(t?.keeperETH)}</dd>
              </div>
            </dl>
          </div>
          <div className="book__page is-r">
            {shown.length ? (
              <ol className="entries">
                {shown.map((r) => {
                  const done = r.stage === "done";
                  const flowers = parseFloat(r.sparkETH ?? "0") > 0;
                  const what =
                    r.kind === "feeding"
                      ? `to ${r.recipients || 10} seats${flowers ? " and the biggest flowers" : ""}`
                      : r.kind === "burn"
                        ? done
                          ? `${compact(r.burnedTokens ?? "0")} ${TICKER} cremated`
                          : "buying to burn"
                        : "to the treasury wallet";
                  const value = r.kind === "feeding" && done ? r.fedETH : r.spentETH;
                  const tx = r.kind === "feeding" ? r.claimTx : r.tx;
                  return (
                    <li key={r.n} className={`entry is-${r.kind}`}>
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
              <p className="quiet">Nobody has signed yet. The first reward runs when the creator fees reach {status?.cycle.steps[0].thresholdETH ?? "0.02"} ETH.</p>
            )}
            {all.length > shown.length ? (
              <button type="button" className="btn is-line book__more" onClick={() => setMore(true)}>
                Turn the page: {all.length - shown.length} earlier
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Foot({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const narrow = useMedia("(max-width: 760px)");
  const ca = DEMO ? "" : status?.tokenAddress;
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // the curtains draw in again as the page ends, and Ash looks out one last time
      gsap
        .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root.current, start: "top 90%", end: "bottom bottom", scrub: 0.6 } })
        .from(".foot__drape.is-l", { xPercent: -70 }, 0)
        .from(".foot__drape.is-r", { xPercent: 70 }, 0)
        .from(".foot .ash__skull", { y: 150 }, 0.4);
      gsap.from(".foot__h .w", { yPercent: 70, opacity: 0, rotate: -5, duration: 0.7, ease: "back.out(1.6)", stagger: 0.1, scrollTrigger: { trigger: ".foot__h", start: "top 88%" } });
    },
    { scope: root },
  );
  return (
    <footer className="foot" ref={root} aria-label="Closing">
      <div className="foot__drape is-l" aria-hidden="true" />
      <div className="foot__drape is-r" aria-hidden="true" />
      <div className="wrap foot__in">
        <AshUrn className="foot__ash" />
        <p className="foot__h">
          <Words text="Rest in ashes." />
        </p>
        <div className="foot__acts">
          <BuyButton status={status} />
          <CaCopy status={status} compact={narrow} />
        </div>
        <nav className="foot__links" aria-label="Elsewhere">
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
          <a href="/terms.html">Terms</a>
          <a href="/privacy.html">Privacy</a>
        </nav>
        <p className="foot__sig">
          <Mark size={22} /> {NAME} · {TICKER} · {CHAIN}
        </p>
      </div>
    </footer>
  );
}
