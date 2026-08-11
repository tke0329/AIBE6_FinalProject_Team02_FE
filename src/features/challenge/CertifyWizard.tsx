import React, { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftIcon, CameraIcon, CheckCircleIcon, MapPinIcon, StarIcon, XIcon } from 'lucide-react'
import { Confetti } from './Confetti'

interface Props {
    name: string
    placeName?: string | null
    onUnlock: (file: File, coords: { lat: number; lng: number }) => Promise<{ completed: boolean }>
    onSubmitReview: (payload: { content: string | null; rating: number | null }) => Promise<void>
    onClose: (completed: boolean) => void
}

const PHOTO = 0
const LOCATION = 1
const REVIEW = 2

const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}

export function CertifyWizard({ name, placeName, onUnlock, onSubmitReview, onClose }: Props) {
    const [[step, dir], setStepDir] = useState<[number, number]>([PHOTO, 0])
    const go = (next: number) => setStepDir([next, next > step ? 1 : -1])

    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState('')
    const fileRef = useRef<HTMLInputElement>(null)

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [locating, setLocating] = useState(false)

    const [rating, setRating] = useState(0)
    const [review, setReview] = useState('')

    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [completed, setCompleted] = useState(false)

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        e.target.value = ''
        if (!f) return
        setFile(f)
        setPreview(URL.createObjectURL(f))
    }

    const captureLocation = () => {
        if (!navigator.geolocation) {
            setError('이 브라우저에서는 위치를 쓸 수 없어요')
            return
        }
        setLocating(true)
        setError('')
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setLocating(false)
            },
            () => {
                setError('위치 권한을 허용해 주세요')
                setLocating(false)
            },
            { enableHighAccuracy: true, timeout: 10_000 },
        )
    }

    // 위치 확인(2단계) → 실제 해금 실행 → 리뷰(3단계)
    const submitUnlock = async () => {
        if (!file || !coords) return
        setBusy(true)
        setError('')
        try {
            const res = await onUnlock(file, coords)
            setCompleted(res.completed)
            go(REVIEW)
        } catch (e) {
            setError(e instanceof Error ? e.message : '인증에 실패했어요. 다시 시도해 주세요.')
        } finally {
            setBusy(false)
        }
    }

    const submitReview = async () => {
        setBusy(true)
        setError('')
        try {
            await onSubmitReview({ content: review.trim() || null, rating: rating || null })
            onClose(completed)
        } catch (e) {
            setError(e instanceof Error ? e.message : '리뷰 등록에 실패했어요')
        } finally {
            setBusy(false)
        }
    }

    const titles = ['사진 인증', '위치 확인', '리뷰 남기기']

    return (
        <div className="absolute inset-0 z-30 flex flex-col bg-white">
            {step === REVIEW && <Confetti />}
            <header className="flex items-center gap-3 px-5 py-4">
                {step === LOCATION && !busy ? (
                    <button onClick={() => go(PHOTO)} aria-label="이전">
                        <ArrowLeftIcon size={22} className="text-neutral-900" />
                    </button>
                ) : (
                    <span className="w-[22px]" />
                )}
                <span className="font-display text-lg text-neutral-900">{name}</span>
                <button
                    onClick={() => onClose(completed)}
                    disabled={busy}
                    aria-label="닫기"
                    className="ml-auto disabled:opacity-40"
                >
                    <XIcon size={22} className="text-neutral-400" />
                </button>
            </header>

            <div className="mx-5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <motion.div
                    className="h-full rounded-full bg-watermelon-500"
                    animate={{ width: `${((step + 1) / 3) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                />
            </div>
            <p className="mt-2 px-5 text-xs font-bold text-neutral-800">
                {step + 1} / 3 · {titles[step]}
            </p>

            <div className="relative flex-1 overflow-hidden">
                <AnimatePresence mode="wait" custom={dir}>
                    <motion.div
                        key={step}
                        custom={dir}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        className="absolute inset-0 overflow-y-auto px-5 py-4"
                    >
                        {step === PHOTO && (
                            <div>
                                <h1 className="font-display text-2xl text-neutral-900">사진으로 인증해요</h1>
                                <p className="mt-1 text-sm text-neutral-800">먹은 음식 사진을 한 장 올려주세요.</p>
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="mt-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl bg-neutral-50 text-sm text-neutral-400"
                                >
                                    {preview ? (
                                        <img src={preview} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="flex flex-col items-center gap-2">
                                            <CameraIcon size={34} />
                                            사진 올리기
                                        </span>
                                    )}
                                </button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={onFile}
                                />
                            </div>
                        )}

                        {step === LOCATION && (
                            <div>
                                <h1 className="font-display text-2xl text-neutral-900">위치를 확인해요</h1>
                                <p className="mt-1 text-sm text-neutral-800">지정 장소 근처에서만 인증할 수 있어요.</p>
                                <div className="mt-4 rounded-3xl bg-white p-4">
                                    <p className="flex items-center gap-1 text-sm font-bold text-neutral-800">
                                        <MapPinIcon size={16} /> {placeName ?? '지정 위치'}
                                    </p>
                                    <div className="mt-3">
                                        {coords ? (
                                            <p className="flex items-center gap-1 text-sm font-bold text-lime-text">
                                                <CheckCircleIcon size={16} /> 현재 위치 확인됨
                                            </p>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={captureLocation}
                                                disabled={locating}
                                                className="w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                                            >
                                                {locating ? '위치 확인 중…' : '현재 위치 확인'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === REVIEW && (
                            <div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-watermelon-100 text-watermelon-500"
                                >
                                    <CheckCircleIcon size={36} />
                                </motion.div>
                                <h1 className="mt-3 text-center font-display text-2xl text-neutral-900">인증 완료!</h1>
                                <p className="mt-1 text-center text-sm text-neutral-800">
                                    방금 다녀온 곳, 한 줄 남겨줄래요?
                                </p>

                                <div className="mt-5 flex justify-center">
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setRating(rating === n ? 0 : n)}
                                                aria-label={`별점 ${n}`}
                                                className={n <= rating ? 'text-watermelon-500' : 'text-neutral-200'}
                                            >
                                                <StarIcon size={34} fill={n <= rating ? 'currentColor' : 'none'} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <textarea
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    rows={3}
                                    maxLength={500}
                                    placeholder="맛·분위기·팁을 자유롭게 적어주세요 (선택)"
                                    className="mt-4 w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {error && <p className="px-5 pb-1 text-xs font-medium text-red-500">{error}</p>}

            <div className="border-t border-neutral-100 bg-white px-5 py-4">
                {step === PHOTO && (
                    <button
                        type="button"
                        onClick={() => go(LOCATION)}
                        disabled={!file}
                        className="h-cta w-full rounded-full bg-watermelon-500 font-display text-lg text-white shadow-card disabled:bg-action-disabled-bg disabled:text-action-disabled-text disabled:shadow-none"
                    >
                        다음
                    </button>
                )}
                {step === LOCATION && (
                    <button
                        type="button"
                        onClick={submitUnlock}
                        disabled={!coords || busy}
                        className="h-cta w-full rounded-full bg-watermelon-500 font-display text-lg text-white shadow-card disabled:bg-action-disabled-bg disabled:text-action-disabled-text disabled:shadow-none"
                    >
                        {busy ? '인증 중…' : '인증하기'}
                    </button>
                )}
                {step === REVIEW && (
                    <div className="flex flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={submitReview}
                            disabled={busy}
                            className="h-cta w-full rounded-full bg-watermelon-500 font-display text-lg text-white shadow-card disabled:opacity-60"
                        >
                            {busy ? '등록 중…' : '리뷰 등록'}
                        </button>
                        <button
                            type="button"
                            onClick={() => onClose(completed)}
                            disabled={busy}
                            className="text-xs font-medium text-neutral-400 underline underline-offset-2 disabled:opacity-40"
                        >
                            건너뛰기
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
