'use client'

import React, { useState } from 'react'
import { BottomSheet, Button, Calendar, Text } from '@/shared/ui'
import { formatDateOnly, parseDateOnly, todayDateOnly } from '@/shared/lib/dateOnly'

interface Props {
    /** 지금 고른 날. `YYYY-MM-DD`. 아직 없으면 빈 문자열 */
    value: string
    onPick: (date: string) => void
    onClose: () => void
}

/**
 * 챌린짓 종료일 고르기.
 *
 * 예전에는 `<input type="date">`였다. 두 가지가 문제였다.
 *
 *   1. **지난 날짜를 고를 수 있었다.** 어제로 끝나는 챌린짓을 만들 수 있었다는 뜻이다
 *   2. 달력 모양이 **OS마다 달라서** 로그잇 달력과 같은 앱으로 보이지 않았다
 *
 * 그래서 로그잇이 쓰는 공통 `Calendar`를 같은 방식(바텀 시트)으로 띄운다.
 * `disabled`로 오늘 이전을 잠그면 달력이 그 날짜를 눌리지 않게 그려 준다 —
 * 눌러 놓고 거절당하는 것보다 애초에 못 누르는 쪽이 낫다.
 */
export function EndDateSheet({ value, onPick, onClose }: Props) {
    const today = todayDateOnly()
    const [picked, setPicked] = useState<Date | undefined>(value ? parseDateOnly(value) : undefined)

    return (
        <BottomSheet title="종료일" onClose={onClose}>
            <div className="flex flex-col gap-4 px-5 pb-8 pt-2">
                <Text variant="secondary" tone="muted" as="p">
                    이 날까지 참여할 수 있어요. 오늘 이전은 고를 수 없어요.
                </Text>

                <Calendar
                    mode="single"
                    selected={picked}
                    onSelect={setPicked}
                    disabled={{ before: today }}
                    // 처음 열 때 고른 달을 보여 준다. 없으면 이번 달
                    defaultMonth={picked ?? today}
                />

                <Button
                    shape="block"
                    fullWidth
                    disabled={!picked}
                    onClick={() => {
                        if (!picked) return
                        onPick(formatDateOnly(picked))
                        onClose()
                    }}
                >
                    이 날로 정하기
                </Button>
            </div>
        </BottomSheet>
    )
}
