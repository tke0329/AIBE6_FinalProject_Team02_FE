import React, { useRef, useState } from 'react'
import { ArrowLeftIcon, CameraIcon, CrownIcon, MapPinIcon, PlusIcon, XIcon } from 'lucide-react'
import { ProgressBar } from '@/shared/ui/atoms/ProgressBar'
import { Badge } from '@/shared/ui/atoms/Badge'
import { FoodCard } from '@/shared/ui/molecules/FoodCard'
import { TabBar } from '@/shared/ui/molecules/TabBar'
import { ChallengeData, ChallengeTarget } from './types'

type DetailTab = '기록 도감' | '랭킹'
interface Props {
    challenge: ChallengeData
    onBack: () => void
    onRegister: () => void
    onJoin?: () => void
    onUnlock?: (slotId: string, file: File, coords: { lat: number; lng: number } | null) => void | Promise<void>
    onLeave?: () => void
}
const RANKINGS = [
    { rank: 1, name: '윤하연수', initial: '윤', count: 14, tone: 'bg-amber-200 text-amber-800' },
    { rank: 2, name: '민지수', initial: '민', count: 12, tone: 'bg-slate-200 text-slate-700' },
    {
        rank: 3,
        name: '주말식도락',
        initial: '주',
        count: 11,
        tone: 'bg-orange-200 text-orange-800',
    },
    {
        rank: 4,
        name: '신재락현',
        initial: '신',
        count: 6,
        tone: 'bg-orange-200 text-orange-800',
        me: true,
    },
    { rank: 5, name: '라면러버', initial: '라', count: 5, tone: 'bg-cream-200 text-brown-soft' },
    { rank: 6, name: '한입만', initial: '한', count: 4, tone: 'bg-cream-200 text-brown-soft' },
]

