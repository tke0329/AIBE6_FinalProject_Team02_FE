import React, { useState } from 'react';
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, MenuIcon, UserPlusIcon } from 'lucide-react';
import { BottomNav, NavTab } from '@/shared/ui/molecules/BottomNav';
import { DexHelpSheet } from '@/shared/ui/molecules/DexHelpSheet';
import { HelpIcon } from '@/shared/ui/atoms/HelpIcon';
import { SearchBar } from '@/shared/ui/atoms/SearchBar';
import { Badge } from '@/shared/ui/atoms/Badge';
import { FoodCard } from '@/shared/ui/molecules/FoodCard';
import { MadeCard, MadeDexId, MadeParticipant } from './types';
import { useMadeDexSearch } from './useMadeDexSearch';

export type { MadeCard } from './types';

interface Props {dexId: MadeDexId;recentCard?: MadeCard | null;participants: MadeParticipant[];onBack: () => void;onSwitchDex: (id: MadeDexId) => void;onRegister: () => void;onManageParticipants: () => void;onOpenInfo: () => void;onTab: (tab: NavTab) => void;}

const CARDS: MadeCard[] = [{ name: '연남동 파스타집', emoji: '🍝', by: '신', location: '연남동', tags: ['데이트', '기념일'] }, { name: '을지로 노포', emoji: '🍲', by: '윤', location: '을지로', tags: ['점심', '혼밥'] }, { name: '성수 브런치', emoji: '🥞', by: '신', location: '성수동', tags: ['데이트', '주말'] }, { name: '망원 타코', emoji: '🌮', by: '윤', location: '망원동', tags: ['저녁'] }, { name: '한남 스시', emoji: '🍣', by: '신', location: '한남동', tags: ['기념일', '재방문'] }, { name: '연희 베이커리', emoji: '🥐', by: '윤', location: '연희동', tags: ['브런치'] }, { name: '홍대 라멘', emoji: '🍜', by: '신', location: '홍대', tags: ['혼밥', '점심'] }, { name: '이태원 커리', emoji: '🍛', by: '윤', location: '이태원', tags: ['저녁'] }];

// TODO(CATCHEAT-29): 도감 자유 기록 이슈에서 API 응답으로 교체
const DEX_INFO: Record<MadeDexId, {title: string;count: string;emoji: string;}> = { 1: { title: '우리의 데이트 도감', count: '함께 등록한 카드 8개', emoji: '💑' }, 2: { title: '회사 점심 도감', count: '함께 등록한 카드 13개', emoji: '🍱' } };
const UNKNOWN_DEX = { title: '제작 도감', count: '', emoji: '📔' };

/**
 * 제작 도감 (§6) — 전체 목록·빈칸·진행률 바 없음.
 * 등록된 카드만 쌓이고 진행 상황은 "함께 등록한 카드 n개" 텍스트로만 표시.
 */
export function MadeDexHome({
  dexId,
  recentCard,
  participants,
  onBack,
  onSwitchDex,
  onRegister,
  onManageParticipants,
  onOpenInfo,
  onTab
}: Props) {
  const [switchOpen, setSwitchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const info = DEX_INFO[dexId] ?? UNKNOWN_DEX;
  const allCards = recentCard ? [recentCard, ...CARDS] : CARDS;
  const { query, setQuery, results } = useMadeDexSearch(allCards);

  return (
    <div className="relative flex h-full flex-col bg-cream-100">
      <header className="shrink-0 px-4 pt-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} aria-label="제작 도감 목록으로">
            <ArrowLeftIcon size={21} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setSwitchOpen((open) => !open)}
            aria-expanded={switchOpen}
            className="flex min-h-touch min-w-0 flex-1 items-center gap-1 font-display text-xl text-content-primary">
            <h1 className="truncate">{info.title}</h1>
            <ChevronDownIcon size={18} aria-hidden className="shrink-0 text-content-muted" />
          </button>
          <HelpIcon label="제작 도감" onClick={() => setHelpOpen(true)} />
          <button
            type="button"
            onClick={onRegister}
            className="min-h-touch shrink-0 rounded-full bg-action-primary px-4 text-xs font-bold text-content-on-action shadow-card">
            등록하기
          </button>
          <button
            type="button"
            onClick={onOpenInfo}
            aria-label="도감 정보"
            className="min-h-touch shrink-0">
            <MenuIcon size={22} aria-hidden className="text-content-primary" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface-card p-4 shadow-card">
          <div>
            <p className="text-sm font-medium text-content-secondary">{info.count}</p>
            <div className="mt-2 flex -space-x-2">
              {participants.map((person) =>
                <Badge key={person.id} variant="member" label={`참여자 ${person.name}`}>{person.name}</Badge>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onManageParticipants}
            className="flex min-h-touch items-center gap-2 rounded-full border border-orange-400 px-4 text-xs font-bold text-content-link">
            <UserPlusIcon size={15} aria-hidden />참여자 추가
          </button>
        </div>

        <SearchBar
          label="카드명, 장소, 태그 검색"
          placeholder="카드명, 장소, #태그 검색"
          value={query}
          onChange={setQuery}
          className="mt-3" />

      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {results.length ?
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {results.map((card) =>
              <FoodCard
                key={card.name}
                name={card.name}
                emoji={card.emoji}
                state="unlocked"
                accessibleName={`${card.name}, ${card.location}, ${card.by}님 등록`}
                footer={<p className="truncate text-center text-xs text-content-link">#{card.tags[0]}</p>}
                overlay={
                  <Badge
                    variant="member"
                    label={`${card.by}님 등록`}
                    className="absolute bottom-2 right-2 h-5 w-5 border-0">
                    {card.by}
                  </Badge>
                } />

            )}
          </div> :
          <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge-default bg-cream-50 text-center">
            <span aria-hidden className="text-3xl">🔎</span>
            <p className="mt-2 text-sm font-bold text-content-primary">조건에 맞는 카드가 없어요</p>
            <p className="mt-1 text-xs text-content-secondary">카드명, 장소명 또는 #태그를 확인해 보세요.</p>
          </div>
        }
      </main>

      <BottomNav active="제작" onTab={onTab} />

      {switchOpen &&
        <>
          <button
            type="button"
            aria-label="도감 전환 닫기"
            className="no-touch-expand absolute inset-0 z-10 bg-black/20"
            onClick={() => setSwitchOpen(false)} />

          <div className="absolute left-4 right-4 top-14 z-20 overflow-hidden rounded-2xl bg-surface-raised shadow-modal">
            {Object.keys(DEX_INFO).map(Number).map((id) =>
              <button
                key={id}
                type="button"
                onClick={() => {onSwitchDex(id);setSwitchOpen(false);}}
                className={`flex min-h-touch w-full items-center gap-3 px-4 text-left ${
                  id === dexId ? 'bg-orange-50 text-content-link' : 'text-content-primary'
                }`}>
                <span aria-hidden className="text-xl">{DEX_INFO[id].emoji}</span>
                <span className="flex-1 text-sm font-medium">{DEX_INFO[id].title}</span>
                {id === dexId && <CheckIcon size={16} aria-hidden />}
              </button>
            )}
          </div>
        </>
      }
      {helpOpen && <DexHelpSheet kind="made" onClose={() => setHelpOpen(false)} />}
    </div>);

}
