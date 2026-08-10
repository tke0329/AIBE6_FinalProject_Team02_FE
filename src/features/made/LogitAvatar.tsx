import React from 'react'

interface Props {
    name: string
    imageUrl: string | null
    /** 냉장고 셀처럼 겹쳐 쌓을 때는 sm */
    size?: 'sm' | 'md'
    className?: string
}

const sizeClass = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-9 w-9 text-sm',
}

export function LogitAvatar({ name, imageUrl, size = 'md', className = '' }: Props) {
    const base = `${sizeClass[size]} shrink-0 rounded-full object-cover ${className}`

    if (imageUrl) {
        return (
            // presigned URL이라 next/image의 도메인 설정 대상이 아니다
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={`${name} 프로필 사진`} className={base} />
        )
    }

    return (
        <span
            aria-hidden
            className={`${sizeClass[size]} flex shrink-0 items-center justify-center rounded-full bg-cream-200 font-bold text-content-secondary ${className}`}
        >
            {name.charAt(0)}
        </span>
    )
}
