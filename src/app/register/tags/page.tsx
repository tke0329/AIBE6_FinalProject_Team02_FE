'use client'

import { useRouter } from 'next/navigation'
import { RegisterTags } from '@/features/register/RegisterTags'
import { useAppState } from '@/shared/store/AppStateProvider'
import { goBackOr } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'

/** `/register/tags` 등록 4단계 — 제작 도감 전용 태그 입력 */
export default function RegisterTagsPage() {
    const router = useRouter()
    const { selectedFood, recordDraft, setSelectedTags, finishRegistration } = useAppState()

    return (
        <RegisterTags
            foodName={selectedFood.name}
            foodEmoji={selectedFood.emoji}
            onBack={() => goBackOr(router, ROUTES.registerRecord)}
            onNext={(tags) => {
                setSelectedTags(tags)
                finishRegistration(tags, recordDraft)
                // replace — 등록을 확정한 뒤라 태그 화면으로 되돌아갈 자리가 없다
                router.replace(ROUTES.registerUnlock)
            }}
        />
    )
}
