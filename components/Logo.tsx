import Image from 'next/image';

interface LogoProps {
  /** Size of the logo image in pixels. Nav uses 72, footer uses 56. */
  size?: number;
  /** Whether to show the text fallback alongside */
  showText?: boolean;
  /** Optional className for outer wrapper */
  className?: string;
}

/**
 * The Christ Fields flame logo with animated glow and floating embers.
 * Ports the .logo-fire-wrap pattern from the v1 site verbatim so the
 * fire animation feels identical.
 */
export function Logo({ size = 72, showText = false, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="logo-fire-wrap" style={{ width: size, height: size }}>
        <div className="logo-fire-glow" />
        <div className="logo-fire-glow2" />
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={`logo-ember logo-ember-${i + 3}`} />
        ))}
        <Image
          src="/assets/logo.png"
          alt="Christ Fields"
          width={size}
          height={size}
          priority
          sizes={`${size}px`}
          className="logo-fire-img relative z-[2]"
          style={{ width: size, height: 'auto' }}
        />
      </div>
      {showText && (
        <span className="font-display text-[1.3rem] font-medium tracking-wide text-ivory">
          Christ Fields
        </span>
      )}
    </div>
  );
}
