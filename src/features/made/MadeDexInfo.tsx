import React, { useState } from 'react'
import { ArrowLeftIcon, ChevronRightIcon, KeyRoundIcon, LockIcon, SettingsIcon, UsersIcon } from 'lucide-react'

import { BottomSheet } from '@/shared/ui/molecules/BottomSheet'
import { DEFAULT_MADE_DEX_COVER, madeDexDayCount, MadeDexDetail } from './types'

interface Props {
    detail: MadeDexDetail
    /** 탈퇴가 도는 동안 버튼을 잠근다 */
    leaving: boolean
    error: string | null
    onBack: () => void
    onLeave: () => void
    /** 도감 관리 메뉴 — 그룹장에게만 보인다 */
    onEditInfo: () => void
    onManageInvites: () => void
    onManageParticipants: () => void
}

export function MadeDexInfo({
    detail,
    leaving,
    error,
    onBack,
    onLeave,
    onEditInfo,
    onManageInvites,
    onManageParticipants,
}: Props) {
    const [leaveOpen, setLeaveOpen] = useState(false)

    const owner = detail.myRole === 'OWNER'

    const MENU = [
        {
            label: '도감 정보 변경하기',
            hint: '표지·이름·소개말',
            Icon: SettingsIcon,
            onClick: onEditInfo,
        },
        {
            label: '초대 코드 관리하기',
            hint: '코드 발급과 링크 공유',
            Icon: KeyRoundIcon,
            onClick: onManageInvites,
        },
        {
            label: '참여자 관리하기',
            hint: '그룹장 넘기기와 내보내기',
            Icon: UsersIcon,
            onClick: onManageParticipants,
        },
    ]

    return (
        <div className="relative flex h-full flex-col bg-surface-app">
            <header className="flex items-center justify-between gap-3 px-5 py-4">
                <button type="button" onClick={onBack} aria-label="뒤로가기" className="min-h-touch">
                    <ArrowLeftIcon size={22} className="text-content-primary" />
                </button>
                {detail.myRole && (
                    <button
                        type="button"
                        disabled={leaving}
                        onClick={() => setLeaveOpen(true)}
                        className="min-h-touch rounded-full px-3 text-sm font-bold text-feedback-error disabled:opacity-40"
                    >
                        도감 탈퇴하기
                    </button>
                )}
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
                <section className="rounded-3xl bg-surface-card p-5 shadow-card">
                    <div className="flex items-center justify-between">
                        <h1 className="font-display text-lg text-content-primary">도감 정보</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-content-secondary">
                            <LockIcon size={13} aria-hidden />
                            비공개
                        </span>
                    </div>

                    <div className="mt-5 flex flex-col items-center text-center">
                        {/* presigned URL이라 next/image의 도메인 설정 대상이 아니다 */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={detail.imageUrl ?? DEFAULT_MADE_DEX_COVER}
                            alt=""
                            className="h-28 w-28 rounded-full bg-neutral-100 object-cover"
                        />

                        <h2 className="mt-4 font-display text-xl text-content-primary">{detail.name}</h2>

                        {detail.description && (
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-content-secondary">
                                {detail.description}
                            </p>
                        )}

                        <p className="mt-4 flex items-center gap-1 text-sm text-content-secondary">
                            <UsersIcon size={15} aria-hidden />
                            {detail.memberCount}명이 참여 중
                        </p>
                        <p className="mt-1 text-xs text-content-muted">개설 {madeDexDayCount(detail.createdAt)}일째</p>
                    </div>
                </section>

                {/* 도감을 손보는 건 그룹장 일이라 메뉴도 그룹장에게만 보인다 */}
                {owner && (
                    <section className="mt-4" aria-label="도감 관리">
                        <h2 className="px-1 pb-2 font-display text-lg text-content-primary">도감 관리</h2>
                        <ul className="space-y-2">
                            {MENU.map(({ label, hint, Icon, onClick }) => (
                                <li key={label}>
                                    <button
                                        type="button"
                                        onClick={onClick}
                                        className="flex w-full items-center gap-3 rounded-2xl bg-surface-card p-4 text-left shadow-card active:scale-[0.99]"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                                            <Icon size={18} aria-hidden className="text-content-secondary" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-bold text-content-primary">
                                                {label}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-content-secondary">{hint}</span>
                                        </span>
                                        <ChevronRightIcon size={18} aria-hidden className="shrink-0 text-content-muted" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {error && <p className="mt-4 text-sm text-feedback-error">{error}</p>}
            </main>

            {leaveOpen && (
                <BottomSheet
                    title={owner ? '도감이 사라져요' : '도감에서 탈퇴할까요?'}
                    onClose={() => setLeaveOpen(false)}
                >
                    <div className="px-5 pb-8 pt-2">
                        <p className="text-sm leading-5 text-content-secondary">
                            {owner ? (
                                <>
                                    그룹장이 탈퇴하면 {detail.name}이 사라지고, 참여자 모두가 함께 나가게 돼요. 도감을
                                    남기고 싶다면 참여자 관리에서 먼저 그룹장을 넘겨 주세요.
                                </>
                            ) : (
                                <>탈퇴하면 카드를 더 등록할 수 없어요. 초대 코드를 다시 받으면 들어올 수 있어요.</>
                            )}
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setLeaveOpen(false)}
                                className="min-h-touch rounded-2xl border border-edge-default text-sm font-medium text-content-secondary"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                disabled={leaving}
                                onClick={() => {
                                    setLeaveOpen(false)
                                    onLeave()
                                }}
                                className="min-h-touch rounded-2xl bg-action-primary text-sm font-bold text-content-on-action disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
                            >
                                {owner ? '없애고 탈퇴하기' : '탈퇴하기'}
                            </button>
                        </div>
                    </div>
                </BottomSheet>
            )}
        </div>
    )
}
