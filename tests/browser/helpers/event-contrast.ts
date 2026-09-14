import type { Locator } from '@playwright/test';

/** Browser-resolved solid-background compositing. Masks/filters/group opacity
 * need separate pixel evidence and are rejected rather than silently ignored. */
export async function eventTextContrast(target: Locator) {
  return target.evaluate(element => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    const rgba = (value: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const pixel = context.getImageData(0, 0, 1, 1).data;
      return [pixel[0], pixel[1], pixel[2], pixel[3] / 255];
    };
    const over = (front: number[], back: number[]) => front.slice(0, 3)
      .map((channel, i) => channel * front[3] + back[i] * (1 - front[3]));
    const luminance = (rgb: number[]) => rgb.reduce((sum, channel, i) => {
      const srgb = channel / 255;
      return sum + (srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
    }, 0);
    const chain: Element[] = [];
    for (let node: Element | null = element; node; node = node.parentElement) chain.unshift(node);
    const unsupported: string[] = [];
    let background = [255, 255, 255];
    for (const node of chain) {
      const style = getComputedStyle(node);
      if (style.backgroundImage !== 'none') unsupported.push(`${node.tagName}:background-image`);
      if (style.maskImage !== 'none' || style.webkitMaskImage !== 'none') unsupported.push(`${node.tagName}:mask`);
      if (style.opacity !== '1') unsupported.push(`${node.tagName}:opacity=${style.opacity}`);
      if (style.filter !== 'none' || style.backdropFilter !== 'none') unsupported.push(`${node.tagName}:filter`);
      if (style.mixBlendMode !== 'normal' || style.backgroundBlendMode !== 'normal') unsupported.push(`${node.tagName}:blend`);
      if (style.clipPath !== 'none') unsupported.push(`${node.tagName}:clip-path`);
      if (style.textShadow !== 'none') unsupported.push(`${node.tagName}:text-shadow`);
      for (const pseudo of ['::before', '::after']) {
        const paint = getComputedStyle(node, pseudo);
        if (!['none', 'normal'].includes(paint.content) && paint.display !== 'none' && paint.visibility === 'visible' && Number(paint.opacity) > 0) {
          unsupported.push(`${node.tagName}${pseudo}:generated-paint`);
        }
      }
      background = over(rgba(style.backgroundColor), background);
    }
    const style = getComputedStyle(element);
    const foreground = over(rgba(style.color), background);
    const a = luminance(foreground), b = luminance(background);
    const fontSize = parseFloat(style.fontSize), fontWeight = Number(style.fontWeight);
    return {
      text: element.textContent?.trim(), foreground, background, unsupported, fontSize, fontWeight,
      contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      threshold: fontSize >= 24 || (fontSize >= 18.666666 && fontWeight >= 700) ? 3 : 4.5,
    };
  });
}
