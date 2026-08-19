'use client'

import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'

export interface ImageCropperHandle {
    /** 지금 보이는 그대로를 정사각 이미지로 잘라 낸다. 아직 안 불러왔으면 null */
    crop(): Promise<Blob | null>
}

interface Props {
    /** 자를 원본. `URL.createObjectURL(file)` 또는 dataURL */
    src: string
    /** 크롭 창 한 변(px). 화면 폭에 맞춰 호출부가 정한다 */
    size?: number
    /** 저장될 이미지 한 변(px) */
    output?: number
    /** 최대 확대 배율 */
    maxZoom?: number
    /** 창 모양. 결과는 어느 쪽이든 정사각이고, 둥근 건 보여 주기만 하는 마스크다 */
    shape?: 'circle' | 'square'
    /** 잘라낼 때 쓸 형식. 그림 뱃지처럼 투명이 필요하면 png */
    mimeType?: 'image/jpeg' | 'image/png'
    className?: string
}

/**
 * 사진을 끌어 옮기고 확대해서 정사각으로 자르는 창.
 *
 * ## 왜 공통으로 뺐나
 *
 * 프로필 사진(`ProfilePhotoChange`)과 챌린짓 대표 사진(`CoverPhotoStep`)에 **똑같은
 * 계산이 통째로 복사돼 있었다** — 클램프, 포인터 드래그, 캔버스 역산까지 줄 단위로 같았다.
 * 여기에 로그잇 표지와 커스텀 뱃지 이미지까지 같은 동작을 요구받으면서, 같은 코드가
 * 네 벌이 될 참이었다. 자르는 규칙이 화면마다 달라지면 사용자는 매번 다시 배워야 한다.
 *
 * ## 화면마다 다른 것은 밖에 남겼다
 *
 * 버튼 배치·문구·다음 단계는 화면마다 크게 다르다(전체 페이지 / 마법사 한 단계 / 시트).
 * 그래서 **창과 확대 슬라이더만** 이 컴포넌트가 갖고, "자르기"는 `ref`로 불러 쓴다.
 *
 * ```tsx
 * const cropper = useRef<ImageCropperHandle>(null)
 * <ImageCropper ref={cropper} src={src} />
 * const blob = await cropper.current?.crop()
 * ```
 *
 * ## 규칙 하나: 사진이 창을 늘 덮는다
 *
 * `clamp`가 이동 범위를 이미지 크기 안으로 가둔다. 이게 없으면 가장자리를 끌었을 때
 * 빈 자리가 생겨 **투명이 섞인 결과물**이 나온다.
 */
export const ImageCropper = forwardRef<ImageCropperHandle, Props>(function ImageCropper(
    { src, size = 240, output = 512, maxZoom = 3, shape = 'circle', mimeType = 'image/jpeg', className = '' },
    ref,
) {
    const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
    const [zoom, setZoom] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })

    const imgRef = useRef<HTMLImageElement>(null)
    const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

    // 사진이 바뀌면 확대·위치를 처음으로 되돌린다 — 앞 사진의 값이 남으면 엉뚱한 데가 잡힌다
    const lastSrc = useRef(src)
    if (lastSrc.current !== src) {
        lastSrc.current = src
        setNat(null)
        setZoom(1)
        setOffset({ x: 0, y: 0 })
    }

    /** 짧은 변이 창을 꽉 채우는 배율 */
    const base = nat ? size / Math.min(nat.w, nat.h) : 1

    const clamp = (off: { x: number; y: number }, z: number) => {
        if (!nat) return off
        const maxX = Math.max(0, (nat.w * base * z - size) / 2)
        const maxY = Math.max(0, (nat.h * base * z - size) / 2)
        return {
            x: Math.max(-maxX, Math.min(maxX, off.x)),
            y: Math.max(-maxY, Math.min(maxY, off.y)),
        }
    }

    const changeZoom = (z: number) => {
        setZoom(z)
        setOffset((current) => clamp(current, z))
    }

    useImperativeHandle(ref, () => ({
        crop: () =>
            new Promise((resolve) => {
                const img = imgRef.current
                if (!img || !nat) {
                    resolve(null)
                    return
                }
                // 화면에 그린 것과 **같은 변환**을 되짚어 원본에서 잘라낼 사각형을 구한다
                const scale = base * zoom
                const left = size / 2 + offset.x - (nat.w * scale) / 2
                const top = size / 2 + offset.y - (nat.h * scale) / 2

                const canvas = document.createElement('canvas')
                canvas.width = output
                canvas.height = output
                const context = canvas.getContext('2d')
                if (!context) {
                    resolve(null)
                    return
                }
                context.drawImage(img, -left / scale, -top / scale, size / scale, size / scale, 0, 0, output, output)
                canvas.toBlob(resolve, mimeType, 0.9)
            }),
    }))

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId)
                    drag.current = { sx: event.clientX, sy: event.clientY, ox: offset.x, oy: offset.y }
                }}
                onPointerMove={(event) => {
                    const start = drag.current
                    if (!start) return
                    setOffset(
                        clamp(
                            { x: start.ox + (event.clientX - start.sx), y: start.oy + (event.clientY - start.sy) },
                            zoom,
                        ),
                    )
                }}
                onPointerUp={() => {
                    drag.current = null
                }}
                // touch-none이 없으면 끌 때 페이지가 같이 스크롤된다
                className={`relative touch-none overflow-hidden bg-neutral-100 shadow-inner ${
                    shape === 'circle' ? 'rounded-full' : 'rounded-3xl'
                }`}
                style={{ width: size, height: size, cursor: 'grab' }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- blob:·dataURL이라 next/image 대상이 아니다 */}
                <img
                    ref={imgRef}
                    src={src}
                    alt=""
                    draggable={false}
                    onLoad={(event) =>
                        setNat({ w: event.currentTarget.naturalWidth, h: event.currentTarget.naturalHeight })
                    }
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: nat ? nat.w * base * zoom : 'auto',
                        height: nat ? nat.h * base * zoom : 'auto',
                        // 크기를 재기 전에 보이면 원본 크기로 한 번 번쩍인다
                        visibility: nat ? 'visible' : 'hidden',
                        maxWidth: 'none',
                        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                        userSelect: 'none',
                        pointerEvents: 'none',
                    }}
                />
                <span
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 ring-2 ring-white/70 ${
                        shape === 'circle' ? 'rounded-full' : 'rounded-3xl'
                    }`}
                />
            </div>

            <p className="mt-3 text-xs text-content-muted">끌어서 위치를, 아래 막대로 크기를 맞춰요</p>
            <input
                type="range"
                min={1}
                max={maxZoom}
                step={0.01}
                value={zoom}
                onChange={(event) => changeZoom(Number(event.target.value))}
                aria-label="확대"
                // h-11 — 막대는 얇아도 잡히는 높이는 44px이어야 한다 (§5 최소 터치 타깃)
                className="mt-1 h-11 w-full max-w-xs cursor-pointer accent-watermelon-500"
            />
        </div>
    )
})
