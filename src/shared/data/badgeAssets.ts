/**
 * 시스템 뱃지 code → public 정적 이미지 매핑.
 * BE badge.code(마이그레이션 V24 시드)와 1:1로 맞춘다.
 * 챌린지 커스텀 뱃지는 code가 없고 image_url(S3)로 렌더 → 여기 없음.
 */
export const BADGE_ASSETS: Record<string, string> = {
  // 수저 티어 (기본 도감 수집률)
  SPOON_STEEL: "/badge/basic_dex_badge/default_badge.png", // 가입 시
  SPOON_BRONZE: "/badge/basic_dex_badge/bronze_badge.png", // 25%
  SPOON_SILVER: "/badge/basic_dex_badge/silver_badge.png", // 50%
  SPOON_GOLD: "/badge/basic_dex_badge/gold_badge.png", // 75%
  SPOON_DIAMOND: "/badge/basic_dex_badge/diamond_badge.png", // 100%

  // 카테고리 완전수집
  CATEGORY_RICE_DISH: "/badge/category_badge/rice.png",
  CATEGORY_NOODLE: "/badge/category_badge/noodle.png",
  CATEGORY_SOUP_STEW: "/badge/category_badge/soup.png",
  CATEGORY_MEAT_DISH: "/badge/category_badge/meat.png",
  CATEGORY_FRIED: "/badge/category_badge/friedfood.png",
  CATEGORY_SEAFOOD: "/badge/category_badge/seafood.png",
  CATEGORY_STREET: "/badge/category_badge/snackfood.png", // 분식·길거리
  CATEGORY_BREAD: "/badge/category_badge/bread.png",
  CATEGORY_DESSERT: "/badge/category_badge/dessert.png",

  // 챌린지 보상 프리셋
  CHALLENGE_PRESET_EXPLORER: "/badge/challenge_default_badge/Food_Explorer.png", // 맛집 탐험가
  CHALLENGE_PRESET_FINISHER: "/badge/challenge_default_badge/Challenge_Finisher.png", // 챌린지 완주자
  CHALLENGE_PRESET_PIONEER: "/badge/challenge_default_badge/Neighborhood_Adventurer.png", // 동네 개척자

  // 제작 도감
  FIRST_MADE_DEX: "/badge/custom_dex/custom_firstmade_badge.png", // 첫 만남은 너무 어려워
};

/**
 * 뱃지 표시 이미지 소스 결정.
 * 업로드 이미지(챌린지 커스텀, S3)가 우선, 없으면 code로 정적 에셋 매핑, 둘 다 없으면 null(아이콘 대체).
 */
export function resolveBadgeImage(
  code: string | null | undefined,
  imageUrl: string | null | undefined,
): string | null {
  if (imageUrl) return imageUrl;
  if (code && BADGE_ASSETS[code]) return BADGE_ASSETS[code];
  return null;
}

/** 뱃지 그룹(결). code 규칙으로 판정 — BE badge.code(V24 시드)와 짝을 맞춘다. */
export type BadgeGroup = "CHALLENGE" | "MADE_DEX" | "SPOON" | "CATEGORY" | "ETC";

/** code로 그룹을 판정. 챌린지 커스텀은 code가 없으므로(S3 이미지) 챌린지로. */
export function badgeGroupOf(code: string | null | undefined): BadgeGroup {
  if (!code) return "CHALLENGE"; // 챌린지 커스텀(개설자 제작, imageUrl로 렌더)
  if (code.startsWith("CHALLENGE_PRESET")) return "CHALLENGE";
  if (code === "FIRST_MADE_DEX") return "MADE_DEX";
  if (code.startsWith("SPOON_")) return "SPOON"; // 쇠·동·은·금·다이아
  if (code.startsWith("CATEGORY_")) return "CATEGORY";
  return "ETC";
}

/** 보관함 섹션 표시 순서 */
export const BADGE_GROUP_ORDER: BadgeGroup[] = [
  "CHALLENGE",
  "MADE_DEX",
  "SPOON",
  "CATEGORY",
  "ETC",
];

/** 섹션 제목 */
export const BADGE_GROUP_LABEL: Record<BadgeGroup, string> = {
  CHALLENGE: "챌린지",
  MADE_DEX: "제작 도감",
  SPOON: "기본 도감 수집률",
  CATEGORY: "기본 도감 카테고리",
  ETC: "기타",
};
