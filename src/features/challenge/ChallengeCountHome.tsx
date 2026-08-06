"use client";

import { Badge } from "@/shared/ui/atoms/Badge";
import { HelpIcon } from "@/shared/ui/atoms/HelpIcon";
import { ProgressBar } from "@/shared/ui/atoms/ProgressBar";
import { BottomNav, NavTab } from "@/shared/ui/molecules/BottomNav";
import { DexHelpSheet } from "@/shared/ui/molecules/DexHelpSheet";
import { TabBar } from "@/shared/ui/molecules/TabBar";
import { CrownIcon, MedalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { ChallengeSort } from "./api";
import { ChallengeData } from "./types";

type MyTab = "개설한" | "참여 중" | "완료한";
type ExploreStatus = "ONGOING" | "FINISHED";

const MAIN_TABS: Array<{ id: "mine" | "explore"; label: string }> = [
  { id: "mine", label: "내 챌린지" },
  { id: "explore", label: "챌린지 탐색" },
];

const MY_TABS: Array<{ id: MyTab; label: MyTab }> = [
  { id: "개설한", label: "개설한" },
  { id: "참여 중", label: "참여 중" },
  { id: "완료한", label: "완료한" },
];

// 탐색 진행 상태 토글
const STATUS_TABS: Array<{ id: ExploreStatus; label: string }> = [
  { id: "ONGOING", label: "진행중" },
  { id: "FINISHED", label: "종료" },
];

// 탐색 정렬 탭
// 최신순(기본) + 랭킹 3종(최근 7일)
const SORT_TABS: Array<{ id: ChallengeSort; label: string }> = [
  { id: "LATEST", label: "최신순" },
  { id: "VIEWS", label: "조회순" },
  { id: "PARTICIPANTS", label: "참여자순" },
  { id: "UNLOCKS", label: "진행도순" },
];

// 카드/포디움에 붙일 지표 텍스트
// 최신순은 누적 참가자수
function scoreText(sort: ChallengeSort, c: ChallengeData): string {
  const s = c.score ?? 0;
  switch (sort) {
    case "VIEWS":
      return `조회 ${s.toLocaleString()}`;
    case "PARTICIPANTS":
      return `참여 ${s}`;
    case "UNLOCKS":
      return `해금 ${s}`;
    default:
      return `${c.participants}명 참가`;
  }
}

interface Props {
  mainTab: "mine" | "explore";
  onMainTabChange: (tab: "mine" | "explore") => void;
  challenges: ChallengeData[];
  myCreated: ChallengeData[];
  myJoined: ChallengeData[];
  myCompleted: ChallengeData[];
  createdThisMonth: number;
  onTab: (tab: NavTab) => void;
  onOpenChallenge: (challenge: ChallengeData) => void;
  onCreateChallenge: () => void;
  // 탐색(서버 정렬 + 페이지)
  exploreItems: ChallengeData[];
  exploreSort: ChallengeSort;
  exploreStatus: ExploreStatus;
  exploreHasNext: boolean;
  exploreLoading: boolean;
  exploreError: boolean;
  onExploreStatusChange: (status: ExploreStatus) => void;
  onExploreSortChange: (sort: ChallengeSort) => void;
  onExploreLoadMore: () => void;
  onExploreRetry: () => void;
  onJoinChallenge: (challenge: ChallengeData) => void;
}

/** 챌린지 도감 (§6) — 개설자가 지정한 목표 리스트, 랭킹 탭, 월 3회 개설 제한 */
export function ChallengeCountHome({
  mainTab,
  onMainTabChange,
  challenges,
  myCreated,
  myJoined,
  myCompleted,
  createdThisMonth,
  onTab,
  onOpenChallenge,
  onCreateChallenge,
  exploreItems,
  exploreSort,
  exploreStatus,
  exploreHasNext,
  exploreLoading,
  exploreError,
  onExploreStatusChange,
  onExploreSortChange,
  onExploreLoadMore,
  onExploreRetry,
  onJoinChallenge,
}: Props) {
  const [myTab, setMyTab] = useState<MyTab>("참여 중");
  const [helpOpen, setHelpOpen] = useState(false);
  // 내 챌린지 탭은 서버에서 relation별로 받아온 목록을 그대로 사용
  const mine =
    myTab === '참여 중' ? myJoined : myTab === '개설한' ? myCreated : myCompleted;
  // 종료 탭은 랭킹 미적용(최근 완료순). 랭킹은 진행중 + 최신순 외 정렬일 때만
  const ended = exploreStatus === "FINISHED";
  const isRanking = !ended && exploreSort !== "LATEST";
  const podium = isRanking ? exploreItems.slice(0, 3) : [];
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
          onChange={onMainTabChange}
          className="mt-3"
        />
      </header>
      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5 pt-4">
        {mainTab === "mine" ? (
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
                  <p className="text-sm font-bold text-brown">
                    아직 이 상태의 챌린지가 없어요
                  </p>
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-brown">전체 챌린지</p>
              <TabBar
                label="진행 상태"
                variant="pill"
                items={STATUS_TABS}
                value={exploreStatus}
                onChange={onExploreStatusChange}
              />
            </div>
            {ended ? (
              <p className="mt-3 text-xs text-brown-muted">최근 완료순</p>
            ) : (
              <>
                <TabBar
                  label="탐색 정렬"
                  variant="pill"
                  items={SORT_TABS}
                  value={exploreSort}
                  onChange={onExploreSortChange}
                  className="mt-3"
                />
                {isRanking && (
                  <p className="mt-2 text-xs text-brown-muted">
                    최근 7일 기준 랭킹
                  </p>
                )}
                {isRanking && podium.length > 0 && (
                  <Podium
                    sort={exploreSort}
                    challenges={podium}
                    onOpen={onOpenChallenge}
                  />
                )}
              </>
            )}
            <div className="mt-4 space-y-3">
              {exploreItems.length ? (
                exploreItems.map((challenge, index) => (
                  <ExploreCard
                    key={challenge.id}
                    rank={isRanking ? index + 1 : undefined}
                    metric={
                      ended
                        ? `${challenge.participants}명 참가`
                        : scoreText(exploreSort, challenge)
                    }
                    ended={ended}
                    challenge={challenge}
                    onOpen={() => onOpenChallenge(challenge)}
                    onJoin={() => onJoinChallenge(challenge)}
                  />
                ))
              ) : exploreError ? (
                <div className="rounded-2xl bg-white p-6 text-center shadow-soft">
                  <p className="text-sm font-bold text-brown">
                    목록을 불러오지 못했어요
                  </p>
                  <button
                    onClick={onExploreRetry}
                    className="mt-3 min-h-touch rounded-full bg-orange-500 px-5 text-sm font-bold text-white"
                  >
                    다시 시도
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-6 text-center shadow-soft">
                  <p className="text-sm font-bold text-brown">
                    {ended
                      ? "종료된 챌린지가 없어요"
                      : "아직 진행 중인 챌린지가 없어요"}
                  </p>
                </div>
              )}
            </div>
            {exploreHasNext && (
              <button
                onClick={onExploreLoadMore}
                disabled={exploreLoading}
                className="mt-4 min-h-touch w-full rounded-full border border-cream-300 bg-white text-sm font-bold text-brown disabled:opacity-60"
              >
                {exploreLoading ? "불러오는 중…" : "더 보기"}
              </button>
            )}
          </>
        )}
      </main>
      <BottomNav active="챌린지" onTab={onTab} />
      {helpOpen && (
        <DexHelpSheet kind="challenge" onClose={() => setHelpOpen(false)} />
      )}
    </div>
  );
}
function MyChallengeCard({
  challenge,
  onOpen,
}: {
  challenge: ChallengeData;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-2xl bg-white p-4 text-left shadow-soft"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{challenge.emoji}</span>
        <span className="flex-1 font-display text-base text-brown">
          {challenge.title}
        </span>
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
  sort,
  challenges,
  onOpen,
}: {
  sort: ChallengeSort;
  challenges: ChallengeData[];
  onOpen: (challenge: ChallengeData) => void;
}) {
  // 순위를 먼저 확정한 뒤 시각 배치만 2-1-3으로(가운데가 1위)
  const ranked = challenges.map((challenge, i) => ({ challenge, rank: i + 1 }));
  const ordered = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
  return (
    <div className="mt-5 flex items-end justify-center gap-2">
      {ordered.map(({ challenge, rank }) => {
        return (
          <button
            key={challenge.id}
            onClick={() => onOpen(challenge)}
            className={`flex flex-col items-center ${rank === 1 ? "w-28" : "w-24"}`}
          >
            <span
              className={`relative flex items-center justify-center rounded-2xl bg-white text-3xl shadow-soft ${rank === 1 ? "h-20 w-20 ring-2 ring-amber-400" : "h-16 w-16"}`}
            >
              {rank === 1 && (
                <CrownIcon
                  size={21}
                  className="absolute -top-5 text-amber-500"
                />
              )}
              {challenge.emoji}
            </span>
            <span className="mt-2 line-clamp-1 text-center text-xs font-bold text-brown">
              {challenge.title}
            </span>
            <span className="text-xs text-brown-soft">
              {scoreText(sort, challenge)}
            </span>
            <span
              className={`mt-1 flex w-full items-center justify-center rounded-t-lg py-1 text-xs font-bold ${rank === 1 ? "h-10 bg-amber-400 text-white" : rank === 2 ? "bg-slate-300 text-white" : "bg-orange-200 text-orange-700"}`}
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
  metric,
  ended,
  onOpen,
  onJoin,
}: {
  challenge: ChallengeData;
  rank?: number;
  metric: string;
  ended: boolean;
  onOpen: () => void;
  onJoin: () => void;
}) {
  return (
    // 카드 본문 탭 = 상세
    // 우측 버튼 = 실제 참여
    <div className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
      <button
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]"
      >
        {rank && (
          <span className="w-5 text-center font-display text-sm text-brown-muted">
            {rank}
          </span>
        )}
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-2xl">
          {challenge.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-brown">
            {challenge.title}
          </span>
          <span className="mt-1 block text-xs text-brown-soft">{metric}</span>
        </span>
      </button>
      {ended ? (
        <span className="shrink-0 rounded-full bg-cream-200 px-3 py-2 text-xs font-bold text-brown-muted">
          종료
        </span>
      ) : challenge.joined ? (
        <span className="shrink-0 rounded-full bg-cream-200 px-3 py-2 text-xs font-bold text-brown-soft">
          참여 중
        </span>
      ) : (
        <button
          onClick={onJoin}
          className="min-h-touch shrink-0 rounded-full bg-orange-500 px-3 text-xs font-bold text-white active:scale-[0.98]"
        >
          참여하기
        </button>
      )}
    </div>
  );
}
