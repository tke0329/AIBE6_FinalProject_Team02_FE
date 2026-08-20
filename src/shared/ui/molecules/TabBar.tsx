'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

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
    /**
     * 탭을 모두 **같은 폭**으로. 가장 긴 라벨에 맞춘다 (`pill`에만 의미 있음).
     *
     * 글자 수가 다르면 폭이 달라지고, 고른 탭에 배경이 깔릴 때 그 차이가 눈에 띈다
     * (「진행중」과 「종료」처럼). 기본값이 `false`인 이유는 항목이 많은 그룹까지 최장 폭으로
     * 맞추면 좁은 화면에서 줄을 넘기기 때문이다 — 2~3개짜리 토글에만 켠다
     */
    equalWidth?: boolean
    className?: string
}

const trackClass: Record<TabBarVariant, string> = {
    segmented: 'flex rounded-2xl bg-neutral-100 p-1',
    pill: 'flex items-center gap-2',
    // w-max(= width: max-content)로 내용 길이만큼 렌더해 화면 밖으로 넘긴다.
    // 끝 여백은 **트랙에** 준다 — 스크롤 컨테이너의 padding-right는 브라우저에 따라
    // scrollWidth에 안 잡혀서 끝까지 밀면 마지막 탭이 화면 끝에 붙는다
    scroll: 'flex w-max gap-2 pb-1 pr-6',
}

