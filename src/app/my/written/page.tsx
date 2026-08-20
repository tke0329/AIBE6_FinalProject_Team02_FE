'use client'

import { getMyLogitComments, getMyReviews, type MyLogitComment, type MyReview } from '@/features/my/api'
import { MyWritten, type WrittenTab } from '@/features/my/MyWritten'
import { goBackOr, pushInApp } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

/**
 * `/my/written` 내가 쓴 글 (마이 → 내 활동).
 *
 * 두 소스를 마운트 때 **병렬로** 부른다 — 탭 라벨에 개수를 그리려면 둘 다 필요하고,
 * 「내 활동」이라 목록이 작다. 탭을 눌렀을 때 다시 부르지 않는다.
 *
 * 실패는 소스마다 따로 잡는다. 한쪽이 죽어도 다른 탭은 그대로 쓸 수 있어야 한다
 */
export default function MyWrittenPage() {
    const router = useRouter()
    const [tab, setTab] = useState<WrittenTab>('challenge')
    const [reviews, setReviews] = useState<MyReview[] | null>(null)
    const [comments, setComments] = useState<MyLogitComment[] | null>(null)
    const [reviewsFailed, setReviewsFailed] = useState(false)
    const [commentsFailed, setCommentsFailed] = useState(false)

    const load = useCallback(() => {
        setReviewsFailed(false)
        setCommentsFailed(false)
        setReviews(null)
        setComments(null)
        // 실패해도 목록은 null로 둔다 — 빈 목록과 실패는 다른 화면
        getMyReviews()
            .then(setReviews)
            .catch(() => setReviewsFailed(true))
        getMyLogitComments()
            .then(setComments)
            .catch(() => setCommentsFailed(true))
    }, [])

    useEffect(() => {
        load()
    }, [load])

    return (
        <MyWritten
            tab={tab}
            onTab={setTab}
            reviews={reviews}
            comments={comments}
            reviewsFailed={reviewsFailed}
            commentsFailed={commentsFailed}
            onRetry={load}
            onBack={() => goBackOr(router, ROUTES.my)}
            onOpenReview={(review) =>
                pushInApp(router, ROUTES.challengeReviewTarget(review.challengeId, review.slotId))
            }
            onOpenComment={(comment) => pushInApp(router, ROUTES.madeRecord(comment.madeDexId, comment.recordId))}
            onExplore={() => pushInApp(router, `${ROUTES.challenge}?tab=explore`)}
        />
    )
}
