"use client";
// Videos below the hero: nothing is downloaded until the section scrolls near the screen.
// Phones and data-saver get the 720p file, larger screens the 1080p one. Both are H.264 with
// faststart, so playback begins after the first second is buffered and keeps streaming.
import { useEffect, useRef, useState } from "react";

type Props = {
  src1080: string; src720: string; poster?: string; label: string;
  /** Background mode: muted autoplay loop, paused when off screen. */
  ambient?: boolean; className?: string; rootMargin?: string;
  /** Element to watch instead of the video itself (needed for fixed-position backgrounds). */
  watch?: string;
};

function pickSrc(src1080: string, src720: string) {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  const slow = nav.connection?.saveData || /(^|-)2g|3g/.test(nav.connection?.effectiveType ?? "");
  const small = Math.min(window.innerWidth, window.innerHeight) * (window.devicePixelRatio || 1) < 1100 || window.innerWidth < 820;
  return slow || small ? src720 : src1080;
}

export default function LazyVideo({ src1080, src720, poster, label, ambient = false, className, rootMargin = "300px 0px", watch }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [showPoster, setShowPoster] = useState(false);

  useEffect(() => {
    const v = ref.current; if (!v) return;
    // Poster image waits too, so nothing below the fold costs bytes on first paint.
    const near = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      setShowPoster(true);
      setSrc(pickSrc(src1080, src720));
      near.disconnect();
    }, { rootMargin });
    near.observe((watch && document.querySelector(watch)) || v);
    return () => near.disconnect();
  }, [src1080, src720, rootMargin, watch]);

  useEffect(() => {
    const v = ref.current; if (!v || !src) return;
    v.load();
    if (!ambient) return;
    const target = (watch && document.querySelector(watch)?.parentElement) || v;
    const vis = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0 });
    vis.observe(target);
    return () => vis.disconnect();
  }, [src, ambient, watch]);

  // Pause the film when it scrolls away so it never plays hidden.
  useEffect(() => {
    const v = ref.current; if (!v || ambient) return;
    const away = new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) v.pause(); }, { threshold: 0 });
    away.observe(v);
    return () => away.disconnect();
  }, [ambient]);

  return ambient ? (
    <video ref={ref} className={className} muted loop playsInline preload="none" poster={poster} aria-hidden>
      {src && <source src={src} type="video/mp4" />}
    </video>
  ) : (
    <video ref={ref} className={className} controls playsInline preload={src ? "auto" : "none"} poster={showPoster ? poster : undefined} aria-label={label} controlsList="nodownload">
      {src && <source src={src} type="video/mp4" />}
    </video>
  );
}
