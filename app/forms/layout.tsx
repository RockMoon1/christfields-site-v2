import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = { title: 'Iron and Ember forms', robots: { index: false, follow: false } };
export default function FormsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#101612] text-[#f5f1e7]">
    <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-7"><Link href="/forms" className="text-sm uppercase tracking-[.16em] text-[#dbc28a]">Iron &amp; Ember</Link><span className="text-xs text-[#b7c1b9]">Christ Fields</span></header>
    <main id="main" className="mx-auto max-w-3xl px-5 pb-16"><aside className="rounded-lg border border-white/15 p-4 text-xs leading-relaxed text-[#b7c1b9]" aria-label="Cookie and privacy notice">Privacy &amp; cookies: these public forms add no advertising or analytics cookies. Hosting processes technical information for delivery and security. We explain the information collected before you submit. The private dashboard uses necessary sign-in cookies. <Link href="/privacy" className="underline">Read our privacy policy.</Link></aside>{children}</main>
    <footer className="mx-auto max-w-3xl border-t border-white/15 px-5 py-8 text-sm text-[#b7c1b9]">
      <p>Shared by link. Anyone with this link can visit or share it. Responses are not public.</p>
      <p className="mt-3"><Link href="/privacy" className="underline">Privacy policy</Link> · <a href="mailto:proverbs@christfields2717.com" className="underline">Contact the organizer</a></p>
    </footer>
  </div>;
}
