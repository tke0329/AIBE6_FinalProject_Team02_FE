'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { HeartIcon, MessageCircleIcon, SendIcon } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { Avatar, BottomSheet, Dialog, ServerBadge, Text } from '@/shared/ui'
import {
    createRecordComment,
    deleteRecordComment,
    fetchRecordComments,
    toggleRecordCommentLike,
    updateRecordComment,
} from './logitApi'
import { COMMENT_MAX, LogitComment } from './logitTypes'
import { madeErrorMessage } from './errors'
import type { MadeDexId } from './types'

interface Props {
    madeDexId: MadeDexId
    recordId: number
    preview?: number
    onExpand: () => void
    expanded: boolean
}

export function RecordSocial({ madeDexId, recordId, preview = 2, onExpand, expanded }: Props) {
    const { me } = useAuth()
    const [comments, setComments] = useState<LogitComment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editing, setEditing] = useState<LogitComment | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<LogitComment | null>(null)

    const load = useCallback(() => {
        setLoading(true)
        setError(null)
        fetchRecordComments(madeDexId, recordId)
            .then(setComments)
            .catch((failure) => setError(madeErrorMessage(failure, '댓글을 불러오지 못했어요.')))
            .finally(() => setLoading(false))
    }, [madeDexId, recordId])

    useEffect(() => {
        load()
    }, [load])

    const shown = expanded ? comments : comments.slice(0, preview)
    const hidden = comments.length - shown.length

    const submit = async (content: string) => {
        await createRecordComment(madeDexId, recordId, content)
        load()
    }

    const saveEdit = async (content: string) => {
        if (!editing) return
        await updateRecordComment(madeDexId, recordId, editing.commentId, content)
        setEditing(null)
        load()
    }

    const remove = async () => {
        if (!confirmDelete) return
        const target = confirmDelete
        setConfirmDelete(null)
        try {
            await deleteRecordComment(madeDexId, recordId, target.commentId)
            setComments((prev) => prev.filter((comment) => comment.commentId !== target.commentId))
        } catch (failure) {
            setError(madeErrorMessage(failure, '댓글을 지우지 못했어요.'))
        }
    }

    const like = async (commentId: number) => {
        try {
            const next = await toggleRecordCommentLike(madeDexId, recordId, commentId)
            setComments((prev) =>
                prev.map((comment) =>
                    comment.commentId === commentId
                        ? { ...comment, likedByMe: next.isLike, likeCount: next.likeCount }
                        : comment,
                ),
            )
        } catch {
            /* 좋아요 실패는 조용히 둔다. 다음 조회에서 서버 상태로 맞춰진다. */
        }
    }

    return (
        <section className="pt-3">
            <div className="flex min-h-touch items-center gap-1.5 text-content-secondary">
                <MessageCircleIcon size={19} aria-hidden />
                <span className="text-sm font-bold tabular-nums">{comments.length}</span>
                <span className="text-sm font-bold">댓글</span>
            </div>

            {error && <p className="pb-1 text-xs font-medium text-feedback-error">{error}</p>}

            {loading ? (
                <Text variant="caption" tone="muted" as="p" className="pt-2">
                    댓글을 불러오는 중이에요
                </Text>
            ) : comments.length === 0 ? (
                <Text variant="caption" tone="muted" as="p" className="pt-2">
                    아직 댓글이 없어요
                </Text>
            ) : (
                <ul className="flex flex-col gap-3 pt-2">
                    {shown.map((comment) => (
                        <CommentRow
                            key={comment.commentId}
                            comment={comment}
                            currentUserId={me?.id ?? null}
                            currentNickname={me?.nickname ?? null}
                            onLike={() => like(comment.commentId)}
                            onEdit={() => setEditing(comment)}
                            onDelete={() => setConfirmDelete(comment)}
                        />
                    ))}
                </ul>
            )}

            {hidden > 0 && (
                <button type="button" onClick={onExpand} className="min-h-touch text-sm font-bold text-content-link">
                    모든 댓글 보기
                </button>
            )}

            <CommentDraft onSubmit={submit} />

            {editing && (
                <BottomSheet title="댓글 수정" onClose={() => setEditing(null)}>
                    <EditCommentForm comment={editing} onCancel={() => setEditing(null)} onSubmit={saveEdit} />
                </BottomSheet>
            )}

            {confirmDelete && (
                <Dialog
                    title="댓글을 지울까요?"
                    message="이 댓글이 기록에서 사라져요."
                    danger
                    action={{ label: '삭제하기', onClick: () => void remove() }}
                    onClose={() => setConfirmDelete(null)}
                />
            )}
        </section>
    )
}

