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
  // NOTE: FIRST_MADE_DEX("첫 만남은 너무 어려워")는 아직 이미지 없음 → 추가되면 여기 매핑
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
