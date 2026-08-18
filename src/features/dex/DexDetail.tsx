import { DexEntry } from '@/shared/data/dex'
import { getLocalDexIllustrationUrl } from '@/shared/lib/dexIllustrations'
import { BottomNav, NavTab, StarRank } from '@/shared/ui'
import { AnimatePresence, motion } from 'framer-motion'
import {
    ArrowLeftIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    MapPinIcon,
    PlusIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { CategoryFilter } from './useDexFilter'

interface Props {
    entry: DexEntry
    /** 현재 상세 이동 범위의 기준이 되는 기본 도감 슬롯 */
    entries: DexEntry[]
    collectedEntries: DexEntry[]
    activeCategory: CategoryFilter
    onBack: () => void
    onRegister: () => void
    onOpenEntry: (id: number) => void
    onTab: (tab: NavTab) => void
}

/** 위/아래로 스와이프해 다음·이전"해금된" 도감으로 건너뛸 때 보여줄 안내 */
interface SkipTeaser {
    kind: 'skipped' | 'complete'
    direction: 'next' | 'prev'
    skipped?: number
}

export function DexDetail({
    entry,
    entries,
    collectedEntries,
    activeCategory,
    onBack,
    onRegister,
    onOpenEntry,
    onTab,
}: Props) {
    const cards = entry.cards ?? []
    const [cardIndex, setCardIndex] = useState(0)
    const [photoIndex, setPhotoIndex] = useState(0)
    const [teaser, setTeaser] = useState<SkipTeaser | null>(null)
    const [touchStartY, setTouchStartY] = useState<number | null>(null)
    const [photoTouchStartX, setPhotoTouchStartX] = useState<number | null>(null)
    const [cardTouchStartX, setCardTouchStartX] = useState<number | null>(null)
    // 그림이 아예 없으면 이모지를 넣는다 — 아래 렌더가 "URL이면 <Image>, 아니면 글자"로 갈린다
    const fallbackImage = entry.illustrationUrl ?? getLocalDexIllustrationUrl(entry) ?? entry.emoji
    const currentCard = cards[cardIndex] ?? {
        photos: [fallbackImage],
        date: entry.firstDate ?? '',
        memo: '',
        location: '',
    }
    const photos = currentCard.photos.length ? currentCard.photos : [fallbackImage]
    /**
     * 인덱스를 렌더 시점에 가둔다.
     *
     * 다른 도감으로 넘어가면 entry는 즉시 새 값인데 photoIndex를 0으로 되돌리는 effect는
     * 렌더 뒤에 돈다. 사진 5장 카드에서 4번을 보다 1장짜리 카드로 넘어가면 photos[4]가
     * undefined가 되어 아래 startsWith에서 렌더 중 TypeError가 났다.
     */
    const safePhotoIndex = Math.min(photoIndex, photos.length - 1)
    const currentPhoto = photos[safePhotoIndex]

    // 해금된 도감끼리만 이동하되, 기본 도감에서 들어온 카테고리 안으로 범위를 제한한다.
    const scopedEntries =
        activeCategory === '전체' ? entries : entries.filter((item) => item.category === activeCategory)
    const scopedCollectedEntries =
        activeCategory === '전체'
            ? collectedEntries
            : collectedEntries.filter((item) => item.category === activeCategory)
    const orderedIds = scopedEntries.map((item) => item.id)
    const total = orderedIds.length
    const positionOf = (id: number) => orderedIds.indexOf(id)
    const currentIndex = scopedCollectedEntries.findIndex((item) => item.id === entry.id)
    const hasMoveTarget = scopedCollectedEntries.length > 1 && currentIndex >= 0
    const nextEntry = hasMoveTarget
        ? scopedCollectedEntries[(currentIndex + 1) % scopedCollectedEntries.length]
        : undefined
    const prevEntry = hasMoveTarget
        ? scopedCollectedEntries[(currentIndex - 1 + scopedCollectedEntries.length) % scopedCollectedEntries.length]
        : undefined
    const skippedBetween = (fromId: number, toId: number) => {
        const from = positionOf(fromId)
        const to = positionOf(toId)
        if (from === -1 || to === -1 || total === 0) return 0
        return (to - from - 1 + total) % total
    }

    useEffect(() => {
        setCardIndex(0)
        setPhotoIndex(0)
        setTeaser(null)
    }, [entry.id])
    const selectCard = (index: number) => {
        setCardIndex(index)
        setPhotoIndex(0)
    }
    // 범위를 벗어난 값에서 넘기면 엉뚱한 장으로 튄다. 화면에 보이는 인덱스를 기준으로 센다
    const movePhoto = (direction: -1 | 1) => setPhotoIndex((safePhotoIndex + direction + photos.length) % photos.length)
    // 카드 정보 영역 스와이프는 처음/마지막에서 순환 이동한다.
    const cycleCard = (direction: -1 | 1) => {
        if (cards.length < 2) return
        selectCard((cardIndex + direction + cards.length) % cards.length)
    }
    const jumpTo = (target: DexEntry | undefined, direction: 'next' | 'prev') => {
        if (!target || target.id === entry.id) return
        const isWrapped = direction === 'next' ? currentIndex === scopedCollectedEntries.length - 1 : currentIndex === 0
        const skipped = skippedBetween(
            direction === 'next' ? entry.id : target.id,
            direction === 'next' ? target.id : entry.id,
        )
        if (isWrapped) {
            setTeaser({ kind: 'complete', direction })
            window.setTimeout(() => {
                setTeaser(null)
                onOpenEntry(target.id)
            }, 700)
            return
        }
        if (skipped <= 0) {
            onOpenEntry(target.id)
            return
        }
        setTeaser({ kind: 'skipped', direction, skipped })
        window.setTimeout(() => {
            setTeaser(null)
            onOpenEntry(target.id)
        }, 550)
    }
    const moveNext = () => jumpTo(nextEntry, 'next')
    const movePrev = () => jumpTo(prevEntry, 'prev')
    const formatCardDate = (date: string) => date.slice(5).replace('-', '.')

    return (
        <div
            className="relative flex h-full flex-col bg-surface-app"
            onTouchStart={(event) => setTouchStartY(event.touches[0].clientY)}
            onTouchEnd={(event) => {
                if (touchStartY !== null) {
                    const delta = touchStartY - event.changedTouches[0].clientY
                    if (delta > 70) moveNext()
                    else if (delta < -70) movePrev()
                }
                setTouchStartY(null)
            }}
        >
            <header className="grid grid-cols-[96px_minmax(0,1fr)_96px] items-center gap-2 px-5 py-3">
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="뒤로가기"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 active:scale-[0.98]"
                >
                    <ArrowLeftIcon size={22} aria-hidden />
                </button>
                <h1 className="min-w-0 truncate text-center font-display text-xl text-neutral-900">{entry.name}</h1>
                <button
                    type="button"
                    onClick={onRegister}
                    className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-full bg-watermelon-500 px-3 text-sm font-bold text-white shadow-soft transition-colors hover:bg-watermelon-600 active:scale-[0.98]"
                >
                    <PlusIcon size={15} strokeWidth={2.75} aria-hidden />
                    <span className="whitespace-nowrap">등록하기</span>
                </button>
            </header>
            <button
                onClick={movePrev}
                className="flex min-h-touch w-full items-center justify-center gap-1 pt-1 text-xs text-neutral-800"
            >
                <ChevronDownIcon size={16} aria-hidden />
                아래로 스와이프하면 이전 도감으로
            </button>
            {cards.length > 1 && (
                <div className="border-y border-neutral-100 bg-white px-5 py-2.5">
                    <div className="mx-auto max-w-3xl">
                        <p className="mb-2 text-xs font-medium text-neutral-800">등록 카드</p>
                        <div className="flex gap-2" aria-label="등록 카드 선택">
                            {cards.map((card, index) => (
                                <button
                                    key={`${card.date}-${index}`}
                                    onClick={() => selectCard(index)}
                                    className={`min-h-touch flex-1 rounded-full border px-2 text-center transition ${cardIndex === index ? 'border-watermelon-500 bg-watermelon-500 text-white' : 'border-neutral-200 bg-white text-neutral-800'}`}
                                >
                                    <span className="text-xs font-bold">
                                        {index + 1} · {formatCardDate(card.date)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <main className="no-scrollbar flex-1 overflow-y-auto">
                <div className="">
                    <div className="hidden">
                        <button
                            type="button"
                            disabled={!prevEntry}
                            onClick={movePrev}
                            className="flex min-h-[76px] w-36 items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 text-left shadow-soft transition-colors hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeftIcon size={18} aria-hidden className="shrink-0 text-neutral-400" />
                            <span className="min-w-0">
                                <span className="block text-xs font-bold text-neutral-400">이전</span>
                                <span className="block truncate text-sm font-bold text-neutral-900">
                                    {prevEntry?.name ?? '이전 도감'}
                                </span>
                                <span className="block truncate text-xs text-neutral-400">
                                    {prevEntry?.firstDate ?? '수집일 없음'}
                                </span>
                            </span>
                        </button>
                    </div>
                    <div>
                        <div
                            className="relative aspect-[4/3] w-full bg-watermelon-50"
                            onTouchStart={(event) => setPhotoTouchStartX(event.touches[0].clientX)}
                            onTouchEnd={(event) => {
                                if (photoTouchStartX === null) return
                                const distance = photoTouchStartX - event.changedTouches[0].clientX
                                // 사진 영역 스와이프는 현재 카드의 사진만 넘긴다(카드로 넘어가지 않음).
                                if (Math.abs(distance) > 45 && photos.length > 1) {
                                    movePhoto(distance > 0 ? 1 : -1)
                                }
                                setPhotoTouchStartX(null)
                            }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${cardIndex}-${safePhotoIndex}`}
                                    initial={{ opacity: 0, x: 18 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -18 }}
                                    className="flex h-full items-center justify-center text-8xl"
                                >
                                    {currentPhoto.startsWith('http') || currentPhoto.startsWith('/') ? (
                                        <Image
                                            src={currentPhoto}
                                            alt=""
                                            fill
                                            sizes="(min-width: 768px) 768px, 100vw"
                                            className="h-full w-full object-contain p-6"
                                        />
                                    ) : (
                                        currentPhoto
                                    )}
                                </motion.div>
                            </AnimatePresence>
                            <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
                                {safePhotoIndex + 1}/{photos.length}
                            </span>

                            <div className="absolute inset-x-0 bottom-0 flex justify-center">
                                {photos.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setPhotoIndex(index)}
                                        aria-label={`${index + 1}번째 사진`}
                                        className="no-touch-expand flex h-11 w-11 items-end justify-center pb-3"
                                    >
                                        <span
                                            aria-hidden
                                            className={`h-2 w-2 rounded-full ${index === photoIndex ? 'bg-watermelon-500' : 'bg-white/70'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="mt-3 hidden text-center text-xs font-medium text-neutral-400">
                            {activeCategory === '전체' ? '전체' : activeCategory} ·{' '}
                            {currentIndex >= 0 ? currentIndex + 1 : 0}/{scopedCollectedEntries.length}
                        </p>
                        {photos.length > 1 && (
                            <div className="mt-2 hidden justify-end gap-2 px-5">
                                <button
                                    type="button"
                                    onClick={() => movePhoto(-1)}
                                    className="flex h-8 items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-800 shadow-soft transition-colors hover:bg-white active:scale-[0.98]"
                                >
                                    <ChevronLeftIcon size={14} aria-hidden />
                                    이전 사진
                                </button>
                                <button
                                    type="button"
                                    onClick={() => movePhoto(1)}
                                    className="flex h-8 items-center gap-1 rounded-full bg-watermelon-500 px-3 text-xs font-bold text-white shadow-soft transition-colors hover:bg-watermelon-600 active:scale-[0.98]"
                                >
                                    다음 사진
                                    <ChevronRightIcon size={14} aria-hidden />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="hidden">
                        <button
                            type="button"
                            disabled={!nextEntry}
                            onClick={moveNext}
                            className="flex min-h-[76px] w-36 items-center gap-2 rounded-2xl bg-watermelon-500 px-3 text-left text-white shadow-soft transition-colors hover:bg-watermelon-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <span className="min-w-0 flex-1">
                                <span className="block text-xs font-bold text-watermelon-100">다음</span>
                                <span className="block truncate text-sm font-bold">
                                    {nextEntry?.name ?? '다음 도감'}
                                </span>
                                <span className="block truncate text-xs text-watermelon-100">
                                    {nextEntry?.firstDate ?? '수집일 없음'}
                                </span>
                            </span>
                            <ChevronRightIcon size={18} aria-hidden className="shrink-0 text-watermelon-100" />
                        </button>
                    </div>
                </div>
                <div className="">
                    <div
                        className=""
                        onTouchStart={
                            cards.length > 1 ? (event) => setCardTouchStartX(event.touches[0].clientX) : undefined
                        }
                        onTouchEnd={
                            cards.length > 1
                                ? (event) => {
                                      if (cardTouchStartX === null) return
                                      const distance = cardTouchStartX - event.changedTouches[0].clientX
                                      // 왼쪽으로 쓸어넘김: 다음 카드, 오른쪽: 이전 카드
                                      if (Math.abs(distance) > 45) cycleCard(distance > 0 ? 1 : -1)
                                      setCardTouchStartX(null)
                                  }
                                : undefined
                        }
                    >
                        <div className="px-5 py-3">
                            <span className="text-xs text-neutral-800">
                                카드 {cardIndex + 1}의 사진 {photos.length}장
                                {cards.length > 1 && (
                                    <>
                                        <span className=""> · 좌우로 스와이프해 카드 넘기기</span>
                                        <span className="hidden"> · 위 카드 버튼으로 기록 선택</span>
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="mx-5 rounded-2xl bg-white p-4 shadow-soft">
                            <p className="flex items-center gap-1.5 text-sm text-neutral-800">
                                <MapPinIcon size={15} className="text-watermelon-500" />
                                {currentCard.location || '위치 없음'} · {currentCard.date} 수집
                            </p>
                            {currentCard.memo && (
                                <p className="mt-2 text-sm text-neutral-900">메모: {currentCard.memo}</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="">
                    <AnimatePresence>
                        {teaser && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-3"
                            >
                                <div className="flex">
                                    {Array.from({
                                        length: teaser.kind === 'skipped' ? Math.min(teaser.skipped ?? 0, 3) : 3,
                                    }).map((_, value) => (
                                        <span
                                            key={value}
                                            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-neutral-100 text-neutral-400 first:ml-0"
                                        >
                                            ?
                                        </span>
                                    ))}
                                    {teaser.kind === 'skipped' && (teaser.skipped ?? 0) > 3 && (
                                        <span className="-ml-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-neutral-100 text-xs font-bold text-neutral-400">
                                            +{(teaser.skipped ?? 0) - 3}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-neutral-900">
                                        {teaser.kind === 'complete'
                                            ? '카테고리를 모두 확인했습니다'
                                            : `미해금 도감 ${teaser.skipped}칸을 건너뛰었어요`}
                                    </p>
                                    <p className="text-xs text-neutral-800">
                                        {teaser.kind === 'complete'
                                            ? teaser.direction === 'next'
                                                ? activeCategory === '전체'
                                                    ? '전체 도감의 처음 수집 카드로 돌아가요'
                                                    : `${activeCategory} 도감의 처음 수집 카드로 돌아가요`
                                                : activeCategory === '전체'
                                                  ? '전체 도감의 마지막 수집 카드로 돌아가요'
                                                  : `${activeCategory} 도감의 마지막 수집 카드로 돌아가요`
                                            : teaser.direction === 'next'
                                              ? '다음 수집 카드로 이동해요'
                                              : '이전 수집 카드로 이동해요'}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="">
                    <div className="mt-4 border-t border-neutral-200 px-5 py-4">
                        <div className="flex items-center justify-between">
                            <span className="font-display text-lg text-neutral-900">{entry.name}</span>
                            <StarRank value={entry.stars ?? 1} size={16} />
                        </div>
                        <p className="mt-1 text-xs text-neutral-800">첫 수집일 {entry.firstDate}</p>
                    </div>
                </div>
                <button
                    onClick={moveNext}
                    className="flex min-h-touch w-full items-center justify-center gap-1 pb-6 text-xs text-neutral-800"
                >
                    <ChevronUpIcon size={16} aria-hidden />
                    위로 스와이프하면 다음 도감으로
                </button>
            </main>
            <BottomNav active="기본" onTab={onTab} />
        </div>
    )
}
