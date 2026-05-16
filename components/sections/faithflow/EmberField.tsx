'use client';

import { useEffect, useRef } from 'react';

interface Ember {
  el: HTMLSpanElement;
  sensX: number;
  sensY: number;
}

const COLORS = [
  { c: '#FFD27A', c2: '#C9A548' },
  { c: '#FFB048', c2: '#7A6228' },
  { c: '#FF8A1E', c2: '#7A4218' },
  { c: '#FFE89A', c2: '#C9A548' },
  { c: '#FFC56B', c2: '#A77828' },
];

/**
 * Fixed-position layer of floating embers. They drift ambiently at all times.
 * On scroll they scatter in the direction of motion based on scroll velocity,
 * then decay back into ambient drift over about 1.4 seconds.
 *
 * Mirrors the v1 ember-field.js behavior and the iron-and-ember identity.
 */
export function EmberField() {
  const fieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const emberCount = window.innerWidth < 700 ? 22 : 38;
    const embers: Ember[] = [];

    for (let i = 0; i < emberCount; i++) {
      const el = document.createElement('span');
      const r = Math.random();
      const sizeClass = r < 0.25 ? 'ember-lg' : r < 0.65 ? '' : 'ember-sm';
      el.className = `ember ${sizeClass}`.trim();

      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const dur = 7 + Math.random() * 10;
      const delay = -Math.random() * dur;
      const maxOp = 0.32 + Math.random() * 0.4;

      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${Math.random() * 100}%`;
      el.style.setProperty('--col', color.c);
      el.style.setProperty('--col2', color.c2);
      el.style.setProperty('--dur', `${dur}s`);
      el.style.setProperty('--delay', `${delay}s`);
      el.style.setProperty('--max-op', `${maxOp}`);

      embers.push({
        el,
        sensX: (Math.random() - 0.5) * 2,
        sensY: 0.6 + Math.random() * 0.8,
      });

      field.appendChild(el);
    }

    if (reduceMotion) {
      return () => {
        embers.forEach((e) => e.el.remove());
      };
    }

    let lastScroll = window.scrollY;
    let velocity = 0;
    let scatter = 0;
    let raf: number | null = null;
    let scrolling = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    function tick() {
      raf = null;
      scatter = scrolling ? scatter * 0.98 : scatter * 0.92;

      const direction = velocity > 0 ? 1 : -1;
      for (const e of embers) {
        const tx = scatter * e.sensX;
        const ty = scatter * e.sensY * direction;
        e.el.style.setProperty('--scatter-x', `${tx.toFixed(1)}px`);
        e.el.style.setProperty('--scatter-y', `${ty.toFixed(1)}px`);
      }

      if (scatter > 0.4 || scrolling) {
        raf = requestAnimationFrame(tick);
      } else {
        for (const e of embers) {
          e.el.style.setProperty('--scatter-x', '0px');
          e.el.style.setProperty('--scatter-y', '0px');
        }
      }
    }

    function onScroll() {
      const now = window.scrollY;
      velocity = (now - lastScroll) * 0.6;
      lastScroll = now;

      scrolling = true;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        scrolling = false;
      }, 140);

      scatter = Math.min(80, scatter + Math.abs(velocity) * 1.4);

      if (!raf) raf = requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (idleTimer) clearTimeout(idleTimer);
      embers.forEach((e) => e.el.remove());
    };
  }, []);

  return <div ref={fieldRef} className="ember-field" aria-hidden />;
}
