'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ClockIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Confetti } from '@/features/challenge/Confetti'
import { ProgressBar, StarRank } from '@/shared/ui'

export interface RevealCard {
    slotId: number
    name: string
    emoji: string
    illustrationUrl?: string
    /** 별 랭크 1~3 */
    rank: number
    firstUnlock: boolean
}

interface Props {
    cards: RevealCard[]
    /** 검토를 기다리는 음식 이름들. 아직 열리지 않았고 수집률에도 없다 */
    awaitingReview: string[]
    collectedCount: number
    totalSlots: number
    onGoDex: () => void
}

/* --- 연출 박자 (초) --- */
/** 카드가 잠긴 면으로 올라온다 */
const RISE = 0.15
/** 뒤집히기 시작 */
const FLIP = 0.55
/** 카드 하나마다 밀리는 간격 — 동시에 뒤집히면 한 장이 커진 것처럼 보인다 */
const STAGGER = 0.5
const FLIP_MS = 0.6

/**
 * §7 시그니처 순간 — **도감 칸이 열리는 장면.**
 *
 * ## 무엇을 바꿨나
 *
 * 예전에는 카드가 그냥 나타나며 살짝 회전했다. 축하는 됐지만 **"도감을 채웠다"는
 * 느낌이 없었다** — 방금 무엇이 달라졌는지(몇 칸이 몇 칸이 됐는지)가 화면에 없었고,
 * 격자에서 보던 미해금 칸과 이 장면이 이어지지도 않았다.
 *
 * 그래서 셋을 붙였다.
 *
 * 1. **잠긴 면 → 열린 면 뒤집기.** 카드가 격자에서 보던 그 모습(흑백 `?` 실루엣)으로
 *    올라와서 뒤집힌다. 눌러서 등록한 그 칸이 지금 열리는 중이라는 게 눈으로 이어진다.
 * 2. **수집률이 차오른다.** 바가 0이 아니라 **원래 있던 자리에서** 늘어나고 숫자도
 *    같이 오른다. 늘어난 몫이 얼마인지가 보여야 "채웠다"가 된다.
 * 3. **별 도장.** 등급이 위에서 쿵 찍힌다.
 *
 * 중복 수집(이미 열린 칸)에는 뒤집기를 쓰지 않는다 — 열리는 장면을 재사용하면
 * 첫 해금의 감격이 닳는다. 카드는 이미 열린 면으로 올라오고 "+1 기록"만 붙는다.
 *
 * 대담한 모션은 이 화면 한 곳에만. prefers-reduced-motion이면 전부 생략하고 즉시 표시.
 */
