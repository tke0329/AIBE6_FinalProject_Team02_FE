import React from 'react'

/**
 * 글자의 **역할**. 크기가 아니라 역할로 고른다.
 *
 * "18px 굵게"가 아니라 "섹션 제목"이라고 적으면, 나중에 섹션 제목을 17px로 바꾸기로 했을 때
 * 고칠 곳이 이 파일 한 줄이다. 화면에 `text-lg font-display`를 흩어 두면 68곳을 찾아다녀야 한다.
 */
export type TextVariant =
    /** 해금 연출·로그인 로고처럼 화면을 압도하는 글자 */
    | 'display'
    /** 화면 제목. **화면당 하나** */
    | 'screenTitle'
    /** 섹션·카드 제목 */
    | 'sectionTitle'
    /** 본문 */
    | 'body'
    /** 본문 중 강조 */
    | 'bodyStrong'
    /** 보조 설명 */
    | 'secondary'
    /** 입력 라벨·목록 항목처럼 짧고 굵은 글자 */
    | 'label'
    /** 날짜·카드 하단 등 가장 작은 글자 */
    | 'caption'
    /**
     * 수량·D-day·시간처럼 **자릿수가 바뀌는 숫자**.
     *
     * `tabular-nums`를 걸어 두지만 **딩궁딩굴에서는 동작하지 않는다** — 폰트에 `GSUB`/`GPOS`
     * 테이블이 없어서 OpenType 기능이 무시된다. 숫자 자폭이 `1`=129, `4`=490(1000 단위)이라
     * 시계·카운터가 좌우로 흔들리는 건 **감수하기로 한 것**이다 (2026-08-11 결정).
     *
     * 그래도 이 변형을 남겨 둔 이유는, 나중에 흔들림을 막기로 하면 **여기 한 곳만** 고치면
     * 되기 때문이다 (숫자만 다른 글꼴로 돌리거나 고정폭 칸을 씌우거나).
     */
    | 'numeric'

type TextTone = 'primary' | 'secondary' | 'muted' | 'link' | 'error' | 'onAction'

/**
 * 글꼴은 **온글잎 딩궁딩굴 하나**다. 위계는 크기·굵기·색 셋으로만 만든다.
 *
 * 그래서 여기에 `font-*` 지정이 없다 — 어차피 전부 같은 글꼴이라 적을 게 없다.
 * (`globals.css`의 body에서 한 번 정한다. Pretendard는 딩궁딩굴에 없는 글자를 받는 폴백)
 *
 * ## 굵기가 400 하나뿐이라 생기는 일
 *
 * 딩궁딩굴은 `usWeightClass 400` 단일 페이스다. `font-bold`를 주면 **브라우저가 합성 볼드로
 * 그린다** (실측: 잉크 픽셀 364 → 651). 큰 글자에서는 멀쩡하지만 **작은 글자에서는 뭉갠다.**
 * 그래서 가장 작은 `caption`에는 굵기를 주지 않는다. 그 크기의 강조는 색으로 한다.
 */
const VARIANT: Record<TextVariant, string> = {
    display: 'text-3xl font-bold',
    screenTitle: 'text-xl font-bold',
    sectionTitle: 'text-lg font-bold',
    body: 'text-base',
    bodyStrong: 'text-base font-bold',
    secondary: 'text-sm',
    label: 'text-sm font-bold',
    // 가장 작은 단계에 합성 볼드를 얹으면 뭉갠다. 이 크기의 강조는 tone으로
    caption: 'text-xs',
    numeric: 'text-base font-bold tabular-nums',
}

/** 역할마다 가장 흔한 색. `tone`으로 덮을 수 있다 */
const DEFAULT_TONE: Record<TextVariant, TextTone> = {
    display: 'primary',
    screenTitle: 'primary',
    sectionTitle: 'primary',
    body: 'primary',
    bodyStrong: 'primary',
    secondary: 'secondary',
    label: 'primary',
    caption: 'muted',
    numeric: 'primary',
}

const TONE: Record<TextTone, string> = {
    primary: 'text-content-primary',
    secondary: 'text-content-secondary',
    muted: 'text-content-muted',
    link: 'text-content-link',
    error: 'text-feedback-error',
    onAction: 'text-content-on-action',
}

/**
 * 기본 태그.
 *
 * 제목 변형만 heading으로 낸다. **문서 순서가 다르면 `as`로 바로잡아야 한다** —
 * 한 화면에 `sectionTitle`이 h2로 여러 개 나오는 건 정상이지만,
 * `screenTitle`(h1)이 둘이면 스크린리더가 화면이 둘인 것처럼 읽는다.
 */
const DEFAULT_TAG: Record<TextVariant, TextTag> = {
    display: 'p',
    screenTitle: 'h1',
    sectionTitle: 'h2',
    body: 'p',
    bodyStrong: 'p',
    secondary: 'p',
    label: 'span',
    caption: 'span',
    numeric: 'span',
}

type TextTag = 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'strong' | 'time' | 'dt' | 'dd' | 'label'

interface TextProps extends React.HTMLAttributes<HTMLElement> {
    variant?: TextVariant
    tone?: TextTone
    as?: TextTag
    /** `as="label"`일 때 입력 id를 잇는다 */
    htmlFor?: string
    /**
     * 한 줄로 자른다. 넘치면 `…`.
     *
     * 목록 행처럼 **높이가 정해진 자리**에만 쓴다. 본문에 쓰면 글이 잘려 읽을 수 없다.
     */
    truncate?: boolean
    className?: string
}

/**
 * 글자를 내는 공통 컴포넌트.
 *
 * ```tsx
 * <Text variant="screenTitle">나의 뱃지</Text>
 * <Text variant="secondary">아직 모은 뱃지가 없어요</Text>
 * <Text variant="numeric" tone="link">D-{days}</Text>
 * ```
 *
 * ## 줄바꿈을 기본으로 `break-keep`으로 둔 이유
 *
 * 한글은 낱말 중간에서도 줄이 넘어간다. 브라우저 기본값이면 "먹킷리스"에서 끊기고
 * 다음 줄에 "트"만 남는다. `break-keep`은 낱말을 지켜 끊는다.
 * 한 줄로 자르는 `truncate`와는 같이 못 쓰므로 그때는 빠진다.
 *
 * ## `className`으로 덮어도 되는 것
 *
 * 여백(`mt-*`)·정렬(`text-center`)·`flex-1` 같은 **배치**는 덮어도 된다.
 * 글꼴·크기·굵기는 덮지 않는다 — 필요한 역할이 없으면 `TextVariant`를 늘린다.
 */
export function Text({ variant = 'body', tone, as, truncate = false, className = '', children, ...rest }: TextProps) {
    const Tag = as ?? DEFAULT_TAG[variant]
    const color = TONE[tone ?? DEFAULT_TONE[variant]]
    const wrap = truncate ? 'truncate' : 'break-keep'

    return (
        <Tag className={`${VARIANT[variant]} ${color} ${wrap} ${className}`} {...rest}>
            {children}
        </Tag>
    )
}
