'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * A one-stop "install this as an app" control for Settings, consistent across
 * devices so members never have to hunt through browser menus:
 *
 *  - Android / desktop Chrome & Edge: we capture the browser's
 *    `beforeinstallprompt` and show a real one-tap Install button.
 *  - iOS Safari: there is no programmatic install, so we show the
 *    Share -> Add to Home Screen steps.
 *  - Already installed (running standalone): we say so.
 *  - Anything else (e.g. desktop Safari/Firefox): a short generic instruction.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt: () => Promise<void>;
}

export function InstallAppCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) setInstalled(true);

    setIsIOS(/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()));

    const onPrompt = (e: Event) => {
      e.preventDefault(); // stop the default mini-infobar; we trigger it ourselves
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    setPending(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      // The prompt was dismissed or failed; leave the instructions visible.
    } finally {
      setDeferred(null);
      setPending(false);
    }
  }

  return (
    <section className="mb-6 rounded-sm border border-border-sub bg-black-3 p-8">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
        Install the app
      </p>
      <h3 className="mb-3 font-display text-xl font-light text-ivory">
        Use Christ Fields like an app
      </h3>
      <p className="mb-5 max-w-xl text-sm leading-relaxed text-silver">
        Add it to your phone home screen or desktop. It opens full-screen, straight to here, with
        the Christ Fields icon. No app store needed.
      </p>

      {installed ? (
        <p className="text-sm text-emerald-bright">
          It&rsquo;s installed. Open it from your home screen or dock anytime.
        </p>
      ) : deferred ? (
        <button
          type="button"
          onClick={install}
          disabled={pending}
          className={cn(
            'inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-black transition-colors',
            pending ? 'cursor-not-allowed opacity-70' : 'hover:bg-gold-lt',
          )}
        >
          {pending ? 'Installing…' : 'Install Christ Fields'}
        </button>
      ) : isIOS ? (
        <div className="rounded-sm border border-border-sub bg-black-2 p-4 text-sm leading-relaxed text-silver">
          On iPhone or iPad: open this in <span className="text-ivory">Safari</span>, tap the{' '}
          <span className="text-ivory">Share</span> button, then choose{' '}
          <span className="text-ivory">&ldquo;Add to Home Screen&rdquo;</span>.
        </div>
      ) : (
        <div className="rounded-sm border border-border-sub bg-black-2 p-4 text-sm leading-relaxed text-silver">
          In your browser menu, choose <span className="text-ivory">&ldquo;Install&rdquo;</span> or{' '}
          <span className="text-ivory">&ldquo;Add to Home Screen&rdquo;</span>. On desktop Chrome or
          Edge, look for the install icon at the right of the address bar.
        </div>
      )}
    </section>
  );
}