export function UnlockReveal({ cards, awaitingReview, collectedCount, totalSlots, onGoDex }: Props) {
    const reduceMotion = useReducedMotion()

    const firstUnlocks = cards.filter((card) => card.firstUnlock)
    const celebrate = firstUnlocks.length > 0

    // 열린 칸이 하나도 없으면 축하할 것이 없다 — 검토 접수 안내로 대체한다
    if (cards.length === 0) {
        return <ReviewRequested names={awaitingReview} onGoDex={onGoDex} />
    }

    /** 등록 전 수집 칸 수. 중복 수집은 칸을 늘리지 않으므로 첫 해금 수만 뺀다 */
    const before = collectedCount - firstUnlocks.length
    /** 마지막 카드가 다 뒤집힌 뒤에 게이지가 움직인다 — 둘이 겹치면 어느 쪽도 안 읽힌다 */
    const gaugeDelay = FLIP + STAGGER * (cards.length - 1) + FLIP_MS

    const headline = !celebrate
        ? `+${cards.length} 기록`
        : firstUnlocks.length > 1
          ? `${firstUnlocks.length}칸 동시 해금!`
          : '도감 한 칸이 열렸어요!'

    return (
        <div
            className={`relative flex h-full flex-col items-center justify-center overflow-hidden px-8 text-center ${
                celebrate ? 'bg-watermelon-500' : 'bg-surface-app'
            }`}
        >
            {/* 컨페티는 첫 해금에만, 1회만 (무한 루프 장식 금지) */}
            {celebrate && !reduceMotion && <Confetti />}

            <motion.h1
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
                className={`mb-6 font-display text-xl ${celebrate ? 'text-white' : 'text-content-primary'}`}
            >
                {headline}
            </motion.h1>

            <div className="flex flex-wrap items-center justify-center gap-3">
                {cards.map((card, index) => (
                    <RevealTile
                        key={card.slotId}
                        card={card}
                        big={cards.length === 1}
                        delay={index * STAGGER}
                        reduceMotion={Boolean(reduceMotion)}
                    />
                ))}
            </div>

            {/* 도감이 얼마나 찼는지 — 이 장면의 결론이다 */}
            <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reduceMotion ? { duration: 0 } : { delay: gaugeDelay - 0.2, duration: 0.3 }}
                className={`mt-8 w-full max-w-xs rounded-2xl px-4 py-3 ${celebrate ? 'bg-white/15' : 'bg-surface-card shadow-card'}`}
            >
                <div className="mb-2 flex items-baseline justify-between">
                    <span className={`text-xs font-bold ${celebrate ? 'text-white/80' : 'text-content-secondary'}`}>
                        베이짓 수집
                    </span>
                    <span
                        className={`text-sm font-bold tabular-nums ${celebrate ? 'text-white' : 'text-content-primary'}`}
                    >
                        <CountUp from={before} to={collectedCount} delay={gaugeDelay} instant={Boolean(reduceMotion)} />{' '}
                        / {totalSlots}
                    </span>
                </div>
                <ProgressBar
                    value={collectedCount / Math.max(1, totalSlots)}
                    from={before / Math.max(1, totalSlots)}
                    delay={gaugeDelay}
                    label="베이짓 수집률"
                />
            </motion.div>

            {awaitingReview.length > 0 && (
                <p
                    className={`mt-4 rounded-2xl px-4 py-3 text-xs leading-5 ${
                        celebrate ? 'bg-white/15 text-white' : 'bg-surface-accent text-content-secondary'
                    }`}
                >
                    {awaitingReview.join(', ')}은(는) 확인되지 않아 검토를 요청했어요. 통과하면 도감이 열려요.
                </p>
            )}

            <motion.button
                type="button"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reduceMotion ? { duration: 0 } : { delay: gaugeDelay + 0.4 }}
                onClick={onGoDex}
                className={`mt-8 h-cta rounded-full border-2 px-10 font-display text-lg ${
                    celebrate ? 'border-white text-white' : 'border-watermelon-400 text-watermelon-600'
                }`}
            >
                도감 보러 가기
            </motion.button>
        </div>
    )
}

/**
 * 카드 한 장. **첫 해금이면 잠긴 면으로 올라와 뒤집힌다.**
 *
 * 두 면을 겹쳐 놓고 컨테이너를 `rotateY` 한다. `backfaceVisibility: hidden`이 없으면
 * 뒤집히는 동안 뒷면 글자가 거울처럼 비쳐 보인다. `perspective`가 없으면 회전이
 * 납작해져 **뒤집히는 게 아니라 가로로 찌그러졌다 펴지는** 것처럼 보인다.
 */
