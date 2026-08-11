import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { HeartIcon, LockIcon, PencilIcon, StarIcon, Trash2Icon } from 'lucide-react'
import { Review, ReviewWritePayload, deleteReview, editReview, toggleReviewLike } from './api'
import { ConfirmModal } from '@/shared/ui/molecules/ConfirmModal'

interface Props {
    load: () => Promise<Review[]>
    write: (payload: ReviewWritePayload) => Promise<unknown>
    canWrite: boolean
    lockedReason: string
    reloadKey?: string | number
    // 미해금/미완료 미리보기: 좋아요순 2개만 노출하고 나머지는 블러 처리
    preview?: boolean
    previewMessage?: string
}

const PREVIEW_VISIBLE = 2

function StarPicker({ value, onChange, size = 24 }: { value: number; onChange: (n: number) => void; size?: number }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(value === n ? 0 : n)}
                    aria-label={`별점 ${n}`}
                    className={n <= value ? 'text-watermelon-500' : 'text-neutral-200'}
                >
                    <StarIcon size={size} fill={n <= value ? 'currentColor' : 'none'} />
                </button>
            ))}
        </div>
    )
}

function StarView({ value }: { value: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <StarIcon
                    key={n}
                    size={14}
                    className={n <= value ? 'text-watermelon-500' : 'text-neutral-200'}
                    fill={n <= value ? 'currentColor' : 'none'}
                />
            ))}
        </div>
    )
}