/** 열 폭을 1fr로 나눠 모든 탭이 최장 라벨 기준으로 같아진다 */
const EQUAL_WIDTH_TRACK = 'grid grid-flow-col auto-cols-fr items-center gap-2'

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
    // shrink-0 — 지금은 트랙이 max-content라 압축될 일이 없지만, 트랙 폭이 바뀌면
    // 글자가 눌려 두 줄이 되거나 알약이 찌그러진다. 잘려서 넘어가는 쪽이 맞다
    return `${base} shrink-0 gap-2 rounded-full border px-4 text-xs font-bold ${
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
    equalWidth = false,
    className = '',
}: TabBarProps<T>) {
    const track = equalWidth && variant === 'pill' ? EQUAL_WIDTH_TRACK : trackClass[variant]
    const list = (
        <div role="tablist" aria-label={label} className={`${track} ${className}`}>
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
    return <ScrollTrack hintKey={label}>{list}</ScrollTrack>
}

/** 첫 진입 힌트로 밀어 보는 거리. 다음 탭이 살짝 들어왔다가 되돌아갈 만큼만 */
const HINT_PX = 36

/** 힌트를 이미 보여 줬는지 — 탭 그룹별로 한 세션에 한 번 */
function hintShown(key: string): boolean {
    try {
        const k = `tabbar-hint:${key}`
        if (sessionStorage.getItem(k)) return true
        sessionStorage.setItem(k, '1')
        return false
    } catch {
        // 프라이빗 모드 등에서 sessionStorage가 막히면 힌트를 건너뛴다 — 매번 흔들리는 것보다 낫다
        return true
    }
}

/**
 * 가로 스크롤 껍데기 — **인디케이터**와 첫 진입 흔들기로 더 있다는 것을 알린다.
 *
 * ## 왜 필요한가
 *
 * 스크롤바를 숨겨 두었기 때문에(`no-scrollbar`) 옆에 더 있는지 알 방법이 없다.
 * 특히 마지막으로 보이는 탭이 온전한 모양이면 그게 끝인 줄 알게 된다.
 *
 * ## 페이드·화살표를 걷어내고 인디케이터로 온 경위
 *
 * ① `mask-image`로 잘린 쪽을 흐리게 깎고 화살표를 얹어 봤다. **알약 색이 가려져**
 *    서비스 느낌과 어긋났고, 화살표는 이 앱에 없는 형태였다.
 * ② 잘림 자체에 맡겨 봤다. `w-max`로 내용 길이만큼 넘기니 잘리기는 하는데
 *    **가려지는 양이 화면 폭에 따라 1~61px로 들쭉날쭉**했다 — 실측에서 375·448·640px는
 *    1~6px만 가려져 온전해 보였다. 잘리는 위치는 알약 폭의 누적 합이 정하므로 CSS로 못 묶는다.
 *
 * 그래서 **잘림과 무관하게 늘 같은 모양인** 인디케이터를 뒀다. 「전체 중 이만큼 보고 있다」를
 * 알려주므로 어느 폭에서든 신호가 일정하고, 내용 위에 겹치지 않아 색을 가리지 않는다.
 *
 * ## 색은 초록(rind)이다
 *
 * 디자인 규칙이 **핑크 = 하는 것(액션·선택) / 초록 = 된 것(진행·달성)**으로 갈려 있다.
 * 인디케이터는 누르는 게 아니라 진행 상태 표시라 초록이 맞다 — `rind-500` 주석도
 * 「진행 바」를 용례로 든다. 핑크로 두면 바로 위 선택된 알약과 색이 겹쳐 「이것도 눌러야 하나」가 된다.
 *
 * ## 흔들기는 한 번만, 그리고 조건부다
 *
 * 넘치지 않으면 흔들 이유가 없고(없는 것을 찾게 만든다), 모션을 줄인 사용자에게는
 * 흔들지 않는다. 세션당 탭 그룹별 한 번이라 화면을 오갈 때마다 반복되지 않는다
 */
function ScrollTrack({ hintKey, children }: { hintKey: string; children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null)
    /** 보이는 비율과 진행률(0~1). 넘치지 않으면 shown이 1이라 인디케이터를 숨긴다 */
    const [view, setView] = useState({ shown: 1, progress: 0 })

    const measure = useCallback(() => {
        const el = ref.current
        if (!el) return
        const max = el.scrollWidth - el.clientWidth
        const shown = el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1
        const progress = max > 1 ? el.scrollLeft / max : 0
        setView((prev) =>
            Math.abs(prev.shown - shown) < 0.001 && Math.abs(prev.progress - progress) < 0.001
                ? prev
                : { shown, progress },
        )
    }, [])

    useEffect(() => {
        const el = ref.current
        if (!el) return
        measure()
        el.addEventListener('scroll', measure, { passive: true })
        // 화면 폭이나 항목이 바뀌면 비율도 바뀐다
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        if (el.firstElementChild) observer.observe(el.firstElementChild)
        return () => {
            el.removeEventListener('scroll', measure)
            observer.disconnect()
        }
    }, [measure])

    useEffect(() => {
        const el = ref.current
        if (!el) return
        // 넘치지 않으면 알릴 것이 없다
        if (el.scrollWidth <= el.clientWidth + 1) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        if (hintShown(hintKey)) return

        // 레이아웃이 자리 잡은 다음에 민다 — 폰트가 늦게 붙으면 폭이 달라진다
        const start = setTimeout(() => el.scrollTo({ left: HINT_PX, behavior: 'smooth' }), 400)
        const back = setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 900)
        return () => {
            clearTimeout(start)
            clearTimeout(back)
        }
    }, [hintKey])

    const overflowing = view.shown < 0.999

    return (
        <div>
            {/* 카테고리 탭은 화면 좌우 패딩을 뚫고 끝까지 스크롤돼야 함.
                끝 여백은 트랙의 pr-6이 맡는다 (trackClass.scroll 주석 참고) */}
            <div ref={ref} className="no-scrollbar -mx-4 overflow-x-auto pl-4">
                {children}
            </div>
            {overflowing && <ScrollIndicator shown={view.shown} progress={view.progress} />}
        </div>
    )
}

/**
 * 스크롤 위치 표시 — 탭 줄 아래 작은 막대.
 *
 * 눌러서 움직이는 물건이 아니라 **상태 표시**라 보조기기에는 숨긴다. 탭 목록 자체가
 * 이미 「몇 개 중 몇 번째」를 말해 주므로 여기서 또 읽어 줄 필요가 없다.
 *
 * 손잡이 폭은 보이는 비율(`shown`)에, 위치는 진행률에 맞춘다 — 남은 트랙 안에서만 움직여야
 * 끝에서 손잡이가 넘치지 않는다. 최소 폭을 두는 이유는 항목이 아주 많을 때
 * 손잡이가 점처럼 작아져 보이지 않기 때문이다
 */
function ScrollIndicator({ shown, progress }: { shown: number; progress: number }) {
    const width = Math.max(shown * 100, 18) // %
    const left = progress * (100 - width) // 남은 여유 안에서만 이동
    return (
        <div aria-hidden className="mt-2 flex justify-center">
            <span className="relative block h-1 w-12 overflow-hidden rounded-full bg-neutral-200">
                <span
                    className="absolute inset-y-0 rounded-full bg-rind-500 transition-[left] duration-150"
                    style={{ width: `${width}%`, left: `${left}%` }}
                />
            </span>
        </div>
    )
}
