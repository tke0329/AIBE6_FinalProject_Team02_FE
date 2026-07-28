import { apiFetch } from '@/shared/lib/api';

/** 도감 칸 id → 별칭 목록. JSON 객체 키는 문자열이다. */
export type DexAliasMap = Record<string, string[]>;

/**
 * 도감 별칭 사전. 등록 화면의 도감 검색이 초성·별칭을 흡수하려면 필요하다.
 *
 * 칸 목록은 `/api/v1/dex/basic`이 이미 주므로 여기서는 별칭만 받는다(약 5.5KB).
 * 실패해도 등록을 막지 않는다 — 별칭 없이 이름·초성 검색만으로도 고를 수 있다.
 */
export async function fetchDexAliases(): Promise<DexAliasMap> {
  return apiFetch<DexAliasMap>('/api/v1/dex/aliases');
}
