'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MadeDexId } from './types'

/** 아무도 안 적은 칸에 기본으로 뜨는 글 */
export const DEFAULT_EMPTY_CAPTION = '배고파요'

/** 한 칸이 작아서 이보다 길면 두 줄을 넘긴다 */
export const EMPTY_CAPTION_MAX = 20

/**
 * 빈 칸 문구를 하루 단위로 기억한다.
 *
 * **서버에 저장하지 않는다.** BE 수정 없이 되는 선까지만 하기로 한 결정이라
 * `localStorage`에 둔다. 그래서 성질이 이렇다.
 *
 *   - 기기마다 다르다. 같은 로그잇을 봐도 **남에게는 기본 문구로 보인다**
 *   - 브라우저 저장소를 비우면 사라진다
 *   - 대신 **다시 들어와도 지정했던 문구가 남는다** (그냥 useState면 나갈 때 사라짐)
 *
 * 하루 단위로 나눠 두는 이유 — 지난 날을 열어 그날 문구를 따로 정할 수 있어야 한다.
 * 날짜를 옮기면 그 날짜의 문구를 다시 읽는다.
 */
const PREFIX = 'catcheat:logit-empty-caption'

function keyOf(dexId: MadeDexId, date: string): string {
    return `${PREFIX}:${dexId}:${date}`
}

function read(dexId: MadeDexId, date: string): string {
    // 서버 렌더에서는 저장소가 없다. 기본값으로 그려도 클라이언트에서 곧 맞춰진다
    if (typeof window === 'undefined') return DEFAULT_EMPTY_CAPTION
    try {
        const saved = window.localStorage.getItem(keyOf(dexId, date))
        return saved?.trim() ? saved : DEFAULT_EMPTY_CAPTION
    } catch {
        // 사파리 비공개 모드처럼 저장소를 막는 환경이 있다. 기본값으로 계속 간다
        return DEFAULT_EMPTY_CAPTION
    }
}

export function useEmptyCaption(dexId: MadeDexId, date: string) {
    const [caption, setCaption] = useState(DEFAULT_EMPTY_CAPTION)

    // 날짜가 바뀌면 그 날짜 것을 다시 읽는다.
    // 첫 렌더를 기본값으로 두고 여기서 맞추는 건 서버·클라이언트 HTML을 같게 하려는 것이다
    useEffect(() => {
        setCaption(read(dexId, date))
    }, [dexId, date])

    const save = useCallback(
        (next: string) => {
            const trimmed = next.trim().slice(0, EMPTY_CAPTION_MAX)
            const value = trimmed || DEFAULT_EMPTY_CAPTION
            setCaption(value)
            if (typeof window === 'undefined') return
            try {
                // 기본값으로 되돌린 것은 지운다 — 기본 문구가 나중에 바뀌면 따라가야 한다
                if (value === DEFAULT_EMPTY_CAPTION) window.localStorage.removeItem(keyOf(dexId, date))
                else window.localStorage.setItem(keyOf(dexId, date), value)
            } catch {
                // 저장만 실패한다. 화면에는 이미 반영돼 있어 이번 방문 동안은 유지된다
            }
        },
        [dexId, date],
    )

    return { caption, save, isCustom: caption !== DEFAULT_EMPTY_CAPTION }
}
