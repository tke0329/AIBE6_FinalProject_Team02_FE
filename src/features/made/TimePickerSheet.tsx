import React, { useState } from 'react'
import { BottomSheet } from '@/shared/ui/molecules/BottomSheet'

interface Props {
    /** `HH:mm` (24시간). 비어 있으면 아직 안 적은 것 */
    value: string
    onDone: (value: string) => void
    onClose: () => void
}

type Meridiem = '오전' | '오후'

/** `HH:mm` → 12시간 표기. 값이 없으면 빈 칸으로 시작한다 */
function split(value: string): { meridiem: Meridiem; hour: string; minute: string } {
    if (!value) return { meridiem: '오전', hour: '', minute: '' }
    const [rawHour, minute] = value.split(':')
    const hour24 = Number(rawHour)
    const meridiem: Meridiem = hour24 >= 12 ? '오후' : '오전'
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
    return { meridiem, hour: String(hour12), minute }
}

function toValue(meridiem: Meridiem, hour: number, minute: number): string {
    // 12시는 예외다. 오전 12시가 0시, 오후 12시가 12시
    const base = hour % 12
    const hour24 = meridiem === '오후' ? base + 12 : base
    return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function digitsOnly(text: string, max: number): string {
    return text.replace(/\D/g, '').slice(0, max)
}

export function TimePickerSheet({ value, onDone, onClose }: Props) {
    const initial = split(value)
    const [meridiem, setMeridiem] = useState<Meridiem>(initial.meridiem)
    const [hour, setHour] = useState(initial.hour)
    const [minute, setMinute] = useState(initial.minute)

    const hourNumber = Number(hour)
    const minuteNumber = Number(minute)
    const valid =
        hour !== '' && minute !== '' && hourNumber >= 1 && hourNumber <= 12 && minuteNumber >= 0 && minuteNumber <= 59

    return (
        <BottomSheet title="언제 먹었나요?" onClose={onClose}>
            <div className="px-5 pb-8 pt-4">
                <div className="mx-auto flex w-48 rounded-full bg-cream-200 p-1">
                    {(['오전', '오후'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setMeridiem(option)}
                            aria-pressed={meridiem === option}
                            className={`min-h-touch flex-1 rounded-full text-sm font-bold transition-colors ${
                                meridiem === option
                                    ? 'bg-surface-card text-content-primary shadow-card'
                                    : 'text-content-secondary'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                <div className="flex items-end justify-center gap-3 pt-6">
                    <label className="flex flex-col items-center">
                        <span className="pb-1 text-xs font-medium text-content-muted">시</span>
                        <input
                            value={hour}
                            onChange={(event) => setHour(digitsOnly(event.target.value, 2))}
                            inputMode="numeric"
                            placeholder="00"
                            aria-label="시"
                            className="w-20 border-b border-edge-default bg-transparent pb-1 text-center font-display text-3xl text-content-primary"
                        />
                    </label>
                    <span aria-hidden className="pb-2 font-display text-3xl text-content-muted">
                        :
                    </span>
                    <label className="flex flex-col items-center">
                        <span className="pb-1 text-xs font-medium text-content-muted">분</span>
                        <input
                            value={minute}
                            onChange={(event) => setMinute(digitsOnly(event.target.value, 2))}
                            inputMode="numeric"
                            placeholder="00"
                            aria-label="분"
                            className="w-20 border-b border-edge-default bg-transparent pb-1 text-center font-display text-3xl text-content-primary"
                        />
                    </label>
                </div>

                <button
                    type="button"
                    onClick={() => onDone(toValue(meridiem, hourNumber, minuteNumber))}
                    disabled={!valid}
                    className="mt-8 h-cta w-full rounded-full bg-action-primary text-sm font-bold text-content-on-action disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
                >
                    완료
                </button>
            </div>
        </BottomSheet>
    )
}
