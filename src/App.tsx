import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { demoPond, demoRounds, demoStatus, usePoll, type Pond, type RoundRow, type Status } from "./lib/api";
import { prefersReducedMotion } from "./lib/motion";
import { restoreWallet } from "./lib/wallet";
import { pageMotion, pointerMotion } from "./lib/fx";
import { Cursor, Embers } from "./skull/Fx";
import { Header } from "./skull/Header";
import { Hero } from "./skull/Hero";
import { Bill, Flowers, FrontRow, Inside, Oven } from "./skull/Rooms";
import { Tag } from "./skull/Card";
import { Foot, GuestBook } from "./skull/Close";

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const { data: status, error } = usePoll<Status>("/api/status", 4000, demoStatus);
  const live = !!status?.tokenAddress;
  // the wake is live: a new buyer is on the page within a few seconds
  const { data: pond } = usePoll<Pond>(live ? "/api/pond?limit=50" : null, 3000, demoPond);
  const { data: rounds } = usePoll<RoundRow[]>(live ? "/api/rounds" : null, 30000, demoRounds);

  // A wallet that already trusts this site shows as connected without a popup.
  useEffect(restoreWallet, []);

  // The scrubbed and pinned scenes measure where they start once; when fonts, X pictures or the live
  // rows change the height above them, measure again so nothing starts in the wrong place.
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    let t = 0;
    const again = () => {
      clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    document.fonts?.ready.then(again);
    window.addEventListener("load", again);
    const watched = ["urn", "row", "flowers", "oven", "bill", "card", "book"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const heights = new Map<Element, number>();
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const h = Math.round(e.contentRect.height);
        if (heights.get(e.target) !== h) {
          heights.set(e.target, h);
          again();
        }
      }
    });
    watched.forEach((el) => ro.observe(el));
    return () => {
      clearTimeout(t);
      window.removeEventListener("load", again);
      ro.disconnect();
    };
  }, []);

  // The page-wide motion (progress line, the bar hiding), and what the mouse does to cards and buttons.
  useEffect(pageMotion, []);
  useEffect(pointerMotion, []);

  // Smooth scroll that ScrollTrigger reads from; off for reduced motion.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    const anchors = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.getAttribute("href") === "#") return;
      const el = document.querySelector(a.getAttribute("href")!);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -64 });
    };
    document.addEventListener("click", anchors);
    return () => {
      document.removeEventListener("click", anchors);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="site">
      <Header status={status} />
      <i className="progress" aria-hidden="true" />
      <Embers />
      <Cursor />
      {/* the parlour stays put while you start down; the view goes into the urn and the next room opens out of it */}
      <Hero status={status} pond={pond} offline={!!error && !status} />
      <main>
        <Inside status={status} rounds={rounds} />
        <FrontRow status={status} pond={pond} />
        <Flowers status={status} pond={pond} />
        <Oven status={status} pond={pond} />
        <Bill status={status} />
        <Tag live={live} />
        <GuestBook status={status} rounds={rounds} />
      </main>
      <Foot status={status} />
    </div>
  );
}
