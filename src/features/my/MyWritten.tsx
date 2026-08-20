import React from 'react'
import type { MyLogitComment, MyReview } from './api'
import { ActivityListScreen } from './ActivityListScreen'
import { LogitCommentCard } from './LogitCommentCard'
import { ReviewListCard } from './ReviewListCard'
import { activityDate, reviewDate, wasEdited } from './activityList'

export type WrittenTab = 'challenge' | 'logit'

interface Props {
    tab: WrittenTab
    onTab: (tab: WrittenTab) => void
    /** `null`이면 아직 불러오는 중이거나 실패 */
    reviews: MyReview[] | null
    comments: MyLogitComment[] | null
    reviewsFailed?: boolean
    commentsFailed?: boolean
    onRetry?: () => void
    onBack: () => void
    onOpenReview: (review: MyReview) => void
    onOpenComment: (comment: MyLogitComment) => void
    /** 남긴 리뷰가 없을 때 갈 곳 (챌린짓 탭에만 둔다) */
    onExplore: () => void
}

/**
 * 마이 → 내 활동 → 내가 쓴 글. 탭 두 개.
 *
 *   챌린짓 — 챌린짓 리뷰 + 챌린짓 내부 음식 리뷰를 **섞어 최신순**
 *   로그잇 — 로그잇 기록에 쓴 댓글을 최신순
 *
 * ## 왜 탭으로 갈랐나
 *
 * 챌린짓 리뷰끼리는 섞었다 — "내가 언제 뭘 남겼나"라는 한 질문에 답하고 종류는
 * 카드 둘째 줄이 말해 준다. 로그잇은 다르다. 카드에 별점이 없고, 대상이 공개
 * 챌린짓이 아니라 **내가 속한 그룹**이라 성격이 다르다. 한 줄에 섞으면 어디로
 * 가는 글인지 배지로 구분해야 하는데, 그건 탭이 더 잘 하는 일이다.
 *
 * ## 읽기 전용이다
 *
 * 리뷰도 댓글도 **대상 옆에서 고치는 게 맞다** — 무엇에 뭐라고 썼는지 다시 보면서
 * 고치는 것이지, 목록에서 글만 보고 고치는 것이 아니다. 목록의 몫은 훑고 그 자리로
 * 데려가는 것까지다
 */
export function MyWritten({
    tab,
    onTab,
    reviews,
    comments,
    reviewsFailed,
    commentsFailed,
    onRetry,
    onBack,
    onOpenReview,
    onOpenComment,
    onExplore,
}: Props) {
    const challenge = tab === 'challenge'

    return (
        <ActivityListScreen
            title="내가 쓴 글"
            tabs={[
                { id: 'challenge', label: countLabel('챌린짓', reviews) },
                { id: 'logit', label: countLabel('로그잇', comments) },
            ]}
            activeTab={tab}
            onTab={onTab}
            count={(challenge ? reviews : comments)?.length ?? null}
            failed={challenge ? reviewsFailed : commentsFailed}
            onRetry={onRetry}
            onBack={onBack}
            empty={
                challenge
                    ? {
                          icon: '📝',
                          title: '아직 남긴 리뷰가 없어요',
                          description: '챌린짓에서 음식을 해금하면 리뷰를 쓸 수 있어요.',
                          action: { label: '챌린짓 둘러보기', onClick: onExplore },
                      }
                    : {
                          // 버튼을 두지 않는다 — 댓글을 쓰려면 로그잇에 들어가 그날 기록이 있어야
                          // 해서 버튼 한 번으로 갈 곳이 정해지지 않는다
                          icon: '💬',
                          title: '아직 남긴 댓글이 없어요',
                          description: '로그잇 기록에 댓글을 남기면 여기 모여요.',
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
                              footnote={`${reviewDate(review.createdAt)}${wasEdited(review) ? ' (수정됨)' : ''}`}
                              onOpen={() => onOpenReview(review)}
                          />
                      </li>
                  ))
                : (comments ?? []).map((comment) => (
                      <li key={comment.commentId}>
                          <LogitCommentCard
                              madeDexName={comment.madeDexName}
                              target={`${activityDate(comment.loggedOn)} · ${comment.slotName}`}
                              content={comment.content}
                              footnote={`${reviewDate(comment.createdAt)}${wasEdited(comment) ? ' (수정됨)' : ''}`}
                              onOpen={() => onOpenComment(comment)}
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
