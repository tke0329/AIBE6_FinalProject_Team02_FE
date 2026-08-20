import React from 'react'
import { ChevronRightIcon, StarIcon } from 'lucide-react'
import { Avatar } from '@/shared/ui'

interface Props {
    challengeName: string
    /** 음식 리뷰면 음식 이름, 챌린짓 전체 리뷰면 `null` */
    foodName: string | null
    rating: number | null
    content: string | null
    /** 맨 아래 줄 오른쪽. 「8월 12일」·「8월 12일에 좋아요」처럼 화면이 정한다 */
    footnote: string
    /** 남이 쓴 리뷰일 때만. 내 리뷰 목록에서는 생략한다 — 작성자가 언제나 나라서 군더더기 */
    author?: { id: number; nickname: string | null; profileImageUrl: string | null }
    onOpen: () => void
}

/**
 * 「내가 쓴 리뷰」·「좋아요한 리뷰」가 함께 쓰는 카드.
 *
 * 두 화면이 보여 주는 것이 거의 같아서 한 벌로 둔다 — 따로 두면 별점 크기나 줄 간격이
 * 조금씩 갈라져 같은 앱의 두 목록이 다른 화면처럼 보인다.
 *
 * ## 카드 전체가 하나의 버튼이다
 *
 * 안에 또 버튼을 두면 어디를 눌러야 이동인지 헷갈리고 터치 영역이 서로 갉아먹는다.
 * 그래서 작성자 아바타도 눌리지 않는다 — 프로필로 가고 싶으면 리뷰가 달린 자리로
 * 가서 거기서 누르면 된다.
 *
 * ## 챌린짓 이름이 첫 줄, 음식 이름이 둘째 줄
 *
 * 목록에서 제일 먼저 필요한 건 "어느 챌린짓의 리뷰인가"다. 다만 같은 챌린짓의 음식
 * 리뷰가 여럿이면 첫 줄이 같아 구분이 안 되므로 둘째 줄이 그걸 맡는다.
 */
export function ReviewListCard({ challengeName, foodName, rating, content, footnote, author, onOpen }: Props) {
    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={`${challengeName}${foodName ? ` · ${foodName}` : ''} 리뷰 보기`}
            className="w-full rounded-2xl bg-surface-card p-4 text-left shadow-card active:scale-[0.99]"
        >
            <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-content-primary">{challengeName}</span>
                <ChevronRightIcon size={16} aria-hidden className="shrink-0 text-content-muted" />
            </div>
            <p className="mt-0.5 truncate text-xs text-content-secondary">{foodName ?? '챌린짓 전체 리뷰'}</p>

            {rating !== null && (
                <div className="mt-2">
                    <Stars value={rating} />
                </div>
            )}

            {/* 내용·별점 둘 다 없는 리뷰도 만들 수 있다(BE가 둘 다 null을 허용) → 빈 카드가 되지 않게 채운다 */}
            {content ? (
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-content-primary">{content}</p>
            ) : (
                <p className="mt-2 text-sm text-content-muted">
                    {rating !== null ? '별점만 남겼어요' : '내용 없이 남긴 리뷰예요'}
                </p>
            )}

            <div className="mt-2 flex items-center gap-1.5 text-xs text-content-muted">
                {author && (
                    <>
                        <Avatar
                            name={author.nickname ?? '?'}
                            imageUrl={author.profileImageUrl}
                            size="xs"
                            colorKey={author.id}
                        />
                        <span className="min-w-0 max-w-[40%] truncate text-content-secondary">
                            {author.nickname ?? '알 수 없는 사용자'}
                        </span>
                        <span aria-hidden>·</span>
                    </>
                )}
                <span>{footnote}</span>
            </div>
        </button>
    )
}

function Stars({ value }: { value: number }) {
    return (
        <span className="flex items-center gap-0.5" aria-label={`별점 ${value} / 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <StarIcon
                    key={n}
                    size={13}
                    aria-hidden
                    className={n <= value ? 'text-watermelon-500' : 'text-neutral-200'}
                    fill={n <= value ? 'currentColor' : 'none'}
                />
            ))}
        </span>
    )
}
