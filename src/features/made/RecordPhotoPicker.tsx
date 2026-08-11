import React, { useEffect, useRef, useState } from 'react'
import { Loader2Icon, PlusIcon, RotateCwIcon, XIcon } from 'lucide-react'
import { CAPTION_MAX, RECORD_MAX_PHOTOS } from './logitTypes'
import { previewOf } from './recordPhotos'
import type { RecordPhoto } from './recordPhotos'

interface Props {
    photos: RecordPhoto[]
    onAdd: () => void
    onCaption: (id: string, caption: string) => void
    /** 맨 앞으로 옮긴다. 맨 앞 사진이 냉장고와 목록에 놓이는 대표다 */
    onCover: (id: string) => void
    onRemove: (id: string) => void
    onRetry: (id: string) => void
}

/** 점이 이보다 많아지면 세지 못한다 — 숫자로 바꾼다 */
const DOT_LIMIT = 8

/** 사진을 넘겨 가며 그 사진에 붙일 글을 적는다 */
export function RecordPhotoPicker({ photos, onAdd, onCaption, onCover, onRemove, onRetry }: Props) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(0)

    const count = photos.length
    const current = photos[Math.min(index, count - 1)]
    const full = count >= RECORD_MAX_PHOTOS

    // 사진을 빼면 남은 장수보다 큰 자리를 보고 있을 수 있다
    useEffect(() => {
        if (index > count - 1) setIndex(Math.max(count - 1, 0))
    }, [count, index])

    const trackScrolled = () => {
        const track = trackRef.current
        if (!track || count === 0) return
        const step = track.scrollWidth / count
        setIndex(Math.min(Math.round(track.scrollLeft / step), count - 1))
    }

    return (
        <section aria-label="사진">
            <div
                ref={trackRef}
                onScroll={trackScrolled}
                className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-5 scroll-px-5"
            >
                {photos.map((photo, position) => {
                    const failed = photo.kind === 'new' && photo.status === 'failed'
                    return (
                        <div key={photo.id} className="relative w-full shrink-0 snap-start">
                            {/* 미리보기는 blob URL이거나 presigned URL이라 next/image 대상이 아니다 */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewOf(photo)}
                                alt=""
                                className="aspect-square w-full rounded-2xl object-cover"
                            />

                            {photo.kind === 'new' && photo.status === 'uploading' && (
                                <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/35">
                                    <Loader2Icon size={22} aria-hidden className="animate-spin text-white" />
                                </span>
                            )}

                            {/* no-touch-expand가 없으면 전역 터치 확장 규칙이 position을 relative로 덮어 사진 밖으로 밀려난다 */}
                            {failed && (
                                <button
                                    type="button"
                                    onClick={() => onRetry(photo.id)}
                                    aria-label="다시 올리기"
                                    className="no-touch-expand absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-black/45 text-white"
                                >
                                    <RotateCwIcon size={20} aria-hidden />
                                    <span className="text-xs font-bold">다시</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => onRemove(photo.id)}
                                aria-label={`${position + 1}번째 사진 빼기`}
                                className="no-touch-expand absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45"
                            >
                                <XIcon size={18} aria-hidden className="text-white" />
                            </button>

                            {/* 한 장뿐이면 고를 것이 없다 */}
                            {count > 1 &&
                                (position === 0 ? (
                                    <span className="absolute left-2 top-2 rounded-full bg-action-primary px-2 py-1 text-xs font-bold text-content-on-action">
                                        대표
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => onCover(photo.id)}
                                        className="no-touch-expand absolute left-2 top-2 rounded-full bg-black/45 px-2 py-1 text-xs font-bold text-white"
                                    >
                                        대표로
                                    </button>
                                ))}
                        </div>
                    )
                })}
            </div>

            {count > 1 && (
                <div className="flex items-center justify-center gap-1 pt-2">
                    {count <= DOT_LIMIT ? (
                        photos.map((photo, position) => (
                            <span
                                key={photo.id}
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
                </div>
            )}

            {current && (
                <input
                    // 자리가 바뀌면 다른 사진의 글이 남아 있지 않도록 입력칸을 새로 만든다
                    key={current.id}
                    value={current.caption}
                    onChange={(event) => onCaption(current.id, event.target.value)}
                    maxLength={CAPTION_MAX}
                    placeholder="이 사진에 한마디"
                    aria-label={`${index + 1}번째 사진에 붙일 글`}
                    className="mt-3 min-h-touch w-full rounded-xl bg-neutral-50 px-3 text-sm text-content-primary"
                />
            )}

            {count > 1 && <p className="pt-2 text-xs text-content-muted">대표 사진이 냉장고와 목록에 놓여요</p>}

            <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-content-muted">
                    {count} / {RECORD_MAX_PHOTOS}장
                </p>
                {!full && (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="flex min-h-touch items-center gap-1 px-1 text-sm font-bold text-content-link"
                    >
                        <PlusIcon size={16} aria-hidden />
                        사진 더 올리기
                    </button>
                )}
            </div>
        </section>
    )
}
