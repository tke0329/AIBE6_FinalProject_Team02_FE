import { GuideTour } from '@/features/onboarding/GuideTour'
import { useGuide } from '@/features/onboarding/useGuide'
import { BottomNav, HelpIcon, NavTab } from '@/shared/ui'
import { ArrowLeftIcon, MenuIcon, MessageSquareTextIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { DateStrip } from './DateStrip'
import { DayCardView } from './DayCardView'
import { EmptyCaptionSheet } from './EmptyCaptionSheet'
import { LogitCalendar } from './LogitCalendar'
import { MealSlotSection } from './MealSlotSection'
import { RecordDetailSheet } from './RecordDetailSheet'
import { SlotEditSheet } from './SlotEditSheet'
import type { MadeDexId } from './types'
import { useEmptyCaption } from './useEmptyCaption'
import { useLogitFeed } from './useLogitFeed'

interface Props {
    dexId: MadeDexId
    title: string
    onBack: () => void
    onOpenInfo: () => void
    /** 기록 화면으로. 어느 날짜의 어느 끼니인지 들고 간다 */
    onRecord: (date: string, slotId?: number) => void
    onEditRecord: (recordId: number) => void
    /** 아바타를 누른 사람의 프로필로. 나면 마이페이지로 보낸다 */
    onOpenProfile: (userId: number, me: boolean) => void
    onTab: (tab: NavTab) => void
}

export function LogitHome({ dexId, title, onBack, onOpenInfo, onRecord, onEditRecord, onOpenProfile, onTab }: Props) {
    const feed = useLogitFeed(dexId)
    const emptyCaption = useEmptyCaption(dexId, feed.date)
    const [dayCardOpen, setDayCardOpen] = useState(false)
    const [slotsOpen, setSlotsOpen] = useState(false)
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [captionOpen, setCaptionOpen] = useState(false)
    const [openedRecordIds, setOpenedRecordIds] = useState<number[] | null>(null)

    const slots = feed.feed?.slots ?? []
    // 로그잇은 오늘을 나누는 앱이다. 지난 날은 읽기만 한다
    const canRecord = feed.today !== '' && feed.date === feed.today
    // 끼니가 그려진 뒤에 켠다 — 로딩 중이면 짚을 요소가 없어 투어가 헛돈다
    const guide = useGuide('logit-home', !!feed.feed)

    return (
        <div className="relative flex h-full flex-col bg-surface-app">
            <header className="shrink-0 bg-surface-app px-5 pt-4">
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onBack} aria-label="로그잇 목록으로">
                        <ArrowLeftIcon size={21} aria-hidden />
                    </button>
                    <h1 className="min-w-0 flex-1 truncate font-display text-xl text-content-primary">{title}</h1>
                    <HelpIcon label="로그잇" onClick={guide.replay} />
                    <button
                        type="button"
                        onClick={onOpenInfo}
                        aria-label="로그잇 정보"
                        className="min-h-touch shrink-0"
                    >
                        <MenuIcon size={22} aria-hidden className="text-content-primary" />
                    </button>
                </div>

                <div data-tour="logit-date">
                    <DateStrip
                        date={feed.date}
                        today={feed.today}
                        onChange={feed.select}
                        onOpenCalendar={() => setCalendarOpen(true)}
                        className="pt-2"
                    />
                </div>
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-48">
                {feed.error && (
                    <div className="pt-10 text-center">
                        <p className="break-keep text-sm font-bold text-content-primary">{feed.error}</p>
                        <button
                            type="button"
                            onClick={feed.reload}
                            className="mt-3 min-h-touch rounded-full bg-neutral-100 px-5 text-sm font-bold text-content-secondary"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {feed.loading && !feed.feed && (
                    <div className="space-y-3 pt-5" aria-hidden>
                        <div className="h-5 w-20 animate-pulse rounded-full bg-neutral-100" />
                        <div className="aspect-square w-4/5 animate-pulse rounded-2xl bg-neutral-100" />
                    </div>
                )}

                {!feed.error && feed.feed && (
                    <>
                        {/* 편집은 끼니 목록 **위**에 둔다. 아래에 있으면 끼니가 많은 날 스크롤을
                            끝까지 내려야 나와서 있는 줄도 모른다 */}
                        <div className="grid grid-cols-2 gap-2 pt-3">
                            <button
                                type="button"
                                data-tour="logit-edit"
                                onClick={() => setSlotsOpen(true)}
                                className="flex min-h-touch items-center justify-center gap-1.5 rounded-full border border-edge-default px-2 text-sm font-bold text-content-secondary"
                            >
                                <PencilIcon size={15} aria-hidden className="shrink-0" />
                                <span className="truncate">구성 편집</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCaptionOpen(true)}
                                className="flex min-h-touch items-center justify-center gap-1.5 rounded-full border border-edge-default px-2 text-sm font-bold text-content-secondary"
                            >
                                <MessageSquareTextIcon size={15} aria-hidden className="shrink-0" />
                                <span className="truncate">빈 칸 문구</span>
                            </button>
                        </div>

                        {slots.map((slot, index) => (
                            <MealSlotSection
                                key={slot.slotId}
                                // 첫 끼니만 짚는다 — 끼니가 여럿이어도 설명은 한 번이면 된다
                                dataTour={index === 0 ? 'logit-slot' : undefined}
                                slot={slot}
                                onOpen={(card) => setOpenedRecordIds(card.recordIds)}
                                canRecord={canRecord}
                                emptyCaption={emptyCaption.caption}
                                onRecord={(target) => onRecord(feed.date, target.slotId)}
                                onOpenProfile={(card) => onOpenProfile(card.userId, card.me)}
                            />
                        ))}
                    </>
                )}
            </main>

            {/*
             * 하단에는 냉장고 만들기 하나만, 오른쪽 절반 크기로 둔다.
             *
             *   - `식사 기록하기`를 뺐다 — 끼니 카드마다 `+ 기록하기`가 이미 있어서
             *     같은 일을 하는 큰 버튼이 화면 아래를 덮고 있었다
             *   - 남은 하나도 폭을 꽉 채우지 않는다. 하루에 한 번 누르는 동작이 화면
             *     아래를 통째로 가릴 이유가 없다
             */}
            {!feed.error && feed.feed && (
                <div className="pointer-events-none absolute bottom-20 left-4 right-4 flex justify-end">
                    <button
                        type="button"
                        data-tour="logit-daycard"
                        onClick={() => setDayCardOpen(true)}
                        className="pointer-events-auto flex min-h-touch w-1/2 items-center justify-center gap-1.5 rounded-full border border-edge-default bg-surface-card px-3 text-sm font-bold text-content-primary shadow-card active:scale-[0.98]"
                    >
                        <span className="truncate">냉장고 만들기</span>
                    </button>
                </div>
            )}

            <BottomNav active="제작" onTab={onTab} />

            {calendarOpen && feed.today && (
                <LogitCalendar
                    madeDexId={dexId}
                    date={feed.date}
                    today={feed.today}
                    onSelect={(picked) => {
                        feed.select(picked)
                        setCalendarOpen(false)
                    }}
                    onClose={() => setCalendarOpen(false)}
                />
            )}

            <GuideTour guide={guide} />

            {slotsOpen && (
                <SlotEditSheet madeDexId={dexId} onClose={() => setSlotsOpen(false)} onChanged={feed.reload} />
            )}

            {captionOpen && (
                <EmptyCaptionSheet
                    caption={emptyCaption.caption}
                    onSave={emptyCaption.save}
                    onClose={() => setCaptionOpen(false)}
                />
            )}

            {openedRecordIds && (
                <RecordDetailSheet
                    madeDexId={dexId}
                    recordIds={openedRecordIds}
                    onClose={() => setOpenedRecordIds(null)}
                    onEdit={onEditRecord}
                    onDeleted={() => {
                        setOpenedRecordIds(null)
                        feed.reload()
                    }}
                />
            )}

            {dayCardOpen && (
                <div className="absolute inset-0 z-20 flex flex-col bg-surface-app">
                    <div className="shrink-0 bg-surface-app px-5 pt-4">
                        <button
                            type="button"
                            onClick={() => setDayCardOpen(false)}
                            aria-label="냉장고 닫기"
                            className="min-h-touch"
                        >
                            <ArrowLeftIcon size={21} aria-hidden />
                        </button>
                    </div>
                    <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-10">
                        <DayCardView
                            madeDexId={dexId}
                            date={feed.date}
                            title={title}
                            canRecord={canRecord}
                            emptyCaption={emptyCaption.caption}
                            onRecord={() => onRecord(feed.date)}
                            onOpenProfile={onOpenProfile}
                        />
                    </main>
                </div>
            )}
        </div>
    )
}
