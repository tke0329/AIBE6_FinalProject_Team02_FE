import React from 'react'
import { ChevronRightIcon, ImageOffIcon } from 'lucide-react'
import { Avatar } from '@/shared/ui'

interface Props {
    madeDexName: string
    /** 「8월 12일 · 점심」 */
    target: string
    /** 사진 없이 올린 기록이면 `null` */
    thumbnailUrl: string | null
    /** 피드와 같게 잘려 보이도록 넘겨받는다. **0~100 퍼센트** */
    cropX: number
    cropY: number
    author: { id: number; nickname: string | null; profileImageUrl: string | null }
    /** 「8월 12일에 좋아요」 */
    footnote: string
    onOpen: () => void
}

/**
 * 「좋아요한 글」 → 로그잇 탭 카드.
 *
 * ## 사진이 본문이다
 *
 * 로그잇 기록에는 글 필드가 없다. 그래서 리뷰 카드처럼 글을 두 줄 보여 줄 수 없고
 * 대신 썸네일이 그 자리를 맡는다. 크롭 값을 `object-position`으로 넘겨 피드에서
 * 보던 것과 같은 부분이 보이게 한다 — 다르게 잘리면 같은 사진인지 알기 어렵다.
 *
 * 사진 없이 올린 기록도 있어서 그때는 자리를 비우고 아이콘을 둔다. 자리를 아예
 * 없애면 목록에서 카드 높이가 들쭉날쭉해진다.
 *
 * ## 작성자를 보여 준다
 *
 * 남의 기록이 대부분일 목록이다. 누가 올린 것인지 없으면 익명 사진 더미가 된다
 */
export function LikedLogitCard({ madeDexName, target, thumbnailUrl, cropX, cropY, author, footnote, onOpen }: Props) {
    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={`${madeDexName} ${target} 기록 보기`}
            className="flex w-full items-stretch gap-3 rounded-2xl bg-surface-card p-3 text-left shadow-card active:scale-[0.99]"
        >
            <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                {thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- presigned URL은 next/image 최적화 대상이 아님
                    <img
                        src={thumbnailUrl}
                        alt=""
                        className="size-full object-cover"
                        style={{ objectPosition: `${cropX}% ${cropY}%` }}
                    />
                ) : (
                    <div className="flex size-full items-center justify-center text-content-muted">
                        <ImageOffIcon size={20} aria-hidden />
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center">
                <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-content-primary">
                        {madeDexName}
                    </span>
                    <ChevronRightIcon size={16} aria-hidden className="shrink-0 text-content-muted" />
                </div>
                <p className="mt-0.5 truncate text-xs text-content-secondary">{target}</p>

                <div className="mt-2 flex items-center gap-1.5 text-xs text-content-muted">
                    <Avatar
                        name={author.nickname ?? '?'}
                        imageUrl={author.profileImageUrl}
                        size="xs"
                        colorKey={author.id}
                    />
                    <span className="min-w-0 max-w-[45%] truncate text-content-secondary">
                        {author.nickname ?? '알 수 없는 사용자'}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="truncate">{footnote}</span>
                </div>
            </div>
        </button>
    )
}
