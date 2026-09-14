export function usePathname() {
  const query = new URLSearchParams(window.location.search);
  const which = query.get('case');
  return query.get('route') ?? (which === 'community-page' ? '/dashboard/community' : which === 'settings' || which === 'availability' ? `/dashboard/${which}` : '/dashboard');
}
export function useRouter() {
  return { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
}
