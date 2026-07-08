'use client';

import { useEffect, useRef, useState } from 'react';

// Compteur animé qui grimpe quand il devient visible.
export function Compteur({ cible, suffixe = '', duree = 1400 }: { cible: number; suffixe?: string; duree?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [valeur, setValeur] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const debut = performance.now();
        const tick = (now: number) => {
          const progression = Math.min(1, (now - debut) / duree);
          const eased = 1 - Math.pow(1 - progression, 3);
          setValeur(Math.round(cible * eased));
          if (progression < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cible, duree]);

  return (
    <span ref={ref} className="font-display font-bold tabular-nums">
      {valeur}
      {suffixe}
    </span>
  );
}
