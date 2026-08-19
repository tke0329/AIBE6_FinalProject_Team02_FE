import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HeartIcon, LockIcon, MoreVerticalIcon, StarIcon } from 'lucide-react'
import { Review, ReviewWritePayload, deleteReview, editReview, toggleReviewLike } from './api'
import { useRouter } from 'next/navigation'
import { pushInApp } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'
import { BottomSheet, Button, Dialog, ServerBadge } from '@/shared/ui'

interface Props {
    load: () => Promise<Review[]>
    write: (payload: ReviewWritePayload) => Promise<unknown>
    canWrite: boolean
    lockedReason: string
    reloadKey?: string | number
    // 미해금/미완료 미리보기: 좋아요순 2개만 노출하고 나머지는 블러 처리
    preview?: boolean
    previewMessage?: string
    focusReviewId?: number | null
}

const PREVIEW_VISIBLE = 2

/** 블러 안내를 어디에 얹을지 계산할 때 쓰는 카드 한 장의 대략 높이(px) */
const BLURRED_ROW_PX = 116

/** previewMessage를 주지 않았을 때의 기본 문구 */
const BLUR_HINT = '해금하면 볼 수 있어요'

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

/** 리뷰 작성자 프로필 사진(없으면 닉네임 첫 글자). 클릭 시 해당 유저 페이지로 이동 */
function ReviewerAvatar({
    nickname,
    imageUrl,
    onClick,
    size = 32,
}: {
    nickname: string | null
    imageUrl: string | null
    onClick?: () => void
    size?: number
}) {
    const cls =
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-watermelon-200 font-display text-xs text-watermelon-700'
    const inner = imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
    ) : (
        <span>{nickname?.charAt(0) || '?'}</span>
    )
    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                aria-label={`${nickname ?? '익명'}님 프로필 보기`}
                className={`${cls} transition-opacity hover:opacity-80`}
                style={{ width: size, height: size }}
            >
                {inner}
            </button>
        )
    }
    return (
        <span className={cls} style={{ width: size, height: size }}>
            {inner}
        </span>
    )
}

