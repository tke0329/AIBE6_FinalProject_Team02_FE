import { cardName } from './logitTypes'
import type { LogitFeed } from './logitTypes'

export interface FridgePerson {
    userId: number
    name: string
    profileImageUrl: string | null
}

export interface FridgeEntry {
    name: string
    /** 같은 음식명이 몇 번 나왔는지 */
    count: number
    thumbnailUrl: string | null
    people: FridgePerson[]
}

/**
 * 냉장고 전용 API가 나오기 전까지 홈 피드를 음식 단위로 접어 쓴다.
 * 사진은 기록 대표 사진이라 음식명과 정확히 짝지어지지 않는다 —
 * made_dex_record_food에 사진 참조가 생기면 이 파일을 통째로 걷어낸다.
 */
export function fridgeFromFeed(feed: LogitFeed | null): FridgeEntry[] {
    if (!feed) return []

    const entries = new Map<string, FridgeEntry>()

    for (const slot of feed.slots) {
        for (const card of slot.cards) {
            if (card.recordCount === 0) continue
            const person: FridgePerson = {
                userId: card.userId,
                name: cardName(card),
                profileImageUrl: card.profileImageUrl,
            }

            for (const name of card.foodNames) {
                const found = entries.get(name)
                if (!found) {
                    entries.set(name, {
                        name,
                        count: 1,
                        thumbnailUrl: card.thumbnailUrl,
                        people: [person],
                    })
                    continue
                }
                found.count += 1
                if (!found.people.some((other) => other.userId === person.userId)) {
                    found.people.push(person)
                }
                found.thumbnailUrl ??= card.thumbnailUrl
            }
        }
    }

    return [...entries.values()]
}
