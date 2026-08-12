import React from 'react'

/**
 * 칩 색 역할. 화면에서 본 조합을 그대로 옮겼다.
 *
 * - `neutral` 기본. 태그·분류처럼 뜻이 중립인 것
 * - `accent`  강조하고 싶은 하나 (연한 핑크 면 + 진한 핑크 글자)
 * - `solid`   선택됨/활성 (핑크 면)
 * - `outline` 테두리만. 면이 이미 있는 카드 위에 얹을 때
 * - `overlay` 사진 위. 반투명 검정이라 사진이 밝든 어둡든 글자가 읽힌다
 */
type ChipTone = 'neutral' | 'accent' | 'solid' | 'outline' | 'overlay'

interface ChipProps {
    tone?: ChipTone
    /** 앞에 붙는 작은 아이콘. `size={12}` 정도 */
    icon?: React.ReactNode
    /**
     * 누를 수 있는 칩(필터 토글 등). 넘기면 `<button>`이 되고 터치 타깃 44px이 붙는다.
     *
     * **누르는 칩과 그냥 라벨을 섞지 않는다.** 같이 놓으면 어느 게 눌리는지 알 수 없다.
     */
    onClick?: () => void
    /** `onClick`이 있을 때만 뜻이 있다. 선택 상태를 스크린리더에 알린다 */
    selected?: boolean
    className?: string
    children: React.ReactNode
}

const TONE: Record<ChipTone, string> = {
    neutral: 'bg-action-disabled-bg text-content-secondary',
    accent: 'bg-action-soft text-action-soft-text',
    solid: 'bg-action-primary text-content-on-action',
    outline: 'border border-edge-default bg-surface-card text-content-secondary',
    overlay: 'bg-black/55 text-content-on-dark',
}

/**
 * 짧은 라벨 한 조각 — 태그, 분류, 사진 위 표시.
 *
 * 글자는 `text-xs`(스케일 최소 단계) + `font-bold`로 고정한다. 칩은 한두 낱말이라
 * 크기를 키우면 옆 내용과 위계가 뒤집히고, 굵기가 없으면 배경 면에 묻힌다.
 */
export function Chip({ tone = 'neutral', icon, onClick, selected, className = '', children }: ChipProps) {
    const shape = `inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${TONE[tone]} ${className}`

    if (!onClick) {
        return (
            <span className={shape}>
                {icon}
                {children}
            </span>
        )
    }

    return (
        <button
            type="button"
            onClick={onClick}
            // 필터 칩은 켜고 끄는 것이라 pressed가 맞다 (selected는 목록 중 택1일 때)
            aria-pressed={selected}
            // 칩은 작아서 그려진 크기로는 44px이 안 된다. 히트 영역만 넓힌다
            className={`min-h-touch transition active:scale-[0.97] ${shape}`}
        >
            {icon}
            {children}
        </button>
    )
}
