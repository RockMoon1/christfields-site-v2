'use client';

import Link from 'next/link';
import { Container } from '../Container';
import { Reveal } from '../Reveal';
import { TiltCard } from '../motion/TiltCard';
import { MagneticButton } from '../motion/MagneticButton';

/**
 * Homepage section that invites visitors into the member dashboard and the
 * FaithFlow community. The preview card uses TiltCard (pure CSS 3D transforms,
 * reduced-motion aware, no WebGL) with depth-layered children via translateZ,
 * so it reads as a bold 3D moment while costing the page almost nothing.
 */

const FEATURES = [
  { label: 'Rhythms', note: 'Daily practices, gentle streaks' },
  { label: 'Prayer', note: 'Requests and answered prayers' },
  { label: 'Reflect', note: 'Mood, gratitude, examen' },
  { label: 'Scripture', note: 'Verse of the day and memory' },
];

const PREVIEW_ROWS = [
  { name: 'Read Scripture', done: true, z: 60, color: '#e4c97a' },
  { name: 'Pray', done: true, z: 48, color: '#c9a548' },
  { name: 'Gratitude', done: true, z: 36, color: '#52b788' },
  { name: 'Examen', done: false, z: 24, color: '#7e6ba8' },
];

export function DashboardInvite() {
  return (
    <section id="dashboard" className="relative overflow-hidden bg-black py-[110px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 78% 28%, rgba(201, 165, 72, 0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 12% 82%, rgba(27, 67, 50, 0.16) 0%, transparent 60%)
          `,
        }}
      />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <div>
            <Reveal>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold">
                Your space
              </p>
            </Reveal>

            <Reveal delay={0.05}>
              <h2 className="mb-6 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] font-light leading-[1.1] text-ivory">
                A daily place to{' '}
                <em className="not-italic text-gold-lt">walk with God.</em>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-ivory-dim">
                Your dashboard holds the real, ordinary practices of faith. Keep your rhythms,
                take what is on your heart straight to him, be honest about where you are, and walk alongside others.
                Built on grace, not pressure.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <ul className="mb-10 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {FEATURES.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    <span>
                      <span className="block text-sm text-ivory">{f.label}</span>
                      <span className="block text-xs text-muted">{f.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-4">
                <MagneticButton>
                  <Link
                    href="/dashboard/sign-up"
                    className="inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-black transition-colors hover:bg-gold-lt"
                  >
                    Create your account &rarr;
                  </Link>
                </MagneticButton>
                <Link
                  href="/dashboard/sign-in"
                  className="inline-flex items-center gap-2 rounded-sm border border-gold/45 px-6 py-3 text-xs font-medium uppercase tracking-[0.07em] text-gold transition-colors hover:bg-gold hover:text-black"
                >
                  Sign in
                </Link>
                <Link
                  href="/faithflow"
                  className="text-xs font-medium uppercase tracking-[0.16em] text-silver underline-offset-4 transition-colors hover:text-gold-lt hover:underline"
                >
                  Explore FaithFlow
                </Link>
              </div>
            </Reveal>
          </div>

          {/* 3D preview card */}
          <Reveal delay={0.1}>
            <div className="[perspective:1200px]">
              <TiltCard max={9} className="relative">
                <div
                  className="relative rounded-md border border-border-gold bg-gradient-to-br from-black-3 to-black-2 p-6 shadow-2xl"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
                  />

                  <div
                    className="mb-5 flex items-center justify-between"
                    style={{ transform: 'translateZ(40px)' }}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
                      Today
                    </p>
                    <p className="text-xs text-silver">3 of 4 kept</p>
                  </div>

                  <div className="space-y-2.5">
                    {PREVIEW_ROWS.map((r) => (
                      <div
                        key={r.name}
                        className="flex items-center gap-3 rounded-sm border border-border-sub bg-black-2/70 px-3 py-2.5"
                        style={{ transform: `translateZ(${r.z}px)` }}
                      >
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: r.done ? r.color : 'transparent',
                            border: r.done ? 'none' : '1px solid rgba(255,255,255,0.12)',
                          }}
                        >
                          {r.done && (
                            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-black">
                              <path
                                d="M3.5 8.5l3 3 6-7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span className={r.done ? 'text-sm text-ivory-dim' : 'text-sm text-ivory'}>
                          {r.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-5 border-t border-border-sub pt-4"
                    style={{ transform: 'translateZ(30px)' }}
                  >
                    <p className="font-display text-base italic leading-relaxed text-ivory">
                      &ldquo;His mercies are new every morning.&rdquo;
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-gold-lt">
                      Lamentations 3:23
                    </p>
                  </div>

                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold/20 blur-2xl"
                    style={{ transform: 'translateZ(80px)' }}
                  />
                </div>
              </TiltCard>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
