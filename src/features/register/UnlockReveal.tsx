'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ClockIcon } from 'lucide-react'

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

/**
 * §7 시그니처 순간 — 카드 해금.
 *
 * 연출은 세 갈래다 (§5.1):
 *  - 단일 첫 해금 → "새로운 음식을 수집했습니다!" 카드 뒤집힘
 *  - 복수 첫 해금 → "N종 동시 수집!" 카드팩 개봉식(차례로 뒤집힘)
 *  - 중복 수집만 → 가벼운 "+1 수집". **첫 해금 연출을 재사용하지 않는다** —
 *                  이미 열린 칸이라 첫 해금의 감격을 희석하면 안 된다.
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

    const headline = !celebrate
        ? `+${cards.length} 수집`
        : firstUnlocks.length > 1
          ? `${firstUnlocks.length}종 동시 수집!`
          : '새로운 음식을 수집했습니다!'

    const subline = !celebrate ? '이미 열린 칸에 기록을 더했어요' : `도감 ${collectedCount} / ${totalSlots}칸`

    return (
        <div
            className={`relative flex h-full flex-col items-center justify-center overflow-hidden px-8 text-center ${
                celebrate ? 'bg-orange-500' : 'bg-cream-100'
            }`}
        >
            {/* 반짝임은 첫 해금에만, 1회만 재생 (무한 루프 장식 금지) */}
            {celebrate &&
                !reduceMotion &&
                Array.from({ length: 12 }).map((_, index) => (
                    <motion.span
                        key={index}
                        aria-hidden
                        className="absolute text-xl"
                        initial={{ opacity: 0, y: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], y: [-10, -80], scale: [0, 1, 0.6] }}
                        transition={{ delay: 0.3 + index * 0.06, duration: 1.4 }}
                        style={{
                            left: `${(8 + index * 6.4) % 84}%`,
                            top: `${20 + (index % 5) * 12}%`,
                        }}
                    >
                        {['✨', '🎉', '⭐'][index % 3]}
                    </motion.span>
                ))}

            <motion.h1
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-2 font-display text-xl ${celebrate ? 'text-white' : 'text-content-primary'}`}
            >
                {headline}
            </motion.h1>
            <p className={`mb-8 text-sm ${celebrate ? 'text-white/80' : 'text-content-secondary'}`}>{subline}</p>

            <div className="flex flex-wrap items-center justify-center gap-3">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.slotId}
                        initial={
                            reduceMotion
                                ? false
                                : celebrate
                                  ? { rotateY: 180, opacity: 0, scale: 0.9 }
                                  : { opacity: 0, scale: 0.96 }
                        }
                        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                        transition={
                            reduceMotion
                                ? { duration: 0 }
                                : { delay: 0.25 + index * 0.18, duration: 0.4, ease: 'easeOut' }
                        }
                        className={`flex flex-col items-center justify-center rounded-3xl bg-surface-card shadow-modal ${
                            cards.length > 1 ? 'h-40 w-32' : 'h-52 w-44'
                        }`}
                    >
                        {card.illustrationUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- presigned URL이라 next/image 최적화 대상이 아니다
                            <img
                                src={card.illustrationUrl}
                                alt=""
                                className={cards.length > 1 ? 'h-16 w-16 object-contain' : 'h-24 w-24 object-contain'}
                            />
                        ) : (
                            <span aria-hidden className={cards.length > 1 ? 'text-5xl' : 'text-7xl'}>
                                {card.emoji}
                            </span>
                        )}

                        <span
                            className={`mt-3 font-display text-content-primary ${
                                cards.length > 1 ? 'text-base' : 'text-xl'
                            }`}
                        >
                            {card.name}
                        </span>

                        <span aria-label={`별 ${card.rank}개`} className="mt-1 text-action-primary">
                            {'★'.repeat(card.rank)}
                            {'☆'.repeat(Math.max(0, 3 - card.rank))}
                        </span>

                        {!card.firstUnlock && (
                            <span className="mt-1 rounded-full bg-surface-accent px-2 py-0.5 text-xs font-bold text-content-link">
                                +1 수집
                            </span>
                        )}
                    </motion.div>
                ))}
            </div>

            {awaitingReview.length > 0 && (
                <p
                    className={`mt-6 rounded-2xl px-4 py-3 text-xs leading-5 ${
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
                transition={reduceMotion ? { duration: 0 } : { delay: 0.5 + cards.length * 0.18 }}
                onClick={onGoDex}
                className={`mt-10 h-cta rounded-full border-2 px-10 font-display text-lg ${
                    celebrate ? 'border-white text-white' : 'border-orange-400 text-orange-600'
                }`}
            >
                도감 보러 가기
            </motion.button>
        </div>
    )
}

/**
 * 전부 검토 대기인 경우. 해금 연출을 쓰지 않는다 —
 */
function ReviewRequested({ names, onGoDex }: { names: string[]; onGoDex: () => void }) {
    return (
        <div className="flex h-full flex-col items-center justify-center bg-cream-100 px-8 text-center">
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
                className="mt-10 h-cta rounded-full border-2 border-orange-400 px-10 font-display text-lg text-orange-600"
            >
                도감 보러 가기
            </button>
        </div>
    )
}
