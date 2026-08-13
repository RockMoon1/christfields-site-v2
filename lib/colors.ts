/**
 * Shared color palette for progress areas. Used both on cards (as a
 * left-edge stripe and accent) and on the dashboard globe (as the raindrop color)
 * so users can match a card to its dot at a glance.
 *
 * Colors are hand-picked to work against the dark Christ Fields theme:
 * warm enough to feel like part of the brand, distinct enough to tell
 * each area apart without thinking.
 */

export interface AreaColor {
  /** Hex value used everywhere. */
  hex: string;
  /** Human-readable name for accessibility. */
  label: string;
}

export const AREA_COLORS: AreaColor[] = [
  { hex: '#c9a548', label: 'Gold' },
  { hex: '#e4c97a', label: 'Cream' },
  { hex: '#2d6a4f', label: 'Emerald' },
  { hex: '#52b788', label: 'Sage' },
  { hex: '#5b8db8', label: 'Sky' },
  { hex: '#c47b3c', label: 'Copper' },
  { hex: '#a64453', label: 'Rose' },
  { hex: '#7e6ba8', label: 'Lavender' },
];

/** Default if nothing else is set. */
export const DEFAULT_COLOR = '#c9a548';

/** Returns whether a string is a valid hex color from our palette. */
export function isValidAreaColor(hex: string): boolean {
  return AREA_COLORS.some((c) => c.hex === hex);
}
