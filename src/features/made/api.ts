import { apiFetch } from '@/shared/lib/api';
import type {
  MadeDexId,
  MadeDexInvite,
  MadeDexInvitePreview,
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
