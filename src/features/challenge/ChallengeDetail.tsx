import React, { useState } from 'react'
import { ArrowLeftIcon, MapPinIcon, PlusIcon, XIcon } from 'lucide-react'
import { ProgressBar } from '@/shared/ui/atoms/ProgressBar'
import { Badge } from '@/shared/ui/atoms/Badge'
import { FoodCard } from '@/shared/ui/molecules/FoodCard'
import { TabBar } from '@/shared/ui/molecules/TabBar'
import { ChallengeData, ChallengeTarget } from './types'
import { ReviewSection } from './ReviewSection'
import { CertifyWizard } from './CertifyWizard'
import { fetchChallengeReviews, fetchFoodReviews, writeChallengeReview, writeFoodReview } from './api'

type DetailTab = '기록 도감' | '리뷰'
interface Props {
    challenge: ChallengeData
    onBack: () => void
    onRegister: () => void
    onJoin?: () => void
    // 사진+위치로 해금 실행 후 완료 여부 반환 (해금 위저드가 호출)
    onUnlock?: (
        slotId: string,
        file: File,
        coords: { lat: number; lng: number } | null,
    ) => Promise<{ completed: boolean }>
    // 이 해금으로 챌린지를 완주했을 때 (완주 보상 팝업 트리거)
    onUnlockCompleted?: () => void
    onLeave?: () => void
}
export function ChallengeDetail({
    challenge,
    onBack,
    onRegister,
    onJoin,
    onUnlock,
    onUnlockCompleted,
    onLeave,
}: Props) {
    const [activeTab, setActiveTab] = useState<DetailTab>('기록 도감')
    const joined = Boolean(challenge.joined)
    const ended = Boolean(challenge.ended)
    const targets = challenge.targetRestaurants ?? []
    const completed = new Set(challenge.completedTargetIds ?? [])
    const badge = challenge.rewardBadge
    const [record, setRecord] = useState<ChallengeTarget | null>(null) // 해금 기록 모달
    const [locked, setLocked] = useState<ChallengeTarget | null>(null) // 미해금 미리보기 모달

    // 해금 위저드 (사진 → 위치 → 리뷰)
    const [certify, setCertify] = useState<ChallengeTarget | null>(null)
    const openCertify = (target: ChallengeTarget) => setCertify(target)

    return (
        <div className="flex h-full flex-col bg-cream-100">
            <header className="flex items-center gap-3 px-5 py-4">
                <button onClick={onBack} aria-label="뒤로가기">
                    <ArrowLeftIcon size={22} />
                </button>
                <span className="font-display text-lg text-brown">챌린지 상세</span>
                {joined && onLeave && (
                    <button
                        onClick={onLeave}
                        className="ml-auto rounded-full border border-cream-300 px-3 py-1 text-xs font-medium text-brown-muted"
                    >
                        나가기
                    </button>
                )}
            </header>
            <main className="no-scrollbar flex-1 overflow-y-auto px-5">
                <section className="rounded-3xl bg-white p-4 shadow-soft">
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                            {challenge.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                            <Badge variant="type">{challenge.tag}</Badge>
                            <h1 className="mt-1 truncate font-display text-xl text-brown">{challenge.title}</h1>
                            <p className="mt-1 text-xs text-brown-soft">
                                {challenge.participants}명 참가 · {challenge.dday}
                            </p>
                        </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700">
                        <MapPinIcon size={16} />
                        <span>지정 목표 음식 {targets.length}개</span>
                    </div>
                    {joined && (
                        <div className="mt-3">
                            <div className="mb-1 flex justify-between text-xs text-brown-soft">
                                <span>내 진행</span>
                                <span>{challenge.mine ?? `나 0/${targets.length}`}</span>
                            </div>
                            <ProgressBar value={challenge.progress ?? 0} animate={false} label="챌린지 진행률" />
                        </div>
                    )}
                </section>
                {badge && (
                    <section className={`mt-4 flex items-center gap-3 rounded-2xl p-4 ${badge.tone}`}>
                        <Badge variant="reward" imageSrc={badge.customImage} label={`${badge.name} 보상 뱃지`}>
                            {badge.emoji}
                        </Badge>
                        <span>
                            <p className="text-xs font-medium opacity-75">완주 보상 뱃지</p>
                            <p className="font-display text-lg">{badge.name}</p>
                        </span>
                    </section>
                )}
                <TabBar
                    label="챌린지 상세 보기 전환"
                    variant="segmented"
                    items={(['기록 도감', '리뷰'] as DetailTab[]).map((tab) => ({
                        id: tab,
                        label: tab,
                    }))}
                    value={activeTab}
                    onChange={setActiveTab}
                    className="mt-4"
                />
                {activeTab === '기록 도감' && (
                    <section className="mt-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-bold text-brown">목표 도감</h2>
                            <span className="text-xs text-brown-muted">
                                내 진행 {completed.size}/{targets.length}
                            </span>
                        </div>
                        {targets.length ? (
                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                                {targets.map((target) => {
                                    const unlocked = completed.has(target.id)
                                    // 해금됨 → 내 기록 보기 / 미해금 → 미리보기(흑백+리뷰 일부). 미리보기 안에서 인증 진입
                                    const clickable = true
                                    const onCardClick = unlocked ? () => setRecord(target) : () => setLocked(target)
                                    return (
                                        // FoodCard가 <button>(잠금 시 disabled)이라 클릭을 먹음 →
                                        // 카드는 pointer-events-none로 통과시키고, 바깥 div가 클릭을 받는다
                                        <div
                                            key={target.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={onCardClick}
                                            aria-label={
                                                unlocked ? `${target.name} 기록 보기` : `${target.name} 미리보기`
                                            }
                                            className="cursor-pointer"
                                        >
                                            <div className="pointer-events-none">
                                                <FoodCard
                                                    name={target.name}
                                                    emoji={target.emoji ?? '🍽️'}
                                                    illustrationUrl={target.imageUrl || '/images/default_food.png'}
                                                    state={unlocked ? 'unlocked' : 'locked'}
                                                    accessibleName={
                                                        unlocked ? `${target.name}, 인증 완료` : '미해금 목표 음식'
                                                    }
                                                    footer={
                                                        <p className="text-center text-xs text-content-secondary">
                                                            {unlocked
                                                                ? '인증 완료'
                                                                : joined && !ended
                                                                  ? '인증하기'
                                                                  : '미해금'}
                                                        </p>
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-white p-6 text-center text-sm text-brown-muted">
                                등록된 목표 음식이 없어요.
                            </div>
                        )}
                    </section>
                )}
                {activeTab === '리뷰' && (
                    <section className="mt-4">
                        <h2 className="mb-3 font-bold text-brown">챌린지 리뷰</h2>
                        <ReviewSection
                            reloadKey={`challenge-${challenge.id}`}
                            load={() => fetchChallengeReviews(challenge.id)}
                            write={(payload) => writeChallengeReview(challenge.id, payload)}
                            canWrite={Boolean(challenge.completed)}
                            lockedReason="챌린지를 완료하면 리뷰를 쓸 수 있어요"
                            preview={!challenge.completed}
                            previewMessage="완주하면 리뷰를 모두 볼 수 있어요"
                        />
                    </section>
                )}
            </main>
            <div className="border-t border-cream-300 bg-cream-50 px-5 py-4">
                {ended ? (
                    <p className="flex h-cta w-full items-center justify-center rounded-full bg-cream-200 font-display text-base text-brown-muted">
                        종료된 챌린지예요
                    </p>
                ) : joined ? (
                    <p className="flex h-cta w-full items-center justify-center gap-2 rounded-full bg-orange-50 font-display text-base text-orange-700">
                        <PlusIcon size={18} aria-hidden />
                        목표 음식을 눌러 인증하세요
                    </p>
                ) : (
                    <button
                        onClick={onJoin}
                        className="h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card"
                    >
                        참여하기
                    </button>
                )}
            </div>
            {record && (
                <div
                    className="absolute inset-0 z-20 flex items-end justify-center bg-black/40 p-4"
                    onClick={() => setRecord(null)}
                >
                    <div
                        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-pop"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-display text-lg text-brown">{record.name}</h3>
                            <button onClick={() => setRecord(null)} aria-label="닫기">
                                <XIcon size={20} className="text-brown-muted" />
                            </button>
                        </div>
                        {record.myImageUrl ? (
                            <img
                                src={record.myImageUrl}
                                alt={`${record.name} 인증 사진`}
                                className="mb-3 aspect-square w-full rounded-2xl object-cover"
                            />
                        ) : (
                            <div className="mb-3 flex aspect-square w-full items-center justify-center rounded-2xl bg-cream-100 text-sm text-brown-muted">
                                인증 사진이 없어요
                            </div>
                        )}
                        {record.placeName && (
                            <p className="flex items-center gap-1 text-sm text-brown-soft">
                                <MapPinIcon size={15} /> {record.placeName}
                            </p>
                        )}
                        {record.unlockedAt && (
                            <p className="mt-1 text-xs text-brown-muted">
                                {new Date(record.unlockedAt).toLocaleString('ko-KR')} 인증
                            </p>
                        )}
                        <div className="mt-4 border-t border-cream-200 pt-4">
                            <h4 className="mb-2 font-bold text-brown">리뷰</h4>
                            <ReviewSection
                                reloadKey={`food-${record.id}`}
                                load={() => fetchFoodReviews(challenge.id, record.id)}
                                write={(payload) => writeFoodReview(challenge.id, record.id, payload)}
                                canWrite
                                lockedReason=""
                            />
                        </div>
                    </div>
                </div>
            )}
            {locked && (
                <div
                    className="absolute inset-0 z-20 flex items-end justify-center bg-black/40 p-4"
                    onClick={() => setLocked(null)}
                >
                    <div
                        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-pop"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-display text-lg text-brown">{locked.name}</h3>
                            <button onClick={() => setLocked(null)} aria-label="닫기">
                                <XIcon size={20} className="text-brown-muted" />
                            </button>
                        </div>
                        <div className="relative mb-3">
                            <img
                                src={locked.imageUrl || '/images/default_food.png'}
                                alt={`${locked.name} 미리보기`}
                                className="aspect-square w-full rounded-2xl object-cover grayscale"
                            />
                            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/20">
                                <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white">
                                    미해금
                                </span>
                            </div>
                        </div>
                        {locked.placeName && (
                            <p className="flex items-center gap-1 text-sm text-brown-soft">
                                <MapPinIcon size={15} /> {locked.placeName}
                            </p>
                        )}
                        {locked.description && <p className="mt-1 text-sm text-brown-soft">{locked.description}</p>}
                        {joined && !ended ? (
                            <button
                                type="button"
                                onClick={() => {
                                    const t = locked
                                    setLocked(null)
                                    openCertify(t)
                                }}
                                className="mt-3 h-cta w-full rounded-full bg-orange-500 font-display text-base text-white shadow-card"
                            >
                                인증하기
                            </button>
                        ) : (
                            <p className="mt-3 rounded-full bg-cream-200 py-3 text-center text-sm font-medium text-brown-muted">
                                {ended ? '종료된 챌린지예요' : '참여하면 인증할 수 있어요'}
                            </p>
                        )}
                        <div className="mt-4 border-t border-cream-200 pt-4">
                            <h4 className="mb-2 font-bold text-brown">리뷰</h4>
                            <ReviewSection
                                reloadKey={`food-locked-${locked.id}`}
                                load={() => fetchFoodReviews(challenge.id, locked.id)}
                                write={(payload) => writeFoodReview(challenge.id, locked.id, payload)}
                                canWrite={false}
                                lockedReason="인증하면 리뷰를 남길 수 있어요"
                                preview
                                previewMessage="인증하면 리뷰를 모두 볼 수 있어요"
                            />
                        </div>
                    </div>
                </div>
            )}
            {certify && onUnlock && (
                <CertifyWizard
                    name={certify.name}
                    placeName={certify.placeName}
                    onUnlock={(file, coords) => onUnlock(certify.id, file, coords)}
                    onSubmitReview={(payload) => writeFoodReview(challenge.id, certify.id, payload).then(() => {})}
                    onClose={(completedNow) => {
                        setCertify(null)
                        if (completedNow) onUnlockCompleted?.()
                    }}
                />
            )}
        </div>
    )
}