export function ChallengeDetail({ challenge, onBack, onRegister, onJoin, onUnlock, onLeave }: Props) {
    const [activeTab, setActiveTab] = useState<DetailTab>('기록 도감')
    const joined = Boolean(challenge.joined)
    const ended = Boolean(challenge.ended)
    const targets = challenge.targetRestaurants ?? []
    const completed = new Set(challenge.completedTargetIds ?? [])
    const badge = challenge.rewardBadge
    const [record, setRecord] = useState<ChallengeTarget | null>(null) // 해금 기록 모달
    const isLocation = true // 챌린지는 위치 인증 전용

    // 인증(등록) 모달 상태
    const [certify, setCertify] = useState<ChallengeTarget | null>(null)
    const [certFile, setCertFile] = useState<File | null>(null)
    const [certPreview, setCertPreview] = useState('')
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [locating, setLocating] = useState(false)
    const [certError, setCertError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const certFileRef = useRef<HTMLInputElement>(null)

    const openCertify = (target: ChallengeTarget) => {
        setCertify(target)
        setCertFile(null)
        setCertPreview('')
        setCoords(null)
        setCertError('')
    }
    const onCertFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        setCertFile(file)
        setCertPreview(URL.createObjectURL(file))
    }
    const captureLocation = () => {
        if (!navigator.geolocation) {
            setCertError('이 브라우저에서는 위치를 쓸 수 없어요')
            return
        }
        setLocating(true)
        setCertError('')
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setLocating(false)
            },
            () => {
                setCertError('위치 권한을 허용해 주세요')
                setLocating(false)
            },
            { enableHighAccuracy: true, timeout: 10_000 },
        )
    }
    const canSubmit = Boolean(certFile) && (!isLocation || coords != null) && !submitting
    const submitCertify = async () => {
        if (!certify || !certFile || !onUnlock) return
        setSubmitting(true)
        setCertError('')
        try {
            await onUnlock(certify.id, certFile, coords)
            setCertify(null)
        } catch (e) {
            setCertError(e instanceof Error ? e.message : '인증에 실패했어요. 다시 시도해 주세요.')
        } finally {
            setSubmitting(false)
        }
    }
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
                    items={(['기록 도감', '랭킹'] as DetailTab[]).map((tab) => ({
                        id: tab,
                        label: tab,
                    }))}
                    value={activeTab}
                    onChange={setActiveTab}
                    className="mt-4"
                />
                {activeTab === '기록 도감' ? (
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
                                    // 해금됨 → 내 기록 보기, 미해금 & 참여중 → 인증(사진), 그 외 → 정적
                                    const clickable = unlocked || (joined && !ended)
                                    const onCardClick = unlocked
                                        ? () => setRecord(target)
                                        : joined && !ended
                                          ? () => openCertify(target)
                                          : undefined
                                    return (
                                        // FoodCard가 <button>(잠금 시 disabled)이라 클릭을 먹음 →
                                        // 카드는 pointer-events-none로 통과시키고, 바깥 div가 클릭을 받는다
                                        <div
                                            key={target.id}
                                            role={clickable ? 'button' : undefined}
                                            tabIndex={clickable ? 0 : undefined}
                                            onClick={clickable ? onCardClick : undefined}
                                            aria-label={
                                                clickable
                                                    ? unlocked
                                                        ? `${target.name} 기록 보기`
                                                        : `${target.name} 인증하기`
                                                    : undefined
                                            }
                                            className={clickable ? 'cursor-pointer' : undefined}
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
                ) : (
                    <section className="mt-4">
                        <LeaderboardPodium />
                        <div className="mt-4 space-y-2">
                            {RANKINGS.slice(3).map((user) => (
                                <article
                                    key={user.rank}
                                    className={`flex items-center gap-3 rounded-2xl p-3 ${user.me ? 'bg-orange-100 ring-1 ring-orange-400' : 'bg-white shadow-soft'}`}
                                >
                                    <span className="w-5 text-center font-display text-sm text-brown-muted">
                                        {user.rank}
                                    </span>
                                    <span
                                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${user.tone}`}
                                    >
                                        {user.initial}
                                    </span>
                                    <span className="flex-1 text-sm font-bold text-brown">
                                        {user.name}
                                        {user.me && <small className="ml-1 text-xs text-orange-600">나</small>}
                                    </span>
                                    <span className="text-sm font-bold text-orange-600">{user.count}개</span>
                                </article>
                            ))}
                        </div>
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
                        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-pop"
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
                    </div>
                </div>
            )}
            {certify && (
                <div
                    className="absolute inset-0 z-20 flex items-end justify-center bg-black/40 p-4"
                    onClick={() => (submitting ? null : setCertify(null))}
                >
                    <div
                        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-pop"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-display text-lg text-brown">{certify.name} 인증</h3>
                            <button onClick={() => setCertify(null)} aria-label="닫기" disabled={submitting}>
                                <XIcon size={20} className="text-brown-muted" />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => certFileRef.current?.click()}
                            className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-cream-100 text-sm text-brown-muted"
                        >
                            {certPreview ? (
                                <img src={certPreview} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex flex-col items-center gap-1">
                                    <CameraIcon size={26} />
                                    사진 올리기
                                </span>
                            )}
                        </button>
                        <input
                            ref={certFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onCertFile}
                        />

                        {isLocation && (
                            <div className="mt-3 rounded-2xl bg-cream-50 p-3">
                                <p className="flex items-center gap-1 text-xs font-bold text-brown-soft">
                                    <MapPinIcon size={13} /> {certify.placeName ?? '지정 위치'}
                                </p>
                                {coords ? (
                                    <p className="mt-1 text-xs font-medium text-green-600">현재 위치 확인됨</p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={captureLocation}
                                        disabled={locating}
                                        className="mt-2 w-full rounded-xl bg-brown py-2 text-sm font-bold text-white disabled:opacity-60"
                                    >
                                        {locating ? '위치 확인 중…' : '현재 위치 확인'}
                                    </button>
                                )}
                            </div>
                        )}

                        {certError && <p className="mt-2 text-xs font-medium text-red-500">{certError}</p>}

                        <button
                            type="button"
                            onClick={submitCertify}
                            disabled={!canSubmit}
                            className="mt-4 h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card disabled:bg-action-disabled-bg disabled:text-action-disabled-text disabled:shadow-none"
                        >
                            {submitting ? '인증 중…' : '인증하기'}
                        </button>
                        <p className="mt-2 text-center text-xs text-brown-muted">
                            {isLocation ? '지정 위치에서 사진과 함께 인증돼요' : '사진을 올려 인증해요'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
function LeaderboardPodium() {
    const podium = [RANKINGS[1], RANKINGS[0], RANKINGS[2]]
    return (
        <div className="flex items-end justify-center gap-2">
            {podium.map((user) => (
                <div key={user.rank} className={`flex flex-col items-center ${user.rank === 1 ? 'w-28' : 'w-24'}`}>
                    {user.rank === 1 && <CrownIcon size={20} className="mb-1 text-amber-500" />}
                    <span
                        className={`flex items-center justify-center rounded-full font-bold ${user.rank === 1 ? 'h-16 w-16 bg-amber-200 text-amber-800' : 'h-12 w-12 bg-cream-200 text-brown-soft'}`}
                    >
                        {user.initial}
                    </span>
                    <span className="mt-1 text-xs font-bold text-brown">{user.name}</span>
                    <span className="text-xs text-orange-600">{user.count}개</span>
                    <span
                        className={`mt-1 flex w-full items-center justify-center rounded-t-lg py-1 text-xs font-bold ${user.rank === 1 ? 'bg-amber-400 text-white' : user.rank === 2 ? 'bg-slate-300 text-white' : 'bg-orange-200 text-orange-700'}`}
                    >
                        {user.rank}위
                    </span>
                </div>
            ))}
        </div>
    )
}
