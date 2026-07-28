const CHOSUNG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

const CHOSUNG_SET = new Set<string>(CHOSUNG);

const SYLLABLE_FIRST = 0xac00; // '가'
const SYLLABLE_LAST = 0xd7a3; // '힣'
/** 중성 21 × 종성 28 — 초성 하나가 차지하는 음절 수 */
const SYLLABLES_PER_CHOSUNG = 21 * 28;

/**
 * 한글 음절은 초성으로 바꾸고 나머지 문자는 그대로 둔다.
 * "LA갈비" → "LAㄱㅂ" 처럼 섞인 이름도 초성으로 찾을 수 있어야 한다.
 */
export function toChosung(value: string): string {
  let result = "";
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code >= SYLLABLE_FIRST && code <= SYLLABLE_LAST) {
      result +=
        CHOSUNG[Math.floor((code - SYLLABLE_FIRST) / SYLLABLES_PER_CHOSUNG)];
    } else {
      result += char;
    }
  }
  return result;
}

/** 질의가 초성만으로 이뤄졌는지. "ㄱㅊ"는 true, "김ㅊ"·"김치"는 false. */
export function isChosungOnly(value: string): boolean {
  if (!value) return false;
  for (const char of value) {
    if (!CHOSUNG_SET.has(char)) return false;
  }
  return true;
}

/** 공백·가운뎃점·하이픈은 표기 흔들림일 뿐이라 검색에서 무시한다. */
export function normalizeQuery(value: string): string {
  return value.replace(/[\s·\-_]/g, "").toLowerCase();
}

/** 검색 대상이 갖춰야 할 최소 형태. 호출부의 구체 타입(DexEntry 등)은 그대로 보존된다. */
export interface DexSearchable {
  id: number;
  name: string;
}

interface IndexedSlot<T extends DexSearchable> {
  slot: T;
  normalizedName: string;
  chosungName: string;
  normalizedAliases: string[];
  chosungAliases: string[];
}

export interface DexSearchIndex<T extends DexSearchable> {
  readonly slots: readonly IndexedSlot<T>[];
}

/** 어느 갈래로도 안 걸림 */
const NO_MATCH = Number.MAX_SAFE_INTEGER;

/**
 * @param aliasesBySlotId 서버 `/api/v1/dex/aliases` 응답. JSON 키는 문자열이라 숫자 키도 함께 받는다.
 */
export function buildDexSearchIndex<T extends DexSearchable>(
  slots: readonly T[],
  aliasesBySlotId: Readonly<Record<string, string[]>> = {},
): DexSearchIndex<T> {
  return {
    slots: slots.map((slot) => {
      const normalizedName = normalizeQuery(slot.name);
      const normalizedAliases = (aliasesBySlotId[String(slot.id)] ?? []).map(
        normalizeQuery,
      );

      return {
        slot,
        normalizedName,
        chosungName: toChosung(normalizedName),
        normalizedAliases,
        chosungAliases: normalizedAliases.map(toChosung),
      };
    }),
  };
}

function scoreText(entry: IndexedSlot<DexSearchable>, query: string): number {
  if (entry.normalizedName === query) return 0;
  if (entry.normalizedName.startsWith(query)) return 1;
  if (entry.normalizedName.includes(query)) return 2;
  if (entry.normalizedAliases.includes(query)) return 3;
  if (entry.normalizedAliases.some((alias) => alias.includes(query))) return 4;
  return NO_MATCH;
}

function scoreChosung(
  entry: IndexedSlot<DexSearchable>,
  query: string,
): number {
  if (entry.chosungName === query) return 0;
  if (entry.chosungName.startsWith(query)) return 1;
  if (entry.chosungName.includes(query)) return 2;
  if (entry.chosungAliases.some((alias) => alias.startsWith(query))) return 3;
  if (entry.chosungAliases.some((alias) => alias.includes(query))) return 4;
  return NO_MATCH;
}

/**
 * 이름·별칭·초성 세 갈래로 매칭하고 걸린 갈래에 따라 순위를 매긴다.
 * "냉면"처럼 여러 칸에 걸리는 질의는 걸린 칸을 전부 돌려준다 —
 * 하나로 좁히면 유저가 물냉면/비빔냉면을 고를 기회를 잃는다.
 */
export function searchDex<T extends DexSearchable>(
  index: DexSearchIndex<T>,
  rawQuery: string,
  limit = 10,
): T[] {
  const query = normalizeQuery(rawQuery ?? "");
  if (!query) return [];

  // 초성 질의는 비교 대상이 이름이 아니라 이름의 초성이라 먼저 갈라야 한다.
  const chosungQuery = isChosungOnly(query);

  return index.slots
    .map((entry) => ({
      entry,
      rank: chosungQuery ? scoreChosung(entry, query) : scoreText(entry, query),
    }))
    .filter((scored) => scored.rank !== NO_MATCH)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        // 같은 순위면 짧은 이름이 대개 유저가 찾던 쪽이다 (냉면 → 물냉면 > 비빔냉면)
        a.entry.slot.name.length - b.entry.slot.name.length ||
        a.entry.slot.id - b.entry.slot.id,
    )
    .slice(0, limit)
    .map((scored) => scored.entry.slot);
}
