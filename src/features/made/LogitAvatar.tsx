import React from 'react'
import { Avatar } from '@/shared/ui'

interface Props {
    name: string
    imageUrl: string | null
    /** 사람 색을 정하는 값. 로그잇은 참여자가 여러 명이라 항상 넘긴다 (§1.6) */
    userId?: number
    /** 냉장고 셀처럼 겹쳐 쌓을 때는 sm */
    size?: 'sm' | 'md'
    className?: string
}

/** 로그잇 안에서 부르던 이름과 크기 단계를 공통 Avatar에 이어 준다 */
const TO_SHARED = { sm: 'xs', md: 'sm' } as const

export function LogitAvatar({ name, imageUrl, userId, size = 'md', className = '' }: Props) {
    return <Avatar name={name} imageUrl={imageUrl} size={TO_SHARED[size]} colorKey={userId} className={className} />
}