function RevealTile({
    card,
    big,
    delay,
    reduceMotion,
}: {
    card: RevealCard
    big: boolean
    delay: number
    reduceMotion: boolean
}) {
    const size = big ? 'h-52 w-44' : 'h-40 w-32'
    const art = big ? 'h-24 w-24' : 'h-16 w-16'
    // 중복 수집은 뒤집지 않는다 — 열리는 장면은 첫 해금의 것이다
    const flips = card.firstUnlock && !reduceMotion

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { delay: delay + RISE, duration: 0.35, ease: 'easeOut' }}
            style={{ perspective: 800 }}
            className={size}
        >
            <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: 'preserve-3d' }}
                initial={flips ? { rotateY: 180 } : false}
                animate={{ rotateY: 0 }}
                transition={
                    flips ? { delay: delay + FLIP, duration: FLIP_MS, ease: [0.2, 0.8, 0.2, 1] } : { duration: 0 }
                }
            >
                {/* 열린 면 */}
                <div
                    style={{ backfaceVisibility: 'hidden' }}
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-surface-card shadow-modal"
                >
                    {card.illustrationUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- presigned URL이라 next/image 최적화 대상이 아니다
                        <img src={card.illustrationUrl} alt="" className={`${art} object-contain`} />
                    ) : (
                        <span aria-hidden className={big ? 'text-7xl' : 'text-5xl'}>
                            {card.emoji}
                        </span>
                    )}
                    <span className={`mt-3 font-display text-content-primary ${big ? 'text-xl' : 'text-base'}`}>
                        {card.name}
                    </span>
                    {/* 별은 카드가 다 뒤집힌 뒤에 쿵 찍힌다 */}
                    <motion.div
                        className="mt-1"
                        initial={reduceMotion ? false : { scale: 2.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={
                            reduceMotion
                                ? { duration: 0 }
                                : { delay: delay + FLIP + FLIP_MS * 0.8, type: 'spring', stiffness: 500, damping: 18 }
                        }
                    >
                        <StarRank value={card.rank} size={16} />
                    </motion.div>
                    {!card.firstUnlock && (
                        <span className="mt-1 rounded-full bg-surface-accent px-2 py-0.5 text-xs font-bold text-content-link">
                            +1 기록
                        </span>
                    )}
                </div>

                {/* 잠긴 면 — 격자에서 보던 미해금 칸과 같은 모습 */}
                {flips && (
                    <div
                        aria-hidden
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-neutral-100 shadow-modal"
                    >
                        {card.illustrationUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={card.illustrationUrl}
                                alt=""
                                className={`${art} object-contain opacity-25 grayscale`}
                            />
                        ) : (
                            <span className={`text-content-muted ${big ? 'text-7xl' : 'text-5xl'}`}>?</span>
                        )}
                        <span className="mt-3 text-sm font-bold text-content-muted">미해금</span>
                    </div>
                )}
            </motion.div>
        </motion.div>
    )
}

/** 숫자가 또르륵 오른다. 바만 늘면 몇 칸이 늘었는지는 안 읽힌다 */
function CountUp({ from, to, delay, instant }: { from: number; to: number; delay: number; instant: boolean }) {
    const [value, setValue] = useState(instant ? to : from)
    const frame = useRef(0)

    useEffect(() => {
        if (instant || from === to) {
            setValue(to)
            return
        }
        const DURATION = 700
        let start = 0
        const timer = window.setTimeout(() => {
            const step = (now: number) => {
                if (!start) start = now
                const progress = Math.min(1, (now - start) / DURATION)
                setValue(Math.round(from + (to - from) * progress))
                if (progress < 1) frame.current = requestAnimationFrame(step)
            }
            frame.current = requestAnimationFrame(step)
        }, delay * 1000)
        return () => {
            window.clearTimeout(timer)
            cancelAnimationFrame(frame.current)
        }
    }, [from, to, delay, instant])

    return <>{value}</>
}

/**
 * 전부 검토 대기인 경우. 해금 연출을 쓰지 않는다 —
 * 아직 열린 칸이 없어서 축하할 것이 없다.
 */
function ReviewRequested({ names, onGoDex }: { names: string[]; onGoDex: () => void }) {
    return (
        <div className="flex h-full flex-col items-center justify-center bg-surface-app px-8 text-center">
            <ClockIcon size={44} aria-hidden className="text-content-link" />
            <h1 className="mt-4 font-display text-xl text-content-primary">검토를 요청했어요</h1>
            <p className="mt-2 text-sm leading-6 text-content-secondary">
                사진이 증빙으로 함께 전달됐어요.
                <br />
                확인이 끝나면 도감이 열려요.
            </p>

            {names.length > 0 && (
                <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="검토 대기 중인 음식">
                    {names.map((name) => (
                        <li
                            key={name}
                            className="rounded-full border border-edge-default bg-surface-card px-3 py-1.5 text-sm text-content-primary"
                        >
                            {name}
                        </li>
                    ))}
                </ul>
            )}

            <button
                type="button"
                onClick={onGoDex}
                className="mt-10 h-cta rounded-full border-2 border-watermelon-400 px-10 font-display text-lg text-watermelon-600"
            >
                도감 보러 가기
            </button>
        </div>
    )
}
