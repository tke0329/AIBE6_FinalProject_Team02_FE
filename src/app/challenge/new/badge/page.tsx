'use client'

import { useRouter } from 'next/navigation'
import { BadgeCustom } from '@/features/challenge/BadgeCustom'
import { useAppState } from '@/shared/store/AppStateProvider'
import { goBackOr } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'

/**
 * 개설 마법사의 보상 단계 인덱스. `ChallengeCreate`의 `BADGE`와 같은 값이어야 한다 —
 * 그 상수는 컴포넌트 파일에 있어 여기서 못 읽는다. 단계 순서를 바꾸면 여기도 고칠 것
 */
const BADGE_STEP = 4

/** `/challenge/new/badge` 완주 보상 뱃지 직접 만들기 */
export default function BadgeCustomPage() {
    const router = useRouter()
    const { setCustomBadge, challengeDraft, setChallengeDraft } = useAppState()

    /**
     * 보상 단계(4)로 돌아간다. 저장했든 취소했든 같다 —
     * 여기로 올 수 있는 곳이 보상 단계뿐이라 다른 데로 보낼 이유가 없다.
     *
     * `back()`이어야 한다. `push`였을 때는 이 화면이 히스토리에 남아, 위저드로 돌아온
     * 뒤 브라우저 뒤로가기를 누르면 **그림판이 다시 올라왔다**
     */
    const backToBadgeStep = () => {
        setChallengeDraft({ ...challengeDraft, step: BADGE_STEP })
        goBackOr(router, ROUTES.challengeNew)
    }

    return (
        <BadgeCustom
            onBack={backToBadgeStep}
            onSave={(badge) => {
                setCustomBadge(badge)
                backToBadgeStep()
            }}
        />
    )
}
