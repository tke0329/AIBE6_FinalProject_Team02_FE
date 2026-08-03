'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  CrownIcon,
  MedalIcon,
  PlusIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { ProgressBar } from '@/shared/ui/atoms/ProgressBar';
import { BottomNav, NavTab } from '@/shared/ui/molecules/BottomNav';
import { DexHelpSheet } from '@/shared/ui/molecules/DexHelpSheet';
import { HelpIcon } from '@/shared/ui/atoms/HelpIcon';
import { TabBar } from '@/shared/ui/molecules/TabBar';
import { Badge } from '@/shared/ui/atoms/Badge';
import { ChallengeData } from './types';

type MainTab = '내 챌린지' | '챌린지 탐색';
type MyTab = '개설한' | '참여 중' | '완료한';
type SortMode = '참가자 많은 순' | '최근 등록순';

const MAIN_TABS: Array<{ id: MainTab; label: MainTab }> = [
  { id: '내 챌린지', label: '내 챌린지' },
  { id: '챌린지 탐색', label: '챌린지 탐색' },
];

const MY_TABS: Array<{ id: MyTab; label: MyTab }> = [
  { id: '개설한', label: '개설한' },
  { id: '참여 중', label: '참여 중' },
  { id: '완료한', label: '완료한' },
];

interface Props {
  challenges: ChallengeData[];
  createdThisMonth: number;
  onTab: (tab: NavTab) => void;
  onOpenChallenge: (challenge: ChallengeData) => void;
  onCreateChallenge: () => void;
}

