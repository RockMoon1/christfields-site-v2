import type { ReactNode } from 'react';

/** Only Clerk's presentation shell is simulated. No account is loaded. */
function Account({ appearance }: { appearance?: { elements?: { userButtonTrigger?: string } }; children?: ReactNode }) {
  return <button type="button" aria-label="Account fixture" className={appearance?.elements?.userButtonTrigger}>CF</button>;
}
export const UserButton = Object.assign(Account, {
  MenuItems: ({ children }: { children: ReactNode }) => <>{children}</>,
  Link: () => null,
});
