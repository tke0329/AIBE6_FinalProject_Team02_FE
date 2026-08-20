'use client'

import { AwardIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { resolveBadgeImage } from '@/shared/data/badgeAssets'

interface Props {
    /** 시스템 뱃지 식별자. public 정적 에셋 매핑용 (챌린지 커스텀은 없음) */
    code?: string | null
    /** 업로드 이미지 URL(챌린지 커스텀, S3). 시스템 뱃지는 null */
    imageUrl?: string | null
    name: string
    size?: number
}

/**
 * 서버에서 온 뱃지(운영진/챌린지)를 렌더.
 * 이미지 소스: 업로드(S3) 우선 → code 정적 에셋 → 둘 다 없거나 **못 불러오면** 아이콘.
 * (하드코딩 BadgeId 기반 EquippedBadge와 별개 — 서버 데이터 전용)
 *
 * ## `size`는 **높이**다. 폭은 그림 비율대로 흐른다
 *
 * 예전에는 정사각 상자에 `object-contain`으로 넣었다. 그런데 수저 뱃지 원본이
 * **85×128 세로 그림**이라, 50px 상자에 넣으면 폭이 33px로 줄고 **좌우에 8.5px씩
 * 빈 상자가 남았다.** 여기에 그림 자체의 투명 여백(좌우 6~19%)까지 더해져,
 * `gap`을 아무리 줄여도 닉네임과 20px 가까이 떨어져 보였다.
 *
 * 높이만 고정하면 상자가 그림에 딱 붙어 `gap`이 실제 간격이 된다.
 * (하단 네비 아이콘도 같은 이유로 높이만 고정한다 — BottomNav 주석)
 *
 * ## 못 불러온 이미지는 아이콘으로 갈아탄다
 *
 * `resolveBadgeImage`는 **매핑이 있는지**만 본다 — 그 경로에 파일이 실제로 있는지는 모른다.
 * 매핑은 있는데 파일이 없으면(에셋을 아직 안 넣은 뱃지) 깨진 이미지가 그대로 남는다.
 * 목록처럼 여러 개가 나란히 놓이는 자리에서는 그게 장애처럼 보이므로 `onError`로 받아 낸다
 */
export function ServerBadge({ code = null, imageUrl = null, name, size = 17 }: Props) {
    const src = resolveBadgeImage(code, imageUrl)
    const [failed, setFailed] = useState(false)

    // 같은 자리에서 다른 뱃지로 바뀌면 실패 기록을 버린다 (안 그러면 새 뱃지도 아이콘으로 보인다)
    useEffect(() => setFailed(false), [src])

    if (src && !failed) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={src}
                alt={name}
                title={name}
                onError={() => setFailed(true)}
                /*
                 * 원형 마스크는 **올린 이미지에만.** 챌린짓 커스텀 뱃지는 정사각 캔버스라
                 * 동그라미가 맞지만, 기본 뱃지는 배경이 비어 있는 세로 그림이라
                 * 원으로 자르면 바깥 기둥이 잘려 나간다 (수저 뱃지가 50→37px로 잘리고 있었다)
                 */
                className={`inline-block w-auto shrink-0 object-contain ${imageUrl ? 'rounded-full' : ''}`}
                style={{ height: size }}
            />
        )
    }
    return (
        <span
            title={name}
            aria-label={name}
            className="inline-flex shrink-0 items-center text-watermelon-500"
            style={{ width: size, height: size }}
        >
            <AwardIcon size={size} strokeWidth={2.4} />
        </span>
    )
}
