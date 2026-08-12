import React from 'react'
import { Avatar } from '@/shared/ui'

interface Props {
    name: string
    imageUrl: string | null
    /** 냉장고 셀처럼 겹쳐 쌓을 때는 sm */
    size?: 'sm' | 'md'
    className?: string
}

/** 로그잇 안에서 부르던 이름과 크기 단계를 공통 Avatar에 이어 준다 */
const TO_SHARED = { sm: 'xs', md: 'sm' } as const

export function LogitAvatar({ name, imageUrl, size = 'md', className = '' }: Props) {
    return <Avatar name={name} imageUrl={imageUrl} size={TO_SHARED[size]} className={className} />
}
