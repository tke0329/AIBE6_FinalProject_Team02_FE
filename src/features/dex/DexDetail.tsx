import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
} from "lucide-react";
import { DexEntry } from "@/shared/data/dex";
import { BottomNav, NavTab } from "@/shared/ui/molecules/BottomNav";
import { StarRank } from "@/shared/ui/atoms/StarRank";

interface Props {
  entry: DexEntry;
  /** 전체 200칸 (스와이프 시 사이에 낀 미해금 칸 수를 계산하는 데 씀) */
  entries: DexEntry[];
  collectedEntries: DexEntry[];
  onBack: () => void;
  onOpenEntry: (id: number) => void;
  onTab: (tab: NavTab) => void;
}

/** 위/아래로 스와이프해 다음·이전 "해금된" 도감으로 건너뛸 때 보여줄 안내 */
interface SkipTeaser {
  direction: "next" | "prev";
  skipped: number;
}

export function DexDetail({
  entry,
  entries,
  collectedEntries,
  onBack,
  onOpenEntry,
  onTab,
}: Props) {
  const cards = entry.cards ?? [];
  const [cardIndex, setCardIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [teaser, setTeaser] = useState<SkipTeaser | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [photoTouchStartX, setPhotoTouchStartX] = useState<number | null>(null);
  const [cardTouchStartX, setCardTouchStartX] = useState<number | null>(null);
  const fallbackImage = entry.illustrationUrl ?? entry.emoji;
  const currentCard = cards[cardIndex] ?? {
    photos: [fallbackImage],
    date: entry.firstDate ?? "",
    memo: "",
    location: "",
  };
  const photos = currentCard.photos.length
    ? currentCard.photos
    : [fallbackImage];

  // 해금된 도감끼리만 순환 이동한다. 사이에 낀 미해금 칸 수는 전체 200칸 순서
  // 기준으로 계산해 "몇 칸 건너뛰었는지"를 정확히 안내한다.
  const orderedIds = entries.map((item) => item.id);
  const total = orderedIds.length;
  const positionOf = (id: number) => orderedIds.indexOf(id);
  const currentIndex = collectedEntries.findIndex(
    (item) => item.id === entry.id,
  );
  const nextEntry =
    collectedEntries[(currentIndex + 1) % collectedEntries.length];
  const prevEntry =
    collectedEntries[
      (currentIndex - 1 + collectedEntries.length) % collectedEntries.length
    ];
  const skippedBetween = (fromId: number, toId: number) => {
    const from = positionOf(fromId);
    const to = positionOf(toId);
    if (from === -1 || to === -1 || total === 0) return 0;
    return (to - from - 1 + total) % total;
  };

  useEffect(() => {
    setCardIndex(0);
    setPhotoIndex(0);
    setTeaser(null);
  }, [entry.id]);
  const selectCard = (index: number) => {
    setCardIndex(index);
    setPhotoIndex(0);
  };
  const movePhoto = (direction: -1 | 1) =>
    setPhotoIndex(
      (index) => (index + direction + photos.length) % photos.length,
    );
  // 카드 정보 영역 스와이프는 처음/마지막에서 순환 이동한다.
  const cycleCard = (direction: -1 | 1) => {
    if (cards.length < 2) return;
    selectCard((cardIndex + direction + cards.length) % cards.length);
  };
  const jumpTo = (
    target: DexEntry | undefined,
    direction: "next" | "prev",
  ) => {
    if (!target || target.id === entry.id) return;
    const skipped = skippedBetween(
      direction === "next" ? entry.id : target.id,
      direction === "next" ? target.id : entry.id,
    );
    if (skipped <= 0) {
      onOpenEntry(target.id);
      return;
    }
    setTeaser({ direction, skipped });
    window.setTimeout(() => {
      setTeaser(null);
      onOpenEntry(target.id);
    }, 550);
  };
  const moveNext = () => jumpTo(nextEntry, "next");
  const movePrev = () => jumpTo(prevEntry, "prev");
  const formatCardDate = (date: string) => date.slice(5).replace("-", ".");

  return (
    <div
      className="relative flex h-full flex-col bg-cream-100"
      onTouchStart={(event) => setTouchStartY(event.touches[0].clientY)}
      onTouchEnd={(event) => {
        if (touchStartY !== null) {
          const delta = touchStartY - event.changedTouches[0].clientY;
          if (delta > 70) moveNext();
          else if (delta < -70) movePrev();
        }
        setTouchStartY(null);
      }}
    >
      <header className="flex items-center gap-3 px-5 py-3">
        <button onClick={onBack} aria-label="뒤로가기">
          <ArrowLeftIcon size={22} />
        </button>
        <h1 className="flex-1 truncate text-center font-display text-xl text-brown">
          {entry.name}
        </h1>
        <span className="rounded-full bg-cream-200 px-2.5 py-1 text-xs font-medium text-brown-soft">
          일반 · {entry.category}
        </span>
      </header>
      <button
        onClick={movePrev}
        className="flex min-h-touch w-full items-center justify-center gap-1 pt-1 text-xs text-brown-soft"
      >
        <ChevronDownIcon size={16} aria-hidden />
        아래로 스와이프하면 이전 도감으로
      </button>
      {cards.length > 1 && (
        <div className="border-y border-cream-200 bg-cream-50 px-5 py-2.5">
          <p className="mb-2 text-xs font-medium text-brown-soft">등록 카드</p>
          <div className="flex gap-2" aria-label="등록 카드 선택">
            {cards.map((card, index) => (
              <button
                key={`${card.date}-${index}`}
                onClick={() => selectCard(index)}
                className={`min-h-touch flex-1 rounded-full border px-2 text-center transition ${cardIndex === index ? "border-orange-500 bg-orange-500 text-white" : "border-cream-300 bg-white text-brown-soft"}`}
              >
                <span className="text-xs font-bold">
                  {index + 1} · {formatCardDate(card.date)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <main className="no-scrollbar flex-1 overflow-y-auto">
        <div
          className="relative aspect-[4/3] w-full bg-orange-50"
          onTouchStart={(event) =>
            setPhotoTouchStartX(event.touches[0].clientX)
          }
          onTouchEnd={(event) => {
            if (photoTouchStartX === null) return;
            const distance = photoTouchStartX - event.changedTouches[0].clientX;
            // 사진 영역 스와이프는 현재 카드의 사진만 넘긴다(카드로 넘어가지 않음).
            if (Math.abs(distance) > 45 && photos.length > 1) {
              movePhoto(distance > 0 ? 1 : -1);
            }
            setPhotoTouchStartX(null);
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${cardIndex}-${photoIndex}`}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              className="flex h-full items-center justify-center text-8xl"
            >
              {photos[photoIndex].startsWith("http") ? (
                <img
                  src={photos[photoIndex]}
                  alt=""
                  className="h-full w-full object-contain p-6"
                />
              ) : (
                photos[photoIndex]
              )}
            </motion.div>
          </AnimatePresence>
          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
            {photoIndex + 1}/{photos.length}
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
                  className={`h-2 w-2 rounded-full ${index === photoIndex ? "bg-orange-500" : "bg-white/70"}`}
                />
              </button>
            ))}
          </div>
        </div>
        <div
          onTouchStart={
            cards.length > 1
              ? (event) => setCardTouchStartX(event.touches[0].clientX)
              : undefined
          }
          onTouchEnd={
            cards.length > 1
              ? (event) => {
                  if (cardTouchStartX === null) return;
                  const distance =
                    cardTouchStartX - event.changedTouches[0].clientX;
                  // 왼쪽으로 쓸어넘김: 다음 카드, 오른쪽: 이전 카드
                  if (Math.abs(distance) > 45) cycleCard(distance > 0 ? 1 : -1);
                  setCardTouchStartX(null);
                }
              : undefined
          }
        >
          <div className="px-5 py-3">
            <span className="text-xs text-brown-soft">
              카드 {cardIndex + 1}의 사진 {photos.length}장
              {cards.length > 1 && " · 좌우로 스와이프해 카드 넘기기"}
            </span>
          </div>
          <div className="mx-5 rounded-2xl bg-white p-4 shadow-soft">
            <p className="flex items-center gap-1.5 text-sm text-brown-soft">
              <MapPinIcon size={15} className="text-orange-500" />
              {currentCard.location || "위치 없음"} · {currentCard.date} 수집
            </p>
            {currentCard.memo && (
              <p className="mt-2 text-sm text-brown">메모: {currentCard.memo}</p>
            )}
          </div>
        </div>
        <AnimatePresence>
          {teaser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50 p-3"
            >
              <div className="flex">
                {Array.from({ length: Math.min(teaser.skipped, 3) }).map(
                  (_, value) => (
                    <span
                      key={value}
                      className="-ml-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-cream-50 bg-cream-200 text-brown-muted first:ml-0"
                    >
                      ?
                    </span>
                  ),
                )}
                {teaser.skipped > 3 && (
                  <span className="-ml-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-cream-50 bg-cream-200 text-xs font-bold text-brown-muted">
                    +{teaser.skipped - 3}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-brown">
                  미해금 도감 {teaser.skipped}칸을 건너뛰었어요
                </p>
                <p className="text-xs text-brown-soft">
                  {teaser.direction === "next" ?
                    "다음 수집 카드로 이동해요" :
                    "이전 수집 카드로 이동해요"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mt-4 border-t border-cream-300 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg text-brown">
              {entry.name}
            </span>
            <StarRank value={entry.stars ?? 1} size={16} />
          </div>
          <p className="mt-1 text-xs text-brown-soft">
            첫 수집일 {entry.firstDate}
          </p>
        </div>
        <button
          onClick={moveNext}
          className="flex min-h-touch w-full items-center justify-center gap-1 pb-6 text-xs text-brown-soft"
        >
          <ChevronUpIcon size={16} aria-hidden />
          위로 스와이프하면 다음 도감으로
        </button>
      </main>
      <BottomNav active="기본" onTab={onTab} />
    </div>
  );
}
