'use client'

import React from 'react'
import { DayPicker } from 'react-day-picker'
import { ko } from 'react-day-picker/locale'
import { cn } from '@/shared/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/**
 * shadcn calendar(react-day-picker) — 기본 테마 대신 §1 토큰으로 칠했다.
 * shadcn 기본값은 자체 CSS 변수(--background 등)를 쓰는데 이 앱에는 없다.
 */
export function Calendar({ className, classNames, showOutsideDays = false, ...props }: CalendarProps) {
    return (
        <DayPicker
            locale={ko}
            showOutsideDays={showOutsideDays}
            className={cn('w-full', className)}
            classNames={{
                months: 'flex flex-col gap-8',
                month: 'w-full',
                month_caption: 'flex justify-center pb-3',
                caption_label: 'font-display text-lg text-content-primary',
                nav: 'flex items-center justify-between',
                button_previous: 'min-h-touch min-w-touch text-content-secondary',
                button_next: 'min-h-touch min-w-touch text-content-secondary',
                month_grid: 'w-full border-collapse',
                weekdays: 'flex pb-1',
                weekday: 'flex-1 pb-1 text-xs font-medium text-content-muted',
                week: 'flex w-full',
                day: 'flex-1 p-1',
                // 빈 칸과 날짜를 구분하려고 옅은 원을 깔아 둔다
                day_button:
                    'flex aspect-square w-full items-center justify-center rounded-full bg-cream-100 text-sm font-medium text-content-primary transition-colors active:scale-[0.98]',
                today: '[&>button]:font-bold [&>button]:text-content-link',
                selected: '[&>button]:bg-action-primary [&>button]:font-bold [&>button]:text-content-on-action',
                outside: 'opacity-40',
                disabled: '[&>button]:bg-transparent [&>button]:text-action-disabled-text',
                hidden: 'invisible',
                chevron: 'fill-current',
                ...classNames,
            }}
            {...props}
        />
    )
}
