import React from 'react'

/**
 * 동작별 로딩 연출 모음.
 *
 * 기본은 스켈레톤이다. 다만 **기다림이 길거나 그 순간이 즐거운 동작**은 회색 판보다
 * 무슨 일이 일어나는지 보여 주는 편이 낫다 — 사진을 분석하는 중, 도감이 열리는 중처럼.
 *
 * ## 여기에 추가하는 방법
 *
 * 1. 아래에 `function XxxScene()`을 하나 만든다
 * 2. `LOADING_SCENES`에 이름을 등록한다
 * 3. 화면에서 `<LoadingView scene="xxx" label="…" />`
 *
 * 컴포넌트를 고칠 필요는 없다. 등록되지 않은 이름을 넘기면 스켈레톤으로 돌아가므로
 * 연출을 만드는 도중에도 화면이 깨지지 않는다.
 *
 * ## 지킬 것
 *
 * - **높이가 변하지 않아야 한다.** 연출이 커졌다 작아지면 뒤이어 올 내용과 어긋난다
 * - `prefers-reduced-motion`은 globals.css가 전역으로 애니메이션을 죽인다.
 *   움직임이 없어도 뜻이 통하는 그림이어야 한다
 * - 문구는 넣지 않는다. 읽히는 문장은 `LoadingView`의 `label` 하나로 모은다
 */
export type LoadingSceneName = keyof typeof LOADING_SCENES

/** 셋 다 같은 리듬으로 뛰게 해서 하나의 덩어리로 읽히게 한다 */
function BouncingDots({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-end gap-1.5 ${className}`}>
            {[0, 1, 2].map((index) => (
                <span
                    key={index}
                    className="h-2.5 w-2.5 animate-bounce rounded-full bg-action-primary"
                    // 시차를 줘야 물결처럼 보인다. 같이 뛰면 그냥 깜빡임이다
                    style={{ animationDelay: `${index * 0.12}s` }}
                />
            ))}
        </div>
    )
}

/** 사진을 올려 AI가 음식을 알아보는 동안 */
function AnalyzingScene() {
    return (
        <div className="flex flex-col items-center gap-4">
            {/* 사진이 들어올 자리. 실제 결과 화면의 사진 비율과 맞춰 둔다 */}
            <div className="relative aspect-[4/3] w-40 overflow-hidden rounded-2xl bg-action-disabled-bg">
                {/* 위에서 아래로 훑는 스캔선 — "보고 있는 중"이라는 뜻 */}
                <span className="absolute inset-x-0 top-0 h-1/3 animate-[scan_1.6s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-action-soft to-transparent" />
            </div>
            <BouncingDots />
        </div>
    )
}

/** 도감 칸이 열리기 직전 */
function UnlockingScene() {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 animate-pulse rounded-3xl bg-action-soft" />
            <BouncingDots />
        </div>
    )
}

export const LOADING_SCENES = {
    /** 마땅한 연출이 없을 때. 점 세 개만 */
    dots: BouncingDots,
    analyzing: AnalyzingScene,
    unlocking: UnlockingScene,
} satisfies Record<string, React.ComponentType>
