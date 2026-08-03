import { apiFetch } from '@/shared/lib/api';

export type ChallengeType = 'FIRST_COME' | 'COLLECTION';
export type PeriodType = 'PERMANENT' | 'LIMITED';

export interface CreateSlotInput {
  foodName: string;
  placeName?: string | null;
  lat?: number | null;
  lng?: number | null;
  imageKey?: string | null;   // 개설자가 등록한 목표 음식 사진(S3 key)
}

export interface CreateChallengePayload {
  name: string;
  description?: string | null;
  challengeType: ChallengeType;
  periodType: PeriodType;
  startsAt?: string | null;   // ISO, null이면 지금부터
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
  return apiFetch<{ remaining: number }>('/api/v1/challenges/creation-tickets');
}

/** 챌린지 개설 */
export function createChallenge(payload: CreateChallengePayload) {
  return apiFetch<CreateChallengeResult>('/api/v1/challenges', {
    method: 'POST',
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
}

/** 챌린지 탐색 (진행중/완료) */
export function fetchChallenges(status: 'ONGOING' | 'FINISHED' = 'ONGOING') {
  return apiFetch<ChallengeSummary[]>(`/api/v1/challenges?status=${status}`);
}

export interface ChallengeSlotDetail {
  id: number;
  foodName: string;
  placeName: string | null;
  slotOrder: number;
  unlocked: boolean;
  imageUrl: string | null;   // 개설자가 등록한 목표 사진(프리사인 URL). 미해금이면 흑백 표시
}

export interface ChallengeDetailData {
  id: number;
  name: string;
  description: string | null;
  challengeType: ChallengeType;
  periodType: PeriodType;
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
  return apiFetch<{ participantId: number }>(`/api/v1/challenges/${id}/participants`, {
    method: 'POST',
  });
}

export interface UnlockResult {
  unlockedCount: number;
  totalSlots: number;
  completed: boolean;
}

/** 슬롯 인증(해금). imageKey는 사전에 S3에 올린 인증 사진 key. */
export function unlockSlot(id: string | number, slotId: string | number, imageKey: string) {
  return apiFetch<UnlockResult>(`/api/v1/challenges/${id}/unlocks`, {
    method: 'POST',
    body: JSON.stringify({ slotId: Number(slotId), imageKey }),
  });
}