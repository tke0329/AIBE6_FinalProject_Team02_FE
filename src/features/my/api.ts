import { apiFetch } from "@/shared/lib/api";

/** GET /api/v1/my/profile 응답 */
export interface MyProfile {
  nickname: string;
  nicknameChangeable: boolean; // 지금 닉네임 변경 가능한지 (1개월 제한 통과 여부)
  nicknameChangeableAt: string | null; // 다음 변경 가능 시각. null이면 즉시 가능
  profileImageUrl: string | null; // 표시용 이미지 URL. null이면 사진 없음(닉네임 첫 글자)
}

// PATCH /api/v1/my/profile-image — 프로필 사진 설정 (업로드된 S3 key 저장)
export function patchProfileImage(key: string): Promise<void> {
  return apiFetch<void>("/api/v1/my/profile-image", {
    method: "PATCH",
    body: JSON.stringify({ key }),
  });
}

// DELETE /api/v1/my/profile-image — 프로필 사진 제거 (닉네임 첫 글자로 복귀)
export function removeProfileImage(): Promise<void> {
  return apiFetch<void>("/api/v1/my/profile-image", { method: "DELETE" });
}

// POST /api/v1/my/nickname — 최초 닉네임 세팅 (온보딩 전)
// 규칙: 2~8자, 한글/영문/숫자/밑줄
export function postInitialNickname(nickname: string): Promise<void> {
  return apiFetch<void>("/api/v1/my/nickname", {
    method: "POST",
    body: JSON.stringify({ nickname }),
  });
}

// GET /api/v1/my/profile — 마이페이지 프로필(닉네임 + 변경 가능 여부/가능 시각)
export function getMyProfile(): Promise<MyProfile> {
  return apiFetch<MyProfile>("/api/v1/my/profile");
}

// PATCH /api/v1/my/nickname — 닉네임 변경 (1개월 1회)
// 너무 이르면 NICKNAME_CHANGE_TOO_SOON, 중복이면 NICKNAME_DUPLICATED 메시지가 던져진다.
export function patchNickname(nickname: string): Promise<void> {
  return apiFetch<void>("/api/v1/my/nickname", {
    method: "PATCH",
    body: JSON.stringify({ nickname }),
  });
}

// DELETE /api/v1/my — 회원 탈퇴(소프트 삭제)
// 세션 정리는 호출부에서 이어서 logout()으로 처리
export function withdrawAccount(): Promise<void> {
  return apiFetch<void>("/api/v1/my", { method: "DELETE" });
}

// GET /api/v1/my/badges 항목 (BE MyBadgeResponse와 일치)
export interface MyBadge {
  id: number;
  name: string;
  imageUrl: string | null; // null이면 프론트가 아이콘으로 대체
  acquiredAt: string; // ISO
  equipped: boolean; // 현재 대표 뱃지 여부
}

// GET /api/v1/my/badges — 내가 획득한 뱃지 목록(장착 표시 포함)
export function getMyBadges(): Promise<MyBadge[]> {
  return apiFetch<MyBadge[]>("/api/v1/my/badges");
}

// PATCH /api/v1/my/badges/equip — 대표 뱃지 장착/해제 (badgeId=null이면 해제)
export function equipBadge(badgeId: number | null): Promise<void> {
  return apiFetch<void>("/api/v1/my/badges/equip", {
    method: "PATCH",
    body: JSON.stringify({ badgeId }),
  });
}
