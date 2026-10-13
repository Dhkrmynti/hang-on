/**
 * The moving layers that sit over the whole page: embers that rise, follow the mouse and burst
 * where you click; an ember cursor; and a number that counts up to its value when first seen.
 * None of it runs under prefers-reduced-motion.
 */
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../lib/motion";

gsap.registerPlugin(ScrollTrigger);

type Ember = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; seed: number; burst: boolean };

/** Sparks over everything. They drift up on their own, faster when you scroll, trail the mouse, and burst on a click. */
export function Embers() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = ref.current!;
    const g = canvas.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const size = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const list: Ember[] = [];
    const add = (x: number, y: number, burst = false) => {
      if (list.length > 380) return;
      list.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (burst ? 6 : 0.6),
        vy: burst ? -Math.random() * 6 - 1 : -Math.random() * 1.1 - 0.4,
        r: Math.random() * 1.8 + 0.6,
        life: 0,
        max: burst ? 45 + Math.random() * 45 : 220 + Math.random() * 220,
        seed: Math.random(),
        burst,
      });
    };
    let lastY = window.scrollY;
    let speed = 0;
    const tick = () => {
      if (document.hidden) return;
      speed += (window.scrollY - lastY - speed) * 0.2;
      lastY = window.scrollY;
      // a steady few dozen rising from the bottom edge
      if (list.filter((p) => !p.burst).length < 44 && Math.random() < 0.5) add(Math.random() * w, h + 8);
      g.clearRect(0, 0, w, h);
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life++;
        p.x += p.vx + Math.sin((p.life + p.seed * 90) / 26) * 0.35;
        // scrolling down pushes them up past you; a burst falls back under its own weight
        p.y += p.vy - speed * 0.12;
        if (p.burst) p.vy += 0.14;
        const left = 1 - p.life / p.max;
        if (left <= 0 || p.y < -20 || p.y > h + 40) {
          list.splice(i, 1);
          continue;
        }
        g.globalAlpha = Math.min(1, left * 1.4);
        g.fillStyle = p.seed > 0.6 ? "#ffc23d" : "#ff6a1a";
        g.beginPath();
        g.arc(p.x, p.y, p.r * (0.5 + left * 0.5), 0, 6.283);
        g.fill();
      }
    };
    const burst = (e: Event) => {
      const d = (e as CustomEvent<{ x: number; y: number; n: number }>).detail;
      for (let i = 0; i < d.n; i++) add(d.x, d.y, true);
    };
    const down = (e: PointerEvent) => {
      for (let i = 0; i < 12; i++) add(e.clientX, e.clientY, true);
    };
    let moves = 0;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && ++moves % 4 === 0) add(e.clientX, e.clientY);
    };
    gsap.ticker.add(tick);
    window.addEventListener("resize", size);
    window.addEventListener("bf:burst", burst);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", size);
      window.removeEventListener("bf:burst", burst);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
    };
  }, []);
  return <canvas className="embers" ref={ref} aria-hidden="true" />;
}

/** An ember that follows the mouse, with a ring that lags behind and widens over anything you can press. Mouse only. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const d = dot.current!;
    const r = ring.current!;
    const to = [gsap.quickTo(d, "x", { duration: 0.12, ease: "power3" }), gsap.quickTo(d, "y", { duration: 0.12, ease: "power3" }), gsap.quickTo(r, "x", { duration: 0.45, ease: "power3" }), gsap.quickTo(r, "y", { duration: 0.45, ease: "power3" })];
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      gsap.set([d, r], { opacity: 1 });
      to[0](e.clientX);
      to[1](e.clientY);
      to[2](e.clientX);
      to[3](e.clientY);
      const press = e.target instanceof Element && !!e.target.closest("a, button, input");
      gsap.to(r, { scale: press ? 1.8 : 1, duration: 0.25, overwrite: "auto" });
    };
    const out = () => gsap.set([d, r], { opacity: 0 });
    window.addEventListener("pointermove", move);
    document.documentElement.addEventListener("pointerleave", out);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", out);
    };
  }, []);
  return (
    <>
      <div className="cur cur--ring" ref={ring} aria-hidden="true" />
      <div className="cur cur--dot" ref={dot} aria-hidden="true" />
    </>
  );
}

/**
 * A number that counts up from zero the first time it is scrolled to, and from its old value
 * whenever it changes after that. `format` turns the running value into what is printed.
 */
export function Count({ value, format, className = "" }: { value: number; format: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const fmt = useRef(format);
  fmt.current = format;
  useLayoutEffect(() => {
    const el = ref.current!;
    if (prefersReducedMotion()) {
      shown.current = value;
      el.textContent = fmt.current(value);
      return;
    }
    el.textContent = fmt.current(shown.current);
    const o = { n: shown.current };
    const tween = gsap.to(o, {
      n: value,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: () => {
        shown.current = o.n;
        el.textContent = fmt.current(o.n);
      },
      scrollTrigger: { trigger: el, start: "top 94%", once: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [value]);
  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
