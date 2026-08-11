import { PlacePicker } from '@/features/register/PlacePicker'
import { LocationInput } from '@/features/register/confirmApi'
import { geocodeAddress } from '@/features/register/placeApi'
import { resolveBadgeImage } from '@/shared/data/badgeAssets'
import { useAppState } from '@/shared/store/AppStateProvider'
import { Badge } from '@/shared/ui/atoms/Badge'
import { AnimatePresence, motion } from 'framer-motion'
import {
    ArrowLeftIcon,
    CameraIcon,
    CheckIcon,
    MapPinIcon,
    MedalIcon,
    PencilIcon,
    Trash2Icon,
    TrophyIcon,
    UtensilsIcon,
} from 'lucide-react'
import React, { useRef, useState } from 'react'
import { ChallengeData, ChallengeTarget, RewardBadge } from './types'
import { CoverPhotoStep } from './CoverPhotoStep'

interface Props {
    createdThisMonth: number
    customBadge: RewardBadge | null
    onBack: () => void
    onCreate: (challenge: ChallengeData) => void | Promise<void>
    onCustomBadge: () => void
    onUsePreset: () => void
}

const PRESETS = [
    { code: 'CHALLENGE_PRESET_EXPLORER', name: '맛집 탐험가' },
    { code: 'CHALLENGE_PRESET_FINISHER', name: '챌린지 완주자' },
    { code: 'CHALLENGE_PRESET_PIONEER', name: '동네 개척자' },
]
const MIN_TARGETS = 5

// 스텝 인덱스
const TITLE = 0
const COVER = 1
const PERIOD = 2
const FOODS = 3
const BADGE = 4
const DONE = 5
const STEP_LABEL = ['제목', '대표 사진', '기한', '음식', '보상']

const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}

