'use client'

import type { MyBadge } from '@/features/my/api'
import { BADGE_GROUP_LABEL, BADGE_GROUP_ORDER, badgeGroupOf } from '@/shared/data/badgeAssets'
import { ServerBadge } from '@/shared/ui/atoms/ServerBadge'
import { ArrowLeftIcon, CheckIcon } from 'lucide-react'
import { useState } from 'react'

interface Props {
    badges: MyBadge[]
    pending?: boolean
    /** badgeId=null이면 장착 해제 */
    onEquip: (badgeId: number | null) => void
    onBack: () => void
}

/** 뱃지 보관함 — 획득한 뱃지만 표시, 탭해서 대표 뱃지로 장착/해제. */
export function BadgeCollection({ badges, pending, onEquip, onBack }: Props) {
    const equippedId = badges.find((b) => b.equipped)?.id ?? null
    const [selected, setSelected] = useState<number | null>(equippedId)

    const isEmpty = badges.length === 0
    const changed = selected !== equippedId

    return (
        <div className="flex h-full flex-col bg-surface-app">
            <header className="flex items-center gap-3 px-5 py-4">
                <button onClick={onBack} aria-label="뒤로가기">
                    <ArrowLeftIcon size={22} className="text-neutral-900" />
                </button>
                <span className="font-display text-xl text-neutral-900">나의 뱃지</span>
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
                <div className="mx-auto w-full max-w-2xl">
                    {isEmpty ? (
                        <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                            <p className="text-sm text-neutral-800">아직 획득한 뱃지가 없어요.</p>
                            <p className="mt-1 text-xs text-neutral-400">
                                미션과 챌린지를 완료하면 뱃지를 모을 수 있어요.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-neutral-400">획득한 뱃지를 탭해 대표 뱃지로 설정하세요.</p>
                            {BADGE_GROUP_ORDER.map((group) => {
                                // 같은 결끼리 섹션 분리 — 획득한 것만 있으므로 빈 그룹은 숨긴다
                                const items = badges.filter((b) => badgeGroupOf(b.code) === group)
                                if (items.length === 0) return null
                                return (
                                    <section key={group} className="mt-6">
                                        <h3 className="mb-2 flex items-baseline gap-2 font-display text-base text-neutral-900">
                                            {BADGE_GROUP_LABEL[group]}
                                            <span className="text-xs font-normal text-neutral-400">{items.length}</span>
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {items.map((badge) => {
                                                const active = selected === badge.id
                                                return (
                                                    <button
                                                        key={badge.id}
                                                        onClick={() => setSelected(active ? null : badge.id)}
                                                        className={`relative overflow-hidden rounded-2xl border-2 p-3 text-left ${
                                                            active
                                                                ? 'border-watermelon-500 bg-watermelon-50'
                                                                : 'border-transparent bg-white shadow-soft'
                                                        }`}
                                                    >
                                                        <div className="flex h-24 items-center justify-center rounded-xl bg-white">
                                                            <ServerBadge
                                                                code={badge.code}
                                                                imageUrl={badge.imageUrl}
                                                                name={badge.name}
                                                                size={72}
                                                            />
                                                        </div>
                                                        <p className="mt-2 text-sm font-bold text-neutral-900">
                                                            {badge.name}
                                                        </p>
                                                        {active && (
                                                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-watermelon-500 text-white">
                                                                <CheckIcon size={13} />
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </section>
                                )
                            })}
                        </>
                    )}
                </div>
            </main>

            {!isEmpty && (
                <div className="border-t border-neutral-200 bg-white px-5 py-4">
                    <button
                        onClick={() => onEquip(selected)}
                        disabled={pending || !changed}
                        className="min-h-cta w-full rounded-full bg-watermelon-500 font-display text-lg text-white shadow-card transition active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
                    >
                        {pending ? '저장 중…' : selected === null ? '대표 뱃지 해제' : '대표 뱃지로 설정'}
                    </button>
                </div>
            )}
        </div>
    )
}