export function ReviewSection({
    load,
    write,
    canWrite,
    lockedReason,
    reloadKey,
    preview = false,
    previewMessage,
    focusReviewId = null,
}: Props) {
    const router = useRouter()
    const focusedRef = useRef<HTMLLIElement | null>(null)

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
    // 점 세 개로 여는 관리 시트. 대상 리뷰를 그대로 담는다
    const [menuFor, setMenuFor] = useState<Review | null>(null)

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

    useEffect(() => {
        if (loading || !focusReviewId) return
        focusedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [focusReviewId, loading])

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
                        className="mt-2 w-full rounded-full bg-watermelon-500 py-2 text-sm font-bold text-content-on-action disabled:opacity-60"
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
                /*
                 * 블러 위에 왜 안 보이는지 적는다.
                 *
                 * 예전에는 흐릿한 카드만 있고 설명이 **목록 아래**에 작게 있어서, 스크롤
                 * 위치에 따라 "왜 흐리지"만 남았다. 흐린 묶음 위에 겹쳐 두면 원인과 결과가
                 * 한자리에 있다. 개별 카드마다 붙이면 같은 문장이 여러 번 나오므로 묶음에 하나만 둔다.
                 */
                <ul className="relative space-y-2">
                    {preview && sorted.length > PREVIEW_VISIBLE && (
                        <li
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center gap-1 rounded-2xl bg-white/85 px-4 py-3 text-center backdrop-blur-[1px]"
                            // 보이는 2개 아래(흐려지는 첫 카드 자리)에 얹는다
                            style={{ top: `${PREVIEW_VISIBLE * BLURRED_ROW_PX}px` }}
                        >
                            <LockIcon size={18} aria-hidden className="text-content-secondary" />
                            <p className="text-sm font-bold text-content-primary">{previewMessage ?? BLUR_HINT}</p>
                        </li>
                    )}
                    {sorted.map((r, idx) => {
                        const blurred = preview && idx >= PREVIEW_VISIBLE
                        return (
                            <li
                                key={r.id}
                                ref={r.id === focusReviewId ? focusedRef : undefined}
                                className={`rounded-2xl bg-white p-3 shadow-card transition ${
                                    r.id === focusReviewId ? 'ring-2 ring-watermelon-400' : ''
                                } ${blurred ? 'pointer-events-none select-none blur-sm' : ''
                                }`}
                                aria-hidden={blurred}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <ReviewerAvatar
                                            nickname={r.reviewerNickname}
                                            imageUrl={r.reviewerProfileImageUrl}
                                            // pushInApp — 그냥 push하면 도착한 프로필 화면의 ←가
                                            // 되돌아갈 자리를 몰라 목록을 새로 push한다(히스토리가 는다)
                                            onClick={() =>
                                                pushInApp(router, r.mine ? ROUTES.my : ROUTES.userProfile(r.reviewerId))
                                            }
                                        />
                                        <span className="flex min-w-0 items-center gap-1">
                                            {r.reviewerEquippedBadge && (
                                                <ServerBadge
                                                    code={r.reviewerEquippedBadge.code}
                                                    imageUrl={r.reviewerEquippedBadge.imageUrl}
                                                    name={r.reviewerEquippedBadge.name}
                                                    size={36}
                                                />
                                            )}
                                            <span className="truncate text-sm font-bold text-neutral-900">
                                                {r.reviewerNickname ?? '익명'}
                                            </span>
                                        </span>
                                    </div>
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
                                                className="flex-1 rounded-full bg-watermelon-500 py-1.5 text-xs font-bold text-content-on-action"
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
                                            {/* 로그잇 좋아요(RecordSocial)와 같은 모양·크기다.
                                                채운 하트로 눌림을 알린다 — 색만 바꾸면 색맹인 사람이 구분하지 못한다 */}
                                            <button
                                                type="button"
                                                onClick={() => like(r.id)}
                                                aria-pressed={r.likedByMe}
                                                aria-label={r.likedByMe ? '좋아요 취소' : '좋아요'}
                                                className="no-touch-expand flex min-h-touch items-center gap-1.5 pr-3"
                                            >
                                                <HeartIcon
                                                    size={20}
                                                    aria-hidden
                                                    className={
                                                        r.likedByMe
                                                            ? 'fill-current text-content-link'
                                                            : 'text-content-secondary'
                                                    }
                                                />
                                                <span className="text-sm font-bold tabular-nums text-content-secondary">
                                                    {r.likeCount}
                                                </span>
                                            </button>
                                            {r.mine && (
                                                /*
                                                 * 수정·삭제를 점 세 개로 접었다.
                                                 *
                                                 * 예전에는 14px 아이콘 두 개가 나란히 있어서 **최소 터치 크기(44px)에
                                                 * 한참 못 미쳤고**, 서로 붙어 있어 삭제를 잘못 누르기 쉬웠다.
                                                 * 시트로 열면 표적이 커지고 글자 라벨이 붙어 무엇인지도 분명해진다.
                                                 */
                                                <button
                                                    type="button"
                                                    onClick={() => setMenuFor(r)}
                                                    aria-label="이 리뷰 관리"
                                                    className="no-touch-expand flex min-h-touch min-w-touch items-center justify-center text-content-secondary"
                                                >
                                                    <MoreVerticalIcon size={20} aria-hidden />
                                                </button>
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

            {menuFor && (
                <BottomSheet title="이 리뷰" onClose={() => setMenuFor(null)}>
                    <div className="flex flex-col gap-2 px-5 pb-8 pt-2">
                        <Button
                            variant="secondary"
                            shape="block"
                            fullWidth
                            onClick={() => {
                                startEdit(menuFor)
                                setMenuFor(null)
                            }}
                        >
                            수정하기
                        </Button>
                        <Button
                            variant="danger"
                            shape="block"
                            fullWidth
                            onClick={() => {
                                setConfirmDeleteId(menuFor.id)
                                setMenuFor(null)
                            }}
                        >
                            삭제하기
                        </Button>
                    </div>
                </BottomSheet>
            )}

            {confirmDeleteId != null && (
                <Dialog
                    title="리뷰 삭제"
                    message="이 리뷰를 지울까요?"
                    danger
                    action={{ label: '삭제', onClick: doDelete }}
                    onClose={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
    )
}
