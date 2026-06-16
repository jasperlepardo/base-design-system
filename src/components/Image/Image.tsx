import type { ImgHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export const imageRatios = ['1:1', '16:9', '5:4', '3:2', '4:3', '1:2', '1:3'] as const;
export type ImageRatio = (typeof imageRatios)[number];

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Aspect ratio. Default `'1:1'`. */
  ratio?: ImageRatio;
  /** Flip to the taller orientation — e.g. `16:9` → `9:16`. */
  portrait?: boolean;
  /** How the image fills the box. Default `'cover'` (crops); `'contain'` letterboxes. */
  fit?: 'cover' | 'contain';
}

/**
 * Image — a fixed-ratio image box. The `<img>` fills the `ratio` (default `1:1`)
 * and crops with `object-fit: cover`. Extends native `<img>` props; `alt` defaults
 * to `''` (decorative) — pass a meaningful `alt` for content images.
 */
export function Image({
  ratio = '1:1',
  portrait = false,
  fit = 'cover',
  alt = '',
  className,
  style,
  ...rest
}: ImageProps) {
  const [a, b] = ratio.split(':').map(Number);
  const max = Math.max(a, b);
  const min = Math.min(a, b);
  const aspectRatio = portrait ? `${min} / ${max}` : `${max} / ${min}`;
  return (
    <img
      className={cn(
        'block w-full',
        fit === 'contain' ? 'object-contain' : 'object-cover',
        className,
      )}
      alt={alt}
      style={{ aspectRatio, ...style }}
      {...rest}
    />
  );
}
