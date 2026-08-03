"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { INITIAL_CHALLENGES } from "@/features/challenge/data";
import { ChallengeData, RewardBadge } from "@/features/challenge/types";
import {
  fetchBasicDexEntries,
  fetchMyBasicDexEntries,
} from "@/features/dex/api";
import {
  MadeCard,
  MadeDexId,
  MadeParticipant,
  parseMadeDexId,
} from "@/features/made/types";
import {
  fetchOnboardingStatus,
  postOnboardingComplete,
} from "@/features/onboarding/api";
import { AI_CANDIDATES, DEX_ENTRIES, DexEntry } from "@/shared/data/dex";
import { BadgeId } from "@/shared/ui/atoms/EquippedBadge";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type RegistrationSource = "basic" | "made" | "challenge";

type InviteCode = { dexId: MadeDexId; expiresAt: number };
export type JoinResult = "success" | "invalid" | "expired" | "already";

const WEEK = 7 * 24 * 60 * 60 * 1000;

// TODO(CATCHEAT-29): 초대/멤버 이슈에서 API로 교체. 그때까지 목업 도감 id 1, 2로 버틴다
const MADE_DEX_TITLE: Record<MadeDexId, string> = {
  1: "우리의 데이트 도감",
  2: "회사 점심 도감",
};
const MADE_DEX_CODE: Record<MadeDexId, string> = {
  1: "DATE26",
  2: "LUNCH7",
};

/**
 * 라우트를 건너 공유되는 앱 상태.
 * 페이지(컨테이너)는 이 훅에서 값과 액션을 받아 프레젠테이셔널 컴포넌트에 props로 내려준다 (§3.1).
 *
 * 목업 단계라 메모리에만 두며, 새로고침하면 초기화된다.
 * 실제 API 연동 시 이 파일의 액션 본문만 교체하면 화면 코드는 손댈 필요 없다.
 */
/**
 * 도감 슬라이스만 담은 좁은 컨텍스트.
 * 챌린지/제작 도감/등록 플로우 등 무관한 상태가 바뀔 때 도감 화면이 함께
 * 리렌더되지 않도록 `AppStore`와 분리해서 제공한다 (useDexState 참고).
 */
export interface DexStore {
  entries: DexEntry[];
  entriesLoading: boolean;
  refreshEntries: () => Promise<void>;
  collectedIds: number[];
  collectedEntries: DexEntry[];
  newlyUnlockedId: number | null;
  findEntry: (id: number) => DexEntry | undefined;
}

interface AppStore {
  // 프로필
  equippedBadge: BadgeId;
  setEquippedBadge: (badge: BadgeId) => void;
  profilePhoto: string;
  setProfilePhoto: (photo: string) => void;

  // 온보딩
  onboardingSeen: boolean | null;
  completeOnboarding: () => void;

  // 제작 도감
  madeParticipants: Record<MadeDexId, MadeParticipant[]>;
  madeDexTitle: (dexId: MadeDexId) => string;
  madeDexCode: (dexId: MadeDexId) => string;
  removeParticipant: (dexId: MadeDexId, participantId: string) => void;
  joinWithCode: (code: string) => { result: JoinResult; dexId?: MadeDexId };
  recentMadeCard: MadeCard | null;

  // 챌린지
  challenges: ChallengeData[];
  createdThisMonth: number;
  findChallenge: (id: string) => ChallengeData | undefined;
  createChallenge: (challenge: ChallengeData) => void;
  customBadge: RewardBadge | null;
  setCustomBadge: (badge: RewardBadge | null) => void;

  // 등록 플로우
  registrationSource: RegistrationSource;
  registrationChallengeId: string | null;
  registrationMadeDexId: MadeDexId | null;
  startRegistration: (source: RegistrationSource, contextId?: string) => void;
  hasUpload: boolean;
  setHasUpload: (value: boolean) => void;
  selectedFood: DexEntry;
  setSelectedFoodId: (id: number) => void;
  recordDraft: { memo: string; location: string };
  setRecordDraft: (draft: { memo: string; location: string }) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  finishRegistration: (
    tags?: string[],
    draft?: { memo: string; location: string },
  ) => void;
}

