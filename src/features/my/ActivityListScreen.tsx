import React from 'react'
import { AppScreen, EmptyState, PageHeader, Skeleton, TabBar } from '@/shared/ui'
import type { TabItem } from '@/shared/ui'

interface Props<T extends string> {
    title: string
    /**
     * 상단 탭. 개수는 **라벨에 접어 넣는다**(`챌린짓 12`) — `TabBar`의 `TabItem`에 개수
     * 필드가 없고, 그 파일이 "새 형태가 필요하면 컴포넌트를 만들지 말고 variant를
     * 추가할 것"이라고 정해 두었다. 아직 안 불러온 탭은 개수를 빼면 되므로
     * 「0개」로 잘못 보일 일이 없다
     */
    tabs: Array<TabItem<T>>
    activeTab: T
    onTab: (key: T) => void
    /** **활성 탭의** 항목 수. `null`이면 아직 불러오는 중 */
    count: number | null
    /** **활성 탭의** 실패 여부 */
    failed?: boolean
    onRetry?: () => void
    onBack: () => void
    /**
     * 활성 탭이 0개일 때 보여 줄 것.
     *
     * `action`은 **여기서 바로 시작할 수 있을 때만** 넣는다. 「좋아요한 글」처럼
     * 갈 곳이 하나로 정해지지 않는 화면은 안내만 둔다 — 후보 중 하나를 임의로 고른
     * 버튼은 나중에 다른 후보가 생기면 틀린 안내가 된다
     */
    empty: {
        icon: string
        title: string
        description: string
        action?: { label: string; onClick: () => void }
    }
    /** 카드 `<li>` 목록 */
    children: React.ReactNode
}

/**
 * 내 활동 목록 화면의 껍데기 — 머리글 + 탭 + 네 가지 상태.
 *
 * 「내가 쓴 글」과 「좋아요한 글」이 같은 틀이라 한 벌로 뽑았다. 두 화면 모두
 * `챌린짓`(리뷰)과 `로그잇`(댓글·기록) 탭을 갖는다.
 *
 * ## 빈 것과 실패를 갈라 놓는다
 *
 * "아직 없다"는 사용자가 만들면 되고 "못 불러왔다"는 다시 시도해야 한다. 같은 화면을
 * 보여 주면 무엇을 해야 할지 알 수 없다. 그래서 부르는 쪽도 실패 시 목록을 `[]`로
 * 두지 말고 `null`로 남겨야 한다.
 *
 * ## 상태는 탭마다 따로다
 *
 * `count`·`failed`·`empty`는 **활성 탭 기준**으로 받는다. 한쪽 요청이 실패해도
 * 다른 탭은 그대로 쓸 수 있어야 한다 — 두 소스를 따로 부르기 때문이다
 */
export function ActivityListScreen<T extends string>({
    title,
    tabs,
    activeTab,
    onTab,
    count,
    failed,
    onRetry,
    onBack,
    empty,
    children,
}: Props<T>) {
    return (
        <AppScreen header={<PageHeader title={title} onBack={onBack} />}>
            <TabBar
                label={`${title} 종류 전환`}
                items={tabs}
                value={activeTab}
                onChange={onTab}
                variant="segmented"
                className="mb-4"
            />

            {failed ? (
                <EmptyState
                    tone="error"
                    title="불러오지 못했어요"
                    description="잠시 뒤 다시 시도해 주세요."
                    action={onRetry ? { label: '다시 시도', onClick: onRetry } : undefined}
                />
            ) : count === null ? (
                // 카드와 같은 높이로 자리를 잡아 둔다 — 채워질 때 목록이 튀지 않는다
                <div className="space-y-3 pb-8" role="status" aria-label={`${title} 불러오는 중`}>
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                </div>
            ) : count === 0 ? (
                <EmptyState
                    icon={empty.icon}
                    title={empty.title}
                    description={empty.description}
                    action={empty.action}
                />
            ) : (
                <ul className="space-y-3 pb-8">{children}</ul>
            )}
        </AppScreen>
    )
}
