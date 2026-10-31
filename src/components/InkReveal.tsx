"use client";
// Cursor ink reveal: a smoky colour trail follows the pointer and turns the big word white where it passes.
// Both the word and the ink are drawn on one canvas so the white cut-out always lines up with the black word.
import { useEffect, useRef } from "react";

type Blob = { x: number; y: number; r: number; hue: number; born: number; life: number; dx: number; dy: number };

export default function InkReveal({ word, top, cta, onCta, hint, aside }: { word: string; top: string; cta: string; onCta: () => void; hint: string; aside: string[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current, canvas = cv.current;
    if (!el || !canvas) return;
    const ctx = canvas.getContext("2d");
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");
    if (!ctx || !octx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, fontPx = 100, raf = 0, visible = false;
    let family = "sans-serif";
    const blobs: Blob[] = [];
    let last: { x: number; y: number; t: number } | null = null;
    let lastMove = 0, hue = 225;

    const layout = () => {
      const r = el.getBoundingClientRect();
      W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      off.width = Math.round(W / 2); off.height = Math.round(H / 2);
      family = getComputedStyle(el).getPropertyValue("--ink-font") || getComputedStyle(el).fontFamily;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `800 100px ${family}`;
      const w = ctx.measureText(word).width || 1;
      fontPx = Math.min((W * 0.92) / w * 100, H * 0.34);
    };

    const add = (x: number, y: number, now: number, speed: number) => {
      hue = (hue + 0.9) % 360;
      const h = 225 + ((Math.sin(now / 1400) + 1) / 2) * 175; // blue -> magenta -> orange
      const r = 34 + Math.min(70, speed * 0.55) + Math.random() * 18;
      blobs.push({ x, y, r, hue: h, born: now, life: 1500 + Math.random() * 900, dx: (Math.random() - .5) * .25, dy: (Math.random() - .5) * .25 + .03 });
      if (Math.random() < 0.12) {
        const a = Math.random() * Math.PI * 2, d = r * (1.3 + Math.random() * 1.6);
        blobs.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: 4 + Math.random() * 9, hue: h + 20, born: now, life: 2200, dx: 0, dy: .08 });
      }
      if (blobs.length > 420) blobs.splice(0, blobs.length - 420);
    };

    const trail = (x: number, y: number, now: number) => {
      if (!last) { last = { x, y, t: now }; add(x, y, now, 0); return; }
      const dx = x - last.x, dy = y - last.y, dist = Math.hypot(dx, dy);
      const speed = dist / Math.max(1, now - last.t) * 16;
      const steps = Math.max(1, Math.floor(dist / 7));
      for (let i = 1; i <= steps; i++) add(last.x + dx * i / steps, last.y + dy * i / steps, now, speed);
      last = { x, y, t: now };
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      lastMove = performance.now();
      trail(e.clientX - r.left, e.clientY - r.top, lastMove);
    };
    const onLeave = () => { last = null; };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      // idle: a slow figure-eight so phones and still screens still see the effect
      if (!reduce && now - lastMove > 2200) {
        const t = now / 1000;
        trail(W * (0.5 + 0.38 * Math.sin(t * 0.7)), H * (0.5 + 0.26 * Math.sin(t * 1.4)), now);
      }
      ctx.clearRect(0, 0, W, H);
      ctx.font = `800 ${fontPx}px ${family}`;
      ctx.textBaseline = "middle";
      const tw = ctx.measureText(word).width;
      const tx = (W - tw) / 2, ty = H * 0.52;
      // ink on a half-size buffer, blurred once for the smoky edge
      octx.setTransform(0.5, 0, 0, 0.5, 0, 0);
      octx.clearRect(0, 0, W, H);
      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i]; const age = (now - b.born) / b.life;
        if (age >= 1) { blobs.splice(i, 1); continue; }
        b.x += b.dx; b.y += b.dy;
        const k = 1 - age, rr = b.r * (0.55 + 0.45 * Math.sqrt(k)) * (1 + age * 0.35);
        const g = octx.createRadialGradient(b.x - rr * .25, b.y - rr * .3, rr * .05, b.x, b.y, rr);
        g.addColorStop(0, `hsla(${b.hue + 25},100%,${62 + 10 * k}%,${0.95 * k})`);
        g.addColorStop(0.55, `hsla(${b.hue},95%,48%,${0.85 * k})`);
        g.addColorStop(1, `hsla(${b.hue - 15},90%,30%,0)`);
        octx.fillStyle = g; octx.beginPath(); octx.arc(b.x, b.y, rr, 0, Math.PI * 2); octx.fill();
      }
      ctx.save();
      ctx.filter = "blur(5px) saturate(1.25) contrast(1.15)";
      ctx.drawImage(off, 0, 0, W, H);
      ctx.restore();
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(word, tx, ty);
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#0b0b0c";
      ctx.fillText(word, tx, ty);
      ctx.globalCompositeOperation = "source-over";
    };

    layout();
    document.fonts?.ready.then(layout);
    const ro = new ResizeObserver(layout); ro.observe(el);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.05 }); io.observe(el);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave); };
  }, [word]);

  return (
    <section className="ink" ref={wrap} aria-label={word}>
      <canvas ref={cv} className="ink-canvas" aria-hidden />
      <h2 className="sr-only">{word}</h2>
      <div className="ink-top">
        <p>{top}</p>
        <button className="ink-pill" onClick={onCta}>{cta} <span aria-hidden>›</span></button>
      </div>
      <ul className="ink-aside" aria-hidden>{aside.map((a) => <li key={a}><i />{a}</li>)}</ul>
      <p className="ink-hint"><i />{hint}</p>
    </section>
  );
}
