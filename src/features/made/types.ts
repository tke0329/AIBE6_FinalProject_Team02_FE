/** 서버가 발급한 made_dex.id */
export type MadeDexId = number;

export type MadeDexVisibility = 'PUBLIC' | 'PRIVATE';
export type MadeDexRole = 'OWNER' | 'MEMBER';

export interface MadeDexSummary {
  id: MadeDexId;
  name: string;
  description: string | null;
  visibility: MadeDexVisibility;
  memberCount: number;
  myRole: MadeDexRole;
}

/** URL 세그먼트를 MadeDexId로 좁힘. 숫자가 아니면 null */
export function parseMadeDexId(value: string | undefined): MadeDexId | null {
  if (!value) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** BE InviteCodeGenerator.LENGTH와 맞춘다 */
export const INVITE_CODE_LENGTH = 6;

export interface MadeDexInvite {
  code: string;
  /** ISO 문자열. 발급 시각 + 7일 */
  expiresAt: string;
}

export interface MadeDexInvitePreview {
  madeDexId: MadeDexId;
  name: string;
  description: string | null;
  memberCount: number;
  maxMembers: number;
  alreadyMember: boolean;
}

/** 입력값을 서버가 보는 형태(대문자 영숫자)로 맞춘다 */
export function normalizeInviteCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, INVITE_CODE_LENGTH);
}

/** 만료까지 남은 일수(올림). 지났으면 0 */
export function inviteDaysLeft(expiresAt: string, now = Date.now()): number {
  const remain = new Date(expiresAt).getTime() - now;
  return remain <= 0 ? 0 : Math.ceil(remain / (24 * 60 * 60 * 1000));
}

export interface MadeParticipant {
  id: string;
  name: string;
}

export interface MadeCard {
  name: string;
  emoji: string;
  /** 등록한 참여자 이름 */
  by: string;
  location: string;
  tags: string[];
}
