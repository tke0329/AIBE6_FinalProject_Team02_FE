import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeftIcon, EraserIcon, ImagePlusIcon, PaintbrushIcon, RotateCcwIcon, Sparkles } from 'lucide-react'
import { RewardBadge } from './types'

type BadgeTab = '그림으로 그리기' | '이미지로 만들기'
interface Props {
    onBack: () => void
    onSave: (badge: RewardBadge) => void
}
const COLORS = ['#f97316', '#ef4444', '#eab308', '#22c55e', '#0ea5e9', '#8b5cf6', '#3f2a1d']

export function BadgeCustom({ onBack, onSave }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const drawingRef = useRef(false)
    const [tab, setTab] = useState<BadgeTab>('그림으로 그리기')
    const [color, setColor] = useState(COLORS[0])
    const [size, setSize] = useState(8)
    const [eraser, setEraser] = useState(false)
    const [uploaded, setUploaded] = useState<string | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [name, setName] = useState('나만의 완주 뱃지')
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const context = canvas.getContext('2d')
        if (!context) return
        context.fillStyle = '#fff8ed'
        context.fillRect(0, 0, canvas.width, canvas.height)
        setPreview(canvas.toDataURL())
    }, [])
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
        context.strokeStyle = eraser ? '#fff8ed' : color
        context.lineTo(point.x, point.y)
        context.stroke()
        setPreview(canvas.toDataURL())
    }
    const clear = () => {
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')
        if (!canvas || !context) return
        context.fillStyle = '#fff8ed'
        context.fillRect(0, 0, canvas.width, canvas.height)
        setPreview(canvas.toDataURL())
    }
    const upload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            const result = String(reader.result)
            setUploaded(result)
            setPreview(result)
        }
        reader.readAsDataURL(file)
    }
    const save = () => {
        const image = tab === '이미지로 만들기' ? uploaded : canvasRef.current?.toDataURL()
        if (!image) return
        onSave({
            emoji: '✨',
            name: name.trim() || '나만의 완주 뱃지',
            tone: 'bg-watermelon-100 text-watermelon-700',
            customImage: image,
        })
    }
    return (
        <div className="flex h-full flex-col bg-surface-app">
            <header className="flex items-center gap-3 px-5 py-4">
                <button onClick={onBack} aria-label="뒤로가기">
                    <ArrowLeftIcon size={22} />
                </button>
                <span className="font-display text-lg text-neutral-900">커스텀 뱃지 만들기</span>
            </header>
            <main className="no-scrollbar flex-1 overflow-y-auto px-5">
                <div className="grid grid-cols-2 rounded-2xl bg-neutral-100 p-1">
                    {(['그림으로 그리기', '이미지로 만들기'] as BadgeTab[]).map((item) => (
                        <button
                            key={item}
                            onClick={() => setTab(item)}
                            className={`rounded-xl py-2 text-sm font-bold ${tab === item ? 'bg-white text-watermelon-600 shadow-soft' : 'text-neutral-400'}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
                <section className="mt-5 flex flex-col items-center">
                    <div className="relative h-52 w-52 overflow-hidden rounded-full border-4 border-white bg-watermelon-50 shadow-card">
                        {tab === '그림으로 그리기' ? (
                            <canvas
                                ref={canvasRef}
                                width={320}
                                height={320}
                                onPointerDown={drawStart}
                                onPointerMove={drawMove}
                                onPointerUp={() => {
                                    drawingRef.current = false
                                }}
                                onPointerLeave={() => {
                                    drawingRef.current = false
                                }}
                                className="h-full w-full touch-none"
                            />
                        ) : uploaded ? (
                            <img src={uploaded} alt="업로드한 뱃지 미리보기" className="h-full w-full object-cover" />
                        ) : (
                            <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-neutral-400">
                                <ImagePlusIcon size={28} />
                                <span className="text-sm font-bold">이미지 선택</span>
                                <input type="file" accept="image/*" onChange={upload} className="sr-only" />
                            </label>
                        )}
                    </div>
                    <p className="mt-3 text-xs text-neutral-400">원형 프레임에 맞춰 미리보기로 확인하세요.</p>
                </section>
                {tab === '그림으로 그리기' ? (
                    <section className="mt-5 rounded-2xl bg-white p-4 shadow-soft">
                        <div className="flex items-center justify-between">
                            <p className="flex items-center gap-1.5 text-sm font-bold text-neutral-900">
                                <PaintbrushIcon size={16} className="text-watermelon-500" />
                                그리기 도구
                            </p>
                            <button
                                onClick={clear}
                                className="flex items-center gap-1 text-xs font-bold text-neutral-400"
                            >
                                <RotateCcwIcon size={14} />
                                초기화
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {COLORS.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => {
                                        setColor(item)
                                        setEraser(false)
                                    }}
                                    aria-label={`${item} 색상`}
                                    className={`h-7 w-7 rounded-full border-2 ${color === item && !eraser ? 'border-neutral-900 scale-110' : 'border-white'}`}
                                    style={{ backgroundColor: item }}
                                />
                            ))}
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-xs font-bold text-neutral-800">굵기</span>
                            {[5, 10, 16].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => {
                                        setSize(value)
                                        setEraser(false)
                                    }}
                                    className={`flex h-8 w-8 items-center justify-center rounded-full ${size === value && !eraser ? 'bg-watermelon-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}
                                >
                                    <span className="rounded-full bg-current" style={{ width: value, height: value }} />
                                </button>
                            ))}
                            <button
                                onClick={() => setEraser(true)}
                                className={`ml-auto flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold ${eraser ? 'bg-watermelon-500 text-white' : 'bg-neutral-100 text-neutral-800'}`}
                            >
                                <EraserIcon size={14} />
                                지우개
                            </button>
                        </div>
                    </section>
                ) : (
                    <section className="mt-5 rounded-2xl bg-white p-4 shadow-soft">
                        <p className="text-sm font-bold text-neutral-900">이미지로 만들기</p>
                        <p className="mt-1 text-xs leading-5 text-neutral-400">
                            사진을 선택하면 원형 프레임 중앙에 맞춰 잘려 보여요.
                        </p>
                        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-watermelon-300 bg-watermelon-50 py-3 text-sm font-bold text-watermelon-600">
                            <ImagePlusIcon size={17} />
                            이미지 다시 선택
                            <input type="file" accept="image/*" onChange={upload} className="sr-only" />
                        </label>
                    </section>
                )}
                <label className="mt-5 block">
                    <span className="mb-1.5 block text-sm font-bold text-neutral-900">뱃지 이름</span>
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={18}
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-watermelon-400"
                    />
                </label>
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-watermelon-50">
                        {preview ? (
                            <img src={preview} alt="실시간 뱃지 미리보기" className="h-full w-full object-cover" />
                        ) : (
                            <Sparkles size={22} strokeWidth={1.5} aria-hidden className="text-watermelon-500" />
                        )}
                    </span>
                    <span>
                        <p className="text-xs text-neutral-400">실시간 미리보기</p>
                        <p className="text-sm font-bold text-neutral-900">{name || '나만의 완주 뱃지'}</p>
                    </span>
                </div>
            </main>
            <div className="px-5 pb-8 pt-4">
                <button
                    onClick={save}
                    disabled={tab === '이미지로 만들기' && !uploaded}
                    className="w-full rounded-2xl bg-watermelon-500 py-4 font-display text-lg text-white shadow-card disabled:opacity-40"
                >
                    완료
                </button>
            </div>
        </div>
    )
}
