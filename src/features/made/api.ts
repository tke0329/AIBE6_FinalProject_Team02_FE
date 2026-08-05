import { apiFetch } from '@/shared/lib/api';
import type {
  MadeDexDetail,
  MadeDexId,
  MadeDexInvite,
  MadeDexInvitePreview,
  MadeDexMembers,
  MadeDexSummary,
  MadeDexVisibility,
} from './types';

/** BE MadeDex.NAME_MAX / DESCRIPTION_MAX와 맞춘다 — 넘기면 서버가 막는다 */
export const MADE_DEX_NAME_MAX = 100;
export const MADE_DEX_DESCRIPTION_MAX = 500;

interface MadeDexCreateRequest {
  name: string;
  description?: string;
  visibility: MadeDexVisibility;
  /** S3에 먼저 올리고 받은 key */
  imageKey?: string;
}

/** null은 "안 바꿈"이 아니라 "비움"이다 */
interface MadeDexUpdateRequest {
  name: string;
  description: string | null;
  visibility: MadeDexVisibility;
  imageKey: string | null;
}

/** 내가 속한 그룹만. 개설한 것과 참여한 것이 함께 온다 */
export function fetchMyMadeDexes(): Promise<MadeDexSummary[]> {
  return apiFetch<MadeDexSummary[]>('/api/v1/made-dexes');
}

export async function createMadeDex(
  request: MadeDexCreateRequest,
): Promise<MadeDexId> {
  const { madeDexId } = await apiFetch<{ madeDexId: MadeDexId }>(
    '/api/v1/made-dexes',
    { method: 'POST', body: JSON.stringify(request) },
  );
  return madeDexId;
}

/**
 * 현재 유효한 초대 코드. 한 번도 안 뽑았거나 7일이 지났으면 null이 온다.
 * 그룹장만 호출할 수 있다.
 */
/** 도감 상세. 공개 도감은 참여하지 않아도 볼 수 있다 */
export function fetchMadeDexDetail(madeDexId: MadeDexId): Promise<MadeDexDetail> {
  return apiFetch<MadeDexDetail>(`/api/v1/made-dexes/${madeDexId}`);
}

/** 도감 정보 수정. 그룹장만. 부분 수정이 아니라 보낸 값으로 전부 교체된다 */
export function updateMadeDex(
  madeDexId: MadeDexId,
  request: MadeDexUpdateRequest,
): Promise<void> {
  return apiFetch<void>(`/api/v1/made-dexes/${madeDexId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function fetchActiveInvite(
  madeDexId: MadeDexId,
): Promise<MadeDexInvite | null> {
  return apiFetch<MadeDexInvite | null>(
    `/api/v1/made-dexes/${madeDexId}/invites/active`,
  );
}

/** 코드 발급/재발급. 살아 있던 코드는 이 호출로 무효화된다 */
export function issueInvite(madeDexId: MadeDexId): Promise<MadeDexInvite> {
  return apiFetch<MadeDexInvite>(`/api/v1/made-dexes/${madeDexId}/invites`, {
    method: 'POST',
  });
}

/** 링크로 들어온 사람에게 참여 전 보여줄 그룹 정보 */
export function fetchInvitePreview(
  code: string,
): Promise<MadeDexInvitePreview> {
  return apiFetch<MadeDexInvitePreview>(
    `/api/v1/made-dexes/invites/${encodeURIComponent(code)}`,
  );
}

export async function joinMadeDex(code: string): Promise<MadeDexId> {
  const { madeDexId } = await apiFetch<{ madeDexId: MadeDexId }>(
    '/api/v1/made-dexes/join',
    { method: 'POST', body: JSON.stringify({ code }) },
  );
  return madeDexId;
}

/** 참여자 목록. 멤버가 아니면 403이다 */
export function fetchMadeDexMembers(
  madeDexId: MadeDexId,
): Promise<MadeDexMembers> {
  return apiFetch<MadeDexMembers>(`/api/v1/made-dexes/${madeDexId}/members`);
}

/** 그룹장이 참여자를 내보낸다 */
export function kickMadeDexMember(
  madeDexId: MadeDexId,
  targetUserId: number,
): Promise<void> {
  return apiFetch<void>(
    `/api/v1/made-dexes/${madeDexId}/members/${targetUserId}`,
    { method: 'DELETE' },
  );
}

/** 자유 탈퇴. 그룹장이 나가면 그룹이 삭제된다 */
export function leaveMadeDex(
  madeDexId: MadeDexId,
): Promise<{ groupDeleted: boolean }> {
  return apiFetch<{ groupDeleted: boolean }>(
    `/api/v1/made-dexes/${madeDexId}/members/me`,
    { method: 'DELETE' },
  );
}

/** 그룹장 위임. 넘긴 사람은 일반 멤버가 된다 */
export function transferMadeDexOwner(
  madeDexId: MadeDexId,
  userId: number,
): Promise<void> {
  return apiFetch<void>(`/api/v1/made-dexes/${madeDexId}/owner`, {
    method: 'PATCH',
    body: JSON.stringify({ userId }),
  });
}
