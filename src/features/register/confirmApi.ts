import { apiFetch } from '@/shared/lib/api';

export interface CardInput {
  slotId: number;
  /** 비우면 서버가 분석 사진을 자동 첨부한다 (§5.2 등록 이탈 방지) */
  cardPhotoKeys: string[];
  /** 미지정이면 첫 번째 카드 사진 */
  thumbnailKey: string | null;
  memo: string | null;
}

export interface LocationInput {
  name: string;
  lat: number | null;
  lng: number | null;
}

export interface UnlockedSlot {
  slotId: number;
  slotName: string;
  category: string;
  cardId: number;
  /** 별 랭크 1~3 */
  rank: number;
  /** true면 첫 해금 연출, false면 가벼운 "+1 수집" 차등 연출 (§5.1) */
  firstUnlock: boolean;
}

/** 관리자가 수락해야 열린다. 카드는 이미 만들어져 있고 "검토 대기" 배지가 붙는다 */
export interface PendingSlot {
  slotId: number;
  slotName: string;
  category: string;
  cardId: number;
}

export interface ConfirmResult {
  registrationId: number;
  unlocked: UnlockedSlot[];
  awaitingReview: PendingSlot[];
  collectedCount: number;
  totalSlots: number;
}

/**
 * 음식별 기록을 마치고 도감을 연다.
 *
 * 위치는 등록 건 공통이라 카드마다 보내지 않는다 (§5.2 — 같은 등록 건에 일괄 적용).
 */
export async function confirmRegistration(
  registrationId: number,
  cards: CardInput[],
  location: LocationInput | null,
): Promise<ConfirmResult> {
  return apiFetch<ConfirmResult>(`/api/v1/register/registrations/${registrationId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ cards, location }),
  });
}
