import React, { useRef, useState } from 'react'
import type { LogitRecordPhoto } from './logitTypes'

interface Props {
    photos: LogitRecordPhoto[]
    className?: string
}

/** 점이 이보다 많아지면 세지 못한다 — 숫자로 바꾼다 */
const DOT_LIMIT = 8

/** 사진 여러 장을 가로로 넘겨 보고, 지금 몇 번째인지 아래 점으로 알린다 */
export function PhotoCarousel({ photos, className = '' }: Props) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(0)

    const count = photos.length

    const trackScrolled = () => {
        const track = trackRef.current
        if (!track || count === 0) return
        const step = track.scrollWidth / count
        setIndex(Math.min(Math.round(track.scrollLeft / step), count - 1))
    }

    return (
        <div className={className}>
            <div
                ref={trackRef}
                onScroll={trackScrolled}
                className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto"
            >
                {photos.map((photo) => (
                    <figure key={photo.photoId} className="w-full shrink-0 snap-start">
                        {/* presigned URL이라 next/image의 도메인 설정 대상이 아니다 */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
                        {photo.caption && (
                            <figcaption className="break-keep px-1 pt-2 text-sm leading-5 text-content-primary">
                                {photo.caption}
                            </figcaption>
                        )}
                    </figure>
                ))}
            </div>

            {count > 1 && (
                <div className="flex items-center justify-center gap-1 pt-2">
                    {count <= DOT_LIMIT ? (
                        photos.map((photo, position) => (
                            <span
                                key={photo.photoId}
                                aria-hidden
                                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                    position === index ? 'bg-action-primary' : 'bg-neutral-200'
                                }`}
                            />
                        ))
                    ) : (
                        <span aria-hidden className="text-xs font-medium text-content-muted">
                            {index + 1} / {count}
                        </span>
                    )}
                    <span className="sr-only" aria-live="polite">
                        사진 {index + 1} / {count}
                    </span>
                </div>
            )}
        </div>
    )
}
