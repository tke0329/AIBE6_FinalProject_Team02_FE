



import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, MapPinIcon, MessageCircleIcon } from 'lucide-react';
import { DexEntry } from '@/shared/data/dex';
import { BadgeId } from '@/shared/ui/atoms/EquippedBadge';
import { BottomNav, NavTab } from '@/shared/ui/molecules/BottomNav';
import { StarRank } from '@/shared/ui/atoms/StarRank';
import { CommentSheet, CommentItem } from './CommentSheet';

interface Props {entry: DexEntry;collectedEntries: DexEntry[];equippedBadge: BadgeId;onBack: () => void;onOpenEntry: (id: number) => void;onTab: (tab: NavTab) => void;}
const buildInitialComments = (equippedBadge: BadgeId): CommentItem[] => [
{ initial: '윤', name: '윤하연수', time: '2시간 전', body: '여기 우리도 가보자!!', badge: 'gold-spoon' },
{ initial: '신', name: '신재락현', time: '1시간 전', body: '트러플 크림 진짜 인정', badge: equippedBadge },
{ initial: '민', name: '민지수', time: '30분 전', body: '다음 주말 어때?' }];


export function DexDetail({ entry, collectedEntries, equippedBadge, onBack, onOpenEntry, onTab }: Props) {
  const cards = entry.cards ?? [];
  const [cardIndex, setCardIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>(() => buildInitialComments(equippedBadge));
  const [showTeaser, setShowTeaser] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [photoTouchStartX, setPhotoTouchStartX] = useState<number | null>(null);
  const fallbackImage = entry.illustrationUrl ?? entry.emoji;
  const currentCard = cards[cardIndex] ?? { photos: [fallbackImage], date: entry.firstDate ?? '', memo: '', location: '' };
  const photos = currentCard.photos.length ? currentCard.photos : [fallbackImage];
  const currentIndex = collectedEntries.findIndex((item) => item.id === entry.id);
  const nextEntry = collectedEntries[(currentIndex + 1) % collectedEntries.length];

  useEffect(() => {setCardIndex(0);setPhotoIndex(0);setShowTeaser(false);setComments(buildInitialComments(equippedBadge));}, [entry.id, equippedBadge]);
  const selectCard = (index: number) => {setCardIndex(index);setPhotoIndex(0);};
  const movePhoto = (direction: -1 | 1) => setPhotoIndex((index) => (index + direction + photos.length) % photos.length);
  const moveNext = () => {if (!nextEntry || nextEntry.id === entry.id) return;setShowTeaser(true);window.setTimeout(() => {setShowTeaser(false);onOpenEntry(nextEntry.id);}, 550);};
  const formatCardDate = (date: string) => date.slice(5).replace('-', '.');

  return <div className="relative flex h-full flex-col bg-cream-100" onTouchStart={(event) => setTouchStartY(event.touches[0].clientY)} onTouchEnd={(event) => {if (touchStartY && touchStartY - event.changedTouches[0].clientY > 70) moveNext();setTouchStartY(null);}}>
    <header className="flex items-center gap-3 px-5 py-3"><button onClick={onBack} aria-label="뒤로가기"><ArrowLeftIcon size={22} /></button><h1 className="flex-1 truncate text-center font-display text-xl text-brown">{entry.name}</h1><span className="rounded-full bg-cream-200 px-2.5 py-1 text-xs font-medium text-brown-soft">일반 · {entry.category}</span></header>
    {cards.length > 1 && <div className="border-y border-cream-200 bg-cream-50 px-5 py-2.5"><p className="mb-2 text-xs font-medium text-brown-soft">등록 카드</p><div className="flex gap-2" aria-label="등록 카드 선택">{cards.map((card, index) => <button key={`${card.date}-${index}`} onClick={() => selectCard(index)} className={`min-h-touch flex-1 rounded-full border px-2 text-center transition ${cardIndex === index ? 'border-orange-500 bg-orange-500 text-white' : 'border-cream-300 bg-white text-brown-soft'}`}><span className="text-xs font-bold">{index + 1} · {formatCardDate(card.date)}</span></button>)}</div></div>}
    <main className="no-scrollbar flex-1 overflow-y-auto">
      <div className="relative aspect-[4/3] w-full bg-orange-50" onTouchStart={(event) => setPhotoTouchStartX(event.touches[0].clientX)} onTouchEnd={(event) => {if (photoTouchStartX === null || photos.length < 2) return;const distance = photoTouchStartX - event.changedTouches[0].clientX;if (Math.abs(distance) > 45) movePhoto(distance > 0 ? 1 : -1);setPhotoTouchStartX(null);}}><AnimatePresence mode="wait"><motion.div key={`${cardIndex}-${photoIndex}`} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} className="flex h-full items-center justify-center text-8xl">{photos[photoIndex].startsWith('http') ? <img src={photos[photoIndex]} alt="" className="h-full w-full object-contain p-6" /> : photos[photoIndex]}</motion.div></AnimatePresence><span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">{photoIndex + 1}/{photos.length}</span>{photos.length > 1 && <><button onClick={() => movePhoto(-1)} aria-label="이전 사진" className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white"><ChevronLeftIcon size={18} /></button><button onClick={() => movePhoto(1)} aria-label="다음 사진" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white"><ChevronRightIcon size={18} /></button></>}<div className="absolute inset-x-0 bottom-0 flex justify-center">{photos.map((_, index) => <button key={index} onClick={() => setPhotoIndex(index)} aria-label={`${index + 1}번째 사진`} className="no-touch-expand flex h-11 w-11 items-end justify-center pb-3"><span aria-hidden className={`h-2 w-2 rounded-full ${index === photoIndex ? 'bg-orange-500' : 'bg-white/70'}`} /></button>)}</div></div>
      <div className="flex items-center gap-2 px-5 py-3"><button onClick={() => setCommentsOpen(true)} aria-label="댓글 보기" className="flex min-h-touch items-center gap-2 text-brown"><MessageCircleIcon size={22} aria-hidden /><span className="text-sm font-medium">{comments.length}</span></button><span className="text-xs text-brown-soft">카드 {cardIndex + 1}의 사진 {photos.length}장</span></div>
      <div className="mx-5 rounded-2xl bg-white p-4 shadow-soft"><p className="flex items-center gap-1.5 text-sm text-brown-soft"><MapPinIcon size={15} className="text-orange-500" />{currentCard.location || '위치 없음'} · {currentCard.date} 수집</p>{currentCard.memo && <p className="mt-2 text-sm text-brown">메모: {currentCard.memo}</p>}</div>
      <AnimatePresence>{showTeaser && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50 p-3"><div className="flex">{[0, 1, 2].map((value) => <span key={value} className="-ml-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-cream-50 bg-cream-200 text-brown-muted first:ml-0">?</span>)}</div><div><p className="text-sm font-bold text-brown">미수집 3종을 건너뛰었습니다</p><p className="text-xs text-brown-soft">다음 수집 카드로 이동합니다</p></div></motion.div>}</AnimatePresence>
      <div className="mt-4 border-t border-cream-300 px-5 py-4"><div className="flex items-center justify-between"><span className="font-display text-lg text-brown">{entry.name}</span><StarRank value={entry.stars ?? 1} size={16} /></div><p className="mt-1 text-xs text-brown-soft">첫 수집일 {entry.firstDate}</p></div><button onClick={moveNext} className="flex min-h-touch w-full items-center justify-center gap-1 pb-6 text-xs text-brown-soft"><ChevronUpIcon size={16} aria-hidden />위로 스와이프하면 다음 도감으로</button>
    </main>
    <BottomNav active="기본" onTab={onTab} />{commentsOpen && <CommentSheet comments={comments} onClose={() => setCommentsOpen(false)} onPost={(body) => setComments((items) => [...items, { initial: '신', name: '신재락현', time: '방금', body, badge: equippedBadge }])} />}
  </div>;
}
