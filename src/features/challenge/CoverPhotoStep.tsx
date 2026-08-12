'use client'

import { ImageIcon } from 'lucide-react'
import { useRef, useState } from 'react'

const V = 240 // 원형 크롭 뷰포트 한 변(px)
const OUTPUT = 512 // 저장 이미지 한 변(px)

interface Props {
    /** 이미 적용된 대표 사진 미리보기(있으면) */
    preview: string
    /** 크롭 완료된 정사각 이미지(Blob)와 미리보기 URL */
    onApply: (blob: Blob, previewUrl: string) => void
    /** 사진 제거 */
    onClear: () => void
}

/** 챌린지 대표 사진 — 원형으로 위치·확대 조절 후 등록 (마이 프로필 사진과 동일 방식) */
export function CoverPhotoStep({ preview, onApply, onClear }: Props) {
    const [src, setSrc] = useState<string | null>(null)
    const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
    const [zoom, setZoom] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })

    const imgRef = useRef<HTMLImageElement>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

    const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSrc(URL.createObjectURL(file))
        setNat(null)
        setZoom(1)
        setOffset({ x: 0, y: 0 })
        e.target.value = '' // 같은 파일 재선택 허용
    }

    const onImgLoad = () => {
        const el = imgRef.current
        if (el) setNat({ w: el.naturalWidth, h: el.naturalHeight })
    }

    // 이미지가 항상 뷰포트를 덮도록 offset을 제한
    const clamp = (off: { x: number; y: number }, z: number) => {
        if (!nat) return off
        const base = V / Math.min(nat.w, nat.h)
        const maxX = Math.max(0, (nat.w * base * z - V) / 2)
        const maxY = Math.max(0, (nat.h * base * z - V) / 2)
        return {
            x: Math.max(-maxX, Math.min(maxX, off.x)),
            y: Math.max(-maxY, Math.min(maxY, off.y)),
        }
    }

    const onPointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y }
    }
    const onPointerMove = (e: React.PointerEvent) => {
        if (!drag.current) return
        setOffset(
            clamp(
                {
                    x: drag.current.ox + (e.clientX - drag.current.sx),
                    y: drag.current.oy + (e.clientY - drag.current.sy),
                },
                zoom,
            ),
        )
    }
    const onPointerUp = () => {
        drag.current = null
    }
    const changeZoom = (z: number) => {
        setZoom(z)
        setOffset((o) => clamp(o, z))
    }

    // 화면 표시와 동일한 변환으로 원본에서 크롭 영역을 계산해 canvas로 추출
    const apply = () => {
        const img = imgRef.current
        if (!img || !nat) return
        const base = V / Math.min(nat.w, nat.h)
        const scale = base * zoom
        const dispW = nat.w * scale
        const dispH = nat.h * scale
        const imgLeft = V / 2 + offset.x - dispW / 2
        const imgTop = V / 2 + offset.y - dispH / 2
        const sx = -imgLeft / scale
        const sy = -imgTop / scale
        const sSize = V / scale

        const canvas = document.createElement('canvas')
        canvas.width = OUTPUT
        canvas.height = OUTPUT
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT)
        canvas.toBlob(
            (blob) => {
                if (blob) onApply(blob, URL.createObjectURL(blob))
            },
            'image/jpeg',
            0.9,
        )
        setSrc(null)
    }

    const base = nat ? V / Math.min(nat.w, nat.h) : 1

    return (
        <div>
            <p className="text-sm font-bold text-watermelon-500">대표 사진</p>
            <h1 className="mt-1 font-display text-2xl leading-snug text-neutral-900">챌린지 대표 사진을 골라요</h1>
            <p className="mt-2 text-sm text-neutral-400">
                선택 사항이에요. 드래그로 위치, 슬라이더로 확대를 조절할 수 있어요.
            </p>

            <div className="mt-6 flex flex-col items-center">
                {src ? (
                    // 크롭 모드
                    <>
                        <div
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            className="relative touch-none overflow-hidden rounded-full bg-neutral-100 shadow-inner"
                            style={{ width: V, height: V, cursor: 'grab' }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                ref={imgRef}
                                src={src}
                                alt=""
                                draggable={false}
                                onLoad={onImgLoad}
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    width: nat ? nat.w * base * zoom : 'auto',
                                    height: nat ? nat.h * base * zoom : 'auto',
                                    visibility: nat ? 'visible' : 'hidden',
                                    maxWidth: 'none',
                                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                }}
                            />
                            <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/70" />
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.01}
                            value={zoom}
                            onChange={(e) => changeZoom(Number(e.target.value))}
                            aria-label="확대"
                            className="mt-4 w-full max-w-xs accent-watermelon-500"
                        />
                        <div className="mt-4 flex w-full max-w-xs gap-2">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex-1 rounded-full bg-neutral-100 py-2.5 text-sm font-bold text-neutral-800"
                            >
                                다른 사진
                            </button>
                            <button
                                type="button"
                                onClick={apply}
                                className="flex-1 rounded-full bg-watermelon-500 py-2.5 text-sm font-bold text-white"
                            >
                                이 사진 사용
                            </button>
                        </div>
                    </>
                ) : preview ? (
                    // 적용된 미리보기
                    <>
                        <div className="h-60 w-60 overflow-hidden rounded-full bg-neutral-100 shadow-inner">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="대표 사진 미리보기" className="h-full w-full object-cover" />
                        </div>
                        <div className="mt-4 flex w-full max-w-xs gap-2">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex-1 rounded-full bg-neutral-100 py-2.5 text-sm font-bold text-neutral-800"
                            >
                                다른 사진
                            </button>
                            <button
                                type="button"
                                onClick={onClear}
                                className="flex-1 rounded-full bg-neutral-100 py-2.5 text-sm font-bold text-neutral-500"
                            >
                                제거
                            </button>
                        </div>
                    </>
                ) : (
                    // 선택 전 플레이스홀더
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex h-60 w-60 flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed border-neutral-200 bg-neutral-50 text-neutral-400"
                    >
                        <ImageIcon size={30} aria-hidden />
                        <span className="text-sm font-medium">앨범에서 선택</span>
                    </button>
                )}
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/heif"
                    onChange={pickFile}
                    className="hidden"
                />
            </div>
        </div>
    )
}
