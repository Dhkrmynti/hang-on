/**
 * The branches: the same ten wallets that hang in the canopy above, written up as a field
 * register. No. 1 has the hammock; No. 1-5 are the top branch and No. 6-10 the lower branch (the
 * two reward tiers); 11-50 are climbing the trunk, with the gap to a branch. When ranks move,
 * entries glide to their new lines.
 */
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DEFAULT_TIERS, compact, splitInheritance, usd, type Pond, type PondRow, type Status } from "../lib/api";
import { nameFor } from "../lib/alias";
import { prefersReducedMotion } from "../lib/motion";
import { TICKER } from "../lib/brand";
import { Face, XCheck, XLink } from "./Bits";
import { openTag } from "./Card";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function Who({ addr, nickname, pp, x, size = 28 }: { addr: string; nickname?: string; pp?: number[] | null; x?: PondRow["x"]; size?: number }) {
  const who = nameFor(addr, nickname, x ?? null);
  return (
    <span className="who">
      {size > 0 ? <Face addr={addr} pp={pp ?? null} x={x ?? null} size={size} className="who__face" /> : null}
      {x ? <XLink x={x} className="who__x" /> : null}
      <button type="button" className="who__name" onClick={() => openTag(addr)} aria-label={`Open the card of ${who.name}`}>
        {who.name}
      </button>
      {x ? <XCheck x={x} /> : null}
    </span>
  );
}

