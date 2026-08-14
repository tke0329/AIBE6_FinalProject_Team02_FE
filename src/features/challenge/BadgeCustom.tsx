'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { EraserIcon, ImagePlusIcon, PaintbrushIcon, RotateCcwIcon, Sparkles } from 'lucide-react'
import { Button, ImageCropper, ImageCropperHandle, PageHeader, TextField } from '@/shared/ui'
import { RewardBadge } from './types'

type BadgeTab = '그림으로 그리기' | '이미지로 만들기'

interface Props {
    onBack: () => void
    onSave: (badge: RewardBadge) => void
}

/**
 * 선 색. **흰색을 넣었다** — 어두운 배경에 그릴 때 필요한데 없었다.
 *
 * 흰 견본은 흰 카드 위에서 윤곽이 사라지므로 **모든 견본에 회색 링을 두른다.**
 * 선택된 것만 테두리를 진하게 하는 방식이면 흰색은 안 골랐을 때 보이지 않는다.
 */
const COLORS = ['#3F2A1D', '#F97316', '#EF4444', '#EAB308', '#22C55E', '#0EA5E9', '#8B5CF6', '#FFFFFF']

/**
 * 그림판 바탕색. 예전에는 `#fff8ed` 하나로 고정이었다.
 *
 * 배경을 **캔버스에 칠하지 않는다** — 뒤에 CSS로 깔고 캔버스는 선만 담는다.
 * 그래야 배경을 바꿔도 그린 선이 살아 있고, 지우개도 배경색을 몰라도 된다
 * (`destination-out`으로 선만 파낸다). 예전 구조에서는 배경을 바꾸면 그림이
 * 지워지고, 배경을 바꾼 뒤 지우개를 쓰면 **옛 배경색이 칠해졌다.**
 */
const BACKGROUNDS = ['#FFF8ED', '#FFFFFF', '#FFE0E7', '#D6EFE0', '#CFE1F5', '#F2E8FF', '#2A2A2A']

/** 캔버스 실제 해상도. 그림판을 키워도 저장 크기는 이 값으로 고정한다 */
const CANVAS_PX = 480

/**
 * 굵기 범위. 미리보기 점을 실제 크기로 그리므로 **최댓값이 미리보기 칸(40px)과 같다.**
 * 더 키우면 점이 칸을 넘친다
 */
const SIZE_MIN = 2
const SIZE_MAX = 40
/** 지우개는 펜보다 굵은 쪽이 기본 — 지울 때는 대개 넓게 쓸어낸다 */
const PEN_DEFAULT = 10
const ERASER_DEFAULT = 24

const NAME_MAX = 18
const DEFAULT_NAME = '나만의 완주 뱃지'

