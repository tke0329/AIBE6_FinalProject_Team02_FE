import React from 'react'
import { Loader2Icon } from 'lucide-react'

/**
 * 버튼 색 역할.
 *
 * 한 화면에 `primary`는 하나만 둔다. 둘 이상이면 무엇을 눌러야 하는지가 흐려진다.
 * - `primary`   주 동작 (저장·다음·만들기)
 * - `secondary` 주 동작 옆의 대안 (취소·나중에)
 * - `soft`      목록 안에서 반복되는 약한 동작 (더 보기·되살리기)
 * - `ghost`     배경 없는 텍스트 동작 (건너뛰기)
 * - `danger`    되돌릴 수 없는 동작 (탈퇴·삭제)
 */
type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger'

/**
 * 크기는 시각적 크기만 바꾼다. **높이는 어느 값이든 44px 아래로 내려가지 않는다** —
 * DESIGN.md §5 최소 터치 타깃. 아이콘 전용 버튼은 globals.css가 히트 영역을 넓혀 주지만
 * 글자 버튼은 그 규칙에 걸리지 않으므로 여기서 지킨다.
 */
type ButtonSize = 'cta' | 'md' | 'sm'

/**
 * 모서리 모양.
 *
 * 둘 다 실제로 쓰이고 있어서 옵션으로 남긴다 — 화면을 훑어 보니 알약(`rounded-full`) CTA와
 * 사각(`rounded-2xl`) CTA가 섞여 있었다. 하나로 통일하는 건 디자인 결정이라 여기서 하지 않는다.
 *
 * - `pill`  기본. 하단 고정 CTA, 목록 속 작은 버튼
 * - `block` 카드처럼 각진 큰 버튼. 카드 사이에 끼어 있을 때 라운드를 맞추려면 이쪽
 */
type ButtonShape = 'pill' | 'block'

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
    variant?: ButtonVariant
    size?: ButtonSize
    shape?: ButtonShape
    /** 가로를 꽉 채움. 하단 고정 CTA는 대부분 이것 */
    fullWidth?: boolean
    /**
     * 요청이 도는 중. 스피너를 앞에 붙이고 버튼을 잠근다.
     *
     * `disabled`와 나눠 둔 이유: disabled는 "지금은 누를 수 없다"(입력이 덜 찼다)이고
     * loading은 "눌렀고 처리 중이다"라 스크린리더에 알릴 내용이 다르다.
     */
    loading?: boolean
    /** 글자 앞 아이콘. `size={16}` 정도로 넘긴다 */
    icon?: React.ReactNode
    /** 정말 예외적인 한 곳만. 색·높이·라운드는 여기서 덮지 않는다 */
    className?: string
}

const BASE =
    'inline-flex items-center justify-center gap-2 font-display transition active:scale-[0.98] disabled:pointer-events-none'

const SHAPE: Record<ButtonShape, string> = { pill: 'rounded-full', block: 'rounded-2xl' }

/** disabled는 변형마다 다르게 두지 않는다 — 잠긴 버튼은 어떤 종류였든 똑같이 잠겨 보여야 한다 */
const DISABLED = 'disabled:bg-action-disabled-bg disabled:text-action-disabled-text disabled:shadow-none'

const VARIANT: Record<ButtonVariant, string> = {
    primary: `bg-action-primary text-content-on-action shadow-card hover:bg-action-hover ${DISABLED}`,
    secondary: `border-2 border-edge-default bg-surface-card text-content-primary ${DISABLED} disabled:border-transparent`,
    soft: `bg-action-soft text-action-soft-text ${DISABLED}`,
    ghost: `text-content-secondary ${DISABLED} disabled:bg-transparent`,
    danger: `bg-feedback-error text-content-on-dark shadow-card ${DISABLED}`,
}

const SIZE: Record<ButtonSize, string> = {
    cta: 'h-cta px-6 text-lg',
    md: 'min-h-touch px-4 text-base',
    sm: 'min-h-touch px-3 text-sm',
}

/** 스피너 크기를 글자에 맞춘다 */
const SPINNER: Record<ButtonSize, number> = { cta: 20, md: 18, sm: 16 }

/**
 * 공통 버튼. 색·높이·라운드는 이 파일에서만 정한다.
 *
 * 화면에서 `className`으로 배경색이나 높이를 덮지 않는다. 필요한 모양이 없으면
 * `variant`/`size`를 늘리는 쪽이 맞다 — 예전에 화면마다 직접 조립하다 보니
 * 같은 주 버튼이 21가지 클래스 문자열로 갈렸다.
 */
export function Button({
    variant = 'primary',
    size = 'cta',
    shape = 'pill',
    fullWidth = false,
    loading = false,
    icon,
    disabled,
    children,
    className = '',
    type = 'button',
    ...rest
}: ButtonProps) {
    return (
        <button
            type={type}
            // 처리 중에는 중복 제출을 막아야 하므로 실제로도 잠근다
            disabled={disabled || loading}
            // disabled와 달리 "값이 없어서"가 아니라 "처리 중이라" 못 누른다는 뜻을 따로 알린다
            aria-busy={loading || undefined}
            className={`${BASE} ${SHAPE[shape]} ${VARIANT[variant]} ${SIZE[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...rest}
        >
            {loading ? (
                <Loader2Icon size={SPINNER[size]} aria-hidden className="animate-spin" />
            ) : (
                icon /* 스피너와 아이콘이 같이 뜨면 글자가 밀린다. 처리 중에는 아이콘 자리를 스피너가 대신한다 */
            )}
            {children}
        </button>
    )
}