export function Register({ status, pond }: { status: Status | null; pond: Pond | null }) {
  const root = useRef<HTMLElement>(null);
  const live = !!status?.tokenAddress;
  const rows = live ? (pond?.rows ?? []).slice(0, 50) : [];
  const tiers = status?.rules.tiers ?? DEFAULT_TIERS;
  const reward = parseFloat(status?.cycle.steps.find((s) => s.kind === "feeding")?.thresholdETH ?? "0.02");
  const share = splitInheritance(reward, rows.filter((r) => r.inTop).map((r) => parseFloat(r.balance)), tiers);
  const px = status?.price?.tokenUSD ?? 0;
  const worth = (b: string) => (px > 0 ? usd(parseFloat(b) * px) : "");
  const bar = rows.length >= 10 ? parseFloat(rows[9].balance) : 0;
  const ten = Array.from({ length: 10 }, (_, i) => rows[i]);
  const far = rows.slice(10);
  const one = ten[0];

  // Entries glide to their new lines when ranks move (FLIP, keyed by wallet). Offsets ignore
  // transforms and scrolling, so only a real change of place is animated; a change of width is not.
  const last = useRef(new Map<string, { x: number; y: number; w: number }>());
  const prevOne = useRef<string | undefined>(undefined);
  const [taken, setTaken] = useState(0);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const w = el.offsetWidth;
    const now = new Map<string, { x: number; y: number; w: number }>();
    el.querySelectorAll<HTMLElement>("[data-key]").forEach((n) => now.set(n.dataset.key!, { x: n.offsetLeft, y: n.offsetTop, w }));
    if (!prefersReducedMotion())
      el.querySelectorAll<HTMLElement>("[data-key]").forEach((n) => {
        const a = last.current.get(n.dataset.key!);
        const b = now.get(n.dataset.key!);
        if (!a || !b || a.w !== b.w || (Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2)) return;
        gsap.fromTo(n, { x: a.x - b.x, y: a.y - b.y, zIndex: 3 }, { x: 0, y: 0, duration: 1.1, ease: "power2.inOut", clearProps: "zIndex" });
      });
    last.current = now;
    const k = rows[0]?.addr;
    if (prevOne.current && k && k !== prevOne.current) setTaken((s) => s + 1);
    prevOne.current = k;
  });

  // the hammock has a new owner: say so once
  useGSAP(
    () => {
      if (!taken || prefersReducedMotion()) return;
      gsap.fromTo(".taken", { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "back.out(1.8)" });
      gsap.to(".taken", { opacity: 0, delay: 2.6, duration: 0.4 });
    },
    { scope: root, dependencies: [taken] },
  );

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // each entry is ruled in from the left as the register comes into view
      gsap.from(".entryline", { clipPath: "inset(0 100% 0 0)", duration: 0.7, ease: "power2.out", stagger: 0.06, scrollTrigger: { trigger: ".tiers", start: "top 82%" } });
    },
    { scope: root, dependencies: [rows.length > 0] },
  );

  const line = (r: PondRow | undefined, rank: number) => (
    <li key={r?.addr ?? `open-${rank}`} data-key={r?.addr} className={`entryline ${r ? "" : "is-open"}`}>
      <span className="entryline__n">{rank}</span>
      {r ? (
        <>
          <Who addr={r.addr} nickname={r.nickname} pp={r.pp} x={r.x} size={34} />
          <span className="entryline__bal num">
            {compact(r.balance)}
            {worth(r.balance) ? ` · ${worth(r.balance)}` : ""}
          </span>
          <span className="entryline__next num">+{(share[rank - 1] ?? 0).toFixed(4)} ETH</span>
        </>
      ) : (
        <span className="entryline__open">Free grip. {bar > 0 ? "Hold more than No. 10 to take it." : `Hold 100,000 ${TICKER} to take it.`}</span>
      )}
    </li>
  );

  return (
    <section className="sec branches" id="branches" ref={root} aria-labelledby="branches-head">
      <div className="wrap">
        <div className="sec__head">
          <p className="fig">Fig. 1</p>
          <h2 className="h2" id="branches-head">
            Who is hanging on
          </h2>
          <p className="deck">
            {live ? `${(pond?.total ?? 0).toLocaleString("en-US")} holders on the tree.` : "Opens at launch."}
            {px > 0 ? ` 1 ${TICKER} is about $${px < 0.01 ? px.toPrecision(3) : px.toFixed(4)}.` : ""}
          </p>
        </div>

        <div className={`first ${one ? "" : "is-open"}`} data-key={one?.addr}>
          <p className="first__k">No. 1 gets the hammock</p>
          {one ? (
            <>
              <Who addr={one.addr} nickname={one.nickname} pp={one.pp} x={one.x} size={84} />
              <p className="first__bal num">
                {compact(one.balance)} {TICKER}
                {worth(one.balance) ? ` · ${worth(one.balance)}` : ""} · next reward +{(share[0] ?? 0).toFixed(4)} ETH
              </p>
            </>
          ) : (
            <p className="first__bal">Nobody yet. The biggest holder takes it.</p>
          )}
        </div>

        <div className="tiers">
          <div className="tier">
            <p className="tier__k">
              <b>Top branch.</b> No. 1-5 share {tiers[0]?.eth ?? "0.014"} ETH of every {reward} ETH reward.
            </p>
            <ol className="tier__list">{ten.slice(1, 5).map((r, i) => line(r, i + 2))}</ol>
          </div>
          <div className="tier">
            <p className="tier__k">
              <b>Lower branch.</b> No. 6-10 share {tiers[1]?.eth ?? "0.006"} ETH.
            </p>
            <ol className="tier__list">{ten.slice(5).map((r, i) => line(r, i + 6))}</ol>
          </div>
        </div>

        {live && (pond?.house || pond?.waiting?.length || pond?.out?.length) ? (
          <div className="notes">
            {pond?.house ? (
              <p className="notes__row">
                <b>The toucan</b>
                <Who addr={pond.house.addr} nickname={pond.house.nickname} pp={pond.house.pp} x={pond.house.x} size={24} />
                <span>
                  <span className="num">{compact(pond.house.balance)}</span>. The dev wallet: watches from the trunk, never hangs, never paid.
                </span>
              </p>
            ) : null}
            {pond?.waiting?.length ? (
              <p className="notes__row">
                <b>Reaching up</b>
                {pond.waiting.map((w) => (
                  <Who key={w.addr} addr={w.addr} nickname={w.nickname} pp={w.pp} x={w.x} size={22} />
                ))}
              </p>
            ) : null}
            {pond?.out?.length ? (
              <p className="notes__row">
                <b>Let go</b>
                {pond.out.map((w) => (
                  <span key={w.addr} className="notes__gone">
                    {nameFor(w.addr, w.nickname, w.x).name}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        ) : null}

        {far.length ? (
          <>
            <h3 className="h3">Climbing the trunk</h3>
            <ol className="climb" start={11} aria-label="No. 11 to 50">
              {far.map((r) => {
                const gap = bar - parseFloat(r.balance);
                return (
                  <li key={r.addr} data-key={r.addr}>
                    <span className="climb__n num">{r.rank}</span>
                    <Who addr={r.addr} nickname={r.nickname} pp={r.pp} x={r.x} size={22} />
                    <span className="climb__sub num">
                      {compact(r.balance)} · {gap > 0 ? `+${compact(gap + 1)} to a branch` : "next up"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </>
        ) : null}
        {taken ? (
          <p className="taken" aria-live="polite">
            The hammock has a new owner.
          </p>
        ) : null}
      </div>
    </section>
  );
}
