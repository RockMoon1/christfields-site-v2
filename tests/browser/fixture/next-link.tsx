import type { AnchorHTMLAttributes } from 'react';

/** Links retain their semantics but are inert inside this isolated fixture. */
export default function FixtureLink({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} href={href} onClick={(event) => { event.preventDefault(); onClick?.(event); }} />;
}