/** 챌린지 도감 (§6) — 개설자가 지정한 목표 리스트, 랭킹 탭, 월 3회 개설 제한 */
export function ChallengeCountHome({
  challenges,
  createdThisMonth,
  onTab,
  onOpenChallenge,
  onCreateChallenge,
}: Props) {
  const [mainTab, setMainTab] = useState<MainTab>('내 챌린지');
  const [myTab, setMyTab] = useState<MyTab>('참여 중');
  const [sortMode, setSortMode] = useState<SortMode>('참가자 많은 순');
  const [sortOpen, setSortOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const mine =
    myTab === '참여 중'
      ? challenges.filter((challenge) => challenge.joined && !challenge.completed)
      : myTab === '개설한'
        ? challenges.filter((challenge) => challenge.isCreator)
        : challenges.filter((challenge) => challenge.completed);
  const discover = useMemo(
    () =>
      sortMode === '최근 등록순'
        ? [...challenges].reverse()
        : [...challenges].sort((a, b) => b.participants - a.participants),
    [challenges, sortMode],
  );
  const podium = [...challenges].sort((a, b) => b.participants - a.participants).slice(0, 3);
  return (
    <div className="relative flex h-full flex-col bg-cream-100">
      <header className="px-5 pt-4">
        <div className="flex items-center gap-1">
          <h1 className="font-display text-xl text-brown">챌린지 도감</h1>
          <HelpIcon label="챌린지 도감" onClick={() => setHelpOpen(true)} />
        </div>
        <TabBar
          label="챌린지 보기 전환"
          variant="segmented"
          items={MAIN_TABS}
          value={mainTab}
          onChange={setMainTab}
          className="mt-3"
        />
      </header>
      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5 pt-4">
        {mainTab === '내 챌린지' ? (
          <>
            <div className="flex items-center gap-2">
              <TabBar
                label="내 챌린지 상태"
                variant="pill"
                items={MY_TABS}
                value={myTab}
                onChange={setMyTab}
              />
              <button
                onClick={onCreateChallenge}
                className="ml-auto flex min-h-touch items-center gap-1 rounded-full bg-orange-500 px-4 text-xs font-bold text-white"
              >
                <PlusIcon size={14} />
                개설 {createdThisMonth}/3
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {mine.length ? (
                mine.map((challenge) => (
                  <MyChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onOpen={() => onOpenChallenge(challenge)}
                  />
                ))
              ) : (
                <div className="rounded-2xl bg-white p-6 text-center shadow-soft">
                  <p className="text-sm font-bold text-brown">아직 이 상태의 챌린지가 없어요</p>
                  <button
                    onClick={onCreateChallenge}
                    className="mt-3 min-h-touch rounded-full bg-orange-500 px-5 text-sm font-bold text-white"
                  >
                    챌린지 개설하기
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="relative flex items-center justify-between">
              <p className="text-sm font-bold text-brown">전체 챌린지</p>
              <button
                onClick={() => setSortOpen((open) => !open)}
                className="flex items-center gap-1 rounded-full border border-cream-300 bg-white px-4 py-2 text-xs font-medium text-brown-soft"
              >
                <SlidersHorizontalIcon size={14} />
                {sortMode}
                <ChevronDownIcon size={13} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-9 z-10 w-44 overflow-hidden rounded-xl bg-white shadow-pop">
                  {(['참가자 많은 순', '최근 등록순'] as SortMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setSortMode(mode);
                        setSortOpen(false);
                      }}
                      className={`min-h-touch w-full px-3 text-left text-xs ${sortMode === mode ? 'bg-orange-50 font-bold text-orange-600' : 'text-brown'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {sortMode === '참가자 많은 순' && (
              <Podium challenges={podium} onOpen={onOpenChallenge} />
            )}
            <div className="mt-4 space-y-3">
              {discover.map((challenge, index) => (
                <ExploreCard
                  key={challenge.id}
                  rank={sortMode === '참가자 많은 순' ? index + 1 : undefined}
                  challenge={challenge}
                  onOpen={() => onOpenChallenge(challenge)}
                />
              ))}
            </div>
          </>
        )}
      </main>
      <BottomNav active="챌린지" onTab={onTab} />
      {helpOpen && <DexHelpSheet kind="challenge" onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
function MyChallengeCard({ challenge, onOpen }: { challenge: ChallengeData; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full rounded-2xl bg-white p-4 text-left shadow-soft">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{challenge.emoji}</span>
        <span className="flex-1 font-display text-base text-brown">{challenge.title}</span>
        <Badge variant="dday">{challenge.dday}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-brown-soft">
        <Badge variant="type">{challenge.tag}</Badge>
        <span>목표 {challenge.target ?? 0}곳</span>
        <span>{challenge.participants}명 참가 중</span>
      </div>
      {challenge.completed ? (
        <div className="mt-3 flex items-center gap-1 text-sm font-bold text-amber-600">
          <MedalIcon size={17} />
          완료한 챌린지
        </div>
      ) : (
        <>
          <div className="mt-3 flex justify-between text-sm">
            <span className="font-bold text-brown">{challenge.mine}</span>
            <span className="text-brown-soft">진행 중</span>
          </div>
          <div className="mt-2">
            <ProgressBar
              value={challenge.progress ?? 0}
              animate={false}
              label={`${challenge.title} 진행률`}
            />
          </div>
        </>
      )}
    </button>
  );
}
function Podium({
  challenges,
  onOpen,
}: {
  challenges: ChallengeData[];
  onOpen: (challenge: ChallengeData) => void;
}) {
  const ordered = [challenges[1], challenges[0], challenges[2]].filter(Boolean);
  return (
    <div className="mt-5 flex items-end justify-center gap-2">
      {ordered.map((challenge, index) => {
        const rank = index === 1 ? 1 : index === 0 ? 2 : 3;
        return (
          <button
            key={challenge.id}
            onClick={() => onOpen(challenge)}
            className={`flex flex-col items-center ${rank === 1 ? 'w-28' : 'w-24'}`}
          >
            <span
              className={`relative flex items-center justify-center rounded-2xl bg-white text-3xl shadow-soft ${rank === 1 ? 'h-20 w-20 ring-2 ring-amber-400' : 'h-16 w-16'}`}
            >
              {rank === 1 && <CrownIcon size={21} className="absolute -top-5 text-amber-500" />}
              {challenge.emoji}
            </span>
            <span className="mt-2 line-clamp-1 text-center text-xs font-bold text-brown">
              {challenge.title}
            </span>
            <span className="text-xs text-brown-soft">{challenge.participants}명</span>
            <span
              className={`mt-1 flex w-full items-center justify-center rounded-t-lg py-1 text-xs font-bold ${rank === 1 ? 'h-10 bg-amber-400 text-white' : rank === 2 ? 'bg-slate-300 text-white' : 'bg-orange-200 text-orange-700'}`}
            >
              {rank}위
            </span>
          </button>
        );
      })}
    </div>
  );
}
function ExploreCard({
  challenge,
  rank,
  onOpen,
}: {
  challenge: ChallengeData;
  rank?: number;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft"
    >
      {rank && (
        <span className="w-5 text-center font-display text-sm text-brown-muted">{rank}</span>
      )}
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-2xl">
        {challenge.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-brown">{challenge.title}</span>
        <span className="mt-1 block text-xs text-brown-soft">
          {challenge.owner} · {challenge.participants}명 참가
        </span>
      </span>
      {challenge.joined ? (
        <span className="rounded-full bg-cream-200 px-2 py-1 text-xs font-bold text-brown-soft">
          참여 중
        </span>
      ) : (
        <span className="rounded-full bg-orange-500 px-2 py-1 text-xs font-bold text-white">
          참여하기
        </span>
      )}
    </button>
  );
}
