import type { ImgHTMLAttributes } from 'react';
export default function FixtureImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  // The actual nav logo is the only image asset this fixture server exposes.
  if (props.src === '/assets/logo.png') return <img {...props} />;
  // Other image sources keep layout dimensions without external requests.
  return <span aria-hidden style={{ display: 'inline-block', width: props.width, height: props.height }} />;
}