export function ReviewSection({
    load,
    write,
    canWrite,
    lockedReason,
    reloadKey,
    preview = false,
    previewMessage = '더 보려면 잠금을 해제하세요',
}: Props) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [content, setContent] = useState('')
    const [rating, setRating] = useState(0)
    const [submitting, setSubmitting] = useState(false)

    const [editingId, setEditingId] = useState<number | null>(null)
    const [editContent, setEditContent] = useState('')
    const [editRating, setEditRating] = useState(0)
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

    // 내 리뷰 최상위 → 그다음 좋아요순(서버 정렬 유지)
    const sorted = useMemo(() => [...reviews].sort((a, b) => (a.mine === b.mine ? 0 : a.mine ? -1 : 1)), [reviews])

    const refresh = useCallback(() => {
        setLoading(true)
        load()
            .then(setReviews)
            .catch(() => setError('리뷰를 불러오지 못했어요'))
            .finally(() => setLoading(false))
    }, [load])

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey])

    const mineExists = reviews.some((r) => r.mine)

    const submit = async () => {
        if (!content.trim() && !rating) {
            setError('별점이나 내용을 남겨 주세요')
            return
        }
        setSubmitting(true)
        setError('')
        try {
            await write({ content: content.trim() || null, rating: rating || null })
            setContent('')
            setRating(0)
            refresh()
        } catch (e) {
            setError(e instanceof Error ? e.message : '리뷰 작성에 실패했어요')
        } finally {
            setSubmitting(false)
        }
    }

    const startEdit = (r: Review) => {
        setEditingId(r.id)
        setEditContent(r.content ?? '')
        setEditRating(r.rating ?? 0)
    }

    const saveEdit = async (id: number) => {
        try {
            await editReview(id, { content: editContent.trim() || null, rating: editRating || null })
            setEditingId(null)
            refresh()
        } catch (e) {
            setError(e instanceof Error ? e.message : '수정에 실패했어요')
        }
    }

    const doDelete = async () => {
        if (confirmDeleteId == null) return
        const id = confirmDeleteId
        setConfirmDeleteId(null)
        try {
            await deleteReview(id)
            refresh()
        } catch (e) {
            setError(e instanceof Error ? e.message : '삭제에 실패했어요')
        }
    }

    const like = async (id: number) => {
        try {
            const res = await toggleReviewLike(id)
            setReviews((prev) =>
                prev.map((r) => (r.id === id ? { ...r, likedByMe: res.liked, likeCount: res.likeCount } : r)),
            )
        } catch {
            /* 좋아요 실패는 조용히 무시 */
        }
    }

    return (
        <div className="space-y-3">
            {canWrite && !mineExists && (
                <div className="rounded-2xl bg-white p-3">
                    <p className="mb-1 text-xs font-bold text-neutral-800">별점</p>
                    <StarPicker value={rating} onChange={setRating} />
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="리뷰를 남겨보세요 (선택)"
                        className="mt-2 w-full resize-none rounded-xl bg-white px-3 py-2 text-sm outline-none"
                    />
                    <button
                        type="button"
                        onClick={submit}
                        disabled={submitting}
                        className="mt-2 w-full rounded-full bg-watermelon-500 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                        {submitting ? '등록 중…' : '리뷰 등록'}
                    </button>
                </div>
            )}

            {!canWrite && (
                <p className="flex items-center gap-1 rounded-2xl bg-white p-3 text-xs text-neutral-400">
                    <LockIcon size={13} /> {lockedReason}
                </p>
            )}

            {error && <p className="text-xs font-medium text-red-500">{error}</p>}

            {loading ? (
                <p className="py-4 text-center text-sm text-neutral-400">불러오는 중…</p>
            ) : sorted.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">아직 리뷰가 없어요</p>
            ) : (
                <ul className="space-y-2">
                    {sorted.map((r, idx) => {
                        const blurred = preview && idx >= PREVIEW_VISIBLE
                        return (
                            <li
                                key={r.id}
                                className={`rounded-2xl bg-white p-3 shadow-card ${
                                    blurred ? 'pointer-events-none select-none blur-sm' : ''
                                }`}
                                aria-hidden={blurred}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-neutral-900">{r.reviewerNickname ?? '익명'}</span>
                                    {r.rating ? <StarView value={r.rating} /> : null}
                                </div>

                                {editingId === r.id ? (
                                    <div className="mt-2">
                                        <StarPicker value={editRating} onChange={setEditRating} size={20} />
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            rows={2}
                                            maxLength={500}
                                            className="mt-2 w-full resize-none rounded-xl bg-white px-3 py-2 text-sm outline-none"
                                        />
                                        <div className="mt-2 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => saveEdit(r.id)}
                                                className="flex-1 rounded-full bg-watermelon-500 py-1.5 text-xs font-bold text-white"
                                            >
                                                저장
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingId(null)}
                                                className="flex-1 rounded-full bg-neutral-100 py-1.5 text-xs font-bold text-neutral-800"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {r.content && <p className="mt-1 text-sm text-neutral-900">{r.content}</p>}
                                        <div className="mt-2 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => like(r.id)}
                                                className={`flex items-center gap-1 text-xs font-medium ${
                                                    r.likedByMe ? 'text-watermelon-500' : 'text-neutral-400'
                                                }`}
                                            >
                                                <HeartIcon size={14} fill={r.likedByMe ? 'currentColor' : 'none'} />
                                                {r.likeCount}
                                            </button>
                                            {r.mine && (
                                                <div className="flex gap-3 text-neutral-400">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(r)}
                                                        aria-label="수정"
                                                    >
                                                        <PencilIcon size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmDeleteId(r.id)}
                                                        aria-label="삭제"
                                                    >
                                                        <Trash2Icon size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}

            {preview && sorted.length > PREVIEW_VISIBLE && (
                <p className="flex items-center justify-center gap-1 rounded-2xl bg-white py-2 text-xs font-medium text-neutral-400">
                    <LockIcon size={13} /> {previewMessage}
                </p>
            )}

            {confirmDeleteId != null && (
                <ConfirmModal
                    title="리뷰 삭제"
                    message="이 리뷰를 지울까요?"
                    confirmText="삭제"
                    cancelText="취소"
                    danger
                    onConfirm={doDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
    )
}