function CommentRow({
    comment,
    currentUserId,
    currentNickname,
    onLike,
    onEdit,
    onDelete,
}: {
    comment: LogitComment
    currentUserId: number | null
    currentNickname: string | null
    onLike: () => void
    onEdit: () => void
    onDelete: () => void
}) {
    const authorId = comment.author?.userId ?? 0
    const mine = currentUserId !== null && currentUserId === authorId
    const authorLabel = mine
        ? currentNickname?.trim() || comment.author?.nickname?.trim() || '나'
        : comment.author?.nickname?.trim() || '이름 없는 참여자'

    return (
        <li className="flex gap-2">
            <Avatar
                name={authorLabel}
                imageUrl={comment.author?.profileImageUrl}
                size="xs"
                colorKey={authorId || undefined}
            />
            <div className="min-w-0 flex-1">
                <p className="flex min-h-5 items-center gap-1.5">
                    <span className="flex min-w-0 items-center gap-1">
                        {comment.author?.equippedBadge && (
                            <span className="flex h-5 shrink-0 items-center">
                                <ServerBadge
                                    code={comment.author.equippedBadge.code}
                                    imageUrl={comment.author.equippedBadge.imageUrl}
                                    name={comment.author.equippedBadge.name}
                                    size={17}
                                />
                            </span>
                        )}
                        <span className="truncate text-sm font-bold leading-5 text-content-primary">{authorLabel}</span>
                    </span>
                    <span className="shrink-0 text-xs text-content-muted">{commentTime(comment.createdAt)}</span>
                </p>
                <p className="whitespace-pre-wrap break-words text-sm text-content-secondary">{comment.content}</p>
                <div className="mt-1 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onLike}
                        aria-pressed={comment.likedByMe}
                        aria-label={comment.likedByMe ? '댓글 좋아요 취소' : '댓글 좋아요'}
                        className="no-touch-expand flex min-h-touch items-center gap-1.5 pr-2"
                    >
                        <HeartIcon
                            size={18}
                            aria-hidden
                            className={comment.likedByMe ? 'fill-current text-content-link' : 'text-content-secondary'}
                        />
                        <span className="text-xs font-bold tabular-nums text-content-secondary">
                            {comment.likeCount}
                        </span>
                    </button>
                    {mine && (
                        <>
                            <button
                                type="button"
                                onClick={onEdit}
                                className="min-h-touch px-1 text-xs font-bold text-content-link"
                            >
                                수정
                            </button>
                            <button
                                type="button"
                                onClick={onDelete}
                                className="min-h-touch px-1 text-xs font-bold text-feedback-error"
                            >
                                삭제
                            </button>
                        </>
                    )}
                </div>
            </div>
        </li>
    )
}

function CommentDraft({ onSubmit }: { onSubmit: (text: string) => Promise<void> }) {
    const [text, setText] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const trimmed = text.trim()

    return (
        <form
            className="flex items-center gap-2 pt-3"
            onSubmit={(event) => {
                event.preventDefault()
                if (!trimmed || submitting) return
                setSubmitting(true)
                setError(null)
                onSubmit(trimmed)
                    .then(() => setText(''))
                    .catch((failure) => setError(madeErrorMessage(failure, '댓글을 남기지 못했어요.')))
                    .finally(() => setSubmitting(false))
            }}
        >
            <div className="min-w-0 flex-1">
                <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="댓글 달기..."
                    maxLength={COMMENT_MAX}
                    aria-label="댓글 입력"
                    className="min-h-touch w-full rounded-full bg-neutral-50 px-4 text-base text-content-primary placeholder:text-content-muted"
                />
                {error && <p className="pt-1 text-xs font-medium text-feedback-error">{error}</p>}
            </div>
            <button
                type="submit"
                disabled={!trimmed || submitting}
                aria-label="댓글 보내기"
                className="no-touch-expand flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-action-primary text-content-on-action disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
            >
                <SendIcon size={18} aria-hidden />
            </button>
        </form>
    )
}

function EditCommentForm({
    comment,
    onCancel,
    onSubmit,
}: {
    comment: LogitComment
    onCancel: () => void
    onSubmit: (content: string) => Promise<void>
}) {
    const [content, setContent] = useState(comment.content)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const trimmed = content.trim()

    return (
        <form
            className="flex flex-col gap-3 px-5 pb-8 pt-2"
            onSubmit={(event) => {
                event.preventDefault()
                if (!trimmed || saving) return
                setSaving(true)
                setError(null)
                onSubmit(trimmed)
                    .catch((failure) => setError(madeErrorMessage(failure, '댓글을 수정하지 못했어요.')))
                    .finally(() => setSaving(false))
            }}
        >
            <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={COMMENT_MAX}
                rows={4}
                aria-label="댓글 수정"
                className="w-full resize-none rounded-2xl bg-neutral-50 px-4 py-3 text-base text-content-primary outline-none"
            />
            {error && <p className="text-xs font-medium text-feedback-error">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="min-h-touch rounded-2xl bg-neutral-100 text-sm font-bold text-content-secondary"
                >
                    취소
                </button>
                <button
                    type="submit"
                    disabled={!trimmed || saving}
                    className="min-h-touch rounded-2xl bg-action-primary text-sm font-bold text-content-on-action disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
                >
                    {saving ? '저장 중...' : '저장하기'}
                </button>
            </div>
        </form>
    )
}

function commentTime(value: string): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    if (diffMinutes < 1) return '방금'
    if (diffMinutes < 60) return `${diffMinutes}분 전`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}시간 전`

    return new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(date)
}
