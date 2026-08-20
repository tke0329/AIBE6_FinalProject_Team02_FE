import { PlacePicker } from '@/features/register/PlacePicker'
import { LocationInput } from '@/features/register/confirmApi'
import { geocodeAddress } from '@/features/register/placeApi'
import { useAppState } from '@/shared/store/AppStateProvider'
import { dateOnlyLabel } from '@/shared/lib/dateOnly'
import { WIZARD_STEP_TRANSITION, wizardStepVariants } from '@/shared/lib/wizardMotion'
import { Button, Dialog, TextArea, TextField, WizardHeader } from '@/shared/ui'
import { AnimatePresence, motion } from 'framer-motion'
import {
    CalendarIcon,
    CameraIcon,
    CheckIcon,
    MapPinIcon,
    PencilIcon,
    Trash2Icon,
    TrophyIcon,
    UtensilsIcon,
} from 'lucide-react'
import React, { useRef, useState } from 'react'
import { ChallengeData, ChallengeTarget, RewardBadge } from './types'
import { CoverPhotoStep, CoverPhotoStepHandle } from './CoverPhotoStep'
import { EndDateSheet } from './EndDateSheet'

interface Props {
    createdThisMonth: number
    customBadge: RewardBadge | null
    onBack: () => void
    onCreate: (challenge: ChallengeData) => void | Promise<void>
    onCustomBadge: () => void
}

const MIN_TARGETS = 2
/** 제목·소개글 길이 제한. 예전에는 소개글에만 있어서 제목이 무한히 길어질 수 있었다 */
const TITLE_MAX = 30
const DESC_MAX = 200
// 스텝 인덱스
const TITLE = 0
const COVER = 1
const PERIOD = 2
const FOODS = 3
const BADGE = 4
const DONE = 5
const STEP_LABEL = ['제목', '대표 사진', '기한', '음식', '보상']

