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
 * 사람을 가리키는 동그란 그림. 사진이 없으면 이름 첫 글자로 대신한다.
 *
 * **첫 글자 자리는 `aria-hidden`이다.** 이름은 대개 바로 옆에 글자로 또 있어서
 * 읽으면 두 번 읽힌다. 아바타만 단독으로 놓이는 자리라면 `name`을 옆에 같이 두거나
 * 감싸는 링크에 `aria-label`을 단다.
 */
export function Avatar({ name, imageUrl, size = 'md', ring = '', className = '' }: AvatarProps) {
    const shape = `${SIZE[size]} shrink-0 rounded-full ${ring} ${className}`

    if (imageUrl) {
        return (
            // presigned URL이라 next/image의 도메인 설정 대상이 아니다
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={`${name} 프로필 사진`} className={`${shape} object-cover`} />
        )
    }

    return (
        <span
            aria-hidden
            className={`${shape} flex items-center justify-center bg-action-disabled-bg font-display text-content-secondary`}
        >
            {/* 빈 이름이 와도 동그라미는 남아야 목록 줄이 어긋나지 않는다 */}
            {name.charAt(0)}
        </span>
    )
}
