import React from 'react'

type SkeletonShape = 'text' | 'title' | 'block' | 'circle'

interface SkeletonProps {
    shape?: SkeletonShape
    /** 여러 줄을 한 번에. `text`에서 마지막 줄은 짧게 그려 문단처럼 보이게 한다 */
    count?: number
    /** 크기 지정. `circle`은 `h-12 w-12`처럼 둘 다, 나머지는 폭만 주면 된다 */
    className?: string
}

const SHAPE: Record<SkeletonShape, string> = {
    text: 'h-4 rounded-full',
    title: 'h-6 rounded-full',
    block: 'aspect-[4/3] w-full rounded-2xl',
    circle: 'rounded-full',
}

/**
 * 내용이 올 자리를 미리 잡아 두는 회색 판.
 *
 * 스피너 대신 이걸 쓰는 이유는 **레이아웃이 튀지 않아서**다. 스피너는 화면 한가운데
 * 떠 있다가 사라지면서 실제 내용이 갑자기 나타나 위치가 바뀌지만, 스켈레톤은
 * 올 내용과 같은 크기라 그대로 채워진다.
 *
 * 그래서 **실제 내용과 비슷한 모양으로 배치해야 값어치가 있다.** 아무 데나 회색 막대
 * 하나를 두면 스피너보다 나을 게 없다.
 *
 * `aria-hidden`이다 — 읽어 줄 내용이 아니다. "불러오는 중"을 알리는 건 감싸는
 * `LoadingView`의 몫이다.
 */
export function Skeleton({ shape = 'text', count = 1, className = '' }: SkeletonProps) {
    if (count === 1) {
        return <div aria-hidden className={`animate-pulse bg-action-disabled-bg ${SHAPE[shape]} ${className}`} />
    }

    return (
        <div aria-hidden className="flex flex-col gap-2">
            {Array.from({ length: count }, (_, index) => (
                <div
                    key={index}
                    className={`animate-pulse bg-action-disabled-bg ${SHAPE[shape]} ${
                        // 마지막 줄만 짧게 — 문단은 끝줄이 덜 차는 게 자연스럽다
                        index === count - 1 && shape === 'text' ? 'w-2/3' : ''
                    } ${className}`}
                />
            ))}
        </div>
    )
}
