import React, { useState } from 'react'
import { ArrowLeftIcon, MenuIcon, PencilIcon, PlusIcon } from 'lucide-react'
import { BottomNav, NavTab } from '@/shared/ui/molecules/BottomNav'
import { DexHelpSheet } from '@/shared/ui/molecules/DexHelpSheet'
import { HelpIcon } from '@/shared/ui/atoms/HelpIcon'
import { TabBar } from '@/shared/ui/molecules/TabBar'
import { DateStrip } from './DateStrip'
import { FridgeGrid } from './FridgeGrid'
import { LogitCalendar } from './LogitCalendar'
import { MealSlotSection } from './MealSlotSection'
import { RecordDetailSheet } from './RecordDetailSheet'
import { SlotEditSheet } from './SlotEditSheet'
import { fridgeFromFeed } from './fridgeFromFeed'
import { useLogitFeed } from './useLogitFeed'
import type { MadeDexId } from './types'

type LogitTab = 'home' | 'fridge'

interface Props {
    dexId: MadeDexId
    title: string
    onBack: () => void
    onOpenInfo: () => void
    /** 기록 화면으로. 어느 날짜의 어느 끼니인지 들고 간다 */
    onRecord: (date: string, slotId?: number) => void
    onEditRecord: (recordId: number) => void
    onTab: (tab: NavTab) => void
}

const TABS = [
    { id: 'home' as const, label: '홈' },
    { id: 'fridge' as const, label: '로그' },
]

export function LogitHome({ dexId, title, onBack, onOpenInfo, onRecord, onEditRecord, onTab }: Props) {
    const feed = useLogitFeed(dexId)
    const [tab, setTab] = useState<LogitTab>('home')
    const [helpOpen, setHelpOpen] = useState(false)
    const [slotsOpen, setSlotsOpen] = useState(false)
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [openedRecordIds, setOpenedRecordIds] = useState<number[] | null>(null)

    const slots = feed.feed?.slots ?? []

    return (
        <div className="relative flex h-full flex-col bg-cream-100">
            <header className="shrink-0 bg-surface-app px-5 pt-4">
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onBack} aria-label="로그잇 목록으로">
                        <ArrowLeftIcon size={21} aria-hidden />
                    </button>
                    <h1 className="min-w-0 flex-1 truncate font-display text-xl text-content-primary">{title}</h1>
                    <HelpIcon label="로그잇" onClick={() => setHelpOpen(true)} />
                    <button
                        type="button"
                        onClick={onOpenInfo}
                        aria-label="로그잇 정보"
                        className="min-h-touch shrink-0"
                    >
                        <MenuIcon size={22} aria-hidden className="text-content-primary" />
                    </button>
                </div>

                <DateStrip
                    date={feed.date}
                    today={feed.today}
                    onChange={feed.select}
                    onOpenCalendar={() => setCalendarOpen(true)}
                    className="pt-2"
                />

                <TabBar label="로그잇 보기 전환" items={TABS} value={tab} onChange={setTab} className="mb-3" />
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28">
                {feed.error && (
                    <div className="pt-10 text-center">
                        <p className="break-keep text-sm font-bold text-content-primary">{feed.error}</p>
                        <button
                            type="button"
                            onClick={feed.reload}
                            className="mt-3 min-h-touch rounded-full bg-cream-200 px-5 text-sm font-bold text-content-secondary"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {feed.loading && !feed.feed && (
                    <div className="space-y-3 pt-5" aria-hidden>
                        <div className="h-5 w-20 animate-pulse rounded-full bg-cream-200" />
                        <div className="aspect-[4/3] w-4/5 animate-pulse rounded-2xl bg-cream-200" />
                    </div>
                )}

                {!feed.error && feed.feed && tab === 'home' && (
                    <>
                        {slots.map((slot) => (
                            <MealSlotSection
                                key={slot.slotId}
                                slot={slot}
                                onOpen={(card) => setOpenedRecordIds(card.recordIds)}
                                onRecord={(target) => onRecord(feed.date, target.slotId)}
                            />
                        ))}

                        <button
                            type="button"
                            onClick={() => setSlotsOpen(true)}
                            className="mt-6 flex min-h-touch w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-edge-default text-sm font-bold text-content-secondary"
                        >
                            <PencilIcon size={15} aria-hidden />
                            구성 편집
                        </button>
                    </>
                )}

                {!feed.error && feed.feed && tab === 'fridge' && (
                    <div className="pt-5">
                        <FridgeGrid entries={fridgeFromFeed(feed.feed)} onRecord={() => onRecord(feed.date)} />
                    </div>
                )}
            </main>

            <button
                type="button"
                onClick={() => onRecord(feed.date)}
                className="absolute bottom-20 left-4 right-4 flex h-cta items-center justify-center gap-1 rounded-full bg-action-primary text-sm font-bold text-content-on-action shadow-card"
            >
                <PlusIcon size={18} aria-hidden />
                식사 기록하기
            </button>

            <BottomNav active="제작" onTab={onTab} />

            {calendarOpen && feed.today && (
                <LogitCalendar
                    date={feed.date}
                    today={feed.today}
                    onSelect={(picked) => {
                        feed.select(picked)
                        setCalendarOpen(false)
                    }}
                    onClose={() => setCalendarOpen(false)}
                />
            )}

            {helpOpen && <DexHelpSheet kind="made" onClose={() => setHelpOpen(false)} />}

            {slotsOpen && (
                <SlotEditSheet madeDexId={dexId} onClose={() => setSlotsOpen(false)} onChanged={feed.reload} />
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
        </div>
    )
}
