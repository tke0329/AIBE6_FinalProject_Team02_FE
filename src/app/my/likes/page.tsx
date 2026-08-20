'use client'

import { getLikedLogitRecords, getLikedReviews, type LikedLogitRecord, type LikedReview } from '@/features/my/api'
import { MyLikes, type LikesTab } from '@/features/my/MyLikes'
import { goBackOr, pushInApp } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

/** `/my/likes` 좋아요한 글 (마이 → 내 활동). 두 소스를 병렬로, 실패는 따로 잡는다 */
export default function MyLikesPage() {
    const router = useRouter()
    const [tab, setTab] = useState<LikesTab>('challenge')
    const [reviews, setReviews] = useState<LikedReview[] | null>(null)
    const [records, setRecords] = useState<LikedLogitRecord[] | null>(null)
    const [reviewsFailed, setReviewsFailed] = useState(false)
    const [recordsFailed, setRecordsFailed] = useState(false)

    const load = useCallback(() => {
        setReviewsFailed(false)
        setRecordsFailed(false)
        setReviews(null)
        setRecords(null)
        // 실패해도 목록은 null로 둔다 — 빈 목록과 실패는 다른 화면
        getLikedReviews()
            .then(setReviews)
            .catch(() => setReviewsFailed(true))
        getLikedLogitRecords()
            .then(setRecords)
            .catch(() => setRecordsFailed(true))
    }, [])

    useEffect(() => {
        load()
    }, [load])

    return (
        <MyLikes
            tab={tab}
            onTab={setTab}
            reviews={reviews}
            records={records}
            reviewsFailed={reviewsFailed}
            recordsFailed={recordsFailed}
            onRetry={load}
            onBack={() => goBackOr(router, ROUTES.my)}
            onOpenReview={(review) =>
                pushInApp(router, ROUTES.challengeReviewTarget(review.challengeId, review.slotId))
            }
            onOpenRecord={(record) => pushInApp(router, ROUTES.madeRecord(record.madeDexId, record.recordId))}
        />
    )
}
