import { usePathname as basePathname, useRouter as baseRouter } from './next-navigation';
import { recordPostNavigation } from './post-actions';
export { notFound } from './next-navigation';

const isPostFixture = () => window.location.pathname === '/post.html';
export function usePathname() { return isPostFixture() ? '/dashboard/lead' : basePathname(); }
export function useRouter() {
  const base = baseRouter();
  if (!isPostFixture()) return base;
  return {
    ...base,
    push(destination: string) { recordPostNavigation('push', destination); base.push(); },
    replace(destination: string) { recordPostNavigation('replace', destination); base.replace(); },
    refresh() { recordPostNavigation('refresh'); base.refresh(); },
  };
}
