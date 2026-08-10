'use client'

import { notFound, useParams, useRouter } from 'next/navigation'
import { ArrowLeftIcon, ChevronRightIcon, KeyRoundIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { parseMadeDexId } from '@/features/made/types'
import { ROUTES } from '@/shared/lib/routes'

/**
 * `/made/[dexId]/manage` 도감 관리 메뉴.
 * 그룹장 여부는 각 화면이 다시 확인한다 — 여기서 막아도 URL로 들어올 수 있다.
 */
export default function MadeDexManagePage() {
    const router = useRouter()
    const params = useParams<{ dexId: string }>()

    const dexId = parseMadeDexId(params.dexId)
    if (!dexId) notFound()

    const MENU = [
        {
            label: '도감 정보 변경하기',
            hint: '표지·이름·소개말·공개 여부',
            Icon: SettingsIcon,
            href: ROUTES.madeEdit(dexId),
        },
        {
            label: '초대 코드 관리하기',
            hint: '코드 발급과 링크 공유',
            Icon: KeyRoundIcon,
            href: ROUTES.madeParticipants(dexId),
        },
        {
            label: '참여자 관리하기',
            hint: '그룹장 넘기기와 내보내기',
            Icon: UsersIcon,
            href: ROUTES.madeParticipants(dexId),
        },
    ]

    return (
        <div className="flex h-full flex-col bg-cream-100">
            <header className="flex items-center gap-3 px-5 py-4">
                <button
                    type="button"
                    onClick={() => router.push(ROUTES.madeInfo(dexId))}
                    aria-label="뒤로가기"
                    className="min-h-touch"
                >
                    <ArrowLeftIcon size={22} className="text-content-primary" />
                </button>
                <h1 className="font-display text-lg text-content-primary">도감 관리</h1>
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 py-2">
                <ul className="space-y-2">
                    {MENU.map(({ label, hint, Icon, href }) => (
                        <li key={label}>
                            <button
                                type="button"
                                onClick={() => router.push(href)}
                                className="flex w-full items-center gap-3 rounded-2xl bg-surface-card p-4 text-left shadow-card active:scale-[0.99]"
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-200">
                                    <Icon size={18} aria-hidden className="text-content-secondary" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-bold text-content-primary">{label}</span>
                                    <span className="mt-0.5 block text-xs text-content-secondary">{hint}</span>
                                </span>
                                <ChevronRightIcon size={18} aria-hidden className="shrink-0 text-content-muted" />
                            </button>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    )
}
