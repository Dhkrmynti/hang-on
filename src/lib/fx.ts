/**
 * Motion that belongs to the whole page rather than one room: the line of fire that shows how far
 * down you are, the bar that hides while you read down, and what the pointer does to cards and
 * buttons. Each room's own scroll scenes live with the room. Everything here is skipped under
 * prefers-reduced-motion.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./motion";

gsap.registerPlugin(ScrollTrigger);

/** Throws `n` sparks from a point on screen (the ember layer listens for this). */
export function sparks(x: number, y: number, n = 30) {
  window.dispatchEvent(new CustomEvent("bf:burst", { detail: { x, y, n } }));
}

/** The page-wide scroll motion. Returns its cleanup. */
export function pageMotion() {
  if (prefersReducedMotion()) return () => {};
  const ctx = gsap.context(() => {
    // how far down the page you are, as a line of fire under the bar
    gsap.fromTo(".progress", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
    // the bar gets out of the way while you read down and comes back the moment you scroll up
    ScrollTrigger.create({
      start: 200,
      end: "max",
      onUpdate: (s) => gsap.to(".head", { yPercent: s.direction === 1 ? -110 : 0, duration: 0.35, ease: "power2.out", overwrite: true }),
      onLeaveBack: () => gsap.to(".head", { yPercent: 0, duration: 0.35, overwrite: true }),
    });
    // a room's small label and plain words settle in when the room is reached
    gsap.utils.toArray<HTMLElement>(".kick, .lead").forEach((el) => gsap.from(el, { y: 24, opacity: 0, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
  });
  return () => ctx.revert();
}

/**
 * What a mouse does: cards lean toward it, and buttons are pulled a little way toward it. One
 * listener for the page, so cards that arrive later behave the same.
 */
export function pointerMotion() {
  if (prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return () => {};
  let card: HTMLElement | null = null;
  let pull: HTMLElement | null = null;
  const settle = (el: HTMLElement) => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
  const release = (el: HTMLElement) => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
  const move = (e: PointerEvent) => {
    const at = e.target instanceof Element ? e.target : null;
    const c = at?.closest<HTMLElement>(".place__card, .tag:not(.is-blank), .sash") ?? null;
    if (card && card !== c) settle(card);
    card = c;
    if (c) {
      const r = c.getBoundingClientRect();
      gsap.to(c, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 12, rotateX: -((e.clientY - r.top) / r.height - 0.5) * 12, transformPerspective: 700, duration: 0.4, ease: "power2.out", overwrite: "auto" });
    }
    const b = at?.closest<HTMLElement>(".btn:not(.is-waiting):not(.is-quiet), .connect") ?? null;
    if (pull && pull !== b) release(pull);
    pull = b;
    if (b) {
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - (r.left + r.width / 2)) * 0.2, y: (e.clientY - (r.top + r.height / 2)) * 0.28, duration: 0.3, ease: "power2.out", overwrite: "auto" });
    }
  };
  const leave = () => {
    if (card) settle(card);
    if (pull) release(pull);
    card = pull = null;
  };
  document.addEventListener("pointermove", move);
  document.documentElement.addEventListener("pointerleave", leave);
  return () => {
    document.removeEventListener("pointermove", move);
    document.documentElement.removeEventListener("pointerleave", leave);
    leave();
  };
}
