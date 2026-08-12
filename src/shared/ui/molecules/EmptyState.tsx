import React from 'react'
import { Button } from '@/shared/ui/atoms/Button'

interface EmptyStateProps {
    /** 큰 이모지나 아이콘 하나. 없으면 생략된다 */
    icon?: React.ReactNode
    /** 무엇이 없는지. "아직 기록이 없어요"처럼 사실만 */
    title: string
    /** 그래서 무엇을 하면 되는지. 한 문장 */
    description?: string
    /** 여기서 바로 시작할 수 있으면 넣는다. 없으면 안내만 */
    action?: { label: string; onClick: () => void }
    /**
     * 실패해서 비어 있는 경우. 문구 색이 바뀌고 `action`은 "다시 시도"로 쓴다.
     *
     * 빈 것과 실패를 구분하는 이유: "아직 없다"는 사용자가 만들면 되지만
     * "못 불러왔다"는 다시 시도해야 한다. 같은 화면을 보여 주면 무엇을 할지 알 수 없다.
     */
    tone?: 'empty' | 'error'
    className?: string
}

/**
 * 목록이 비었거나 불러오지 못했을 때.
 *
 * 지금은 화면마다 문구 한 줄만 덩그러니 두는데, 그러면 **막다른 길**이 된다.
 * 비었다는 사실보다 다음에 무엇을 할 수 있는지가 중요해서 `action`을 함께 받는다.
 */
export function EmptyState({ icon, title, description, action, tone = 'empty', className = '' }: EmptyStateProps) {
    const failed = tone === 'error'

    return (
        <div
            // 실패는 즉시 알려야 하지만, 빈 목록은 그냥 화면 내용이라 알릴 게 아니다
            role={failed ? 'alert' : undefined}
            className={`flex flex-col items-center justify-center gap-2 break-keep px-8 py-12 text-center ${className}`}
        >
            {icon && (
                <span aria-hidden className="pb-1 text-4xl">
                    {icon}
                </span>
            )}
            <p className={`font-display text-lg ${failed ? 'text-feedback-error' : 'text-content-primary'}`}>{title}</p>
            {description && <p className="text-sm leading-5 text-content-secondary">{description}</p>}
            {action && (
                <Button variant={failed ? 'secondary' : 'primary'} size="md" onClick={action.onClick} className="mt-4">
                    {action.label}
                </Button>
            )}
        </div>
    )
}
