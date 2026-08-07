'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeftIcon, UserPlusIcon, CheckIcon, XIcon, Trash2Icon, SearchIcon } from 'lucide-react'
import { ServerBadge } from '@/shared/ui/atoms/ServerBadge'
import { TabBar } from '@/shared/ui/molecules/TabBar'
import {
    UserBrief,
    ReceivedRequest,
    UserSearchResult,
    fetchFriends,
    fetchFriendRequests,
    acceptFriendRequest,
    deleteFriendRequest,
    removeFriend,
    searchUsers,
    sendFriendRequest,
} from './api'

const TABS = ['친구 목록', '받은 요청'] as const

interface Props {
    onBack: () => void
    onOpenUser: (userId: number) => void
}

export function FriendsPanel({ onBack, onOpenUser }: Props) {
    const [tab, setTab] = useState<(typeof TABS)[number]>('친구 목록')
    const [friends, setFriends] = useState<UserBrief[]>([])
    const [requests, setRequests] = useState<ReceivedRequest[]>([])
    // 검색: searchResults가 null이면 탭 목록, 아니면 검색 결과 화면
    const [kw, setKw] = useState('')
    const [searchResults, setSearchResults] = useState<UserSearchResult[] | null>(null)
    const [sent, setSent] = useState<Set<number>>(new Set())

    const loadFriends = () =>
        fetchFriends()
            .then(setFriends)
            .catch(() => {})
    const loadRequests = () =>
        fetchFriendRequests('received')
            .then(setRequests)
            .catch(() => {})

    useEffect(() => {
        loadFriends()
        loadRequests()
    }, [])

    const runSearch = () => {
        if (!kw.trim()) {
            setSearchResults(null)
            return
        }
        searchUsers(kw.trim())
            .then(setSearchResults)
            .catch(() => setSearchResults([]))
    }
    const clearSearch = () => {
        setKw('')
        setSearchResults(null)
    }
    const onSendRequest = (userId: number) =>
        sendFriendRequest(userId)
            .then(() => setSent((s) => new Set(s).add(userId)))
            .catch(() => {})

    return (
        <div className="flex h-full flex-col bg-cream-100">
            <header className="flex items-center gap-3 px-5 pt-4">
                <button onClick={onBack} aria-label="뒤로가기">
                    <ArrowLeftIcon size={21} />
                </button>
                <span className="font-display text-lg text-brown">친구</span>
            </header>

            {/* 검색창 — 상단 항상 고정 */}
            <div className="px-5 pt-3">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        runSearch()
                    }}
                    className="flex items-center gap-2 rounded-2xl border border-cream-300 bg-white px-3"
                >
                    <SearchIcon size={16} className="text-brown-muted" aria-hidden />
                    <input
                        value={kw}
                        onChange={(e) => {
                            const v = e.target.value
                            setKw(v)
                            if (!v.trim()) setSearchResults(null)
                        }}
                        placeholder="닉네임으로 친구 검색"
                        className="min-h-touch flex-1 bg-transparent text-sm text-brown outline-none"
                    />
                    {kw && (
                        <button
                            type="button"
                            aria-label="검색 지우기"
                            onClick={clearSearch}
                            className="p-1 text-brown-muted"
                        >
                            <XIcon size={16} />
                        </button>
                    )}
                </form>
            </div>

            {searchResults !== null ? (
                // 검색 결과 화면
                <main className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
                    <p className="mb-2 text-xs text-brown-soft">검색 결과</p>
                    {searchResults.length === 0 ? (
                        <Empty text="일치하는 유저가 없어요" />
                    ) : (
                        <div className="space-y-2">
                            {searchResults.map(({ user, relationStatus }) => {
                                const already = relationStatus === 'REQUEST_SENT' || sent.has(user.userId)
                                const isFriend = relationStatus === 'FRIEND'
                                return (
                                    <Row
                                        key={user.userId}
                                        user={user}
                                        onOpenUser={onOpenUser}
                                        right={
                                            isFriend ? (
                                                <span className="px-2 text-xs text-brown-soft">친구</span>
                                            ) : already ? (
                                                <span className="px-2 text-xs text-brown-soft">요청됨</span>
                                            ) : (
                                                <button
                                                    onClick={() => onSendRequest(user.userId)}
                                                    className="flex items-center gap-1 rounded-full border-2 border-orange-400 px-3 py-1.5 text-xs font-medium text-orange-600"
                                                >
                                                    <UserPlusIcon size={14} /> 친구 추가
                                                </button>
                                            )
                                        }
                                    />
                                )
                            })}
                        </div>
                    )}
                </main>
            ) : (
                // 탭 목록 화면
                <>
                    <div className="px-5 pt-3">
                        <TabBar
                            label="친구 관리"
                            variant="segmented"
                            items={TABS.map((t) => ({
                                id: t,
                                label: t === '받은 요청' && requests.length ? `받은 요청 ${requests.length}` : t,
                            }))}
                            value={tab}
                            onChange={(v) => setTab(v as (typeof TABS)[number])}
                        />
                    </div>
                    <main className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
                        {tab === '친구 목록' && (
                            <FriendList
                                friends={friends}
                                onOpenUser={onOpenUser}
                                onRemove={(id) =>
                                    removeFriend(id)
                                        .then(loadFriends)
                                        .catch(() => {})
                                }
                            />
                        )}
                        {tab === '받은 요청' && (
                            <RequestList
                                requests={requests}
                                onAccept={(rid) =>
                                    acceptFriendRequest(rid)
                                        .then(() => {
                                            loadRequests()
                                            loadFriends()
                                        })
                                        .catch(() => {})
                                }
                                onReject={(rid) =>
                                    deleteFriendRequest(rid)
                                        .then(loadRequests)
                                        .catch(() => {})
                                }
                                onOpenUser={onOpenUser}
                            />
                        )}
                    </main>
                </>
            )}
        </div>
    )
}

