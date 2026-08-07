import React from 'react'
import { LogitAvatar } from './LogitAvatar'
import type { FridgeEntry } from './fridgeFromFeed'

interface Props {
    entries: FridgeEntry[]
    onRecord: () => void
}

/** 아바타가 이보다 많으면 겹쳐 놓아도 읽히지 않는다 */
const AVATAR_LIMIT = 3

/** §2.1 냉장고 — 사람·끼니 구분 없이 음식 단위 2열 그리드. 진행률·랭킹 수치는 넣지 않는다 */
export function FridgeGrid({ entries, onRecord }: Props) {
    if (entries.length === 0) {
        return (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge-default bg-cream-50 text-center">
                <span aria-hidden className="text-3xl">
                    🧊
                </span>
                <p className="mt-2 break-keep text-sm font-bold text-content-primary">아직 냉장고가 비어 있어요</p>
                <button
                    type="button"
                    onClick={onRecord}
                    className="mt-3 min-h-touch rounded-full bg-action-primary px-5 text-sm font-bold text-content-on-action shadow-card"
                >
                    식사 기록하기
                </button>
            </div>
        )
    }

    return (
        <ul className="grid grid-cols-2 gap-3">
            {entries.map((entry) => {
                const shown = entry.people.slice(0, AVATAR_LIMIT)
                const folded = entry.people.length - shown.length
                return (
                    <li key={entry.name} className="overflow-hidden rounded-2xl bg-surface-card shadow-card">
                        <div className="aspect-square w-full bg-cream-200">
                            {entry.thumbnailUrl && (
                                // presigned URL이라 next/image의 도메인 설정 대상이 아니다
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={entry.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                            )}
                        </div>
                        <div className="p-3">
                            <p className="truncate text-sm font-bold text-content-primary">
                                {entry.name}
                                {entry.count > 1 && (
                                    <span className="pl-1 text-xs font-bold text-content-link">×{entry.count}</span>
                                )}
                            </p>
                            <div className="flex items-center pt-2">
                                {shown.map((person) => (
                                    <LogitAvatar
                                        key={person.userId}
                                        name={person.name}
                                        imageUrl={person.profileImageUrl}
                                        size="sm"
                                        className="-ml-1 border-2 border-white first:ml-0"
                                    />
                                ))}
                                {folded > 0 && (
                                    <span className="pl-1 text-xs font-bold text-content-muted">+{folded}</span>
                                )}
                            </div>
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
