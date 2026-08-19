import React from 'react'

/** 겹쳐 쌓는 목록은 xs·sm, 목록 행은 md, 프로필 머리글은 lg·xl */
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
    /** 사진이 없을 때 첫 글자를 딴다. 대체 텍스트에도 쓰인다 */
    name: string
    imageUrl?: string | null
    size?: AvatarSize
    /**
     * 테두리 링. 인스타 스토리처럼 상태를 겉에 두른다.
     * 색은 화면이 정한다 — 예: `ring-2 ring-edge-active`
     */
    ring?: string
    /**
     * 사진이 없을 때 배경색을 정하는 값. **`userId`를 넣는다.**
     *
     * 이름을 넣으면 닉네임을 바꿀 때 색이 따라 바뀌어 "아까 그 사람"을 잃는다.
     * 생략하면 예전처럼 회색 하나로 그린다 — 사람이 아닌 것(기본 이미지 등)에 쓴다
     */
    colorKey?: number
    className?: string
}

const SIZE: Record<AvatarSize, string> = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-9 w-9 text-sm',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-2xl',
    xl: 'h-24 w-24 text-4xl',
}

/**
 * §1.6 사람 색. 글자는 어느 색 위에서도 `text-content-primary` 하나로 충분하다
 * (7색 전부 12.2:1 이상). 클래스를 문자열로 늘어놓는 이유는 Tailwind가 소스에서
 * 눈으로 찾는 방식이라 `bg-person-${n}` 같은 조립을 못 보기 때문이다
 */
const PERSON = [
    'bg-person-1',
    'bg-person-2',
    'bg-person-3',
    'bg-person-4',
    'bg-person-5',
    'bg-person-6',
    'bg-person-7',
] as const

/** 사진 없는 사람의 배경. colorKey가 없으면 예전 회색 */
function personTone(colorKey: number | undefined): string {
    if (colorKey === undefined) return 'bg-action-disabled-bg text-content-secondary'
    // 음수 id가 와도 무너지지 않게 절댓값을 쓴다
    return `${PERSON[Math.abs(Math.trunc(colorKey)) % PERSON.length]} text-content-primary`
}

/**
 * 사람을 가리키는 동그란 그림. 사진이 없으면 이름 첫 글자로 대신한다.
 *
 * **첫 글자 자리는 `aria-hidden`이다.** 이름은 대개 바로 옆에 글자로 또 있어서
 * 읽으면 두 번 읽힌다. 아바타만 단독으로 놓이는 자리라면 `name`을 옆에 같이 두거나
 * 감싸는 링크에 `aria-label`을 단다.
 */
export function Avatar({ name, imageUrl, size = 'md', ring = '', colorKey, className = '' }: AvatarProps) {
    const shape = `${SIZE[size]} shrink-0 rounded-full ${ring} ${className}`

    if (imageUrl) {
        return (
            // presigned URL이라 next/image의 도메인 설정 대상이 아니다
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={`${name} 프로필 사진`} className={`${shape} object-cover`} />
        )
    }

    return (
        <span aria-hidden className={`${shape} flex items-center justify-center font-display ${personTone(colorKey)}`}>
            {/* 빈 이름이 와도 동그라미는 남아야 목록 줄이 어긋나지 않는다 */}
            {name.charAt(0)}
        </span>
    )
}