function Avatar({ user, size = 44 }: { user: UserBrief; size?: number }) {
    return (
        <span
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-200 font-display text-orange-700"
            style={{ width: size, height: size }}
        >
            {user.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
                <span>{user.nickname.charAt(0) || '?'}</span>
            )}
        </span>
    )
}

function Row({
    user,
    onOpenUser,
    right,
}: {
    user: UserBrief
    onOpenUser: (id: number) => void
    right: React.ReactNode
}) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
            <button
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => onOpenUser(user.userId)}
            >
                <Avatar user={user} />
                <span className="flex items-center gap-2 truncate">
                    {user.equippedBadge && (
                        <ServerBadge
                            code={user.equippedBadge.code}
                            imageUrl={user.equippedBadge.imageUrl}
                            name={user.equippedBadge.name}
                            size={28}
                        />
                    )}
                    <span className="truncate font-medium text-brown">{user.nickname}</span>
                </span>
            </button>
            {right}
        </div>
    )
}

function FriendList({
    friends,
    onOpenUser,
    onRemove,
}: {
    friends: UserBrief[]
    onOpenUser: (id: number) => void
    onRemove: (id: number) => void
}) {
    if (!friends.length) return <Empty text="아직 친구가 없어요" />
    return (
        <div className="space-y-2">
            {friends.map((u) => (
                <Row
                    key={u.userId}
                    user={u}
                    onOpenUser={onOpenUser}
                    right={
                        <button
                            aria-label="친구 삭제"
                            onClick={() => {
                                if (confirm(`${u.nickname}님을 친구에서 삭제할까요?`)) onRemove(u.userId)
                            }}
                            className="rounded-full p-2 text-brown-muted"
                        >
                            <Trash2Icon size={18} />
                        </button>
                    }
                />
            ))}
        </div>
    )
}

function RequestList({
    requests,
    onAccept,
    onReject,
    onOpenUser,
}: {
    requests: ReceivedRequest[]
    onAccept: (rid: number) => void
    onReject: (rid: number) => void
    onOpenUser: (id: number) => void
}) {
    if (!requests.length) return <Empty text="받은 요청이 없어요" />
    return (
        <div className="space-y-2">
            {requests.map((r) => (
                <Row
                    key={r.requestId}
                    user={r.user}
                    onOpenUser={onOpenUser}
                    right={
                        <span className="flex gap-1">
                            <button
                                aria-label="수락"
                                onClick={() => onAccept(r.requestId)}
                                className="rounded-full bg-orange-500 p-2 text-white"
                            >
                                <CheckIcon size={16} />
                            </button>
                            <button
                                aria-label="거절"
                                onClick={() => onReject(r.requestId)}
                                className="rounded-full bg-cream-200 p-2 text-brown-soft"
                            >
                                <XIcon size={16} />
                            </button>
                        </span>
                    }
                />
            ))}
        </div>
    )
}

function Empty({ text }: { text: string }) {
    return <p className="py-16 text-center text-sm text-brown-soft">{text}</p>
}
