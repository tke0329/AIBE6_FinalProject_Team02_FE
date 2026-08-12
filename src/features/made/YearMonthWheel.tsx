import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface Props {
    /** 지금 보고 있는 달 */
    month: Date
    /** 이 달보다 뒤로는 가지 않는다 */
    maxMonth: Date
    onDone: (month: Date) => void
}

/** 행 높이(px) */
const ROW = 44
/** 보이는 행 수*/
const VISIBLE = 5
/** 위아래 여백 */
const PAD = (ROW * (VISIBLE - 1)) / 2
/** 연도 휠에 담는 햇수. 오늘 연도부터 과거로 */
const YEAR_SPAN = 5

interface ColumnProps {
    label: string
    values: number[]
    value: number
    suffix: string
    onChange: (value: number) => void
}

/** 세로 휠 한 줄 */
function WheelColumn({ label, values, value, suffix, onChange }: ColumnProps) {
    const listRef = useRef<HTMLDivElement>(null)
    const frame = useRef(0)

    // 열릴 때 현재 값으로 맞춘다. 굴리는 중에 다시 맞추면 스크롤이 튀므로 처음 한 번만 한다
    // 페인트 전에 맞춰야 첫 항목이 한 프레임 비쳤다 튀지 않는다
    useLayoutEffect(() => {
        const index = values.indexOf(value)
        if (index >= 0 && listRef.current) listRef.current.scrollTop = index * ROW
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => () => cancelAnimationFrame(frame.current), [])

    const onScroll = () => {
        cancelAnimationFrame(frame.current)
        frame.current = requestAnimationFrame(() => {
            const list = listRef.current
            if (!list) return
            const index = Math.min(Math.max(Math.round(list.scrollTop / ROW), 0), values.length - 1)
            const picked = values[index]
            if (picked !== undefined && picked !== value) onChange(picked)
        })
    }

    const pick = (next: number) => {
        onChange(next)
        const index = values.indexOf(next)
        if (index >= 0) listRef.current?.scrollTo({ top: index * ROW, behavior: 'smooth' })
    }

    return (
        <div
            ref={listRef}
            onScroll={onScroll}
            role="listbox"
            aria-label={label}
            className="no-scrollbar snap-y snap-mandatory overflow-y-auto"
            style={{ height: ROW * VISIBLE }}
        >
            <div style={{ height: PAD }} aria-hidden />
            {values.map((option) => (
                <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={option === value}
                    onClick={() => pick(option)}
                    className={`flex w-full snap-center items-center justify-center text-lg transition-colors ${
                        option === value ? 'font-display text-content-primary' : 'text-content-muted'
                    }`}
                    style={{ height: ROW }}
                >
                    {option}
                    {suffix}
                </button>
            ))}
            <div style={{ height: PAD }} aria-hidden />
        </div>
    )
}

/**
 * 년·월을 위아래로 굴려 고른다. 달력과 같은 면에서 자리만 바꿔 뜬다
 * 고르는 동안 달력은 바뀌지 않는다 — 완료를 눌러야 옮겨진다
 */
export function YearMonthWheel({ month, maxMonth, onDone }: Props) {
    const maxYear = maxMonth.getFullYear()
    // 보고 있는 연도가 기본 범위보다 과거면 거기까지 넓힌다
    // 그러지 않으면 휠이 열리자마자 선택을 조용히 앞으로 당겨 놓는다
    const minYear = Math.min(maxYear - (YEAR_SPAN - 1), month.getFullYear())
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index)

    const [year, setYear] = useState(Math.min(Math.max(month.getFullYear(), minYear), maxYear))
    const [monthNumber, setMonthNumber] = useState(month.getMonth() + 1)

    // 아직 오지 않은 달은 아예 목록에 넣지 않는다
    const lastMonth = year === maxYear ? maxMonth.getMonth() + 1 : 12
    const months = Array.from({ length: lastMonth }, (_, index) => index + 1)
    // 과거 연도에서 12월을 고른 뒤 올해로 옮기면 없는 달이 남는다
    const picked = Math.min(monthNumber, lastMonth)

    return (
        <div className="pt-2">
            <div className="relative">
                {/* 가운데 선택 칸 표시. 불투명한 띠라 휠보다 뒤에 깔아야 글자를 가리지 않는다 */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl bg-neutral-50"
                    style={{ height: ROW }}
                />
                {/* absolute인 띠보다 나중에 그려지도록 이쪽도 쌓임 맥락에 올린다 */}
                <div className="relative z-10 grid grid-cols-2">
                    <WheelColumn label="연도" values={years} value={year} suffix="년" onChange={setYear} />
                    <WheelColumn
                        // 연도가 바뀌면 고를 수 있는 달이 달라진다. 다시 그려 스크롤 위치를 맞춘다
                        key={year}
                        label="월"
                        values={months}
                        value={picked}
                        suffix="월"
                        onChange={setMonthNumber}
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={() => onDone(new Date(year, picked - 1, 1))}
                className="mt-4 h-cta w-full rounded-full bg-action-primary text-sm font-bold text-content-on-action"
            >
                완료
            </button>
        </div>
    )
}
