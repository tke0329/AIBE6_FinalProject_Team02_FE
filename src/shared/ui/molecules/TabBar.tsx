import React from 'react'

/**
 * §3.2 상단 탭. 새 형태가 필요하면 컴포넌트를 만들지 말고 variant를 추가할 것.
 *
 * - `segmented` 크림 트랙 위 2~3등분 (내 챌린지 / 챌린지 탐색)
 * - `pill`      배경 없는 알약형 (개설한 / 참여 중 / 완료한)
 * - `scroll`    가로 스크롤형 카테고리 탭 (전체 / 밥 / 면 …)
 *
 * §5 role="tablist"/"tab" + aria-selected, 터치 타깃 44px.
 */
export type TabBarVariant = 'segmented' | 'pill' | 'scroll'

export interface TabItem<T extends string> {
    id: T
    label: string
}

interface TabBarProps<T extends string> {
    /** 탭 그룹의 접근 가능한 이름. 예: "챌린지 보기 전환" */
    label: string
    items: Array<TabItem<T>>
    value: T
    onChange: (id: T) => void
    variant?: TabBarVariant
    className?: string
}

const trackClass: Record<TabBarVariant, string> = {
    segmented: 'flex rounded-2xl bg-neutral-100 p-1',
    pill: 'flex items-center gap-2',
    scroll: 'flex w-max gap-2 pb-1',
}

function tabClass(variant: TabBarVariant, active: boolean) {
    const base = 'flex min-h-touch items-center justify-center transition-colors active:scale-[0.98]'

    if (variant === 'segmented') {
        return `${base} flex-1 rounded-xl text-sm font-bold ${
            active ? 'bg-surface-card text-content-link shadow-card' : 'text-content-secondary'
        }`
    }
    if (variant === 'pill') {
        return `${base} rounded-full px-4 text-xs font-bold ${
            active ? 'bg-watermelon-100 text-content-link' : 'text-content-secondary'
        }`
    }
    return `${base} gap-2 rounded-full border px-4 text-xs font-bold ${
        active
            ? 'border-edge-active bg-action-primary text-content-on-action shadow-card'
            : 'border-edge-default bg-surface-card text-content-secondary'
    }`
}

export function TabBar<T extends string>({
    label,
    items,
    value,
    onChange,
    variant = 'segmented',
    className = '',
}: TabBarProps<T>) {
    const list = (
        <div role="tablist" aria-label={label} className={`${trackClass[variant]} ${className}`}>
            {items.map((item) => {
                const active = item.id === value
                return (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(item.id)}
                        className={tabClass(variant, active)}
                    >
                        {item.label}
                    </button>
                )
            })}
        </div>
    )

    if (variant !== 'scroll') return list
    // 카테고리 탭은 화면 좌우 패딩을 뚫고 끝까지 스크롤돼야 함
    return <div className="no-scrollbar -mx-4 overflow-x-auto px-4">{list}</div>
}
