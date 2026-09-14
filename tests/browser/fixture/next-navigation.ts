export function usePathname() {
  const query = new URLSearchParams(window.location.search);
  const which = query.get('case');
  return query.get('route') ?? (which === 'event-page' ? '/dashboard/e/fixture-event' : which === 'community-page' ? '/dashboard/community' : which === 'settings' || which === 'availability' ? `/dashboard/${which}` : '/dashboard');
}
export function useRouter() {
  return { refresh() { window.dispatchEvent(new Event('fixture-route-refresh')); }, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
}
export function notFound(): never { throw new Error('Synthetic event not found.'); }
