import React from 'react'
import { BookOpenIcon, TrophyIcon, UserIcon, BoxIcon } from 'lucide-react'

export type NavTab = '기본' | '제작' | '챌린지' | '마이'

interface BottomNavProps {
    active: NavTab
    onTab?: (tab: NavTab) => void
}

const tabs: Array<{ id: NavTab; label: string; Icon: typeof BoxIcon }> = [
    { id: '기본', label: '기본 도감', Icon: BoxIcon },
    { id: '제작', label: '제작 도감', Icon: BookOpenIcon },
    { id: '챌린지', label: '챌린지', Icon: TrophyIcon },
    { id: '마이', label: '마이', Icon: UserIcon },
]

/** §2 하단 4탭 고정 네비. safe-area 반영, 터치 타깃 44px 이상 */
export function BottomNav({ active, onTab }: BottomNavProps) {
    return (
        <nav aria-label="주요 메뉴" className="shrink-0 border-t border-edge-default bg-surface-app pb-safe-b">
            <ul role="tablist" className="mx-auto flex w-full max-w-3xl">
                {tabs.map(({ id, label, Icon }) => {
                    const isActive = active === id
                    return (
                        <li key={id} className="flex-1">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => onTab?.(id)}
                                className={`flex min-h-touch w-full flex-col items-center justify-center gap-1 py-2 transition-colors ${
                                    isActive ? 'text-action-primary' : 'text-content-muted hover:text-content-secondary'
                                }`}
                            >
                                <Icon size={20} aria-hidden />
                                <span className="whitespace-nowrap text-xs font-medium">{label}</span>
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
