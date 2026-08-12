import React from 'react'

type CardPadding = 'none' | 'sm' | 'md'

interface CardProps {
    /**
     * 누르면 어디로 가거나 무언가 열리는 카드. 넘기면 `<button>`으로 그려지고
     * 눌리는 느낌(살짝 줄어듦)이 붙는다. 없으면 그냥 담는 상자다.
     */
    onClick?: () => void
    /**
     * 안쪽 여백. 사진이 카드 끝까지 차는 카드는 `none`으로 두고 안에서 직접 준다.
     */
    padding?: CardPadding
    /** 배치(여백·flex)만 덮는다. 배경·라운드·그림자는 여기서 정한다 */
    className?: string
    children: React.ReactNode
}

const PADDING: Record<CardPadding, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
}

/**
 * 내용을 담는 흰 상자.
 *
 * `rounded-2xl bg-surface-card p-4 shadow-card` 조합이 화면 곳곳에 흩어져 있던 것을 모았다.
 * 라운드는 `--radius-md`, 그림자는 `card` 한 단계로 고정된다 — **카드에 `modal` 그림자를
 * 쓰지 않는다**(DESIGN.md §1.5). 그게 지켜지지 않으면 무엇이 떠 있는 것인지 알 수 없게 된다.
 *
 * ```tsx
 * <Card>내용</Card>
 * <Card onClick={open}>누르면 열리는 카드</Card>
 * <Card padding="none"><img …/><div className="p-4">…</div></Card>
 * ```
 */
export function Card({ onClick, padding = 'md', className = '', children }: CardProps) {
    const shape = `rounded-2xl bg-surface-card shadow-card ${PADDING[padding]} ${className}`

    if (!onClick) return <div className={shape}>{children}</div>

    return (
        <button
            type="button"
            onClick={onClick}
            // 카드는 넓어서 눌린 느낌이 약하다. 버튼(0.98)보다 덜 줄여야 덜컹거리지 않는다
            className={`w-full text-left transition active:scale-[0.99] ${shape}`}
        >
            {children}
        </button>
    )
}
