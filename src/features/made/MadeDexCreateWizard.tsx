'use client'

import React, { useState } from 'react'
import { LockIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { WIZARD_STEP_TRANSITION, wizardStepVariants } from '@/shared/lib/wizardMotion'
import { Button, Text, WizardHeader } from '@/shared/ui'
import { madeErrorMessage } from './errors'
import { MadeDexBasicFields, MadeDexCoverPicker, useCoverPreview } from './MadeDexFormFields'
import { DEFAULT_MADE_DEX_COVER } from './types'

interface Props {
    onCreate: (name: string, description: string, image: File | null) => Promise<void>
    /** 1단계에서 뒤로 가면 목록으로 나간다 */
    onExit: () => void
}

/**
 * 로그잇 개설.
 *
 * ## 챌린짓 개설과 같은 모양으로 맞췄다
 *
 * 원래는 로그잇만 **동그란 숫자 점**이고 챌린짓은 **진행 바**여서, 같은 앱의 두 개설
 * 화면이 서로 다른 앱처럼 보였다. 머리글(`WizardHeader`)과 단계 전환
 * (`wizardStepVariants`)을 공통으로 뽑아 둘이 같은 것을 쓴다.
 *
 * ## 마지막 확인 시트를 없앴다
 *
 * 2단계가 이미 **설정을 되짚어 보는 화면**이다. 그 위에 "이 설정으로 만들까요?" 시트를
 * 또 띄우면 같은 확인을 두 번 받는 셈이라, 누르는 횟수만 늘고 얻는 건 없었다.
 * 되돌릴 수 없는 일도 아니다 — 이름·소개말은 나중에 바꿀 수 있고 도감도 지울 수 있다.
 * 그래서 마지막 단계의 버튼이 바로 만든다.
 */
const STEP_LABEL = ['기본 정보', '확인'] as const

export function MadeDexCreateWizard({ onCreate, onExit }: Props) {
    // 방향을 함께 들고 있어야 전환이 좌우로 갈린다 (챌린짓과 같은 방식)
    const [[step, dir], setStepDir] = useState<[number, number]>([0, 1])
    const go = (next: number) => setStepDir([next, next > step ? 1 : -1])

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [image, setImage] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const imagePreview = useCoverPreview(image)
    const trimmedName = name.trim()
    const last = step === STEP_LABEL.length - 1

    const back = () => (step === 0 ? onExit() : go(step - 1))

    const create = async () => {
        setSubmitting(true)
        setError(null)
        try {
            await onCreate(trimmedName, description.trim(), image)
        } catch (failure) {
            setError(madeErrorMessage(failure, '로그잇을 만들지 못했어요. 잠시 후 다시 시도해 주세요.'))
            setSubmitting(false)
        }
    }

    return (
        <div className="relative flex h-full flex-col bg-surface-app">
            <WizardHeader
                step={step}
                total={STEP_LABEL.length}
                onBack={back}
                backLabel={step === 0 ? '로그잇 목록으로' : '이전 단계로'}
                label="로그잇 개설"
            />

            <main className="no-scrollbar relative flex-1 overflow-y-auto px-5 pt-4">
                <AnimatePresence mode="wait" custom={dir}>
                    <motion.div
                        key={step}
                        custom={dir}
                        variants={wizardStepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={WIZARD_STEP_TRANSITION}
                        className="pb-6"
                    >
                        <Text variant="label" tone="link" as="p">
                            {STEP_LABEL[step]}
                        </Text>

                        {step === 0 ? (
                            <>
                                <h1 className="mt-1 font-display text-2xl leading-snug text-content-primary">
                                    로그잇 이름을 먼저 정해주세요
                                </h1>
                                <div className="pt-6">
                                    <MadeDexCoverPicker
                                        preview={imagePreview}
                                        onPick={setImage}
                                        onClear={() => setImage(null)}
                                    />
                                </div>
                                <div className="mt-8">
                                    <MadeDexBasicFields
                                        name={name}
                                        description={description}
                                        onNameChange={setName}
                                        onDescriptionChange={setDescription}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <h1 className="mt-1 font-display text-2xl leading-snug text-content-primary">
                                    이렇게 만들까요?
                                </h1>
                                <dl className="space-y-3 pt-6">
                                    <div className="flex justify-center pb-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={imagePreview ?? DEFAULT_MADE_DEX_COVER}
                                            alt=""
                                            className="h-28 w-28 rounded-full bg-neutral-100 object-cover"
                                        />
                                    </div>
                                    <div className="rounded-2xl bg-surface-card p-4 shadow-card">
                                        <dt className="text-xs text-content-secondary">로그잇 이름</dt>
                                        <dd className="mt-1 font-display text-lg text-content-primary">
                                            {trimmedName}
                                        </dd>
                                    </div>
                                    <div className="rounded-2xl bg-surface-card p-4 shadow-card">
                                        <dt className="text-xs text-content-secondary">소개말</dt>
                                        <dd className="mt-1 whitespace-pre-wrap text-sm text-content-primary">
                                            {description.trim() || '없음'}
                                        </dd>
                                    </div>
                                    {/* 만든 뒤에 바꿀 수 있다는 것을 여기서 알린다 — 확인 시트가 하던 말이다 */}
                                    <Text variant="caption" tone="muted" as="p" className="pt-1 text-center">
                                        이름과 소개말은 나중에 바꿀 수 있어요
                                    </Text>
                                    <p className="flex items-center justify-center gap-1 text-xs text-content-muted">
                                        <LockIcon size={13} aria-hidden />
                                        초대 코드를 받은 사람만 참여할 수 있어요
                                    </p>
                                </dl>
                            </>
                        )}

                        {error && (
                            <Text variant="secondary" tone="error" as="p" className="pt-4">
                                {error}
                            </Text>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            <div className="shrink-0 px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3">
                <Button
                    fullWidth
                    loading={submitting}
                    disabled={!trimmedName}
                    onClick={() => (last ? void create() : go(step + 1))}
                >
                    {last ? '로그잇 만들기' : '다음'}
                </Button>
            </div>
        </div>
    )
}
