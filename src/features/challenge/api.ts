import { apiFetch } from "@/shared/lib/api";

export type ChallengeType = 'FIRST_COME' | 'COLLECTION';
export type PeriodType = 'PERMANENT' | 'LIMITED';
export type VerifyType = 'FOOD' | 'LOCATION';

export interface CreateSlotInput {
  foodName: string;
  placeName?: string | null;
  lat?: number | null;
  lng?: number | null;
  imageKey?: string | null; // 개설자가 등록한 목표 음식 사진(S3 key)
}

export interface CreateChallengePayload {
  name: string;
  description?: string | null;
 challengeType: ChallengeType;
  periodType: PeriodType;
  verifyType?: VerifyType;    // FOOD(기본) / LOCATION(위치 인증)
  startsAt?: string | null;     // ISO, null이면 지금부터
  endsAt?: string | null;     // LIMITED면 필수
  rewardBadgeId?: number | null;
  slots: CreateSlotInput[];
}

export interface CreateChallengeResult {
  challengeId: number;
  remainingTickets: number;
}

/** 이번 달 남은 개설권 */
export function fetchCreationTickets() {
  return apiFetch<{ remaining: number }>("/api/v1/challenges/creation-tickets");
}

/** 챌린지 개설 */
export function createChallenge(payload: CreateChallengePayload) {
  return apiFetch<CreateChallengeResult>("/api/v1/challenges", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export interface ChallengeSummary {
  id: number;
  name: string;
  description: string | null;
  challengeType: ChallengeType;
  periodType: PeriodType;
  startsAt: string;
  endsAt: string | null;
  participantCount: number;
  totalSlots: number; // 전체 목표 수 (내 챌린지 진행도용, 탐색은 0)
  unlockedCount: number; // 내가 해금한 수 (내 챌린지 진행도용, 탐색은 0)
}

/** 챌린지 탐색 (진행중/완료) */
export function fetchChallenges(status: "ONGOING" | "FINISHED" = "ONGOING") {
  return apiFetch<ChallengeSummary[]>(`/api/v1/challenges?status=${status}`);
}

export type MyChallengeRelation = "CREATED" | "JOINED" | "COMPLETED";

/** 내 챌린지 (개설한 / 참여 중 / 완료한) */
export function fetchMyChallenges(relation: MyChallengeRelation) {
  return apiFetch<ChallengeSummary[]>(
    `/api/v1/challenges/mine?relation=${relation}`,
  );
}

export interface ChallengeSlotDetail {
  id: number;
  foodName: string;
  placeName: string | null;
  slotOrder: number;
  unlocked: boolean;
  imageUrl: string | null; // 개설자가 등록한 목표 사진(프리사인 URL). 미해금이면 흑백 표시
  myImageUrl: string | null; // 내가 인증한 사진(해금 시). 없으면 null
  unlockedAt: string | null; // 내가 인증한 시각. 없으면 null
}

export interface ChallengeDetailData {
  id: number;
  name: string;
  description: string | null;
  challengeType: ChallengeType;
  periodType: PeriodType;
  verifyType: VerifyType;
  startsAt: string;
  endsAt: string | null;
  rewardBadgeId: number | null;
  participantCount: number;
  joined: boolean;
  completed: boolean;
  slots: ChallengeSlotDetail[];
}

/** 챌린지 상세 */
export function fetchChallengeDetail(id: string | number) {
  return apiFetch<ChallengeDetailData>(`/api/v1/challenges/${id}`);
}

/** 챌린지 참여 */
export function joinChallenge(id: string | number) {
  return apiFetch<{ participantId: number }>(
    `/api/v1/challenges/${id}/participants`,
    {
      method: "POST",
    },
  );
}

/** 챌린지 포기(나가기) — 내 참여·인증 기록 삭제 */
export function leaveChallenge(id: string | number) {
  return apiFetch<void>(`/api/v1/challenges/${id}/participants`, {
    method: "DELETE",
  });
}

export interface UnlockResult {
  unlockedCount: number;
  totalSlots: number;
  completed: boolean;
}

/** 슬롯 인증(해금). imageKey는 사전에 S3에 올린 인증 사진 key. */
export function unlockSlot(
  id: string | number,
  slotId: string | number,
  imageKey: string,
  lat: number | null = null,   // 위치 인증 챌린지면 현재 위치
  lng: number | null = null,
) {
  return apiFetch<UnlockResult>(`/api/v1/challenges/${id}/unlocks`, {
    method: 'POST',
    body: JSON.stringify({ slotId: Number(slotId), imageKey, lat, lng }),
  });
}

export interface RewardPreset {
  code: string;
  name: string;
}

/** 보상 프리셋 목록 */
export function fetchRewardPresets() {
  return apiFetch<RewardPreset[]>("/api/v1/challenges/reward-badges/presets");
}

/** 보상 뱃지 생성 */
export function createRewardBadge(payload: {
  name: string;
  presetCode?: string | null;
  imageKey?: string | null;
}) {
  return apiFetch<{ badgeId: number }>("/api/v1/challenges/reward-badges", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface RewardBadgeInfo {
  id: number;
  name: string;
  code: string | null;
  imageUrl: string | null; // 제작=프리사인 URL, 프리셋=null(code로 매핑)
}

/** 보상 뱃지 표시 정보(상세 미리보기·완료 팝업) */
export function fetchRewardBadge(badgeId: number | string) {
  return apiFetch<RewardBadgeInfo>(
    `/api/v1/challenges/reward-badges/${badgeId}`,
  );
}
