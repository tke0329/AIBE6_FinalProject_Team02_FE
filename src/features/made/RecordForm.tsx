'use client'

import React, { useState } from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { PhotoSourceSheet } from './PhotoSourceSheet'
import { RecordPhotoPicker } from './RecordPhotoPicker'
import { TimePickerSheet } from './TimePickerSheet'
import { useRecordForm } from './useRecordForm'
import { timeText } from './logitTypes'
import { isUploading } from './recordPhotos'
import type { MadeDexId } from './types'

interface Props {
    madeDexId: MadeDexId
    /** 수정이면 기록 id */
    recordId?: number
    /** 슬롯 카드로 들어오면 정해져 있고, 하단 CTA로 들어오면 비어 있다 */
    slotId?: number
    date: string
    onBack: () => void
    onDone: () => void
}

export function RecordForm({ madeDexId, recordId, slotId, date, onBack, onDone }: Props) {
    const form = useRecordForm({
        madeDexId,
        recordId: recordId ?? null,
        initialSlotId: slotId ?? null,
        initialDate: date,
    })

    // 새 기록은 사진부터다. 빈 폼을 먼저 보여 주면 무엇을 하는 화면인지 흐려진다
    const [sourceOpen, setSourceOpen] = useState(recordId === undefined)
    const [timeOpen, setTimeOpen] = useState(false)

    const editing = recordId !== undefined
    const uploading = isUploading(form.photos)

    const save = async () => {
        if (await form.submit()) onDone()
    }

    return (
        <div className="relative flex h-full flex-col bg-cream-100">
            <header className="flex shrink-0 items-center gap-2 bg-surface-app px-5 pt-4">
                <button type="button" onClick={onBack} aria-label="뒤로">
                    <ArrowLeftIcon size={21} aria-hidden />
                </button>
                <h1 className="flex-1 font-display text-xl text-content-primary">
                    {editing ? '기록 고치기' : '식사 기록하기'}
                </h1>
            </header>

            <main className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-5 pb-28 pt-4">
                {form.error && <p className="break-keep text-sm font-medium text-content-link">{form.error}</p>}

                <RecordPhotoPicker
                    photos={form.photos}
                    onAdd={() => setSourceOpen(true)}
                    onCaption={form.writeCaption}
                    onCover={form.makeCover}
                    onRemove={form.removePhoto}
                    onRetry={form.retryPhoto}
                />

                <section aria-label="끼니">
                    <h2 className="pb-2 text-sm font-bold text-content-primary">어느 끼니인가요?</h2>
                    <div className="flex flex-wrap gap-2">
                        {form.slots.map((slot) => {
                            const selected = slot.slotId === form.slotId
                            return (
                                <button
                                    key={slot.slotId}
                                    type="button"
                                    onClick={() => form.setSlotId(slot.slotId)}
                                    aria-pressed={selected}
                                    className={`min-h-touch rounded-full px-4 text-sm font-bold transition-colors ${
                                        selected
                                            ? 'bg-action-primary text-content-on-action shadow-card'
                                            : 'bg-cream-200 text-content-secondary'
                                    }`}
                                >
                                    {slot.name}
                                </button>
                            )
                        })}
                    </div>
                </section>

                <section aria-label="시간">
                    <h2 className="pb-2 text-sm font-bold text-content-primary">몇 시에 먹었나요?</h2>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTimeOpen(true)}
                            className="min-h-touch rounded-xl bg-cream-100 px-4 text-sm font-bold text-content-primary"
                        >
                            {form.loggedTime ? timeText(form.loggedTime) : '시간 입력'}
                        </button>
                        {form.loggedTime && (
                            <button
                                type="button"
                                onClick={() => form.setLoggedTime('')}
                                className="min-h-touch px-2 text-xs font-bold text-content-link"
                            >
                                지우기
                            </button>
                        )}
                    </div>
                </section>
            </main>

            <button
                type="button"
                onClick={() => void save()}
                disabled={!form.ready || form.submitting || uploading}
                className="absolute bottom-5 left-5 right-5 flex h-cta items-center justify-center rounded-full bg-action-primary text-sm font-bold text-content-on-action shadow-card disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
            >
                {uploading ? '사진 올리는 중…' : editing ? '저장하기' : '기록하기'}
            </button>

            {form.failed && (
                <p className="absolute bottom-20 left-5 right-5 break-keep text-center text-xs font-medium text-content-link">
                    올리지 못한 사진이 있어요. 다시 시도하거나 빼 주세요.
                </p>
            )}

            {sourceOpen && <PhotoSourceSheet onPick={form.addFiles} onClose={() => setSourceOpen(false)} />}

            {timeOpen && (
                <TimePickerSheet
                    value={form.loggedTime}
                    onDone={(picked) => {
                        form.setLoggedTime(picked)
                        setTimeOpen(false)
                    }}
                    onClose={() => setTimeOpen(false)}
                />
            )}
        </div>
    )
}
