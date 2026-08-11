import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'

/**
 * §3.2 도감 그리드 카드 (Watermelon 핸드오프 1a/1c).
 * 사진 중심 카드: 1:1 썸네일 + 이름 + 하단 슬롯(별점/라벨).
 * - `unlocked` 실제 사진(없으면 스트라이프 플레이스홀더)
 * - `locked`   일러스트 흑백 처리 또는 스트라이프 + "미해금" 라벨(색에만 의존하지 않기 위해 텍스트 병기)
 * - `recent`   최근 해금 강조 테두리
 *
 * 사진 자리는 실제 이미지가 없을 때 45° 대각 스트라이프 플레이스홀더를 쓴다(핸드오프 규격).
 */
export type FoodCardState = 'unlocked' | 'locked' | 'recent'

/** 핸드오프 규격: repeating-linear-gradient(45deg, #F5F5F6 0 10px, #EFEFF1 10px 20px) */
const STRIPE_PLACEHOLDER = {
    backgroundImage: 'repeating-linear-gradient(45deg, #F5F5F6 0 10px, #EFEFF1 10px 20px)',
}

interface FoodCardProps {
    name: string
    /** @deprecated 이모지 미표시(핸드오프: 라인 아이콘/이미지). 스크린리더/호환용으로만 유지 */
    emoji?: string
    illustrationUrl?: string
    state: FoodCardState
    /** 스크린리더용 전체 설명. 예: "김치찌개, 해금됨, 별 1개" */
    accessibleName: string
    onClick?: () => void
    /** 이름 아래 영역 — 별점, #태그 등 */
    footer?: React.ReactNode
    /** 우측 상단 코너 뱃지 — "New" 등 */
    corner?: React.ReactNode
    /** 썸네일 위 겹침 뱃지 — 등록자 이니셜 등 */
    overlay?: React.ReactNode
    /** locked일 때 이름 대신 보여줄 문자열 */
    lockedName?: string
    /** 음식 이름 위에 표시할 가게/장소 이름 */
    store?: string
}

export function FoodCard({
    name,
    illustrationUrl,
    state,
    accessibleName,
    onClick,
    footer,
    corner,
    overlay,
    lockedName = name,
    store,
}: FoodCardProps) {
    const locked = state === 'locked'
    const [imageFailed, setImageFailed] = useState(false)

    useEffect(() => {
        setImageFailed(false)
    }, [illustrationUrl])

    const showImage = Boolean(illustrationUrl) && !imageFailed

    return (
        <motion.button
            type="button"
            whileTap={locked ? undefined : { scale: 0.96 }}
            onClick={locked ? undefined : onClick}
            disabled={locked}
            aria-label={accessibleName}
            className={`relative flex w-full min-w-0 flex-col rounded-2xl ${
                state === 'recent' ? 'ring-2 ring-edge-recent' : ''
            }`}
        >
            {corner}
            <div
                aria-hidden
                className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-50"
            >
                {showImage ? (
                    <Image
                        src={illustrationUrl as string}
                        alt=""
                        fill
                        sizes="120px"
                        onError={() => setImageFailed(true)}
                        className={`object-cover ${locked ? 'grayscale' : ''}`}
                    />
                ) : (
                    <div className="h-full w-full" style={STRIPE_PLACEHOLDER} />
                )}
                {overlay}
            </div>
            {store && (
                <span aria-hidden className="mt-1.5 w-full truncate text-center text-xs text-content-muted">
                    {store}
                </span>
            )}
            <span
                aria-hidden
                className={`${store ? 'mt-0.5' : 'mt-1.5'} w-full truncate text-center text-xs font-semibold ${
                    locked ? 'text-content-secondary' : 'text-content-primary'
                }`}
            >
                {locked ? lockedName : name}
            </span>
            {footer ? (
                <div aria-hidden className="mt-0.5 w-full text-center">
                    {footer}
                </div>
            ) : (
                <span aria-hidden className="mt-0.5 text-center text-xs text-content-secondary">
                    {locked ? '미해금' : ''}
                </span>
            )}
        </motion.button>
    )
}
