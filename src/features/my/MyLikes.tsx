import React from 'react'
import type { LikedLogitRecord, LikedReview } from './api'
import { ActivityListScreen } from './ActivityListScreen'
import { LikedLogitCard } from './LikedLogitCard'
import { ReviewListCard } from './ReviewListCard'
import { activityDate, reviewDate } from './activityList'

export type LikesTab = 'challenge' | 'logit'

interface Props {
    tab: LikesTab
    onTab: (tab: LikesTab) => void
    /** `null`이면 아직 불러오는 중이거나 실패 */
    reviews: LikedReview[] | null
    records: LikedLogitRecord[] | null
    reviewsFailed?: boolean
    recordsFailed?: boolean
    onRetry?: () => void
    onBack: () => void
    onOpenReview: (review: LikedReview) => void
    onOpenRecord: (record: LikedLogitRecord) => void
}

/**
 * 마이 → 내 활동 → 좋아요한 글. 탭 두 개.
 *
 *   챌린짓 — 챌린짓 리뷰·음식 리뷰에 누른 좋아요 (`review_like`가 한 번에 걸린다)
 *   로그잇 — 로그잇 **기록**에 누른 좋아요
 *
 * 댓글 좋아요(`made_dex_comment_like`)는 담지 않았다 — 대화 안의 반응이라 도감을
 * 되짚어 보는 목록에 얹을 값이 약하다. 필요해지면 소스 하나를 더하면 된다.
 *
 * ## 순서는 내가 누른 순이다
 *
 * 글이 쓰인 순이 아니다. 오래전 것을 오늘 좋아요했으면 맨 위에 있어야 한다 —
 * 그래서 카드 아래 줄도 작성일이 아니라 「…에 좋아요」로 쓴다.
 *
 * 작성자를 함께 보여 준다. 남의 글이 대부분일 목록에서 누가 쓴 것인지 없으면
 * 익명 글 더미가 된다.
 *
 * ## 빈 화면에 버튼이 없다
 *
 * **좋아요하러 가는 화면이 없다** — 뭘 보다가 그 자리에서 누르는 것이다.
 * 어디로 보내도 임의의 선택이고, 지금은 후보가 챌린짓과 로그잇 둘이라 그게 드러난다
 */
export function MyLikes({
    tab,
    onTab,
    reviews,
    records,
    reviewsFailed,
    recordsFailed,
    onRetry,
    onBack,
    onOpenReview,
    onOpenRecord,
}: Props) {
    const challenge = tab === 'challenge'

    return (
        <ActivityListScreen
            title="좋아요한 글"
            tabs={[
                { id: 'challenge', label: countLabel('챌린짓', reviews) },
                { id: 'logit', label: countLabel('로그잇', records) },
            ]}
            activeTab={tab}
            onTab={onTab}
            count={(challenge ? reviews : records)?.length ?? null}
            failed={challenge ? reviewsFailed : recordsFailed}
            onRetry={onRetry}
            onBack={onBack}
            empty={
                challenge
                    ? {
                          icon: '❤️',
                          title: '아직 좋아요한 리뷰가 없어요',
                          description: '마음에 드는 리뷰에서 하트를 누르면 여기 모여요.',
                      }
                    : {
                          icon: '❤️',
                          title: '아직 좋아요한 기록이 없어요',
                          description: '로그잇에서 마음에 드는 기록에 하트를 누르면 여기 모여요.',
                      }
            }
        >
            {challenge
                ? (reviews ?? []).map((review) => (
                      <li key={review.id}>
                          <ReviewListCard
                              challengeName={review.challengeName}
                              foodName={review.reviewType === 'FOOD' ? review.foodName : null}
                              rating={review.rating}
                              content={review.content}
                              footnote={`${reviewDate(review.likedAt)}에 좋아요`}
                              author={{
                                  id: review.reviewerId,
                                  nickname: review.reviewerNickname,
                                  profileImageUrl: review.reviewerProfileImageUrl,
                              }}
                              onOpen={() => onOpenReview(review)}
                          />
                      </li>
                  ))
                : (records ?? []).map((record) => (
                      <li key={record.recordId}>
                          <LikedLogitCard
                              madeDexName={record.madeDexName}
                              target={`${activityDate(record.loggedOn)} · ${record.slotName}`}
                              thumbnailUrl={record.thumbnailUrl}
                              cropX={record.thumbnailCropX}
                              cropY={record.thumbnailCropY}
                              author={{
                                  id: record.authorId,
                                  nickname: record.authorNickname,
                                  profileImageUrl: record.authorProfileImageUrl,
                              }}
                              footnote={`${reviewDate(record.likedAt)}에 좋아요`}
                              onOpen={() => onOpenRecord(record)}
                          />
                      </li>
                  ))}
        </ActivityListScreen>
    )
}

/** 「챌린짓 12」. 아직 안 불러왔거나 실패한 탭은 개수를 빼서 「0개」로 보이지 않게 한다 */
function countLabel(name: string, items: unknown[] | null): string {
    return items === null ? name : `${name} ${items.length}`
}