export function ChallengeCreate({ createdThisMonth, customBadge, onBack, onCreate, onCustomBadge }: Props) {
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

    /*
     * 머물던 단계를 draft에 적어 둔다.
     *
     * 예전에는 `customBadge ? BADGE : TITLE`로 **추측**했다. 뱃지를 만들어 저장하고
     * 오면 맞았지만, 만들다 **뒤로가기(취소)**로 오면 customBadge가 없어 1단계로
     * 튕겼다 — 적어 놓은 제목·기한·음식이 그대로 있는데 처음 화면이 뜬다.
     *
     * draft에 두는 이유는 라우트를 건너 살아 있어야 하기 때문이다 (README 규칙:
     * 라우트를 건너는 상태는 useAppState로만). 뱃지 화면은 별도 라우트다.
     */
    const [[step, dir], setStepDir] = useState<[number, number]>([challengeDraft.step, 1])
    const go = (next: number) => {
        setStepDir([next, next > step ? 1 : -1])
        // DONE은 개설이 끝난 화면이다. 적어 두면 다음에 들어올 때 완료 화면이 뜬다
        if (next !== DONE) patchDraft({ step: next })
    }

    const canCreate = createdThisMonth < 3

    // 음식 추가 폼(로컬)
    const [storeName, setStoreName] = useState('')
    const [foodName, setFoodName] = useState('')
    const [desc, setDesc] = useState('')
    const [targetFile, setTargetFile] = useState<File | null>(null)
    const [targetPreview, setTargetPreview] = useState('')
    const [coverFile, setCoverFile] = useState<Blob | null>(null) // 대표 사진(정사각 크롭 Blob)
    const [coverPreview, setCoverPreview] = useState('')
    const coverStepRef = useRef<CoverPhotoStepHandle>(null)
    const [targetPlace, setTargetPlace] = useState<LocationInput | null>(null)
    const [addressInput, setAddressInput] = useState('')
    const [addressError, setAddressError] = useState('')
    const [resolving, setResolving] = useState(false)
    const [endDateOpen, setEndDateOpen] = useState(false)
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

    // 보상 뱃지 — 직접 만든 것뿐이다 (프리셋 제거, BADGE 단계 주석 참고)
    const [submitting, setSubmitting] = useState(false)
    /** 뱃지 없이 개설하려 했을 때 뜨는 안내 */
    const [badgeAlert, setBadgeAlert] = useState(false)
    const rewardName = customBadge?.name ?? ''
    const rewardImage = customBadge?.customImage ?? undefined

    const enough = targets.length >= MIN_TARGETS
    const periodOk = periodType === 'PERMANENT' || endsAt.trim().length > 0

    const create = async () => {
        // 보상 뱃지는 필수다. 버튼을 잠그는 대신 눌렀을 때 왜 안 되는지 알려 준다
        if (!customBadge) {
            setBadgeAlert(true)
            return
        }
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
                // 위 가드를 통과했으므로 여기서는 반드시 있다
                rewardBadge: customBadge,
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

    // COVER 단계에서 "다음"을 누르면, 크롭에서 "이 사진 사용"을 깜빡했어도 자동 확정한다
    const handleNext = async () => {
        if (!stepValid) return
        if (step === COVER) await coverStepRef.current?.commit()
        go(step + 1)
    }

    return (
        <div className="flex h-full flex-col bg-white">
            {/* 로그잇 개설과 같은 머리글을 쓴다 — 예전에는 이 블록을 각자 갖고 있어서 갈렸다 */}
            {step !== DONE && <WizardHeader step={step} total={5} onBack={headerBack} label="챌린짓 개설" />}

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
                    >
                        {step === TITLE && (
                            <div>
                                <p className="text-sm font-bold text-watermelon-500">{STEP_LABEL[0]}</p>
                                <h1 className="mt-1 font-display text-2xl leading-snug text-neutral-900">
                                    어떤 챌린짓인가요?
                                </h1>
                                {/*
                                 * 제목도 소개글과 같은 `TextField`로 그린다.
                                 *
                                 * 예전에는 밑줄 하나(`border-b-2`)만 그은 입력이라 **입력칸인지 알기 어려웠고**,
                                 * 위아래 여백도 소개글과 달라 두 칸이 짝으로 보이지 않았다. 아래 소개글은
                                 * 테두리 있는 상자였다 — 같은 화면에서 입력 모양이 두 가지였던 셈이다.
                                 */}
                                <div className="flex flex-col gap-5 pt-6">
                                    <TextField
                                        autoFocus
                                        label="챌린짓 제목"
                                        value={title}
                                        onChange={(e) => patchDraft({ title: e.target.value })}
                                        placeholder="예: 서울 라멘 성지순례"
                                        count={{ current: title.length, max: TITLE_MAX }}
                                        maxLength={TITLE_MAX}
                                    />
                                    <TextArea
                                        label="소개글 (선택)"
                                        value={challengeDraft.description}
                                        onChange={(e) => patchDraft({ description: e.target.value })}
                                        placeholder="어떤 챌린짓인지 짧게 소개해요"
                                        rows={3}
                                        count={{ current: challengeDraft.description.length, max: DESC_MAX }}
                                        maxLength={DESC_MAX}
                                    />
                                </div>
                                {/* 홈과 동일하게 "남은 개설권" 기준으로 표시 */}
                                <p
                                    className={`mt-4 rounded-2xl p-3 text-sm ${
                                        canCreate
                                            ? 'bg-neutral-50 text-neutral-500'
                                            : 'bg-watermelon-50 text-watermelon-700'
                                    }`}
                                >
                                    {canCreate
                                        ? `이번 달 남은 개설권 ${3 - createdThisMonth}/3`
                                        : '이번 달 개설권을 모두 사용했어요 (0/3)'}
                                </p>
                            </div>
                        )}

                        {step === COVER && (
                            <CoverPhotoStep
                                ref={coverStepRef}
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
                                                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${periodType === p ? 'border-watermelon-500 bg-watermelon-500 text-content-on-action' : 'border-neutral-200'}`}
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
                                            <span className="mb-1 block text-xs font-bold text-neutral-800">
                                                종료일
                                            </span>
                                            {/* OS 기본 날짜 입력 대신 로그잇과 같은 공통 Calendar 시트를 띄운다.
                                                지난 날짜는 시트 안에서 잠긴다 */}
                                            <button
                                                type="button"
                                                onClick={() => setEndDateOpen(true)}
                                                className="flex min-h-touch w-full items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-left text-sm text-content-primary"
                                            >
                                                <CalendarIcon
                                                    size={17}
                                                    aria-hidden
                                                    className="shrink-0 text-content-secondary"
                                                />
                                                {endsAt ? (
                                                    dateOnlyLabel(endsAt)
                                                ) : (
                                                    <span className="text-content-muted">종료일을 고르세요</span>
                                                )}
                                            </button>
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
                                <p className="mt-2 text-sm text-neutral-400">최소 2개 · 가게명·음식·주소·사진</p>

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
                                            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rind-text">
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
                                        className="mt-3 h-11 w-full rounded-xl bg-watermelon-500 text-sm font-bold text-content-on-action disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
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
                                                        <UtensilsIcon
                                                            size={18}
                                                            strokeWidth={1.5}
                                                            aria-hidden
                                                            className="text-neutral-400"
                                                        />
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1 text-sm font-bold text-neutral-900">
                                                    <small className="mr-1 text-neutral-400">{i + 1}.</small>
                                                    {t.name}
                                                    {/* 가게·장소는 두 줄까지 편다 — 한 줄로 자르면 어느 지점인지가 사라진다 */}
                                                    <small className="mt-0.5 line-clamp-2 block text-xs font-normal text-neutral-400">
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
                                <h1 className="mt-1 font-display text-2xl leading-snug text-neutral-900">
                                    완주 보상 뱃지
                                </h1>
                                <p className="mt-2 text-sm text-neutral-400">
                                    직접 만든 뱃지 하나가 완주의 증표가 돼요. 꼭 만들어야 개설할 수 있어요.
                                </p>

                                {/*
                                 * **프리셋 세 칸을 없앴다.**
                                 *
                                 * 셋 중 하나를 고르면 어느 챌린짓이든 같은 그림이 걸린다 — 완주
                                 * 보상이 "내가 이걸 해냈다"의 증표인데, 남과 똑같으면 증표 구실을
                                 * 못 한다. 직접 만들면 그 챌린짓에만 있는 뱃지가 되고, 그리기가
                                 * 부담이면 사진 한 장으로도 만들 수 있다.
                                 *
                                 * 서버는 `rewardBadgeId`를 **선택**으로 받지만 화면에서는 **필수**로 막는다.
                                 * 보상 없는 챌린짓은 완주해도 남는 것이 없어서, 만들다 만 상태로
                                 * 개설되면 되돌릴 방법이 없다. 서버보다 화면이 더 엄격한 쪽이라
                                 * 서버 계약을 어기지는 않는다
                                 */}
                                <section className="flex flex-col items-center gap-3 pt-6">
                                    <span className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-watermelon-50 shadow-card">
                                        {rewardImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={rewardImage}
                                                alt={`보상 뱃지 ${rewardName}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <TrophyIcon
                                                size={48}
                                                strokeWidth={1.5}
                                                aria-hidden
                                                className="text-content-muted"
                                            />
                                        )}
                                    </span>
                                    {customBadge ? (
                                        <>
                                            <strong className="text-base text-content-primary">{rewardName}</strong>
                                            <p className="text-xs text-content-muted">완주하면 이 뱃지를 받아요</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-content-muted">아직 만든 뱃지가 없어요</p>
                                    )}
                                </section>

                                <button
                                    type="button"
                                    onClick={onCustomBadge}
                                    className="mt-6 flex min-h-touch w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-watermelon-300 bg-watermelon-50 py-4 text-sm font-bold text-content-link"
                                >
                                    <PencilIcon size={18} strokeWidth={1.75} aria-hidden />
                                    {customBadge ? '뱃지 다시 만들기' : '뱃지 만들기'}
                                </button>
                                <p className="mt-2 text-center text-xs text-content-muted">
                                    직접 그리거나 사진으로 만들 수 있어요
                                </p>

                                {!customBadge && (
                                    <p className="mt-5 rounded-2xl bg-surface-accent px-4 py-3 text-xs leading-5 text-content-secondary">
                                        완주한 사람에게 줄 보상이라 <b>뱃지를 만들어야 개설할 수 있어요.</b>
                                    </p>
                                )}
                            </div>
                        )}

                        {step === DONE && (
                            <div className="flex flex-col items-center justify-center pt-16 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                    className="flex h-24 w-24 items-center justify-center rounded-full bg-watermelon-500 text-content-on-action"
                                >
                                    <CheckIcon size={48} />
                                </motion.div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="mt-6 font-display text-2xl text-neutral-900"
                                >
                                    챌린짓 개설 완료!
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

            {/*
             * 세 CTA를 공통 `Button`으로 옮겼다.
             *
             * 손으로 짠 `bg-watermelon-500 text-content-on-action`는 **2.75:1로 AA(4.5)에 한참 못 미쳤다.**
             * `Button`의 primary는 `--text-on-action`(어두운 글자)을 써서 같은 핑크 면에서
             * 6.32:1이 나온다 — 브랜드색을 바꾸지 않고 대비를 얻은 방식이다 (§1.2.1)
             */}
            <div className="shrink-0 px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
                {step === DONE ? (
                    <Button fullWidth onClick={onBack}>
                        확인
                    </Button>
                ) : step === BADGE ? (
                    <Button fullWidth loading={submitting} disabled={!canCreate} onClick={create}>
                        개설하기
                    </Button>
                ) : (
                    <Button fullWidth disabled={!stepValid} onClick={handleNext}>
                        {step === FOODS && !enough ? `음식 ${targets.length}/${MIN_TARGETS}` : '다음'}
                    </Button>
                )}
            </div>

            {endDateOpen && (
                <EndDateSheet
                    value={endsAt}
                    onPick={(picked) => patchDraft({ endsAt: picked })}
                    onClose={() => setEndDateOpen(false)}
                />
            )}

            {/*
                뱃지 없이 개설하려 할 때. **버튼을 잠그지 않고 눌리게 둔 뒤 여기서 막는다** —
                잠긴 버튼은 왜 안 되는지 말해 주지 않아서, 사용자가 앞 단계를 되짚으며
                무엇이 빠졌는지 찾게 된다. 여기서는 바로 만들러 갈 수도 있다
            */}
            {badgeAlert && (
                <Dialog
                    title="보상 뱃지를 디자인해 주세요!"
                    message={
                        '완주한 사람에게 줄 뱃지가 있어야 챌린짓을 열 수 있어요.\n직접 그리거나 사진으로 만들 수 있어요.'
                    }
                    action={{
                        label: '뱃지 만들기',
                        onClick: () => {
                            setBadgeAlert(false)
                            onCustomBadge()
                        },
                    }}
                    cancelText="닫기"
                    onClose={() => setBadgeAlert(false)}
                />
            )}
        </div>
    )
}