export function ChallengeCreate({
    createdThisMonth,
    customBadge,
    onBack,
    onCreate,
    onCustomBadge,
    onUsePreset,
}: Props) {
    const { challengeDraft, setChallengeDraft } = useAppState()
    const patchDraft = (patch: Partial<typeof challengeDraft>) => setChallengeDraft({ ...challengeDraft, ...patch })

    const title = challengeDraft.title
    const periodType = challengeDraft.periodType
    const endsAt = challengeDraft.endsAt
    const targets = challengeDraft.targets
    const setTargets = (updater: ChallengeTarget[] | ((c: ChallengeTarget[]) => ChallengeTarget[])) =>
        setChallengeDraft({
            ...challengeDraft,
            targets: typeof updater === 'function' ? updater(challengeDraft.targets) : updater,
        })

    // 커스텀 뱃지 그리고 돌아오면 뱃지 스텝으로 복귀
    const [[step, dir], setStepDir] = useState<[number, number]>([customBadge ? BADGE : TITLE, 1])
    const go = (next: number) => setStepDir([next, next > step ? 1 : -1])

    const canCreate = createdThisMonth < 3

    // 음식 추가 폼(로컬)
    const [storeName, setStoreName] = useState('')
    const [foodName, setFoodName] = useState('')
    const [desc, setDesc] = useState('')
    const [targetFile, setTargetFile] = useState<File | null>(null)
    const [targetPreview, setTargetPreview] = useState('')
    const [coverFile, setCoverFile] = useState<Blob | null>(null) // 대표 사진(정사각 크롭 Blob)
    const [coverPreview, setCoverPreview] = useState('')
    const [targetPlace, setTargetPlace] = useState<LocationInput | null>(null)
    const [addressInput, setAddressInput] = useState('')
    const [addressError, setAddressError] = useState('')
    const [resolving, setResolving] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const placeReady = targetPlace != null && targetPlace.lat != null && targetPlace.lng != null

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        setTargetFile(file)
        setTargetPreview(URL.createObjectURL(file))
    }
    const resolveAddress = async () => {
        const q = addressInput.trim()
        if (!q || resolving) return
        setResolving(true)
        setAddressError('')
        try {
            const g = await geocodeAddress(q)
            if (g.lat == null || g.lng == null) {
                setAddressError('해당 주소의 위치를 찾지 못했어요.')
                return
            }
            setTargetPlace({ name: g.address || q, lat: g.lat, lng: g.lng })
            setAddressInput('')
        } catch {
            setAddressError('주소를 찾지 못했어요. 다시 확인해 주세요.')
        } finally {
            setResolving(false)
        }
    }
    const addTarget = () => {
        if (!foodName.trim() || !placeReady) return
        setTargets((c) => [
            ...c,
            {
                id: `target-${Date.now()}`,
                name: foodName.trim(),
                storeName: storeName.trim() || null,
                description: desc.trim() || null,
                file: targetFile,
                imageUrl: targetPreview || '/images/default_food.png',
                placeName: targetPlace?.name ?? null,
                lat: targetPlace?.lat ?? null,
                lng: targetPlace?.lng ?? null,
            },
        ])
        setStoreName('')
        setFoodName('')
        setDesc('')
        setTargetFile(null)
        setTargetPreview('')
        setTargetPlace(null)
        setAddressInput('')
    }

    // 보상 뱃지(로컬)
    const [selectedCode, setSelectedCode] = useState(PRESETS[0].code)
    const [presetName, setPresetName] = useState(PRESETS[0].name)
    const [submitting, setSubmitting] = useState(false)
    const selectedPreset = PRESETS.find((p) => p.code === selectedCode) ?? PRESETS[0]
    const rewardName = customBadge ? customBadge.name : presetName
    const rewardImage = customBadge?.customImage ?? resolveBadgeImage(selectedPreset.code, undefined) ?? undefined

    const enough = targets.length >= MIN_TARGETS
    const periodOk = periodType === 'PERMANENT' || endsAt.trim().length > 0

    const create = async () => {
        if (submitting || !title.trim() || !enough || !periodOk || !canCreate) return
        setSubmitting(true)
        try {
            await onCreate({
                id: `created-${Date.now()}`,
                title: title.trim(),
                coverFile,
                coverUrl: coverPreview || undefined,
                emoji: '🏆',
                tag: '수집형',
                dday: 'D-30',
                participants: 1,
                mine: `나 0/${targets.length}`,
                progress: 0,
                owner: '신재락현',
                joined: true,
                isCreator: true,
                target: targets.length,
                targetRestaurants: targets,
                completedTargetIds: [],
                rewardBadge: customBadge ?? {
                    emoji: '🏆',
                    name: presetName.trim() || selectedPreset.name,
                    tone: 'bg-watermelon-100 text-watermelon-700',
                    code: selectedPreset.code,
                },
            })
            go(DONE)
        } finally {
            setSubmitting(false)
        }
    }

    const headerBack = () => {
        if (step === DONE) return
        if (step > TITLE) go(step - 1)
        else onBack()
    }

    // 스텝별 하단 CTA
    const stepValid =
        step === TITLE ? title.trim().length > 0 : step === PERIOD ? periodOk : step === FOODS ? enough : true

    return (
        <div className="flex h-full flex-col bg-white">
            {step !== DONE && (
                <header className="flex items-center gap-3 px-5 pb-2 pt-4">
                    <button onClick={headerBack} aria-label="뒤로가기">
                        <ArrowLeftIcon size={22} className="text-neutral-900" />
                    </button>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-watermelon-100">
                        <motion.div
                            className="h-full rounded-full bg-watermelon-500"
                            animate={{ width: `${((step + 1) / 5) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                        />
                    </div>
                    <span className="text-xs font-bold text-watermelon-500">{step + 1}/5</span>
                </header>
            )}

            <main className="no-scrollbar relative flex-1 overflow-y-auto px-5 pt-4">
                <AnimatePresence mode="wait" custom={dir}>
                    <motion.div
                        key={step}
                        custom={dir}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                    >
                        {step === TITLE && (
                            <div>
                                <p className="text-sm font-bold text-watermelon-500">{STEP_LABEL[0]}</p>
                                <h1 className="mt-1 font-display text-2xl leading-snug text-neutral-900">
                                    어떤 챌린지인가요?
                                </h1>
                                <p className="mt-2 flex items-center gap-1 text-sm text-neutral-400">
                                    <MapPinIcon size={15} strokeWidth={2} aria-hidden className="shrink-0" />
                                    위치 인증 챌린지 — 참가자는 지정 장소에서 인증해요
                                </p>
                                <input
                                    autoFocus
                                    value={title}
                                    onChange={(e) => patchDraft({ title: e.target.value })}
                                    placeholder="예: 서울 라멘 성지순례"
                                    className="mt-6 w-full border-0 border-b-2 border-watermelon-500 bg-transparent pb-2 text-xl text-neutral-900 outline-none placeholder:text-neutral-400/50"
                                />
                                <textarea
                                    value={challengeDraft.description}
                                    onChange={(e) => patchDraft({ description: e.target.value })}
                                    placeholder="소개글 (선택) — 어떤 챌린지인지 짧게 소개해요"
                                    rows={3}
                                    maxLength={200}
                                    className="mt-5 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-watermelon-400 placeholder:text-neutral-400/50"
                                />
                                {!canCreate && (
                                    <p className="mt-4 rounded-2xl bg-watermelon-50 p-3 text-sm text-watermelon-700">
                                        이번 달 개설 가능 횟수(3회)를 모두 사용했어요.
                                    </p>
                                )}
                            </div>
                        )}

                        {step === COVER && (
                            <CoverPhotoStep
                                preview={coverPreview}
                                onApply={(blob, url) => {
                                    setCoverFile(blob)
                                    setCoverPreview(url)
                                }}
                                onClear={() => {
                                    setCoverFile(null)
                                    setCoverPreview('')
                                }}
                            />
                        )}

                        {step === PERIOD && (
                            <div>
                                <p className="text-sm font-bold text-watermelon-500">{STEP_LABEL[2]}</p>
                                <h1 className="mt-1 font-display text-2xl leading-snug text-neutral-900">
                                    얼마 동안 진행하나요?
                                </h1>
                                <div className="mt-6 space-y-3">
                                    {(['PERMANENT', 'LIMITED'] as const).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() =>
                                                patchDraft(
                                                    p === 'PERMANENT'
                                                        ? { periodType: p, endsAt: '' }
                                                        : { periodType: p },
                                                )
                                            }
                                            className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left ${periodType === p ? 'border-watermelon-500 bg-watermelon-50' : 'border-neutral-100 bg-white'}`}
                                        >
                                            <span
                                                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${periodType === p ? 'border-watermelon-500 bg-watermelon-500 text-white' : 'border-neutral-200'}`}
                                            >
                                                {periodType === p && <CheckIcon size={14} />}
                                            </span>
                                            <span>
                                                <strong className="block text-neutral-900">
                                                    {p === 'PERMANENT' ? '상시' : '기간 한정'}
                                                </strong>
                                                <small className="text-neutral-400">
                                                    {p === 'PERMANENT' ? '기한 없이 계속' : '종료일까지만 참여'}
                                                </small>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <AnimatePresence>
                                    {periodType === 'LIMITED' && (
                                        <motion.label
                                            className="mt-4 block"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        >
                                            <span className="mb-1 block text-xs font-bold text-neutral-800">종료일</span>
                                            <input
                                                type="date"
                                                value={endsAt}
                                                onChange={(e) => patchDraft({ endsAt: e.target.value })}
                                                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-watermelon-400"
                                            />
                                        </motion.label>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {step === FOODS && (
                            <div>
                                <p className="text-sm font-bold text-watermelon-500">{STEP_LABEL[3]}</p>
                                <h1 className="mt-1 font-display text-2xl leading-snug text-neutral-900">
                                    어떤 음식을 모을까요?
                                </h1>
                                <p className="mt-2 text-sm text-neutral-400">최소 5개 · 가게명·음식·주소·사진</p>

                                <div className="mt-5 rounded-2xl border border-neutral-100 bg-white p-4 shadow-soft">
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            aria-label="사진 등록"
                                            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-watermelon-50 text-watermelon-500"
                                        >
                                            {targetPreview ? (
                                                <img
                                                    src={targetPreview}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <CameraIcon size={20} />
                                            )}
                                        </button>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={onPickFile}
                                        />
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <input
                                                value={storeName}
                                                onChange={(e) => setStoreName(e.target.value)}
                                                placeholder="가게명 (예: 라멘야 낙성대점)"
                                                className="w-full rounded-xl bg-neutral-50 px-3 py-2.5 text-sm outline-none"
                                            />
                                            <input
                                                value={foodName}
                                                onChange={(e) => setFoodName(e.target.value)}
                                                placeholder="음식 이름 (예: 돈코츠 라멘)"
                                                className="w-full rounded-xl bg-neutral-50 px-3 py-2.5 text-sm outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3 border-t border-neutral-100 pt-3">
                                        <span className="mb-1.5 block text-xs font-bold text-neutral-800">
                                            주소 / 위치
                                        </span>
                                        <PlacePicker value={targetPlace} onChange={setTargetPlace} />
                                        <div className="mt-2 flex gap-2">
                                            <input
                                                value={addressInput}
                                                onChange={(e) => setAddressInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        resolveAddress()
                                                    }
                                                }}
                                                placeholder="또는 주소 입력"
                                                className="min-w-0 flex-1 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={resolveAddress}
                                                disabled={!addressInput.trim() || resolving}
                                                className="shrink-0 rounded-xl bg-neutral-900 px-3 text-sm font-bold text-white disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
                                            >
                                                {resolving ? '확인 중' : '주소 확인'}
                                            </button>
                                        </div>
                                        {addressError && (
                                            <p className="mt-1.5 text-xs font-medium text-red-500">{addressError}</p>
                                        )}
                                        {placeReady && targetPlace && (
                                            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-lime-text">
                                                <MapPinIcon size={13} /> {targetPlace.name} 위치 확인됨
                                            </p>
                                        )}
                                    </div>

                                    <input
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                        placeholder="설명(팁이나, 설명하고 싶은걸 적으세요!)"
                                        className="mt-3 w-full rounded-xl bg-neutral-50 px-3 py-2.5 text-sm outline-none"
                                    />

                                    <button
                                        type="button"
                                        onClick={addTarget}
                                        disabled={!foodName.trim() || !placeReady}
                                        className="mt-3 h-11 w-full rounded-xl bg-watermelon-500 text-sm font-bold text-white disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
                                    >
                                        이 음식 추가
                                    </button>
                                </div>

                                <div className="mt-3 flex items-center justify-between px-1">
                                    <span className="text-xs font-bold text-neutral-800">
                                        담은 음식 {targets.length}개
                                    </span>
                                    {!enough && (
                                        <span className="text-xs text-neutral-400">
                                            {MIN_TARGETS - targets.length}개 더 필요
                                        </span>
                                    )}
                                </div>

                                <div className="mt-2 space-y-2">
                                    <AnimatePresence initial={false}>
                                        {targets.map((t, i) => (
                                            <motion.div
                                                key={t.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-soft"
                                            >
                                                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-watermelon-50">
                                                    {t.imageUrl ? (
                                                        <img
                                                            src={t.imageUrl}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <UtensilsIcon size={18} strokeWidth={1.5} aria-hidden className="text-neutral-400" />
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1 text-sm font-bold text-neutral-900">
                                                    <small className="mr-1 text-neutral-400">{i + 1}.</small>
                                                    {t.name}
                                                    <small className="mt-0.5 block truncate text-xs font-normal text-neutral-400">
                                                        {t.storeName ? `${t.storeName} · ` : ''}
                                                        {t.placeName}
                                                    </small>
                                                </span>
                                                <button
                                                    onClick={() => setTargets((c) => c.filter((x) => x.id !== t.id))}
                                                    aria-label={`${t.name} 삭제`}
                                                    className="text-neutral-400"
                                                >
                                                    <Trash2Icon size={17} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {step === BADGE && (
                            <div>
                                <p className="text-sm font-bold text-watermelon-500">{STEP_LABEL[4]}</p>
                                <h1 className="mt-1 font-display text-2xl leading-snug text-neutral-900">완주 보상 뱃지</h1>
                                <p className="mt-2 text-sm text-neutral-400">프리셋을 고르거나 직접 만들어요.</p>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {PRESETS.map((preset) => {
                                        const selected = !customBadge && selectedCode === preset.code
                                        const image = resolveBadgeImage(preset.code, undefined)
                                        return (
                                            <button
                                                key={preset.code}
                                                onClick={() => {
                                                    setSelectedCode(preset.code)
                                                    setPresetName(preset.name)
                                                    onUsePreset()
                                                }}
                                                className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${selected ? 'border-watermelon-500 bg-watermelon-50' : 'border-neutral-100 bg-white'}`}
                                            >
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-watermelon-50">
                                                    {image ? (
                                                        <img
                                                            src={image}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <MedalIcon size={22} strokeWidth={1.5} aria-hidden className="text-watermelon-500" />
                                                    )}
                                                </span>
                                                <span className="text-sm font-bold text-neutral-900">{preset.name}</span>
                                            </button>
                                        )
                                    })}
                                    <button
                                        onClick={onCustomBadge}
                                        className={`flex items-center gap-3 rounded-2xl border-2 border-dashed p-3 text-left ${customBadge ? 'border-watermelon-500 bg-watermelon-50' : 'border-watermelon-300 bg-white text-watermelon-600'}`}
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-watermelon-100 text-xl">
                                            {customBadge?.customImage ? (
                                                <img
                                                    src={customBadge.customImage}
                                                    alt="커스텀"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <PencilIcon size={20} strokeWidth={1.5} aria-hidden />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <strong className="block truncate text-sm">
                                                {customBadge ? customBadge.name : '커스텀하기'}
                                            </strong>
                                            <small className="text-xs">직접 그리거나 이미지로</small>
                                        </span>
                                    </button>
                                </div>

                                {!customBadge && (
                                    <label className="mt-3 block">
                                        <span className="mb-1.5 block text-sm font-bold text-neutral-900">
                                            보상 뱃지 이름
                                        </span>
                                        <input
                                            value={presetName}
                                            onChange={(e) => setPresetName(e.target.value)}
                                            maxLength={18}
                                            placeholder={selectedPreset.name}
                                            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-watermelon-400"
                                        />
                                    </label>
                                )}
                                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3">
                                    <Badge variant="reward" imageSrc={rewardImage} label={`보상 뱃지 ${rewardName}`}>
                                        <TrophyIcon size={24} strokeWidth={1.5} aria-hidden className="text-watermelon-500" />
                                    </Badge>
                                    <span>
                                        <p className="text-xs text-neutral-400">완주 보상 미리보기</p>
                                        <strong className="text-sm text-neutral-900">{rewardName}</strong>
                                    </span>
                                </div>
                            </div>
                        )}

                        {step === DONE && (
                            <div className="flex flex-col items-center justify-center pt-16 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                    className="flex h-24 w-24 items-center justify-center rounded-full bg-watermelon-500 text-white"
                                >
                                    <CheckIcon size={48} />
                                </motion.div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="mt-6 font-display text-2xl text-neutral-900"
                                >
                                    챌린지 개설 완료!
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-2 text-sm text-neutral-400"
                                >
                                    {title} · 목표 {targets.length}개
                                </motion.p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            <div className="px-5 pb-8 pt-4">
                {step === DONE ? (
                    <button
                        onClick={onBack}
                        className="h-cta w-full rounded-full bg-watermelon-500 font-display text-lg text-white shadow-card"
                    >
                        확인
                    </button>
                ) : step === BADGE ? (
                    <button
                        onClick={create}
                        disabled={submitting || !canCreate}
                        className="h-cta w-full rounded-full bg-watermelon-500 font-display text-lg text-white shadow-card disabled:bg-action-disabled-bg disabled:text-action-disabled-text disabled:shadow-none"
                    >
                        {submitting ? '개설 중…' : '개설하기'}
                    </button>
                ) : (
                    <button
                        onClick={() => stepValid && go(step + 1)}
                        disabled={!stepValid}
                        className="h-cta w-full rounded-full bg-watermelon-500 font-display text-lg text-white shadow-card disabled:bg-action-disabled-bg disabled:text-action-disabled-text disabled:shadow-none"
                    >
                        {step === FOODS && !enough ? `음식 ${targets.length}/${MIN_TARGETS}` : '다음'}
                    </button>
                )}
            </div>
        </div>
    )
}
