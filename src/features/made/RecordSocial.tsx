'use client'

import React, { useEffect, useState } from 'react'
import { HeartIcon, MessageCircleIcon, SendIcon } from 'lucide-react'
import { Avatar, Text } from '@/shared/ui'
import { COMMENT_MAX, mockComments, mockLikeCount, mockLikedByMe } from './mockSocial'

interface Props {
    recordId: number
    /** 접힌 상태에서 보여 줄 댓글 수. 나머지는 "모두 보기"로 펼친다 */
    preview?: number
    /** 펼칠 때 시트를 키우려고 바깥에 알린다 */
    onExpand: () => void
    expanded: boolean
}

/**
 * 사진 아래 좋아요·댓글 — **전부 목업이다** (`mockSocial.ts`).
 *
 * 눌리기는 하지만 서버로 가지 않아서 시트를 닫으면 사라진다. 그래도 상태를 실제로
 * 바꾸게 둔 이유는, 누르고 아무 일도 안 일어나면 고장으로 읽히기 때문이다.
 *
 * BE가 생기면 `mockSocial.ts`를 지우고 이 파일의 useState 자리에 API 훅을 넣는다.
 * 화면 모양은 그대로 쓸 수 있게 데이터 모양을 미리 맞춰 뒀다
 */
export function RecordSocial({ recordId, preview = 2, onExpand, expanded }: Props) {
    const comments = mockComments(recordId)
    const [mine, setMine] = useState<string[]>([])
    const [liked, setLiked] = useState(false)
    const [likes, setLikes] = useState(0)

    // 기록이 바뀌면 그 기록의 값으로 되돌린다 — 시트 안에서 넘길 수 있어서 필요하다
    useEffect(() => {
        setMine([])
        setLiked(mockLikedByMe(recordId))
        setLikes(mockLikeCount(recordId))
    }, [recordId])

    const toggle = () => {
        setLiked((was) => !was)
        setLikes((count) => count + (liked ? -1 : 1))
    }

    const shown = expanded ? comments : comments.slice(0, preview)
    const hidden = comments.length - shown.length

    return (
        <section className="pt-3">
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={toggle}
                    aria-pressed={liked}
                    aria-label={liked ? '좋아요 취소' : '좋아요'}
                    className="no-touch-expand flex min-h-touch items-center gap-1.5 pr-3"
                >
                    <HeartIcon
                        size={20}
                        aria-hidden
                        // 채워진 하트로 눌린 것을 알린다. 색만 바꾸면 색맹인 사람이 구분하지 못한다
                        className={liked ? 'fill-current text-content-link' : 'text-content-secondary'}
                    />
                    <span className="text-sm font-bold tabular-nums text-content-secondary">{likes}</span>
                </button>

                <span className="flex min-h-touch items-center gap-1.5 text-content-secondary">
                    <MessageCircleIcon size={19} aria-hidden />
                    <span className="text-sm font-bold tabular-nums">{comments.length}</span>
                </span>

                <span className="flex-1" />
                {/* 목업임을 화면에서도 알린다. 이게 없으면 서버에 저장된 줄 안다 */}
                <Text variant="caption" tone="muted">
                    미리 보기
                </Text>
            </div>

            {comments.length === 0 ? (
                <Text variant="caption" tone="muted" as="p" className="pt-2">
                    아직 댓글이 없어요
                </Text>
            ) : (
                <ul className="flex flex-col gap-3 pt-2">
                    {shown.map((comment) => (
                        <li key={comment.id} className="flex gap-2">
                            <Avatar name={comment.author} size="xs" colorKey={comment.userId} />
                            <div className="min-w-0 flex-1">
                                <p className="flex items-baseline gap-1.5">
                                    <span className="truncate text-sm font-bold text-content-primary">
                                        {comment.author}
                                    </span>
                                    <span className="shrink-0 text-xs text-content-muted">{comment.when}</span>
                                </p>
                                <p className="text-sm text-content-secondary">{comment.text}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {hidden > 0 && (
                <button type="button" onClick={onExpand} className="min-h-touch text-sm font-bold text-content-link">
                    댓글 {comments.length}개 모두 보기
                </button>
            )}

            {/* 내가 방금 쓴 것. 목업이라 시트를 닫으면 사라진다 */}
            {mine.length > 0 && (
                <ul className="flex flex-col gap-3 pt-3">
                    {mine.map((text, index) => (
                        <li key={index} className="flex gap-2">
                            <Avatar name="나" size="xs" />
                            <div className="min-w-0 flex-1">
                                <p className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-bold text-content-primary">나</span>
                                    <span className="shrink-0 text-xs text-content-muted">방금</span>
                                </p>
                                <p className="text-sm text-content-secondary">{text}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <CommentDraft onSubmit={(text) => setMine((sent) => [...sent, text])} />
        </section>
    )
}

/**
 * 댓글 입력칸 — **목업**. 서버로 보내지 않는다.
 *
 * 시트를 닫으면 사라지지만 화면에는 붙여 둔다. 보내도 아무 일이 없으면 고장으로 읽힌다.
 * BE가 생기면 `onSubmit`만 API 호출로 바꾸면 된다.
 *
 * `TextField`를 쓰지 않았다 — 라벨·힌트를 세로로 쌓는 컴포넌트라 한 줄 입력 + 보내기
 * 모양에 맞지 않는다. 대신 최소 터치 크기와 **16px 이상 글자**(iOS 입력 자동 확대 방지,
 * `text-base` = 18px)는 지킨다
 */
function CommentDraft({ onSubmit }: { onSubmit: (text: string) => void }) {
    const [text, setText] = useState('')
    const trimmed = text.trim()

    return (
        <form
            className="flex items-center gap-2 pt-3"
            onSubmit={(event) => {
                event.preventDefault()
                if (!trimmed) return
                onSubmit(trimmed)
                setText('')
            }}
        >
            <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="댓글 달기…"
                maxLength={COMMENT_MAX}
                aria-label="댓글 입력"
                className="min-h-touch min-w-0 flex-1 rounded-full bg-neutral-50 px-4 text-base text-content-primary placeholder:text-content-muted"
            />
            <button
                type="submit"
                disabled={!trimmed}
                aria-label="댓글 보내기"
                className="no-touch-expand flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-action-primary text-content-on-action disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
            >
                <SendIcon size={18} aria-hidden />
            </button>
        </form>
    )
}
