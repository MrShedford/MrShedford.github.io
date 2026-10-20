import { useState, type CSSProperties } from 'react'
import type { ImageSet } from '@/content/types'

type Props = {
  image: ImageSet
  alt: string
  /** The `sizes` attribute: how wide this image renders, so the browser picks the right file. */
  sizes: string
  className?: string | undefined
  /** Above-the-fold images skip lazy loading. */
  eager?: boolean
}

/**
 * An image from the content pipeline: responsive WebP sources, intrinsic
 * width/height so nothing jumps while it loads, and a blurred thumbnail
 * behind it until it arrives.
 */
export function ResponsiveImage({ image, alt, sizes, className, eager = false }: Props) {
  const [loaded, setLoaded] = useState(false)
  const style: CSSProperties | undefined = loaded
    ? undefined
    : { backgroundImage: `url(${image.placeholder})`, backgroundSize: 'cover' }

  return (
    <img
      src={image.src}
      srcSet={image.srcset}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      style={style}
      onLoad={() => setLoaded(true)}
    />
  )
}
