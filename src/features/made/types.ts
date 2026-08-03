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
