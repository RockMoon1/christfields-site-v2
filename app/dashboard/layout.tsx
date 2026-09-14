import { ClerkProvider } from '@clerk/nextjs';
import { dashboardClerkAppearance } from '@/lib/clerk-appearance';

/** Dashboard auth and account components share the verified appearance system. */
export default function DashboardClerkLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider appearance={dashboardClerkAppearance}>{children}</ClerkProvider>;
}
