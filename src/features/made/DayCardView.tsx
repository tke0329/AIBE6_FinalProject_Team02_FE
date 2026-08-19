import { ChevronRightIcon, RefrigeratorIcon } from 'lucide-react'
import { LogitAvatar } from './LogitAvatar'
import { DayCardShare } from './share/DayCardShare'
import type { LogitDayCard } from './logitTypes'
import { authorName } from './logitTypes'
import type { MadeDexId } from './types'
import { useLogitDayCard } from './useLogitDayCard'

interface Props {
    madeDexId: MadeDexId
    /** feed가 정한 기준일 */
    date: string
    /** 로그잇 이름. 공유 카드 헤더에 올라간다 */
    title: string
    /** 오늘이 아니면 기록을 받지 않는다 */
    canRecord: boolean
    /** 담지 않은 사람의 칸에 뜰 글 (하루 단위) */
    emptyCaption: string
    onRecord: () => void
    onOpenProfile: (userId: number, me: boolean) => void
}

/** 냉장고 — 위쪽은 공유용 카드, 아래쪽은 카드에 담기지 않는 담긴 사람 */
export function DayCardView({ madeDexId, date, title, canRecord, emptyCaption, onRecord, onOpenProfile }: Props) {
    const { dayCard, loading, error, reload } = useLogitDayCard(madeDexId, date)
    const hasItems = dayCard?.slots.some((slot) => slot.items.length > 0) ?? false

    return (
        <>
            {dayCard && hasItems && <DayCardShare dayCard={dayCard} title={title} emptyCaption={emptyCaption} />}
            <DayCardContent
                dayCard={dayCard}
                loading={loading}
                error={error}
                canRecord={canRecord}
                onReload={reload}
                onRecord={onRecord}
                onOpenProfile={onOpenProfile}
            />
        </>
    )
}

interface ContentProps {
    dayCard: LogitDayCard | null
    loading: boolean
    error: string | null
    canRecord: boolean
    onReload: () => void
    onRecord: () => void
    onOpenProfile: (userId: number, me: boolean) => void
}

/** 데이터와 분리한 냉장고 화면 */
export function DayCardContent({
    dayCard,
    loading,
    error,
    canRecord,
    onReload,
    onRecord,
    onOpenProfile,
}: ContentProps) {
    if (error) {
        return (
            <div className="pt-10 text-center">
                <p className="break-keep text-sm font-bold text-content-primary">{error}</p>
                <button
                    type="button"
                    onClick={onReload}
                    className="mt-3 min-h-touch rounded-full bg-neutral-100 px-5 text-sm font-bold text-content-secondary"
                >
                    다시 시도
                </button>
            </div>
        )
    }

    if (loading && !dayCard) {
        return (
            <div className="space-y-3 pt-5" aria-hidden>
                <div className="h-5 w-24 animate-pulse rounded-full bg-neutral-100" />
                <div className="aspect-square w-full animate-pulse rounded-2xl bg-neutral-100" />
            </div>
        )
    }

    if (!dayCard) return null

    const filledSlots = dayCard.slots.filter((slot) => slot.items.length > 0)

    if (filledSlots.length === 0) {
        return (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge-default bg-white text-center">
                <RefrigeratorIcon size={30} strokeWidth={1.5} aria-hidden className="text-neutral-400" />
                <p className="mt-2 break-keep text-sm font-bold text-content-primary">아직 냉장고가 비어 있어요</p>
                {canRecord ? (
                    <button
                        type="button"
                        onClick={onRecord}
                        className="mt-3 min-h-touch rounded-full bg-action-primary px-5 text-sm font-bold text-content-on-action shadow-card"
                    >
                        식사 기록하기
                    </button>
                ) : (
                    // 지난 날은 채울 수 없다. 버튼을 남겨 두면 눌러 놓고 거절당한다
                    <p className="mt-1 text-xs text-content-muted">그날은 아무도 기록하지 않았어요</p>
                )}
            </div>
        )
    }

    // 끼니 층·통계는 위의 공유 카드가 이미 보여 준다. 여기서는 카드에 없는 것만 남긴다
    return (
        <section className="pt-4">
            {/* 새로고침 단추를 두지 않는다 — "담긴 사람" 옆에 있어서 그 목록만 다시 받는 것처럼
                보이는데 실제로는 냉장고 전체를 다시 받았다. 실패 복구는 아래 오류 화면의
                "다시 시도"가 이미 맡고 있고, 남의 기록이 늘었는지는 날짜를 옮겼다 오면 갱신된다 */}
            <h3 className="pb-2 text-sm font-bold text-content-secondary">담긴 사람</h3>

            <ul className="space-y-2">
                {dayCard.participants.map((person) => (
                    <li key={person.userId}>
                        {/* 줄 전체를 눌러 그 사람 프로필로 간다 — 동그라미만 표적이면 너무 작다 */}
                        <button
                            type="button"
                            onClick={() => onOpenProfile(person.userId, person.me)}
                            aria-label={person.me ? '내 프로필 보기' : `${authorName(person)}님의 프로필 보기`}
                            className="no-touch-expand flex w-full items-center gap-3 rounded-2xl px-1 py-1 text-left active:scale-[0.99]"
                        >
                            <LogitAvatar
                                name={authorName(person)}
                                imageUrl={person.profileImageUrl}
                                userId={person.userId}
                                size="md"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1 text-sm font-bold text-content-primary">
                                    <span className="truncate">{authorName(person)}</span>
                                    {person.me && <span className="text-xs text-content-link">나</span>}
                                </span>
                                <span className="block truncate text-xs text-content-muted">
                                    {person.count}장{person.captions.length > 0 && ` · ${person.captions.join(', ')}`}
                                </span>
                            </span>
                            <ChevronRightIcon size={16} aria-hidden className="shrink-0 text-content-muted" />
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    )
}
