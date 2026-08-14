import React, { useState } from 'react'
import { ChevronRightIcon, KeyRoundIcon, PlusIcon, UsersIcon, BookMarkedIcon } from 'lucide-react'
import { BottomNav, HelpIcon, NavTab } from '@/shared/ui'
import { GuideTour } from '@/features/onboarding/GuideTour'
import { useGuide } from '@/features/onboarding/useGuide'
import { MadeDexCodeSheet } from './MadeDexCodeSheet'
import { DEFAULT_MADE_DEX_COVER, MadeDexId, MadeDexSummary } from './types'

interface Props {
    dexes: MadeDexSummary[]
    loading: boolean
    error: string | null
    onCreateNew: () => void
    onOpenDex: (id: MadeDexId) => void
    onEnterCode: (code: string) => void
    onTab: (tab: NavTab) => void
}

export function MadeDexList({ dexes, loading, error, onCreateNew, onOpenDex, onEnterCode, onTab }: Props) {
    const [joinOpen, setJoinOpen] = useState(false)
    // 목록이 그려진 뒤에 켠다 — 로딩 중이면 짚을 요소가 없어 투어가 헛돈다
    const guide = useGuide('logit-list', !loading)

    return (
        <div className="relative flex h-full flex-col bg-surface-app">
            <header className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
                <div>
                    <div className="flex items-center gap-1">
                        <h1 className="font-display text-xl text-content-primary">로그잇</h1>
                        <HelpIcon label="로그잇" onClick={guide.replay} />
                    </div>
                    <p className="mt-1 text-sm text-content-secondary">함께 먹은 하루를 모아 보세요</p>
                </div>
                <button
                    type="button"
                    data-tour="logit-join"
                    onClick={() => setJoinOpen(true)}
                    className="flex min-h-touch shrink-0 items-center gap-1.5 rounded-full border border-watermelon-400 px-4 text-sm font-bold text-content-link active:scale-[0.98]"
                >
                    <KeyRoundIcon size={16} aria-hidden />
                    초대코드
                </button>
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
                {error && (
                    <p className="mb-3 rounded-2xl bg-surface-card p-4 text-sm text-feedback-error shadow-card">
                        {error}
                    </p>
                )}

                {loading ? (
                    <div className="space-y-3">
                        {[0, 1].map((placeholder) => (
                            <div
                                key={placeholder}
                                className="h-24 animate-pulse rounded-2xl bg-surface-card shadow-card"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dexes.map((dex, index) => (
                            <button
                                key={dex.id}
                                type="button"
                                // 첫 카드만 짚는다. 신규 유저는 카드가 없어 이 단계가 통째로 생략된다
                                data-tour={index === 0 ? 'logit-card' : undefined}
                                onClick={() => onOpenDex(dex.id)}
                                className="flex w-full items-center gap-3 rounded-2xl bg-surface-card p-4 text-left shadow-card active:scale-[0.99]"
                            >
                                {/* presigned URL이라 next/image의 도메인 설정 대상이 아니다 */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={dex.imageUrl ?? DEFAULT_MADE_DEX_COVER}
                                    alt=""
                                    className="h-12 w-12 shrink-0 rounded-xl bg-neutral-100 object-cover"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1">
                                        <span className="truncate font-display text-lg text-content-primary">
                                            {dex.name}
                                        </span>
                                    </span>
                                    {dex.description && (
                                        <span className="mt-1 block truncate text-xs text-content-secondary">
                                            {dex.description}
                                        </span>
                                    )}
                                    <span className="mt-2 block text-xs text-content-secondary">
                                        {dex.memberCount}명{dex.myRole === 'OWNER' && ' · 내가 만든 도감'}
                                    </span>
                                </span>
                                <ChevronRightIcon size={18} aria-hidden className="shrink-0 text-content-muted" />
                            </button>
                        ))}

                        {dexes.length === 0 && !error && (
                            <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge-default bg-white text-center">
                                <BookMarkedIcon size={30} strokeWidth={1.5} aria-hidden className="text-neutral-400" />
                                <p className="mt-2 text-sm font-bold text-content-primary">
                                    아직 참여 중인 로그잇이 없어요
                                </p>
                                <p className="mt-1 text-xs text-content-secondary">
                                    새로 만들거나 초대 코드로 참여해 보세요.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <button
                    type="button"
                    data-tour="logit-create"
                    onClick={onCreateNew}
                    className="mt-4 flex min-h-touch w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-watermelon-400 bg-watermelon-50 py-4 text-sm font-bold text-content-link"
                >
                    <PlusIcon size={18} aria-hidden />새 로그잇 만들기
                </button>

                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-neutral-100 p-3 text-xs text-content-muted">
                    <UsersIcon size={16} aria-hidden className="mt-0.5 shrink-0 text-content-secondary" />
                    초대 코드로 참여하면 함께 카드를 등록할 수 있어요. 한 로그잇에 최대 12명까지 모일 수 있어요.
                </div>
            </main>

            <BottomNav active="제작" onTab={onTab} />

            {joinOpen && <MadeDexCodeSheet onSubmit={onEnterCode} onClose={() => setJoinOpen(false)} />}

            <GuideTour guide={guide} />
        </div>
    )
}
