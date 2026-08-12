'use client'

import { useRouter } from 'next/navigation'
import { MadeDexCreateWizard } from '@/features/made/MadeDexCreateWizard'
import { createMadeDex } from '@/features/made/api'
import { ROUTES } from '@/shared/lib/routes'
import { uploadImageToS3 } from '@/shared/lib/upload'

/** `/made/new` 제작 도감 개설 */
export default function MadeDexCreatePage() {
    const router = useRouter()

    // 만든 직후 목록으로 되돌아오면 개설 화면이 히스토리에 남아 뒤로가기가 어색해진다
    const create = async (name: string, description: string, image: File | null) => {
        // 이미지는 서버를 거치지 않고 S3로 직접 올린 뒤 key만 넘긴다
        const imageKey = image ? (await uploadImageToS3(image, image.name || 'cover.jpg')).key : undefined

        const madeDexId = await createMadeDex({
            name,
            description: description || undefined,
            imageKey,
        })
        router.replace(ROUTES.madeDex(madeDexId))
    }

    return <MadeDexCreateWizard onCreate={create} onExit={() => router.push(ROUTES.made)} />
}
