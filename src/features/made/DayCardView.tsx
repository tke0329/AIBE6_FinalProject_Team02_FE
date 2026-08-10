import { RotateCwIcon } from 'lucide-react'
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
    onRecord: () => void
}

/** 냉장고 — 위쪽은 공유용 카드, 아래쪽은 카드에 담기지 않는 담긴 사람 */
export function DayCardView({ madeDexId, date, title, onRecord }: Props) {
    const { dayCard, loading, error, reload } = useLogitDayCard(madeDexId, date)
    const hasItems = dayCard?.slots.some((slot) => slot.items.length > 0) ?? false

    return (
        <>
            {dayCard && hasItems && <DayCardShare dayCard={dayCard} title={title} />}
            <DayCardContent dayCard={dayCard} loading={loading} error={error} onReload={reload} onRecord={onRecord} />
        </>
    )
}

interface ContentProps {
    dayCard: LogitDayCard | null
    loading: boolean
    error: string | null
    onReload: () => void
    onRecord: () => void
}

/** 데이터와 분리한 냉장고 화면 */
export function DayCardContent({ dayCard, loading, error, onReload, onRecord }: ContentProps) {
    if (error) {
        return (
            <div className="pt-10 text-center">
                <p className="break-keep text-sm font-bold text-content-primary">{error}</p>
                <button
                    type="button"
                    onClick={onReload}
                    className="mt-3 min-h-touch rounded-full bg-cream-200 px-5 text-sm font-bold text-content-secondary"
                >
                    다시 시도
                </button>
            </div>
        )
    }

    if (loading && !dayCard) {
        return (
            <div className="space-y-3 pt-5" aria-hidden>
                <div className="h-5 w-24 animate-pulse rounded-full bg-cream-200" />
                <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-cream-200" />
            </div>
        )
    }

    if (!dayCard) return null

    const filledSlots = dayCard.slots.filter((slot) => slot.items.length > 0)

    if (filledSlots.length === 0) {
        return (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge-default bg-cream-50 text-center">
                <span aria-hidden className="text-3xl">
                    🧊
                </span>
                <p className="mt-2 break-keep text-sm font-bold text-content-primary">아직 냉장고가 비어 있어요</p>
                <button
                    type="button"
                    onClick={onRecord}
                    className="mt-3 min-h-touch rounded-full bg-action-primary px-5 text-sm font-bold text-content-on-action shadow-card"
                >
                    식사 기록하기
                </button>
            </div>
        )
    }

    // 끼니 층·통계는 위의 공유 카드가 이미 보여 준다. 여기서는 카드에 없는 것만 남긴다
    return (
        <section className="pt-4">
            <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-bold text-content-secondary">담긴 사람</h3>
                <button
                    type="button"
                    onClick={onReload}
                    aria-label="냉장고 새로고침"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card text-content-secondary shadow-card"
                >
                    <RotateCwIcon size={16} aria-hidden className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <ul className="space-y-2">
                {dayCard.participants.map((person) => (
                    <li key={person.userId} className="flex items-center gap-3">
                        <LogitAvatar name={authorName(person)} imageUrl={person.profileImageUrl} size="md" />
                        <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1 text-sm font-bold text-content-primary">
                                <span className="truncate">{authorName(person)}</span>
                                {person.me && <span className="text-xs text-content-link">나</span>}
                            </p>
                            <p className="truncate text-xs text-content-muted">
                                {person.count}개{person.captions.length > 0 && ` · ${person.captions.join(', ')}`}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}
