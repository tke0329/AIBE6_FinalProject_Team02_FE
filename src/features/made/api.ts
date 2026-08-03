import { apiFetch } from '@/shared/lib/api';
import type { MadeDexId, MadeDexSummary, MadeDexVisibility } from './types';

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
