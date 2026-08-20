import React from 'react'
import { ChevronRightIcon } from 'lucide-react'

interface Props {
    madeDexName: string
    /** 「8월 12일 · 점심」처럼 어느 날 어느 끼니인지 */
    target: string
    content: string
    /** 맨 아래 줄. 「8월 12일」·「8월 12일 (수정됨)」 */
    footnote: string
    onOpen: () => void
}

/**
 * 「내가 쓴 글」 → 로그잇 탭 카드.
 *
 * `ReviewListCard`와 따로 두는 이유 — 별점이 없고(댓글은 평가가 아니다) 작성자도
 * 언제나 나라서 넣을 것이 없다. 같은 컴포넌트에 옵션으로 밀어넣으면 쓰지 않는
 * 분기만 늘어난다. 대신 여백·글자 크기는 `ReviewListCard`와 같게 맞춰
 * 두 탭을 오갈 때 같은 목록으로 보이게 한다.
 *
 * ## 로그잇 이름이 첫 줄, 날짜·끼니가 둘째 줄
 *
 * 목록에서 제일 먼저 필요한 건 "어느 로그잇인가"다. 같은 로그잇에 여러 날 댓글을
 * 남기면 첫 줄이 같아 구분이 안 되므로 둘째 줄이 그걸 맡는다
 */
export function LogitCommentCard({ madeDexName, target, content, footnote, onOpen }: Props) {
    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={`${madeDexName} ${target} 댓글 보기`}
            className="w-full rounded-2xl bg-surface-card p-4 text-left shadow-card active:scale-[0.99]"
        >
            <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-content-primary">{madeDexName}</span>
                <ChevronRightIcon size={16} aria-hidden className="shrink-0 text-content-muted" />
            </div>
            <p className="mt-0.5 truncate text-xs text-content-secondary">{target}</p>

            <p className="mt-2 line-clamp-2 text-sm leading-5 text-content-primary">{content}</p>

            <div className="mt-2 text-xs text-content-muted">{footnote}</div>
        </button>
    )
}
