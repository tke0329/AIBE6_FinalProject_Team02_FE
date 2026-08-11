import React, { useCallback, useEffect, useRef, useState } from 'react'
import { CheckIcon, Loader2Icon, MoveIcon, PlusIcon, RotateCwIcon, XIcon } from 'lucide-react'
import { CAPTION_MAX, RECORD_MAX_PHOTOS } from './logitTypes'
import { previewOf } from './recordPhotos'
import type { RecordPhoto } from './recordPhotos'

interface Props {
    photos: RecordPhoto[]
    onAdd: () => void
    onCaption: (id: string, caption: string) => void
    onCrop: (id: string, cropX: number, cropY: number) => void
    /** 맨 앞으로 옮긴다. 맨 앞 사진이 냉장고와 목록에 놓이는 대표다 */
    onCover: (id: string) => void
    onMove: (fromIndex: number, toIndex: number) => void
    onRemove: (id: string) => void
    onRetry: (id: string) => void
    /** 지난 기록. 사진 구성은 잠그고 글만 받는다 */
    captionOnly?: boolean
}

/** 사진을 넘겨 가며 그 사진에 붙일 글을 적는다 */
export function RecordPhotoPicker({
    photos,
    onAdd,
    onCaption,
    onCrop,
    onCover,
    onMove,
    onRemove,
    onRetry,
    captionOnly = false,
}: Props) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(0)
    const [cropping, setCropping] = useState(false)
    const [coverConfirmId, setCoverConfirmId] = useState<string | null>(null)

    const count = photos.length
    const current = photos[Math.min(index, count - 1)]
    const full = count >= RECORD_MAX_PHOTOS

    useEffect(() => {
        if (index > count - 1) setIndex(Math.max(count - 1, 0))
    }, [count, index])

    useEffect(() => {
        setCropping(false)
    }, [index])

    const trackScrolled = () => {
        const track = trackRef.current
        if (!track || count === 0) return
        const step = track.scrollWidth / count
        setIndex(Math.min(Math.round(track.scrollLeft / step), count - 1))
    }

    const scrollToIndex = (i: number) => {
        const track = trackRef.current
        if (!track || count === 0) return
        const step = track.scrollWidth / count
        track.scrollTo({ left: step * i, behavior: 'smooth' })
    }

    const handleMove = (fromIndex: number, toIndex: number) => {
        onMove(fromIndex, toIndex)
        setIndex(toIndex)
        requestAnimationFrame(() => scrollToIndex(toIndex))
    }

    return (
        <section aria-label="사진">
            <div
                ref={trackRef}
                onScroll={trackScrolled}
                className={`no-scrollbar -mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-5 scroll-px-5 ${
                    cropping ? 'overflow-x-hidden' : ''
                }`}
            >
                {photos.map((photo, position) => {
                    const failed = photo.kind === 'new' && photo.status === 'failed'
                    const isCurrent = position === index
                    return (
                        <div key={photo.id} className="relative w-full shrink-0 snap-start select-none">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewOf(photo)}
                                alt=""
                                draggable={false}
                                className="aspect-square w-full rounded-2xl object-cover"
                                style={{ objectPosition: `${photo.cropX}% ${photo.cropY}%` }}
                            />

                            {cropping && isCurrent && (
                                <CropOverlay photo={photo} onCrop={onCrop} />
                            )}

                            {photo.kind === 'new' && photo.status === 'uploading' && (
                                <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/35">
                                    <Loader2Icon size={22} aria-hidden className="animate-spin text-white" />
                                </span>
                            )}

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

                            {!cropping && !captionOnly && (
                                <button
                                    type="button"
                                    onClick={() => onRemove(photo.id)}
                                    aria-label={`${position + 1}번째 사진 빼기`}
                                    className="no-touch-expand absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45"
                                >
                                    <XIcon size={18} aria-hidden className="text-white" />
                                </button>
                            )}

                            {!cropping &&
                                count > 1 &&
                                (position === 0 ? (
                                    <span className="absolute left-2 top-2 rounded-full bg-action-primary px-2 py-1 text-xs font-bold text-content-on-action">
                                        대표
                                    </span>
                                ) : captionOnly ? null : (
                                    <button
                                        type="button"
                                        onClick={() => setCoverConfirmId(photo.id)}
                                        className="no-touch-expand absolute left-2 top-2 rounded-full bg-black/45 px-2 py-1 text-xs font-bold text-white"
                                    >
                                        대표 사진으로 지정
                                    </button>
                                ))}

                            {/* 위치 조정 / 완료 버튼 */}
                            {isCurrent && !failed && !captionOnly && !(photo.kind === 'new' && photo.status === 'uploading') && (
                                <button
                                    type="button"
                                    onClick={() => setCropping(!cropping)}
                                    className={`no-touch-expand absolute bottom-2 right-2 z-20 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold backdrop-blur-sm transition-all duration-200 ${
                                        cropping
                                            ? 'bg-action-primary text-content-on-action shadow-lg ring-2 ring-white/50 hover:scale-110 hover:brightness-[1.15]'
                                            : 'bg-black/50 text-white'
                                    }`}
                                >
                                    {cropping ? (
                                        <>
                                            <CheckIcon size={13} aria-hidden />
                                            완료
                                        </>
                                    ) : (
                                        <>
                                            <MoveIcon size={13} aria-hidden />
                                            위치 조정
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* 번호 붙은 썸네일 스트립 — 꾹 눌러 드래그로 순서 변경 */}
            {count > 1 && !captionOnly && (
                <>
                    <ThumbnailStrip
                        photos={photos}
                        activeIndex={index}
                        onTap={scrollToIndex}
                        onMove={handleMove}
                    />
                    <p className="mt-1.5 text-[11px] text-content-muted">
                        사진을 길게 눌러 순서를 변경할 수 있어요
                    </p>
                </>
            )}

            {current && (
                <input
                    key={current.id}
                    value={current.caption}
                    onChange={(event) => onCaption(current.id, event.target.value)}
                    maxLength={CAPTION_MAX}
                    placeholder="이 사진에 한마디"
                    aria-label={`${index + 1}번째 사진에 붙일 글`}
                    className="mt-3 min-h-touch w-full rounded-xl bg-neutral-50 px-3 text-sm text-content-primary"
                />
            )}

            <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-content-muted">
                    {count} / {RECORD_MAX_PHOTOS}장
                </p>
                {!full && !captionOnly && (
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

            {/* 대표 사진 지정 확인 다이얼로그 */}
            {coverConfirmId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    onClick={() => setCoverConfirmId(null)}
                >
                    <div
                        className="mx-6 w-full max-w-xs rounded-2xl bg-surface-card p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-center text-sm font-bold text-content-primary">
                            대표 사진으로 지정하시겠습니까?
                        </p>
                        <p className="mt-1 text-center text-xs text-content-muted">
                            대표 사진은 냉장고와 목록에 표시됩니다
                        </p>
                        <div className="mt-5 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setCoverConfirmId(null)}
                                className="min-h-touch flex-1 rounded-xl bg-neutral-100 text-sm font-bold text-content-secondary"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onCover(coverConfirmId)
                                    setCoverConfirmId(null)
                                }}
                                className="min-h-touch flex-1 rounded-xl bg-action-primary text-sm font-bold text-content-on-action"
                            >
                                지정
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

// ---------------------------------------------------------------------------
// 번호 붙은 썸네일 스트립 — 꾹 눌러 드래그로 순서 변경
// ---------------------------------------------------------------------------

const THUMB_SIZE = 56
/** 스트립의 gap-2 */
const THUMB_GAP = 8
const LONG_PRESS_MS = 400

interface ThumbnailStripProps {
    photos: RecordPhoto[]
    activeIndex: number
    onTap: (index: number) => void
    onMove: (fromIndex: number, toIndex: number) => void
}

function ThumbnailStrip({ photos, activeIndex, onTap, onMove }: ThumbnailStripProps) {
    const stripRef = useRef<HTMLDivElement>(null)
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [dragFrom, setDragFrom] = useState<number | null>(null)
    const [dragOver, setDragOver] = useState<number | null>(null)
    const pointerStart = useRef({ x: 0, y: 0 })
    const moved = useRef(false)

    const clearLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }
    }

    // 사진을 지워 스트립이 사라져도 타이머는 남는다. 그대로 두면 없는 UI 때문에 진동이 울린다
    useEffect(() => {
        return () => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current)
        }
    }, [])

    const handlePointerDown = useCallback((e: React.PointerEvent, idx: number) => {
        pointerStart.current = { x: e.clientX, y: e.clientY }
        moved.current = false
        clearLongPress()
        longPressTimer.current = setTimeout(() => {
            setDragFrom(idx)
            setDragOver(idx)
            if (navigator.vibrate) navigator.vibrate(30)
        }, LONG_PRESS_MS)
    }, [])

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        const dx = Math.abs(e.clientX - pointerStart.current.x)
        const dy = Math.abs(e.clientY - pointerStart.current.y)
        if (dx > 8 || dy > 8) {
            moved.current = true
            if (dragFrom === null) {
                clearLongPress()
                return
            }
        }

        if (dragFrom === null) return
        e.preventDefault()

        const strip = stripRef.current
        if (!strip) return
        // 컨테이너에 px-5(20px)가 있어 rect.left로 재면 그만큼 밀린다.
        // 첫 썸네일의 화면 좌표를 원점으로 쓰면 패딩도 스크롤도 함께 상쇄된다
        const first = strip.firstElementChild?.getBoundingClientRect()
        const originX = first ? first.left : strip.getBoundingClientRect().left
        const x = e.clientX - originX
        const targetIdx = Math.max(0, Math.min(photos.length - 1, Math.floor(x / (THUMB_SIZE + THUMB_GAP))))
        setDragOver(targetIdx)
    }, [dragFrom, photos.length])

    const handlePointerUp = useCallback((idx: number) => {
        clearLongPress()
        if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
            onMove(dragFrom, dragOver)
        } else if (dragFrom === null && !moved.current) {
            onTap(idx)
        }
        setDragFrom(null)
        setDragOver(null)
    }, [dragFrom, dragOver, onMove, onTap])

    const handlePointerCancel = useCallback(() => {
        clearLongPress()
        setDragFrom(null)
        setDragOver(null)
    }, [])

    const getDisplayOrder = (): number[] => {
        const order = photos.map((_, i) => i)
        if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
            const [item] = order.splice(dragFrom, 1)
            order.splice(dragOver, 0, item)
        }
        return order
    }

    const displayOrder = getDisplayOrder()

    return (
        <div
            ref={stripRef}
            className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 scroll-px-5"
            onPointerLeave={handlePointerCancel}
        >
            {displayOrder.map((photoIdx) => {
                const photo = photos[photoIdx]
                const displayPosition = displayOrder.indexOf(photoIdx)
                const isActive = photoIdx === activeIndex
                const isDragging = dragFrom === photoIdx
                return (
                    <div
                        key={photo.id}
                        onPointerDown={(e) => handlePointerDown(e, photoIdx)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={() => handlePointerUp(photoIdx)}
                        onPointerCancel={handlePointerCancel}
                        className={`relative shrink-0 touch-none select-none transition-transform duration-150 ${
                            isDragging ? 'scale-110 opacity-80' : ''
                        }`}
                        style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewOf(photo)}
                            alt=""
                            draggable={false}
                            className={`h-full w-full rounded-xl object-cover ring-2 transition-all ${
                                isActive
                                    ? 'ring-action-primary'
                                    : 'ring-transparent'
                            }`}
                            style={{ objectPosition: `${photo.cropX}% ${photo.cropY}%` }}
                        />
                        {/* 순서 번호 뱃지 */}
                        <span className={`absolute right-0.5 top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold shadow-sm ${
                            displayPosition === 0
                                ? 'bg-action-primary text-content-on-action'
                                : 'bg-neutral-800 text-white'
                        }`}>
                            {displayPosition + 1}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

// ---------------------------------------------------------------------------
// 크롭 오버레이
// ---------------------------------------------------------------------------

function CropOverlay({ photo, onCrop }: { photo: RecordPhoto; onCrop: (id: string, cropX: number, cropY: number) => void }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const dragging = useRef(false)
    const startPos = useRef({ x: 0, y: 0 })
    const startCrop = useRef({ x: photo.cropX, y: photo.cropY })

    const handlePointerDown = useCallback(
        (event: React.PointerEvent) => {
            event.preventDefault()
            event.stopPropagation()
            dragging.current = true
            startPos.current = { x: event.clientX, y: event.clientY }
            startCrop.current = { x: photo.cropX, y: photo.cropY }
            ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
        },
        [photo.cropX, photo.cropY],
    )

    const handlePointerMove = useCallback(
        (event: React.PointerEvent) => {
            if (!dragging.current) return
            event.preventDefault()
            event.stopPropagation()
            const container = containerRef.current
            if (!container) return

            const rect = container.getBoundingClientRect()
            const deltaX = ((event.clientX - startPos.current.x) / rect.width) * -100
            const deltaY = ((event.clientY - startPos.current.y) / rect.height) * -100

            const newCropX = Math.max(0, Math.min(100, startCrop.current.x + deltaX))
            const newCropY = Math.max(0, Math.min(100, startCrop.current.y + deltaY))

            onCrop(photo.id, Math.round(newCropX), Math.round(newCropY))
        },
        [photo.id, onCrop],
    )

    const handlePointerUp = useCallback(() => {
        dragging.current = false
    }, [])

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 cursor-grab rounded-2xl border-2 border-action-primary/60 touch-none active:cursor-grabbing"
        />
    )
}
