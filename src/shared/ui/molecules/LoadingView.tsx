import React from 'react'
import { Skeleton } from '@/shared/ui/atoms/Skeleton'
import { LOADING_SCENES, type LoadingSceneName } from './loadingScenes'

interface LoadingViewProps {
    /**
     * 무엇을 기다리는지. **화면마다 다르게 적는다** — "불러오는 중…" 하나로 통일하면
     * 스크린리더 사용자는 어느 화면에 있는지 알 수 없다.
     * 예: "도감 목록을 불러오는 중", "사진을 분석하는 중"
     */
    label: string
    /**
     * 올 내용의 모양을 흉내 낸 스켈레톤. **되도록 이걸 넘긴다.**
     * 생략하면 일반적인 카드 목록 모양으로 그려진다.
     */
    skeleton?: React.ReactNode
    /**
     * 스켈레톤 대신 쓸 동작별 연출 (loadingScenes.tsx).
     * 기다림이 길거나 그 순간 자체가 즐거운 동작에만. 목록·상세 같은 평범한 조회는 스켈레톤이 낫다.
     */
    scene?: LoadingSceneName
    /** 화면 전체를 채워 가운데 정렬. 라우트 단위 로딩이면 true */
    fullScreen?: boolean
    className?: string
}

/** `skeleton`을 안 넘겼을 때. 제목 한 줄 + 카드 세 장 — 이 앱에서 가장 흔한 모양 */
function DefaultSkeleton() {
    return (
        <div className="flex w-full flex-col gap-4">
            <Skeleton shape="title" className="w-32" />
            <Skeleton shape="block" />
            <Skeleton shape="text" count={2} />
        </div>
    )
}

/**
 * 불러오는 동안 보여 줄 것 + 그 사실을 알리는 것을 한 곳에서 처리한다.
 *
 * 화면마다 `{loading && <p>불러오는 중…</p>}`을 직접 쓰면 두 가지가 빠진다.
 * **① 스크린리더에 아무 것도 안 알려지고** — 화면은 바뀌었는데 조용하다.
 * **② 레이아웃이 튄다** — 글자 한 줄이 있던 자리에 갑자기 목록이 들어찬다.
 *
 * `aria-live="polite"`라 지금 읽던 문장을 끊지 않고 이어서 알린다.
 */
export function LoadingView({ label, skeleton, scene, fullScreen = false, className = '' }: LoadingViewProps) {
    // 등록되지 않은 이름이 와도 스켈레톤으로 돌아간다 — 연출을 만드는 도중 화면이 깨지지 않게
    const Scene = scene ? LOADING_SCENES[scene] : undefined

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy
            className={`${
                fullScreen ? 'flex h-full flex-col justify-center bg-surface-app px-5' : 'w-full'
            } ${className}`}
        >
            {/* 화면에는 그림만, 읽히는 건 이 문장 하나. 둘을 나눠야 중복해서 읽히지 않는다 */}
            <span className="sr-only">{label}</span>
            {Scene ? (
                <div className="flex justify-center py-6">
                    <Scene />
                </div>
            ) : (
                (skeleton ?? <DefaultSkeleton />)
            )}
        </div>
    )
}
