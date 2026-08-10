import React, { useState } from 'react'
import { ArrowLeftIcon } from 'lucide-react'

import { madeErrorMessage } from './errors'
import {
    CoverImage,
    MadeDexBasicFields,
    MadeDexCoverPicker,
    MadeDexVisibilityPicker,
    useCoverPreview,
} from './MadeDexFormFields'
import { MadeDexDetail, MadeDexVisibility } from './types'

interface Props {
    detail: MadeDexDetail
    /** image가 File이면 새로 올리고, 문자열이면 그대로 두고, null이면 표지를 지운다 */
    onSave: (name: string, description: string, visibility: MadeDexVisibility, image: CoverImage) => Promise<void>
    onBack: () => void
}

/** 개설과 달리 단계로 나누지 않는다. 수정은 보통 한 군데만 고친다 */
export function MadeDexEditForm({ detail, onSave, onBack }: Props) {
    const [name, setName] = useState(detail.name)
    const [description, setDescription] = useState(detail.description ?? '')
    const [visibility, setVisibility] = useState(detail.visibility)
    const [image, setImage] = useState<CoverImage>(
        detail.imageKey && detail.imageUrl ? { key: detail.imageKey, url: detail.imageUrl } : null,
    )
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const imagePreview = useCoverPreview(image)
    const trimmedName = name.trim()

    const save = async () => {
        setSubmitting(true)
        setError(null)
        try {
            await onSave(trimmedName, description.trim(), visibility, image)
        } catch (failure) {
            setError(madeErrorMessage(failure, '수정하지 못했어요. 잠시 후 다시 시도해 주세요.'))
            setSubmitting(false)
        }
    }

    return (
        <div className="flex h-full flex-col bg-cream-100">
            <header className="flex items-center gap-3 px-5 py-4">
                <button type="button" onClick={onBack} aria-label="뒤로가기" className="min-h-touch">
                    <ArrowLeftIcon size={22} className="text-content-primary" />
                </button>
                <h1 className="font-display text-lg text-content-primary">도감 정보 변경</h1>
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
                <MadeDexCoverPicker preview={imagePreview} onPick={setImage} onClear={() => setImage(null)} />

                <div className="mt-8">
                    <MadeDexBasicFields
                        name={name}
                        description={description}
                        onNameChange={setName}
                        onDescriptionChange={setDescription}
                    />
                </div>

                <p className="mt-8 text-sm font-bold text-content-primary">공개 여부</p>
                <div className="mt-3">
                    <MadeDexVisibilityPicker visibility={visibility} onChange={setVisibility} />
                </div>

                {error && <p className="mt-4 text-sm text-feedback-error">{error}</p>}
            </main>

            <div className="px-5 pb-8">
                <button
                    type="button"
                    disabled={!trimmedName || submitting}
                    onClick={() => void save()}
                    className="min-h-touch w-full rounded-2xl bg-action-primary py-4 font-display text-lg text-content-on-action shadow-card disabled:bg-action-disabled-bg disabled:text-action-disabled-text disabled:shadow-none"
                >
                    {submitting ? '저장하는 중…' : '저장하기'}
                </button>
            </div>
        </div>
    )
}
