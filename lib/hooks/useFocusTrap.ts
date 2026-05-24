'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Accessibility: contain keyboard focus inside an open dialog, move focus in
 * when it opens, restore it to the trigger when it closes, and dismiss on
 * Escape. aria-modal alone does not stop Tab from reaching the background, so
 * a real modal needs this. Used by the welcome, stage-crossing, and mobile-nav
 * overlays.
 *
 * Pass the dialog container ref, whether it is open, and a close handler.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  isOpen: boolean,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const visibleFocusables = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );

    // Move focus into the dialog (first control, or the container itself).
    const initial = visibleFocusables()[0] ?? container;
    initial.focus({ preventScroll: true });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = visibleFocusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = active ? container!.contains(active) : false;

      if (e.shiftKey) {
        if (!inside || active === first) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (!inside || active === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Restore focus to whatever opened the dialog.
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isOpen, containerRef, onEscape]);
}
