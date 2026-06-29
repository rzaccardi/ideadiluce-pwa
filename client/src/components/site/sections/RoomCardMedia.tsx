'use client'

import { useRef, useState } from 'react'
import { SiteImage } from '../SiteImage'
import { cn } from '@/utils/cn'

type Props = {
  imageUrl: string
  videoUrl?: string
  alt?: string
  aspectClass?: string
  sizes?: string
  hoverScaleClass?: string
}

export function RoomCardMedia({
  imageUrl,
  videoUrl,
  alt = '',
  aspectClass = 'aspect-[16/10]',
  sizes,
  hoverScaleClass = 'group-hover:scale-[1.03]',
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovering, setHovering] = useState(false)

  const handleEnter = () => {
    if (!videoUrl) return
    setHovering(true)
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    void video.play().catch(() => {})
  }

  const handleLeave = () => {
    if (!videoUrl) return
    setHovering(false)
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = 0
  }

  return (
    <div
      className={cn('relative overflow-hidden bg-idl-cream', aspectClass)}
      onMouseEnter={videoUrl ? handleEnter : undefined}
      onMouseLeave={videoUrl ? handleLeave : undefined}
    >
      <div className={cn('absolute inset-0 transition duration-500', hoverScaleClass)}>
        <SiteImage
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizes}
          className={cn(
            'object-cover transition-opacity duration-300',
            videoUrl && hovering ? 'opacity-0' : 'opacity-100',
          )}
        />
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            controls={false}
            controlsList="nodownload nofullscreen noremoteplayback"
            className={cn(
              'pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-300',
              hovering ? 'opacity-100' : 'opacity-0',
            )}
          />
        ) : null}
      </div>
    </div>
  )
}
