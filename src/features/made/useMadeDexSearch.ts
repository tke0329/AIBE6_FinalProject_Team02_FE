import { useMemo, useState } from 'react'
import type { MadeCard } from './types'

/**
 * 제작 도감 카드 검색. `#`으로 시작하면 태그 검색, 아니면 카드명·장소 검색.
 * §3.1 로직은 훅으로, 컴포넌트는 props만 받아 렌더.
 */
export function useMadeDexSearch(cards: MadeCard[]) {
    const [query, setQuery] = useState('')

    const results = useMemo(() => {
        const term = query.trim().toLowerCase()
        if (!term) return cards
        if (term.startsWith('#')) {
            return cards.filter((card) => card.tags.some((tag) => `#${tag}`.includes(term)))
        }
        return cards.filter((card) => `${card.name} ${card.location}`.toLowerCase().includes(term))
    }, [cards, query])

    return { query, setQuery, results }
}