export function BadgeCustom({ onBack, onSave }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const drawingRef = useRef(false)
    const [tab, setTab] = useState<BadgeTab>('그림으로 그리기')
    const [color, setColor] = useState(COLORS[0])
    const [background, setBackground] = useState(BACKGROUNDS[0])
    /**
     * 굵기를 **도구별로 따로 기억한다.**
     *
     * 예전에는 굵기가 하나였고, 굵기 버튼을 누르면 `setEraser(false)`가 같이 돌았다.
     * 그래서 **지우개 굵기는 아예 바꿀 수 없었다** — 바꾸려고 누르는 순간 펜으로 돌아갔다.
     * 따로 두면 지우개를 굵게 써 두고 펜으로 돌아와도 내 펜 굵기가 그대로다
     */
    const [penSize, setPenSize] = useState(PEN_DEFAULT)
    const [eraserSize, setEraserSize] = useState(ERASER_DEFAULT)
    const [eraser, setEraser] = useState(false)
    const size = eraser ? eraserSize : penSize
    const setSize = (value: number) => (eraser ? setEraserSize(value) : setPenSize(value))
    /** 고른 원본. 자르기가 끝나기 전까지는 결과가 아니다 */
    const [picked, setPicked] = useState<string | null>(null)
    const [uploaded, setUploaded] = useState<string | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [name, setName] = useState(DEFAULT_NAME)
    const cropper = useRef<ImageCropperHandle>(null)

    /**
     * 배경 + 선을 한 장으로 합친다. 캔버스는 선만 갖고 있으므로
     * 미리보기와 저장에는 이 합성본을 쓴다
     */
    const flatten = useCallback((): string | null => {
        const strokes = canvasRef.current
        if (!strokes) return null
        const out = document.createElement('canvas')
        out.width = CANVAS_PX
        out.height = CANVAS_PX
        const context = out.getContext('2d')
        if (!context) return null
        context.fillStyle = background
        context.fillRect(0, 0, CANVAS_PX, CANVAS_PX)
        context.drawImage(strokes, 0, 0)
        return out.toDataURL()
    }, [background])

    // 배경을 바꾸면 미리보기도 그 색으로 다시 만든다
    useEffect(() => {
        if (tab === '그림으로 그리기') setPreview(flatten())
    }, [flatten, tab])

    const position = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect()
        return {
            x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width),
            y: (event.clientY - rect.top) * (event.currentTarget.height / rect.height),
        }
    }

    const drawStart = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const context = canvasRef.current?.getContext('2d')
        if (!context) return
        const point = position(event)
        drawingRef.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        context.beginPath()
        context.moveTo(point.x, point.y)
    }

    const drawMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current) return
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')
        if (!canvas || !context) return
        const point = position(event)
        context.lineCap = 'round'
        context.lineJoin = 'round'
        context.lineWidth = size
        // 지우개는 배경색을 칠하지 않고 선을 파낸다 — 배경이 무엇이든 상관없어진다
        context.globalCompositeOperation = eraser ? 'destination-out' : 'source-over'
        context.strokeStyle = color
        context.lineTo(point.x, point.y)
        context.stroke()
        setPreview(flatten())
    }

    const stopDrawing = () => {
        drawingRef.current = false
    }

    const clear = () => {
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')
        if (!canvas || !context) return
        context.clearRect(0, 0, canvas.width, canvas.height)
        setPreview(flatten())
    }

    /**
     * 고르면 **바로 쓰지 않고 자르기 창을 연다.**
     *
     * 예전에는 고른 파일을 그대로 뱃지로 썼다. 뱃지는 원형으로 잘려 보이는데
     * 가로·세로가 다른 사진은 가운데만 남아, 정작 보여 주고 싶은 부분이 잘려 나갔다.
     * 프로필·챌린짓 대표 사진과 같은 창(`ImageCropper`)을 써서 규칙을 하나로 맞춘다
     */
    const upload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        setPicked(URL.createObjectURL(file))
        event.target.value = '' // 같은 파일 다시 고르기 허용
    }

    const applyCrop = async () => {
        // png — 뱃지는 원형으로 잘려 보이므로 투명이 살아 있어야 모서리가 깨끗하다
        const blob = await cropper.current?.crop()
        if (!blob) return
        const reader = new FileReader()
        reader.onload = () => {
            const result = String(reader.result)
            setUploaded(result)
            setPreview(result)
            setPicked(null)
        }
        reader.readAsDataURL(blob)
    }

    const save = () => {
        const image = tab === '이미지로 만들기' ? uploaded : flatten()
        if (!image) return
        onSave({
            emoji: '✨',
            name: name.trim() || DEFAULT_NAME,
            tone: 'bg-watermelon-100 text-watermelon-700',
            customImage: image,
        })
    }

    return (
        <div className="flex h-full flex-col bg-surface-app">
            <PageHeader title="커스텀 뱃지 만들기" onBack={onBack} />

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
                <div className="grid grid-cols-2 rounded-2xl bg-neutral-100 p-1">
                    {(['그림으로 그리기', '이미지로 만들기'] as BadgeTab[]).map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setTab(item)}
                            aria-pressed={tab === item}
                            className={`min-h-touch rounded-xl text-sm font-bold ${
                                tab === item ? 'bg-white text-content-link shadow-soft' : 'text-content-muted'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {/*
                 * 미리보기와 이름을 **맨 위로** 올렸다. 예전에는 그림판 아래, 이름 아래에
                 * 48px짜리로 붙어 있어서 "완성된 뱃지가 어떻게 보이는지"를 확인하려면
                 * 스크롤을 내려야 했다. 결과를 위에 두고 도구를 아래에 둔다.
                 *
                 * 미리보기가 **이름보다 위**다 (요청). 크기도 48 → 112px.
                 */}
                <section className="flex flex-col items-center gap-3 pt-5">
                    <span
                        className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-card"
                        style={{ backgroundColor: background }}
                    >
                        {preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={preview} alt="뱃지 미리보기" className="h-full w-full object-cover" />
                        ) : (
                            <Sparkles size={30} strokeWidth={1.5} aria-hidden className="text-watermelon-500" />
                        )}
                    </span>
                    <p className="text-xs text-content-muted">완주하면 이 모양으로 받아요</p>
                </section>

                <div className="pt-5">
                    <TextField
                        label="뱃지 이름"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={DEFAULT_NAME}
                        count={{ current: name.length, max: NAME_MAX }}
                        maxLength={NAME_MAX}
                    />
                </div>

                {tab === '그림으로 그리기' ? (
                    <>
                        {/*
                         * 그림판은 **사각형**이고 위 미리보기가 원형이다. 예전에는 원형
                         * 프레임 안에서 바로 그려서, 모서리에 그린 것이 잘리는지 알 수 없었다.
                         * 나눠 두면 넓게 그리면서 잘리는 결과를 같이 볼 수 있다.
                         *
                         * 크기는 208px 원 → 화면 폭을 꽉 쓰는 정사각형으로 키웠다 (요청)
                         */}
                        <section className="pt-5">
                            <div
                                className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-card"
                                style={{ backgroundColor: background }}
                            >
                                <canvas
                                    ref={canvasRef}
                                    width={CANVAS_PX}
                                    height={CANVAS_PX}
                                    onPointerDown={drawStart}
                                    onPointerMove={drawMove}
                                    onPointerUp={stopDrawing}
                                    onPointerLeave={stopDrawing}
                                    aria-label="뱃지 그림판"
                                    className="h-full w-full touch-none"
                                />
                                {/* 원형으로 잘릴 경계. 바깥은 뱃지에서 안 보인다 */}
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 rounded-full border-2 border-dashed border-black/15"
                                />
                            </div>
                            <p className="pt-2 text-xs text-content-muted">점선 밖은 뱃지에서 잘려요</p>
                        </section>

                        <section className="mt-5 rounded-2xl bg-white p-4 shadow-soft">
                            <div className="flex items-center justify-between">
                                <p className="flex items-center gap-1.5 text-sm font-bold text-content-primary">
                                    <PaintbrushIcon size={16} aria-hidden className="text-watermelon-500" />
                                    그리기 도구
                                </p>
                                <button
                                    type="button"
                                    onClick={clear}
                                    className="flex min-h-touch items-center gap-1 text-xs font-bold text-content-secondary"
                                >
                                    <RotateCcwIcon size={14} aria-hidden />
                                    초기화
                                </button>
                            </div>

                            <p className="mt-4 text-xs font-bold text-content-secondary">바탕색</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {BACKGROUNDS.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setBackground(item)}
                                        aria-label={`바탕색 ${item}`}
                                        aria-pressed={background === item}
                                        // 링을 늘 둘러서 흰 견본도 흰 카드 위에서 보인다
                                        className={`no-touch-expand h-8 w-8 rounded-lg ring-1 ring-neutral-300 ${
                                            background === item ? 'ring-2 ring-offset-2 ring-neutral-900' : ''
                                        }`}
                                        style={{ backgroundColor: item }}
                                    />
                                ))}
                            </div>

                            <p className="mt-4 text-xs font-bold text-content-secondary">선 색</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {COLORS.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => {
                                            setColor(item)
                                            setEraser(false)
                                        }}
                                        aria-label={`선 색 ${item}`}
                                        aria-pressed={color === item && !eraser}
                                        className={`no-touch-expand h-8 w-8 rounded-full ring-1 ring-neutral-300 ${
                                            color === item && !eraser ? 'ring-2 ring-offset-2 ring-neutral-900' : ''
                                        }`}
                                        style={{ backgroundColor: item }}
                                    />
                                ))}
                            </div>

                            <p className="mt-4 text-xs font-bold text-content-secondary">도구</p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <ToolButton active={!eraser} onClick={() => setEraser(false)}>
                                    <PaintbrushIcon size={15} aria-hidden />펜
                                </ToolButton>
                                <ToolButton active={eraser} onClick={() => setEraser(true)}>
                                    <EraserIcon size={15} aria-hidden />
                                    지우개
                                </ToolButton>
                            </div>

                            {/*
                             * 굵기는 슬라이더 하나로, **지금 고른 도구의 굵기**를 바꾼다.
                             * 6·12·22 세 단추뿐이라 그 사이 굵기를 못 썼고, 지우개는 굵기를
                             * 고를 방법 자체가 없었다 (`penSize`/`eraserSize` 주석 참고)
                             */}
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-xs font-bold text-content-secondary">
                                    {eraser ? '지우개' : '펜'} 굵기
                                </span>
                                <span className="flex items-center gap-2">
                                    {/* 실제 굵기로 그린 점 — 숫자만으로는 얼마나 굵은지 안 잡힌다 */}
                                    <span aria-hidden className="flex h-10 w-10 items-center justify-center">
                                        <span
                                            className={`rounded-full ${
                                                eraser ? 'border-2 border-dashed border-neutral-300' : ''
                                            }`}
                                            style={{
                                                width: size,
                                                height: size,
                                                // 흰 선도 흰 카드 위에서 보이도록 테두리를 두른다
                                                backgroundColor: eraser ? 'transparent' : color,
                                                boxShadow: eraser ? undefined : 'inset 0 0 0 1px rgb(0 0 0 / 0.12)',
                                            }}
                                        />
                                    </span>
                                    <span className="w-6 text-right text-xs font-bold tabular-nums text-content-primary">
                                        {size}
                                    </span>
                                </span>
                            </div>
                            <input
                                type="range"
                                min={SIZE_MIN}
                                max={SIZE_MAX}
                                value={size}
                                onChange={(event) => setSize(Number(event.target.value))}
                                aria-label={`${eraser ? '지우개' : '펜'} 굵기`}
                                // h-11 — 트랙은 얇아도 잡히는 높이는 44px이어야 한다 (§5 최소 터치 타깃).
                                // accent-*로 브랜드 색을 입히면 채워진 구간과 손잡이가 같이 물든다
                                className="h-11 w-full cursor-pointer accent-watermelon-500"
                            />
                        </section>
                    </>
                ) : (
                    <section className="mt-5 rounded-2xl bg-white p-4 shadow-soft">
                        <p className="text-sm font-bold text-content-primary">이미지로 만들기</p>
                        {picked ? (
                            <>
                                <p className="mt-1 text-xs leading-5 text-content-muted">
                                    끌어서 위치를, 막대로 크기를 맞춰요. 원 밖은 뱃지에서 잘려요.
                                </p>
                                <ImageCropper
                                    ref={cropper}
                                    src={picked}
                                    size={240}
                                    mimeType="image/png"
                                    className="mt-3"
                                />
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <Button variant="secondary" size="md" onClick={() => setPicked(null)}>
                                        취소
                                    </Button>
                                    <Button size="md" onClick={applyCrop}>
                                        이 사진 사용
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="mt-1 text-xs leading-5 text-content-muted">
                                    사진을 고르면 위치와 크기를 맞출 수 있어요.
                                </p>
                                <label className="mt-3 flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-watermelon-300 bg-watermelon-50 text-sm font-bold text-content-link">
                                    <ImagePlusIcon size={17} aria-hidden />
                                    {uploaded ? '이미지 다시 선택' : '이미지 선택'}
                                    <input type="file" accept="image/*" onChange={upload} className="sr-only" />
                                </label>
                            </>
                        )}
                    </section>
                )}
            </main>

            <div className="shrink-0 px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3">
                <Button fullWidth disabled={tab === '이미지로 만들기' && !uploaded} onClick={save}>
                    완료
                </Button>
            </div>
        </div>
    )
}

/** 펜·지우개 둘 중 하나. 지금 무엇으로 그리는지가 늘 보여야 한다 */
function ToolButton({
    active,
    onClick,
    children,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`flex min-h-touch items-center justify-center gap-1.5 rounded-xl text-sm font-bold ${
                active ? 'bg-action-primary text-content-on-action' : 'bg-neutral-100 text-content-secondary'
            }`}
        >
            {children}
        </button>
    )
}
