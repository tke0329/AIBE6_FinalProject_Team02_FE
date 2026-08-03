import React, { useRef, useState } from 'react';
import { ArrowLeftIcon, CrownIcon, MapPinIcon, PlusIcon } from 'lucide-react';
import { ProgressBar } from '@/shared/ui/atoms/ProgressBar';
import { Badge } from '@/shared/ui/atoms/Badge';
import { FoodCard } from '@/shared/ui/molecules/FoodCard';
import { TabBar } from '@/shared/ui/molecules/TabBar';
import { ChallengeData } from './types';

type DetailTab = '기록 도감' | '랭킹';
interface Props {
  challenge: ChallengeData;
  onBack: () => void;
  onRegister: () => void;
  onJoin?: () => void;
  onUnlock?: (slotId: string, file: File) => void;
}
const RANKINGS = [
  { rank: 1, name: '윤하연수', initial: '윤', count: 14, tone: 'bg-amber-200 text-amber-800' },
  { rank: 2, name: '민지수', initial: '민', count: 12, tone: 'bg-slate-200 text-slate-700' },
  { rank: 3, name: '주말식도락', initial: '주', count: 11, tone: 'bg-orange-200 text-orange-800' },
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
];

export function ChallengeDetail({ challenge, onBack, onRegister, onJoin, onUnlock }: Props) {
  const [activeTab, setActiveTab] = useState<DetailTab>('기록 도감');
  const joined = Boolean(challenge.joined);
  const targets = challenge.targetRestaurants ?? [];
  const completed = new Set(challenge.completedTargetIds ?? []);
  const badge = challenge.rewardBadge;
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const pickPhoto = (slotId: string) => {
    setPendingSlotId(slotId);
    fileRef.current?.click();
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && pendingSlotId && onUnlock) onUnlock(pendingSlotId, file);
  };
  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex items-center gap-3 px-5 py-4">
        <button onClick={onBack} aria-label="뒤로가기">
          <ArrowLeftIcon size={22} />
        </button>
        <span className="font-display text-lg text-brown">챌린지 상세</span>
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
          items={(['기록 도감', '랭킹'] as DetailTab[]).map((tab) => ({ id: tab, label: tab }))}
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
                  const unlocked = completed.has(target.id);
                  const card = (
                    <FoodCard
                      name={target.name}
                      emoji={target.emoji ?? '🍽️'}
                      illustrationUrl={target.imageUrl || '/images/default_food.png'}
                      state={unlocked ? 'unlocked' : 'locked'}
                      accessibleName={unlocked ? `${target.name}, 인증 완료` : '미해금 목표 음식'}
                      footer={
                        <p className="text-center text-xs text-content-secondary">
                          {unlocked ? '인증 완료' : joined ? '인증하기' : '미해금'}
                        </p>
                      }
                    />
                  );
                  return joined && !unlocked ? (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => pickPhoto(target.id)}
                      className="text-left"
                    >
                      {card}
                    </button>
                  ) : (
                    <div key={target.id}>{card}</div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-6 text-center text-sm text-brown-muted">
                등록된 목표 음식이 없어요.
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
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
        {joined ? (
          <button
            onClick={onRegister}
            className="flex h-cta w-full items-center justify-center gap-2 rounded-full bg-orange-500 font-display text-lg text-white shadow-card"
          >
            <PlusIcon size={19} aria-hidden />
            지정 식당에서 등록하기
          </button>
        ) : (
          <button
            onClick={onJoin}
            className="h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card"
          >
            참여하기
          </button>
        )}
      </div>
    </div>
  );
}
function LeaderboardPodium() {
  const podium = [RANKINGS[1], RANKINGS[0], RANKINGS[2]];
  return (
    <div className="flex items-end justify-center gap-2">
      {podium.map((user) => (
        <div
          key={user.rank}
          className={`flex flex-col items-center ${user.rank === 1 ? 'w-28' : 'w-24'}`}
        >
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
  );
}
