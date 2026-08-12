import React from 'react'

/**
 * 탭 식별자.
 *
 * **사용자에게 보이는 이름과 다르다.** 명칭 개편(기본 도감→베이짓 등)에서
 * 코드명은 그대로 두기로 했으므로(AGENTS.md §1) 여기 값은 옛 이름을 유지한다.
 * 바꾸면 라우팅·화면 16곳이 함께 움직이는데 사용자에게 달라지는 건 없다.
 * 보이는 이름은 아래 `TABS`의 `label`이 정한다.
 */
export type NavTab = '기본' | '제작' | '챌린지' | '마이'

interface BottomNavProps {
    active: NavTab
    onTab?: (tab: NavTab) => void
}

/**
 * **왼쪽부터 로그잇 → 챌린짓 → 베이짓 → 마이.**
 *
 * 로그잇이 첫 자리인 건 우선순위가 그렇기 때문이다(로그잇+SNS 1순위, 베이짓 후순위).
 * 엄지가 가장 편하게 닿는 자리부터 자주 쓰는 것을 놓는다.
 */
const TABS: Array<{ id: NavTab; label: string; icon: string }> = [
    { id: '제작', label: '로그잇', icon: '/images/bottom_nav/logit.png' },
    { id: '챌린지', label: '챌린짓', icon: '/images/bottom_nav/challengit.png' },
    { id: '기본', label: '베이짓', icon: '/images/bottom_nav/basit.png' },
    { id: '마이', label: '마이', icon: '/images/bottom_nav/my.png' },
]

/**
 * §2 하단 4탭 고정 네비. safe-area 반영, 터치 타깃 44px 이상.
 *
 * ## 아이콘 높이를 맞추고 폭은 흐르게 둔 이유
 *
 * 네 그림의 가로세로가 서로 반대다 — 실측 잉크 영역이 로그잇 125×82(가로 1.52:1)인데
 * 챌린짓은 108×123(세로 0.88:1)이다. 정사각 박스에 `object-contain`으로 넣으면
 * 로그잇은 **폭에 걸려 높이가 66%로 줄고** 챌린짓은 높이를 꽉 채워서, 나란히 두면
 * 로그잇만 작아 보인다.
 *
 * 그래서 **높이만 고정(`h-7`)하고 폭은 `w-auto`로 흐르게** 둔다. 눈은 나란한 아이콘의
 * 높이를 먼저 읽으므로 이게 가장 고르게 보인다. 칸 하나가 107px이라 폭 차이는 여유가 있다.
 *
 * ## 활성 표시를 색으로 못 하는 대신
 *
 * lucide 아이콘이던 때는 `currentColor`로 활성 색을 바꿨지만, 이 그림들은 자기 색을
 * 갖고 있어서 그 방법이 통하지 않는다. 대신 **비활성만 회색조로 빼고 흐리게** 한다.
 * 라벨 색은 그대로 바뀌므로 활성 표시가 두 겹(그림 + 글자)으로 남는다.
 */
export function BottomNav({ active, onTab }: BottomNavProps) {
    return (
        <nav aria-label="주요 메뉴" className="shrink-0 border-t border-edge-default bg-surface-app pb-safe-b">
            <ul role="tablist" className="mx-auto flex w-full max-w-3xl">
                {TABS.map(({ id, label, icon }) => {
                    const isActive = active === id
                    return (
                        <li key={id} className="flex-1">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => onTab?.(id)}
                                className={`flex min-h-touch w-full flex-col items-center justify-center gap-1 py-2 transition-colors ${
                                    isActive ? 'text-action-primary' : 'text-content-muted hover:text-content-secondary'
                                }`}
                            >
                                {/*
                                    next/image를 쓰지 않는다. 128px 정적 아이콘 네 개라 최적화로
                                    얻을 게 없고, 모든 화면에 있는 네비라 이미지 최적화 경유를
                                    거치지 않는 편이 낫다
                                */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={icon}
                                    alt=""
                                    aria-hidden
                                    // 높이만 고정. 폭은 그림 비율대로 (컴포넌트 주석 참고)
                                    className={`h-7 w-auto transition ${isActive ? '' : 'opacity-40 grayscale'}`}
                                />
                                <span className="whitespace-nowrap text-xs font-medium">{label}</span>
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
