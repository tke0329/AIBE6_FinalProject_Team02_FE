'use client'

import { useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'

export interface TourStep {
    /**
     * 짚을 요소의 `data-tour` 값. **생략하면 화면 가운데 카드**로 뜬다(인트로용).
     * DOM에 없으면 그 단계는 건너뛴다 — 화면 상태에 따라 없을 수 있어서다
     */
    anchor?: string
    title: string
    body: string
}

interface Props {
    steps: TourStep[]
    /** 스크린리더용 이름. "로그잇 사용법"처럼 */
    label: string
    /** 끝까지 봤든 건너뛰었든 닫힐 때. 호출부가 '봤음'으로 기록한다 */
    onClose: () => void
}

/** 스포트라이트가 대상보다 이만큼 넉넉하게 잡힌다 */
const PAD = 6
/** 말풍선과 스포트라이트 사이 간격 */
const GAP = 12

interface Box {
    top: number
    left: number
    width: number
    height: number
}

/**
 * 실제 화면 위에 스포트라이트를 얹어 단계별로 사용법을 짚는 투어.
 * 도감 3종의 첫 진입 온보딩과 `?` 다시보기가 공유한다.
 *
 * ## 좌표를 호스트 기준으로 환산하는 이유
 *
 * `.app-shell-content`는 `transform: translate(0)`이라 **`fixed`의 컨테이닝 블록**이다
 * (globals.css). 덕분에 오버레이를 `fixed inset-0`으로 두면 데스크톱에서도 폰 폭 컬럼
 * 안에만 깔려서 좋은데, `getBoundingClientRect()`는 **뷰포트 기준**이라 그대로 쓰면
 * 넓은 화면에서 스포트라이트가 컬럼 왼쪽 여백만큼 밀린다.
 * 그래서 앵커 위치를 항상 호스트 사각형만큼 빼서 쓴다.
 *
 * ## 구멍은 box-shadow로 뚫는다
 *
 * 거대한 `box-shadow`가 SVG 마스크나 4분할 div보다 단순하고, 모서리 둥글림이 공짜다.
 */
export function CoachTour({ steps, label, onClose }: Props) {
    const reduceMotion = useReducedMotion()
    const [index, setIndex] = useState(0)
    const [box, setBox] = useState<Box | null>(null)
    // 말풍선을 위/아래 어디에 붙일지 정하는 데 쓴다. 렌더 중에 DOM을 읽지 않으려고 상태로 둔다
    const [hostHeight, setHostHeight] = useState(0)
    /**
     * 앵커가 DOM에 없어 걸러낸 뒤의 단계 목록. **`null`은 "아직 안 걸렀다"**는 뜻이다.
     *
     * 빈 배열로 시작하면 안 된다 — 아래 "짚을 게 없으면 닫는다" 가드가 필터보다 먼저
     * 첫 렌더의 빈 배열을 보고 투어를 즉시 닫아 버린다(열자마자 사라짐). 실제로 그랬다
     */
    const [live, setLive] = useState<TourStep[] | null>(null)
    const panelRef = useFocusTrap<HTMLDivElement>(onClose)
    // 마운트 때 한 번만 거르려고 최신 steps를 ref로 읽는다.
    // deps에 steps를 두면 인라인 배열을 넘긴 호출부에서 매 렌더마다 다시 걸러 루프가 된다
    const stepsRef = useRef(steps)
    stepsRef.current = steps

    // 시작할 때 한 번, 살아 있는 단계만 남긴다.
    // 챌린짓 검색창은 탐색 탭에서만 있고 로그잇 도감 카드는 신규 유저에게 없다 —
    // 이걸 걸러내지 않으면 빈 화면을 가리키는 단계가 나온다
    useLayoutEffect(() => {
        setLive(
            stepsRef.current.filter((step) => !step.anchor || document.querySelector(`[data-tour="${step.anchor}"]`)),
        )
    }, [])

    const step: TourStep | undefined = live?.[index]

    const measure = useCallback(() => {
        const host = document.querySelector('.app-shell-content')
        setHostHeight(host?.clientHeight ?? 0)
        if (!step?.anchor) {
            setBox(null)
            return
        }
        const el = document.querySelector(`[data-tour="${step.anchor}"]`)
        if (!el || !host) {
            setBox(null)
            return
        }
        const rect = el.getBoundingClientRect()
        const hostRect = host.getBoundingClientRect()
        setBox({
            top: rect.top - hostRect.top - PAD,
            left: rect.left - hostRect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
        })
    }, [step])

    /**
     * 단계가 바뀌면 대상을 화면 안으로 들인 뒤 잰다.
     *
     * **스크롤은 일부러 즉시(`auto`)다.** `smooth`로 하면 스크롤이 끝나는 시점을 알 수
     * 없어 타이머로 어림잡아야 하는데, 거리가 멀면 그 사이에 재게 되어 스포트라이트가
     * 옛 좌표에 뜬다. 움직임은 스포트라이트 자체의 250ms 전환이 만들고 있으므로
     * 배경이 즉시 움직여도 어색하지 않다 — 오히려 목표가 가만히 있어 더 깔끔하다
     */
    useEffect(() => {
        if (!step) return
        const el = step.anchor ? document.querySelector(`[data-tour="${step.anchor}"]`) : null
        el?.scrollIntoView({ block: 'center', behavior: 'auto' })
        // 곧바로 잰다. `auto` 스크롤은 동기라 이 시점에 이미 자리가 잡혀 있다.
        // rAF로 미루면 **탭이 뒤에 있거나 화면이 합성되지 않을 때 콜백이 아예 안 돌아**
        // 좌표가 null로 남고 화면 전체가 어두워진 채 멈춘다
        measure()
    }, [step, measure])

    // 스크롤·리사이즈로 대상이 움직이면 따라간다.
    // capture:true — 스크롤은 안쪽 `main`에서 일어나므로 버블링만으로는 못 잡는다
    useEffect(() => {
        const onMove = () => measure()
        window.addEventListener('scroll', onMove, true)
        window.addEventListener('resize', onMove)
        return () => {
            window.removeEventListener('scroll', onMove, true)
            window.removeEventListener('resize', onMove)
        }
    }, [measure])

    const last = index >= (live?.length ?? 0) - 1
    const next = useCallback(() => (last ? onClose() : setIndex((i) => i + 1)), [last, onClose])
    const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

    // ←/→로도 넘긴다. Escape는 useFocusTrap이 onClose로 처리한다
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight') next()
            if (event.key === 'ArrowLeft') prev()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [next, prev])

    // 걸러 보니 짚을 것이 하나도 없으면 투어 자체가 의미 없다.
    // 그냥 안 그리면 매번 다시 뜨므로 '봤음'으로 닫는다.
    // `live !== null` — 아직 안 거른 상태와 걸렀는데 비어 있는 상태는 다르다
    useEffect(() => {
        if (live !== null && live.length === 0) onClose()
    }, [live, onClose])

    if (!step) return null

    // 말풍선을 위에 둘지 아래에 둘지 — 여유가 많은 쪽.
    // 아래쪽은 `top`, 위쪽은 `bottom`으로 붙인다. 높이를 몰라도 스포트라이트를 안 덮는다
    const below = !box || hostHeight - (box.top + box.height) >= box.top
    const move = reduceMotion ? undefined : 'top .25s ease, left .25s ease, width .25s ease, height .25s ease'

    return (
        <div className="fixed inset-0 z-50" role="presentation">
            {box ? (
                <div
                    aria-hidden
                    className="pointer-events-none absolute rounded-2xl"
                    style={{
                        top: box.top,
                        left: box.left,
                        width: box.width,
                        height: box.height,
                        boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.55)',
                        transition: move,
                    }}
                />
            ) : (
                <div aria-hidden className="absolute inset-0 bg-black/55" />
            )}

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                // useFocusTrap이 이 div에 focus()를 건다 — 없으면 포커스가 뒤쪽 화면에 남는다
                // (BottomSheet·Dialog도 같은 규약)
                tabIndex={-1}
                className="absolute left-4 right-4 rounded-2xl bg-surface-card p-4 shadow-modal"
                style={
                    box
                        ? below
                            ? { top: box.top + box.height + GAP }
                            : { bottom: hostHeight - box.top + GAP }
                        : { top: '50%', transform: 'translateY(-50%)' }
                }
            >
                <p className="font-display text-lg text-content-primary">{step.title}</p>
                <p className="mt-1 break-keep text-sm text-content-secondary">{step.body}</p>

                <div className="mt-4 flex items-center gap-2">
                    {/* 색에만 의존하지 않도록 단계를 숫자로도 알린다 (§접근성) */}
                    <span aria-live="polite" className="text-xs font-bold text-content-muted">
                        {index + 1} / {live?.length ?? 0}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-auto min-h-touch px-3 text-sm font-bold text-content-secondary"
                    >
                        건너뛰기
                    </button>
                    {index > 0 && (
                        <button
                            type="button"
                            onClick={prev}
                            className="min-h-touch rounded-full border border-edge-default px-4 text-sm font-bold text-content-secondary"
                        >
                            이전
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={next}
                        className="min-h-touch rounded-full bg-action-primary px-5 text-sm font-bold text-content-on-action active:scale-[0.98]"
                    >
                        {last ? '시작하기' : '다음'}
                    </button>
                </div>
            </div>
        </div>
    )
}
