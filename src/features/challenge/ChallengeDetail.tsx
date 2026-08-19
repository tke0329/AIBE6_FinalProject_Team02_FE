import React, { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeftIcon, AwardIcon, MapPinIcon, PlusIcon, SearchIcon, TrophyIcon } from 'lucide-react'
import { GuideTour } from '@/features/onboarding/GuideTour'
import { useGuide } from '@/features/onboarding/useGuide'
import { Badge, BottomSheet, Button, FoodCard, HelpIcon, ProgressBar, TabBar, Text } from '@/shared/ui'
import { isOverlayEntry, OVERLAY_PARAM } from '@/shared/lib/backNav'
import { ChallengeData, ChallengeTarget } from './types'
import { ReviewSection } from './ReviewSection'
import { CertifyWizard } from './CertifyWizard'
import { fetchChallengeReviews, fetchFoodReviews, writeChallengeReview, writeFoodReview } from './api'

type DetailTab = '해금 목록' | '리뷰'

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
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const joined = Boolean(challenge.joined)
    const ended = Boolean(challenge.ended)
    const targets = challenge.targetRestaurants ?? []
    const completed = new Set(challenge.completedTargetIds ?? [])
    const badge = challenge.rewardBadge
    // 목표 격자가 그려진 뒤에 켠다 — 이 화면에서 가장 핵심인 앵커라 없으면 투어가 앙상하다
    const guide = useGuide('challengit-detail', targets.length > 0)
    /**
     * 어떤 음식의 시트를 열었는지. **파라미터는 하나다.**
     *
     * 예전에는 `?food=`(내 기록)와 `?locked=`(미리보기)로 나뉘어 있었는데, 그러면 **URL이
     * 어떤 시트인지까지 정하게 된다.** 인증에 성공한 순간 `?locked=`가 그대로 남아 해금된
     * 음식을 미해금으로 그리는 어긋남이 생긴다. 무엇을 보여 줄지는 아래에서 **데이터가** 정한다.
     * `locked`는 예전 링크를 위해 읽기만 한다
     */
    const foodParam = searchParams.get('food') ?? searchParams.get('locked')
    const focusReviewId = Number(searchParams.get('reviewId'))
    const validFocusReviewId = Number.isSafeInteger(focusReviewId) && focusReviewId > 0 ? focusReviewId : null
    // 탭 전환은 히스토리를 늘리지 않는다 — 뒤로가기가 탭 되돌리기로 소모되면 화면을 못 벗어난다
    const activeTab: DetailTab = searchParams.get('tab') === 'review' ? '리뷰' : '해금 목록'

    /**
     * 음식 상세 모달과 **탭**을 URL 쿼리에 둔다.
     *
     * 리뷰의 프로필 → 남의 프로필로 갔다가 돌아올 때 보던 자리로 복원하려면 이 상태가
     * URL에 있어야 한다. 탭도 같은 이유로 옮겼다 — `useState`였을 때는 돌아오면
     * 컴포넌트가 다시 붙어 **항상 `해금 목록`으로 초기화**됐다.
     */
    const setModalUrl = (params: { food?: string; tab?: DetailTab }, mode: 'push' | 'replace') => {
        const sp = new URLSearchParams(Array.from(searchParams.entries()))
        sp.delete('food')
        sp.delete('locked')
        // 표식은 push로 새 항목을 넣을 때만 붙는다. replace로 남기면 내 것이 아닌 항목에 표식이 생긴다
        sp.delete(OVERLAY_PARAM)
        if (params.food) sp.set('food', params.food)
        if (params.tab) sp.set('tab', params.tab === '리뷰' ? 'review' : 'unlocks')
        if (mode === 'push') sp.set(OVERLAY_PARAM, '1')
        const qs = sp.toString()
        const href = qs ? `${pathname}?${qs}` : pathname
        if (mode === 'push') router.push(href, { scroll: false })
        else router.replace(href, { scroll: false })
    }

    /**
     * 시트는 **열 때 push, 닫을 때 back**이다.
     *
     * push로 열어야 뒤로가기(제스처·안드로이드 하드웨어 키)로 시트가 닫힌다. 그런데
     * 닫을 때 `replace`를 하면 **항목이 그대로 남는다** — 음식을 3개 열어보면 같은
     * 페이지를 가리키는 항목이 3개 쌓여, 상세를 벗어나려면 뒤로가기를 4번 눌러야 했다.
     * `back()`으로 내가 넣은 항목을 되돌리면 열고 닫기가 히스토리에 흔적을 남기지 않는다.
     *
     * "내가 넣은 항목인가"는 **URL의 `ov=1`이 답한다.** 표식이 항목에 붙어 다니므로
     * 뒤로·앞으로 어떻게 오가도 판단이 어긋나지 않는다 (backNav.ts 주석 참고).
     * `?food=X` 링크로 바로 열린 경우엔 표식이 없어 `replace`로 떨어지고,
     * 앞 항목이 남의 것인데 `back()`으로 앱을 벗어나는 일이 생기지 않는다
     */
    const openFood = (t: ChallengeTarget) => setModalUrl({ food: t.id, tab: activeTab }, 'push')
    const closeModal = () => {
        if (isOverlayEntry(searchParams)) router.back()
        else setModalUrl({ tab: activeTab }, 'replace')
    }
    const setActiveTab = (tab: DetailTab) => setModalUrl({ tab }, 'replace')

    // 해금 위저드 (사진 → 위치 → 리뷰)
    const [certify, setCertify] = useState<ChallengeTarget | null>(null)
    const [badgeOpen, setBadgeOpen] = useState(false)
    /**
     * 인증을 시작한다. **URL은 건드리지 않는다.**
     *
     * 시트를 닫아 버리면 위저드를 X로 닫았을 때 격자로 떨어져, 다시 인증하려면 음식을
     * 처음부터 찾아 눌러야 했다. 그래서 `?food=`를 그대로 두고 시트만 잠시 접는다
     * (아래 렌더의 `!certify`) — 위저드가 닫히면 **그 음식 시트가 그대로 다시 올라온다.**
     *
     * 접는 이유는 두 겹이 겹쳐 있으면 **포커스 가두기가 서로 당기기** 때문이다.
     * 히스토리에는 아무 것도 넣거나 빼지 않으므로 뒤로가기 셈도 그대로다
     */
    const startCertify = (target: ChallengeTarget) => setCertify(target)

    /**
     * 위저드가 떠 있는데 주소에서 그 음식이 사라졌다면(= 뒤로가기) 위저드도 함께 닫는다.
     *
     * 위저드는 히스토리 항목을 만들지 않으므로, 안 맞춰 두면 뒤로가기가 밑에 깔린 시트
     * 항목을 소모하는데 **화면은 위저드 그대로**여서 아무 일도 안 일어난 것처럼 보인다
     */
    useEffect(() => {
        if (certify && foodParam !== certify.id) setCertify(null)
    }, [certify, foodParam])

    /**
     * 해금 여부는 **서버가 준 것만 믿는다.**
     *
     * 예전에는 "방금 해금함"을 화면 상태로 따로 들고 다녔다. 재조회가 늦어도 기록
     * 모달을 바로 열려는 것이었는데, 진실이 두 곳이 되면서 어긋날 자리가 생겼다.
     * 지금은 부모가 **재조회를 마친 뒤에** 해금 성공을 알리므로(`onUnlock`) 이 하나로 충분하다.
     *
     * 어긋나더라도 안전한 쪽으로 실패한다 — 아직 미해금으로 보이면 미리보기(리뷰 못 씀)가
     * 열릴 뿐, 쓸 수 없는 리뷰 칸이 열리지는 않는다
     */
    const isUnlocked = (id: string) => completed.has(id)

    const foodTarget = foodParam ? (targets.find((t) => t.id === foodParam) ?? null) : null
    /**
     * 어떤 시트를 열지는 **URL이 아니라 데이터가 정한다.**
     *
     * 예전에는 `?food=X`면 무조건 "내 기록" 시트였다. 그래서 해금 위저드를 사진만
     * 올린 채 X로 닫으면(또는 위치 인증이 실패한 뒤 닫으면) 해금하지도 않은 음식의
     * 기록 시트가 열리고 **리뷰 쓰기 칸이 보였다.** BE는 `REVIEW_REQUIRES_UNLOCK`으로
     * 거절하니 데이터가 깨지진 않지만, 쓸 수 있는 것처럼 보이면 안 된다.
     *
     * 데이터가 정하게 두면 **인증에 성공한 순간 같은 URL이 저절로 기록 시트가 된다** —
     * 위저드가 닫힐 때 주소를 바꿔 줄 필요가 없다.
     *
     * 위저드가 떠 있는 동안(`certify`)에는 둘 다 접는다 (`startCertify` 주석 참고)
     */
    const sheetTarget = certify ? null : foodTarget
    const record = sheetTarget && isUnlocked(sheetTarget.id) ? sheetTarget : null // 해금 기록 시트
    const locked = sheetTarget && !isUnlocked(sheetTarget.id) ? sheetTarget : null // 미해금 미리보기

    return (
        <div className="flex h-full flex-col bg-surface-app">
            <header className="flex items-center gap-3 px-5 py-4">
                <button onClick={onBack} aria-label="뒤로가기">
                    <ArrowLeftIcon size={22} />
                </button>
                <span className="font-display text-lg text-neutral-900">챌린짓 상세</span>
                <HelpIcon label="챌린짓 상세" onClick={guide.replay} />
                {joined && onLeave && (
                    <button
                        onClick={onLeave}
                        className="ml-auto rounded-full border border-watermelon-200 bg-watermelon-50 px-3 py-1 text-xs font-bold text-watermelon-600"
                    >
                        포기하기
                    </button>
                )}
            </header>
            <main className="no-scrollbar flex-1 overflow-y-auto px-5">
                {/* 대표 이미지가 없으면 기본 챌린지 이미지로 대체 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={challenge.coverUrl || '/images/default_challenge.png'}
                    alt=""
                    className="mt-4 aspect-[16/9] w-full rounded-3xl object-cover shadow-soft"
                />
                <section className="mt-4 rounded-3xl bg-white p-4 shadow-soft">
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-watermelon-50 text-watermelon-500">
                            <TrophyIcon size={26} strokeWidth={1.75} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                            <Badge variant="type">{challenge.tag}</Badge>
                            {/* 자르지 않는다 — 챌린짓 이름은 이 화면이 무엇인지를 말하는 유일한 글자다 */}
                            <h1 className="mt-1 font-display text-xl text-neutral-900">{challenge.title}</h1>
                            <p className="mt-1 text-xs text-neutral-800">
                                {challenge.participants}명 참가 · {challenge.dday}
                            </p>
                        </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-watermelon-50 px-3 py-2 text-sm font-bold text-watermelon-700">
                        <MapPinIcon size={16} />
                        <span>지정 목표 음식 {targets.length}개</span>
                    </div>
                    {joined && (
                        <div data-tour="challengit-detail-progress" className="mt-3">
                            <div className="mb-1 flex justify-between text-xs text-neutral-800">
                                <span>내 진행</span>
                                <span>{challenge.mine ?? `나 0/${targets.length}`}</span>
                            </div>
                            {/* animate·tone을 명시하지 않는다 — 기본이 초록 + 차오르는 움직임이다 */}
                            <ProgressBar value={challenge.progress ?? 0} label="챌린짓 진행률" />
                        </div>
                    )}
                </section>
                {badge && (
                    // 눌러서 크게 볼 수 있다 — 뱃지가 이 크기로는 무엇이 그려졌는지 안 보인다
                    <button
                        type="button"
                        data-tour="challengit-detail-badge"
                        onClick={() => setBadgeOpen(true)}
                        aria-label={`${badge.name} 보상 뱃지 크게 보기`}
                        className="no-touch-expand mt-4 flex w-full items-center gap-3 rounded-2xl border border-mint-border bg-mint-soft p-4 text-left text-mint-ink active:scale-[0.99]"
                    >
                        <Badge variant="reward" imageSrc={badge.customImage} label={`${badge.name} 보상 뱃지`}>
                            <AwardIcon size={24} strokeWidth={1.5} aria-hidden className="text-watermelon-500" />
                        </Badge>
                        <span className="min-w-0 flex-1">
                            <span className="block text-xs font-medium opacity-75">완주 보상 뱃지</span>
                            <span className="line-clamp-2 font-display text-lg">{badge.name}</span>
                        </span>
                        <SearchIcon size={17} aria-hidden className="shrink-0 opacity-60" />
                    </button>
                )}
                <div data-tour="challengit-detail-tabs">
                    <TabBar
                        label="챌린짓 상세 보기 전환"
                        variant="segmented"
                        items={(['해금 목록', '리뷰'] as DetailTab[]).map((tab) => ({
                            id: tab,
                            label: tab,
                        }))}
                        value={activeTab}
                        onChange={setActiveTab}
                        className="mt-4"
                    />
                </div>
                {activeTab === '해금 목록' && (
                    <section className="mt-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-bold text-neutral-900">목표 도감</h2>
                            <span className="text-xs text-neutral-400">
                                내 진행 {completed.size}/{targets.length}
                            </span>
                        </div>
                        {targets.length ? (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3">
                                {targets.map((target, index) => {
                                    const unlocked = isUnlocked(target.id)
                                    // 여는 주소는 하나다. 해금됨 → 내 기록 / 미해금 → 미리보기는 데이터가 가른다
                                    return (
                                        // FoodCard가 미해금이어도 눌리게 바뀌어(FoodCard 주석),
                                        // 클릭을 받으려고 덮어 두던 div 두 겹이 필요 없어졌다
                                        <FoodCard
                                            key={target.id}
                                            // 첫 칸만 짚는다 — 격자가 다 같은 모양이라 하나면 충분
                                            dataTour={index === 0 ? 'challengit-detail-target' : undefined}
                                            name={target.name}
                                            store={target.storeName ?? target.placeName ?? undefined}
                                            illustrationUrl={
                                                target.myImageUrl || target.imageUrl || '/images/default_food.png'
                                            }
                                            state={unlocked ? 'unlocked' : 'locked'}
                                            accessibleName={
                                                unlocked
                                                    ? `${target.name}, 인증 완료`
                                                    : `${target.name}, 미인증 목표 음식`
                                            }
                                            onClick={() => openFood(target)}
                                            footer={<span aria-hidden />}
                                        />
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400">
                                등록된 목표 음식이 없어요.
                            </div>
                        )}
                    </section>
                )}
                {activeTab === '리뷰' && (
                    <section className="mt-4">
                        <h2 className="mb-3 font-bold text-neutral-900">챌린짓 리뷰</h2>
                        <ReviewSection
                            reloadKey={`challenge-${challenge.id}`}
                            load={() => fetchChallengeReviews(challenge.id)}
                            write={(payload) => writeChallengeReview(challenge.id, payload)}
                            canWrite={Boolean(challenge.completed)}
                            lockedReason="챌린짓을 완료하면 리뷰를 쓸 수 있어요"
                            preview={!challenge.completed}
                            previewMessage="챌린짓을 달성하면 볼 수 있어요"
                            focusReviewId={validFocusReviewId}
                        />
                    </section>
                )}
            </main>
            <div data-tour="challengit-detail-cta" className="border-t border-neutral-200 bg-white px-5 py-4">
                {ended ? (
                    <p className="flex h-cta w-full items-center justify-center rounded-full bg-neutral-100 font-display text-base text-neutral-400">
                        종료된 챌린짓예요
                    </p>
                ) : joined ? (
                    <p className="flex h-cta w-full items-center justify-center gap-2 rounded-full bg-watermelon-50 font-display text-base text-watermelon-700">
                        <PlusIcon size={18} aria-hidden />
                        목표 음식을 눌러 인증하세요
                    </p>
                ) : (
                    <Button size="cta" fullWidth onClick={onJoin}>
                        참여하기
                    </Button>
                )}
            </div>

            <GuideTour guide={guide} />

            {/*
                손으로 만든 모달 두 개를 공통 BottomSheet로 바꿨다.
                포커스 가두기·Escape·손잡이 끌어 닫기가 이 앱의 모든 시트와 같아진다 —
                예전에는 딤 누르기와 X 버튼뿐이라 키보드로는 닫을 방법이 없었다.
                닫는 방법은 시트마다 다르지 않다는 전역 계약(BottomSheet 주석 §3.2.1)을 따른다
            */}
            {record && (
                <BottomSheet title={record.name} onClose={closeModal} maxHeightClass="max-h-[88%]">
                    <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8 pt-3">
                        {record.myImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={record.myImageUrl}
                                alt={`${record.name} 인증 사진`}
                                className="mb-3 aspect-square w-full rounded-2xl object-cover"
                            />
                        ) : (
                            <div className="mb-3 flex aspect-square w-full items-center justify-center rounded-2xl bg-neutral-50 text-sm text-neutral-400">
                                인증 사진이 없어요
                            </div>
                        )}
                        {record.placeName && (
                            <p className="flex items-center gap-1 text-sm text-neutral-800">
                                <MapPinIcon size={15} className="shrink-0" /> {record.placeName}
                            </p>
                        )}
                        {record.unlockedAt && (
                            <p className="mt-1 text-xs text-neutral-400">
                                {new Date(record.unlockedAt).toLocaleString('ko-KR')} 인증
                            </p>
                        )}
                        <div className="mt-4 border-t border-neutral-100 pt-4">
                            <h4 className="mb-2 font-bold text-neutral-900">리뷰</h4>
                            {/* 이 시트는 해금된 음식일 때만 뜬다(위 `record` 참고) → 쓰기 허용 */}
                            <ReviewSection
                                reloadKey={`food-${record.id}`}
                                load={() => fetchFoodReviews(challenge.id, record.id)}
                                write={(payload) => writeFoodReview(challenge.id, record.id, payload)}
                                canWrite
                                lockedReason=""
                                focusReviewId={validFocusReviewId}
                            />
                        </div>
                    </div>
                </BottomSheet>
            )}
            {locked && (
                <BottomSheet title={locked.name} onClose={closeModal} maxHeightClass="max-h-[88%]">
                    <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8 pt-3">
                        <div className="relative mb-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
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
                            <p className="flex items-center gap-1 text-sm text-neutral-800">
                                <MapPinIcon size={15} className="shrink-0" /> {locked.placeName}
                            </p>
                        )}
                        {locked.description && <p className="mt-1 text-sm text-neutral-800">{locked.description}</p>}
                        {joined && !ended ? (
                            <Button size="cta" fullWidth onClick={() => startCertify(locked)} className="mt-3">
                                인증하기
                            </Button>
                        ) : (
                            <p className="mt-3 rounded-full bg-neutral-100 py-3 text-center text-sm font-medium text-neutral-400">
                                {ended ? '종료된 챌린짓예요' : '참여하면 인증할 수 있어요'}
                            </p>
                        )}
                        <div className="mt-4 border-t border-neutral-100 pt-4">
                            <h4 className="mb-2 font-bold text-neutral-900">리뷰</h4>
                            <ReviewSection
                                reloadKey={`food-locked-${locked.id}`}
                                load={() => fetchFoodReviews(challenge.id, locked.id)}
                                write={(payload) => writeFoodReview(challenge.id, locked.id, payload)}
                                canWrite={false}
                                lockedReason="인증하면 리뷰를 남길 수 있어요"
                                previewMessage="해금해야 볼 수 있어요"
                                preview
                                focusReviewId={validFocusReviewId}
                            />
                        </div>
                    </div>
                </BottomSheet>
            )}
            {certify && onUnlock && (
                <CertifyWizard
                    name={certify.name}
                    placeName={certify.placeName}
                    onUnlock={(file, coords) => onUnlock(certify.id, file, coords)}
                    onSubmitReview={(payload) => writeFoodReview(challenge.id, certify.id, payload).then(() => {})}
                    /*
                     * 주소를 손대지 않는다. `?food=`가 그대로라 위저드를 접으면 **그 음식 시트가
                     * 다시 올라온다.**
                     *   - 해금 전에 닫음(사진만 올리고 X · 위치 인증 실패 후 X)
                     *     → 미리보기 시트. `인증하기`가 그대로 있어 바로 다시 시도할 수 있다
                     *   - 해금 성공 → 서버 재조회가 끝난 뒤라 같은 주소가 기록 시트가 된다.
                     *     남긴 리뷰가 어디에 붙었는지 바로 보인다
                     */
                    onClose={({ unlocked, completed: completedNow }) => {
                        setCertify(null)
                        if (unlocked && completedNow) onUnlockCompleted?.()
                    }}
                />
            )}

            {badgeOpen && badge && (
                <BottomSheet title="완주 보상 뱃지" onClose={() => setBadgeOpen(false)}>
                    <div className="flex flex-col items-center gap-4 px-5 pb-8 pt-2">
                        <span className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-watermelon-50 shadow-card">
                            {badge.customImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={badge.customImage}
                                    alt={`${badge.name} 보상 뱃지`}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <AwardIcon size={72} strokeWidth={1.5} aria-hidden className="text-watermelon-500" />
                            )}
                        </span>
                        <Text variant="sectionTitle" as="p">
                            {badge.name}
                        </Text>
                        <Text variant="secondary" tone="muted" as="p" className="text-center">
                            목표 음식을 모두 해금하면 이 뱃지를 받아요
                        </Text>
                    </div>
                </BottomSheet>
            )}
        </div>
    )
}
