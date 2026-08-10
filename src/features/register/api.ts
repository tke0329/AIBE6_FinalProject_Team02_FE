import { apiFetch } from '@/shared/lib/api'

/** 도감 칸 id → 별칭 목록. JSON 객체 키는 문자열이다. */
export type DexAliasMap = Record<string, string[]>

export async function fetchDexAliases(): Promise<DexAliasMap> {
    return apiFetch<DexAliasMap>('/api/v1/dex/aliases')
}
