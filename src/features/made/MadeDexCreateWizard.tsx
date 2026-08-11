import React, { useState } from 'react'
import { ArrowLeftIcon } from 'lucide-react'

import { BottomSheet } from '@/shared/ui/molecules/BottomSheet'
import { madeErrorMessage } from './errors'
import { MadeDexBasicFields, MadeDexCoverPicker, MadeDexVisibilityPicker, useCoverPreview } from './MadeDexFormFields'
import { DEFAULT_MADE_DEX_COVER, MadeDexVisibility } from './types'

interface Props {
    onCreate: (name: string, description: string, visibility: MadeDexVisibility, image: File | null) => Promise<void>
    /** 1단계에서 뒤로 가면 목록으로 나간다 */
    onExit: () => void
}

const STEPS = ['기본 정보', '공개 여부', '확인'] as const

export function MadeDexCreateWizard({ onCreate, onExit }: Props) {
    const [step, setStep] = useState(0)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [visibility, setVisibility] = useState<MadeDexVisibility>('PRIVATE')
    const [image, setImage] = useState<File | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const imagePreview = useCoverPreview(image)
    const trimmedName = name.trim()
    const last = step === STEPS.length - 1

    const back = () => (step === 0 ? onExit() : setStep(step - 1))

    const create = async () => {
        setSubmitting(true)
        setError(null)
        try {
            await onCreate(trimmedName, description.trim(), visibility, image)
        } catch (failure) {
            setConfirmOpen(false)
            setError(madeErrorMessage(failure, '도감을 만들지 못했어요. 잠시 후 다시 시도해 주세요.'))
            setSubmitting(false)
        }
    }

    return (
        <div className="relative flex h-full flex-col bg-cream-100">
            <header className="px-5 pb-2 pt-4">
                <button type="button" onClick={back} aria-label="뒤로가기" className="min-h-touch">
                    <ArrowLeftIcon size={22} className="text-content-primary" />
                </button>

                <ol className="mt-2 flex gap-2">
                    {STEPS.map((label, index) => (
                        <li
                            key={label}
                            aria-current={index === step ? 'step' : undefined}
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                index === step
                                    ? 'bg-action-primary text-content-on-action'
                                    : 'bg-cream-200 text-content-muted'
                            }`}
                        >
                            <span className="sr-only">{label} </span>
                            {index + 1}
                        </li>
                    ))}
                </ol>

                <h1 className="mt-5 font-display text-2xl leading-8 text-content-primary">
                    {step === 0 && (
                        <>
                            도감 이름을
                            <br />
                            먼저 정해주세요
                        </>
                    )}
                    {step === 1 && (
                        <>
                            이 도감을
                            <br />
                            공개할까요?
                        </>
                    )}
                    {step === 2 && (
                        <>
                            설정한 내용을
                            <br />
                            마지막으로 확인해요
                        </>
                    )}
                </h1>
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 py-6">
                {step === 0 && (
                    <>
                        <MadeDexCoverPicker preview={imagePreview} onPick={setImage} onClear={() => setImage(null)} />
                        <div className="mt-8">
                            <MadeDexBasicFields
                                name={name}
                                description={description}
                                onNameChange={setName}
                                onDescriptionChange={setDescription}
                            />
                        </div>
                    </>
                )}

                {step === 1 && (
                    <>
                        <MadeDexVisibilityPicker visibility={visibility} onChange={setVisibility} />
                        <p className="mt-3 px-1 text-xs text-content-muted">
                            공개 설정은 만든 뒤에도 언제든 바꿀 수 있어요.
                        </p>
                    </>
                )}

                {step === 2 && (
                    <dl className="space-y-3">
                        <div className="flex justify-center pb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imagePreview ?? DEFAULT_MADE_DEX_COVER}
                                alt=""
                                className="h-28 w-28 rounded-full bg-cream-200 object-cover"
                            />
                        </div>
                        <div className="rounded-2xl bg-surface-card p-4 shadow-card">
                            <dt className="text-xs text-content-secondary">도감 이름</dt>
                            <dd className="mt-1 font-display text-lg text-content-primary">{trimmedName}</dd>
                        </div>
                        <div className="rounded-2xl bg-surface-card p-4 shadow-card">
                            <dt className="text-xs text-content-secondary">소개말</dt>
                            <dd className="mt-1 whitespace-pre-wrap text-sm text-content-primary">
                                {description.trim() || '없음'}
                            </dd>
                        </div>
                        <div className="rounded-2xl bg-surface-card p-4 shadow-card">
                            <dt className="text-xs text-content-secondary">공개 여부</dt>
                            <dd className="mt-1 text-sm text-content-primary">
                                {visibility === 'PUBLIC' ? '공개 도감' : '비공개 도감'}
                            </dd>
                        </div>
                    </dl>
                )}

                {error && <p className="mt-4 text-sm text-feedback-error">{error}</p>}
            </main>

            <div className="px-5 pb-8">
                <button
                    type="button"
                    disabled={!trimmedName || submitting}
                    onClick={() => (last ? setConfirmOpen(true) : setStep(step + 1))}
                    className="min-h-touch w-full rounded-2xl bg-action-primary py-4 font-display text-lg text-content-on-action shadow-card disabled:bg-action-disabled-bg disabled:text-action-disabled-text disabled:shadow-none"
                >
                    {last ? '도감 만들기' : '다음'}
                </button>
            </div>

            {confirmOpen && (
                // 만드는 중에 닫히면 결과를 못 본다 (WithdrawConfirmSheet와 같은 이유)
                <BottomSheet
                    title="이 설정으로 도감을 만들까요?"
                    onClose={() => setConfirmOpen(false)}
                    dismissible={!submitting}
                >
                    <div className="px-5 pb-8 pt-2">
                        <p className="text-sm text-content-secondary">설정한 내용은 나중에 바꿀 수 있어요.</p>
                        <div className="mt-6 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmOpen(false)}
                                className="min-h-touch rounded-2xl border border-edge-default text-sm font-medium text-content-secondary"
                            >
                                아니요
                            </button>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => void create()}
                                className="min-h-touch rounded-2xl bg-action-primary text-sm font-bold text-content-on-action disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
                            >
                                {submitting ? '만드는 중…' : '네, 만들게요'}
                            </button>
                        </div>
                    </div>
                </BottomSheet>
            )}
        </div>
    )
}
