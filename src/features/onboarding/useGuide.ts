'use client'

import { useCallback, useState } from 'react'
import { useGuideStore } from './GuideProvider'
import type { GuideKey } from './guides'

export interface Guide {
    key: GuideKey
    /** 지금 투어가 떠 있어야 하는가 */
    open: boolean
    /** `?` 아이콘용. 이미 본 사람도 처음부터 다시 본다 */
    replay: () => void
    /** 끝까지 봤든 건너뛰었든 */
    close: () => void
}

/**
 * 화면 하나가 쓰는 온보딩 투어 상태.
 *
 * @param key   가이드 키
 * @param ready **화면 내용이 그려진 뒤에 true로 준다.**
 *              투어는 마운트 시점에 `data-tour` 요소를 찾아 없는 단계를 버리는데,
 *              목록이 로딩 중이면 전부 버려져서 **아무것도 안 보여 주고 '봤음'으로
 *              기록된다.** 데이터가 오기 전에 켜지지 않게 막는 장치다
 */
export function useGuide(key: GuideKey, ready = true): Guide {
    const store = useGuideStore()
    const [replaying, setReplaying] = useState(false)

    const close = useCallback(() => {
        // 다시보기로 연 것이면 이미 기록돼 있어 서버를 또 부를 이유가 없다
        if (store.unseen(key)) store.markSeen(key)
        setReplaying(false)
    }, [key, store])

    return {
        key,
        open: replaying || (store.ready && ready && store.unseen(key)),
        replay: () => setReplaying(true),
        close,
    }
}