const AppStateContext = createContext<AppStore | null>(null);
const DexContext = createContext<DexStore | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<DexEntry[]>(DEX_ENTRIES);
  // 실제 도감 데이터가 도착하기 전까지는 목업이 화면에 잠깐 노출되지 않도록 로딩 상태로 가린다.
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [newlyUnlockedId, setNewlyUnlockedId] = useState<number | null>(null);
  const [equippedBadge, setEquippedBadge] = useState<BadgeId>("silver-spoon");
  const [profilePhoto, setProfilePhoto] = useState("신");
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  // 진입 시 서버에서 온보딩 완료 여부 확인
  // 미로그인/실패 시 온보딩 노출로 폴백
  useEffect(() => {
    fetchOnboardingStatus()
      .then((status) => setOnboardingSeen(status.onboardingCompleted))
      .catch(() => setOnboardingSeen(false));
  }, []);

  const { me, loading: authLoading } = useAuth();
  const userId = me?.id;

  // 비로그인 → 전체 목록(/basic), 로그인 → 내가 실제로 등록(해금)한 항목만
  // collected=true인 목록(/me/basic). 등록 직후처럼 서버 상태가 바뀐 뒤에도
  // 다시 불러 최신화할 수 있도록 콜백으로 분리해 둔다.
  const refreshEntries = useCallback(async () => {
    const fetchEntries = userId ? fetchMyBasicDexEntries : fetchBasicDexEntries;
    try {
      const basicEntries = await fetchEntries();
      if (basicEntries.length > 0) setEntries(basicEntries);
    } catch {
      // 실패하면 이전 목록(초기 진입 시엔 로컬 목업)을 그대로 유지한다.
    }
  }, [userId]);

  // 로그인 여부가 확정된 뒤에만 최초 요청한다: 확정 전에 먼저 쐈다가 로그인
  // 상태가 뒤늦게 밝혀져 다시 쏘면 화면이 한 번 더 바뀌므로 그냥 기다린다.
  useEffect(() => {
    if (authLoading) return;
    setEntriesLoading(true);
    refreshEntries().finally(() => setEntriesLoading(false));
  }, [authLoading, refreshEntries]);

  const [madeParticipants, setMadeParticipants] = useState<
    Record<MadeDexId, MadeParticipant[]>
  >({
    1: [
      { id: "me", name: "신" },
      { id: "yoon", name: "윤" },
    ],
    2: [
      { id: "me", name: "신" },
      { id: "yoon", name: "윤" },
      { id: "min", name: "민" },
      { id: "jay", name: "J" },
    ],
  });
  const [inviteCodes] = useState<Record<string, InviteCode>>({
    DATE26: { dexId: 1, expiresAt: Date.now() + WEEK },
    LUNCH7: { dexId: 2, expiresAt: Date.now() + WEEK },
    OLD999: { dexId: 1, expiresAt: Date.now() - 1 },
  });
  const [recentMadeCard, setRecentMadeCard] = useState<MadeCard | null>(null);

  const [challenges, setChallenges] =
    useState<ChallengeData[]>(INITIAL_CHALLENGES);
  const [customBadge, setCustomBadge] = useState<RewardBadge | null>(null);

  const [registrationSource, setRegistrationSource] =
    useState<RegistrationSource>("basic");
  const [registrationChallengeId, setRegistrationChallengeId] = useState<
    string | null
  >(null);
  const [registrationMadeDexId, setRegistrationMadeDexId] =
    useState<MadeDexId | null>(null);
  const [hasUpload, setHasUpload] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState(16);
  const [recordDraft, setRecordDraft] = useState({ memo: "", location: "" });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const collectedEntries = useMemo(
    () => entries.filter((entry) => entry.collected),
    [entries],
  );
  const collectedIds = useMemo(
    () => collectedEntries.map((entry) => entry.id),
    [collectedEntries],
  );

  // AI 후보로만 존재하고 아직 도감에 없는 음식도 등록 대상이 될 수 있음
  const selectedFood = useMemo<DexEntry>(() => {
    const known = entries.find((entry) => entry.id === selectedFoodId);
    if (known) return known;
    const candidate = AI_CANDIDATES.find((item) => item.id === selectedFoodId);
    return {
      id: selectedFoodId,
      name: candidate?.name ?? "칼국수",
      emoji: candidate?.emoji ?? "🍜",
      category: "면" as const,
      collected: false,
    };
  }, [entries, selectedFoodId]);

  const createdThisMonth = challenges.filter(
    (challenge) => challenge.isCreator,
  ).length;

  const findEntry = useCallback(
    (id: number) => entries.find((entry) => entry.id === id),
    [entries],
  );
  const findChallenge = useCallback(
    (id: string) => challenges.find((challenge) => challenge.id === id),
    [challenges],
  );

  const startRegistration = useCallback(
    (source: RegistrationSource, contextId?: string) => {
      setRegistrationSource(source);
      setRegistrationChallengeId(
        source === "challenge" ? (contextId ?? null) : null,
      );
      setRegistrationMadeDexId(
        source === "made" ? parseMadeDexId(contextId) : null,
      );
      setSelectedTags([]);
      setRecordDraft({ memo: "", location: "" });
      setHasUpload(false);
    },
    [],
  );

  const removeParticipant = useCallback(
    (dexId: MadeDexId, participantId: string) => {
      setMadeParticipants((current) => ({
        ...current,
        [dexId]: (current[dexId] ?? []).filter(
          (person) => person.id !== participantId,
        ),
      }));
    },
    [],
  );

  const joinWithCode = useCallback(
    (code: string): { result: JoinResult; dexId?: MadeDexId } => {
      const invite = inviteCodes[code];
      if (!invite) return { result: "invalid" };
      if (invite.expiresAt < Date.now()) return { result: "expired" };
      if (
        (madeParticipants[invite.dexId] ?? []).some(
          (participant) => participant.id === "guest",
        )
      ) {
        return { result: "already" };
      }
      setMadeParticipants((current) => ({
        ...current,
        [invite.dexId]: [
          ...(current[invite.dexId] ?? []),
          { id: "guest", name: "현" },
        ],
      }));
      return { result: "success", dexId: invite.dexId };
    },
    [inviteCodes, madeParticipants],
  );

  const createChallenge = useCallback((challenge: ChallengeData) => {
    setChallenges((current) => [challenge, ...current]);
    setCustomBadge(null);
  }, []);

  const finishRegistration = useCallback(
    (tags: string[] = selectedTags, draft = recordDraft) => {
      const location = draft.location || "현재 위치 근처";
      const memo = draft.memo || "AI로 찾은 오늘의 음식";

      // 챌린지 등록이면 지정 식당과 대조해 목표 하나를 해금
      if (registrationSource === "challenge" && registrationChallengeId) {
        setChallenges((current) =>
          current.map((challenge) => {
            if (challenge.id !== registrationChallengeId) return challenge;
            const matched = challenge.targetRestaurants?.find(
              (target) =>
                (location.includes(target.name) ||
                  target.name.includes(location)) &&
                !challenge.completedTargetIds?.includes(target.id),
            );
            if (!matched) return challenge;
            const nextIds = [
              ...(challenge.completedTargetIds ?? []),
              matched.id,
            ];
            const total = challenge.targetRestaurants?.length ?? 1;
            return {
              ...challenge,
              completedTargetIds: nextIds,
              mine: `나 ${nextIds.length}/${total}`,
              progress: nextIds.length / total,
            };
          }),
        );
      }

      const savedEntry: DexEntry = {
        ...selectedFood,
        collected: true,
        stars: 1,
        firstDate: "2026.07.22",
        cards: [
          {
            photos: [selectedFood.illustrationUrl ?? selectedFood.emoji],
            memo,
            location,
            date: "2026.07.22",
            tags,
          },
        ],
      };

      if (registrationSource === "made") {
        setRecentMadeCard({
          name: selectedFood.name,
          emoji: selectedFood.emoji,
          by: "신",
          location,
          tags: tags.length ? tags : ["새 기록"],
        });
      }

      setEntries((current) =>
        current.some((entry) => entry.id === savedEntry.id)
          ? current.map((entry) =>
              entry.id === savedEntry.id ? savedEntry : entry,
            )
          : [...current, savedEntry],
      );
      setNewlyUnlockedId(savedEntry.id);
    },
    [
      recordDraft,
      registrationChallengeId,
      registrationSource,
      selectedFood,
      selectedTags,
    ],
  );

  const dexValue = useMemo<DexStore>(
    () => ({
      entries,
      entriesLoading,
      refreshEntries,
      collectedIds,
      collectedEntries,
      newlyUnlockedId,
      findEntry,
    }),
    [
      entries,
      entriesLoading,
      refreshEntries,
      collectedIds,
      collectedEntries,
      newlyUnlockedId,
      findEntry,
    ],
  );

  const value = useMemo<AppStore>(
    () => ({
      equippedBadge,
      setEquippedBadge,
      profilePhoto,
      setProfilePhoto,
      onboardingSeen,
      completeOnboarding: async () => {
        setOnboardingSeen(true); // 낙관적 갱신 — UX를 막지 않음
        try {
          await postOnboardingComplete();
        } catch {
          // 미로그인/실패해도 화면은 진행 (서버 반영은 다음 로그인 때)
        }
      },
      madeParticipants,
      madeDexTitle: (dexId) => MADE_DEX_TITLE[dexId] ?? "제작 도감",
      madeDexCode: (dexId) => MADE_DEX_CODE[dexId] ?? "------",
      removeParticipant,
      joinWithCode,
      recentMadeCard,
      challenges,
      createdThisMonth,
      findChallenge,
      createChallenge,
      customBadge,
      setCustomBadge,
      registrationSource,
      registrationChallengeId,
      registrationMadeDexId,
      startRegistration,
      hasUpload,
      setHasUpload,
      selectedFood,
      setSelectedFoodId,
      recordDraft,
      setRecordDraft,
      selectedTags,
      setSelectedTags,
      finishRegistration,
    }),
    [
      equippedBadge,
      profilePhoto,
      onboardingSeen,
      madeParticipants,
      removeParticipant,
      joinWithCode,
      recentMadeCard,
      challenges,
      createdThisMonth,
      findChallenge,
      createChallenge,
      customBadge,
      registrationSource,
      registrationChallengeId,
      registrationMadeDexId,
      startRegistration,
      hasUpload,
      selectedFood,
      recordDraft,
      selectedTags,
      finishRegistration,
    ],
  );

  return (
    <DexContext.Provider value={dexValue}>
      <AppStateContext.Provider value={value}>
        {children}
      </AppStateContext.Provider>
    </DexContext.Provider>
  );
}

export function useAppState() {
  const store = useContext(AppStateContext);
  if (!store)
    throw new Error("useAppState는 AppStateProvider 안에서만 쓸 수 있어요.");
  return store;
}

/**
 * 도감 슬라이스 전용 훅. 챌린지/제작 도감/등록 플로우 등 다른 상태 변경으로는
 * 리렌더되지 않아 도감 화면(그리드/상세)에서 사용하기 적합하다.
 */
export function useDexState() {
  const store = useContext(DexContext);
  if (!store)
    throw new Error("useDexState는 AppStateProvider 안에서만 쓸 수 있어요.");
  return store;
}
