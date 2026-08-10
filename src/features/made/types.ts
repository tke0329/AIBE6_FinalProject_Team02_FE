/** 서버가 발급한 made_dex.id */
export type MadeDexId = number

export type MadeDexVisibility = 'PUBLIC' | 'PRIVATE'
export type MadeDexRole = 'OWNER' | 'MEMBER'

export interface MadeDexSummary {
    id: MadeDexId
    name: string
    description: string | null
    visibility: MadeDexVisibility
    /** 표지를 안 고른 도감은 null. 목록은 이모지 표지로 대체한다 */
    imageUrl: string | null
    memberCount: number
    myRole: MadeDexRole
}

export interface MadeDexDetail {
    madeDexId: MadeDexId
    name: string
    description: string | null
    visibility: MadeDexVisibility
    imageUrl: string | null
    /** 표지를 그대로 두고 수정할 때 되돌려 보낸다 */
    imageKey: string | null
    memberCount: number
    maxMembers: number
    /** 참여자가 아니면 null. 공개 도감은 참여 없이도 열람된다 */
    myRole: MadeDexRole | null
    /** ISO 문자열 */
    createdAt: string
}

/** 개설일부터 오늘까지 며칠째인지. 만든 날이 1일째 */
export function madeDexDayCount(createdAt: string, now = Date.now()): number {
    const start = new Date(createdAt).setHours(0, 0, 0, 0)
    const today = new Date(now).setHours(0, 0, 0, 0)
    return Math.max(Math.floor((today - start) / (24 * 60 * 60 * 1000)) + 1, 1)
}

/** URL 세그먼트를 MadeDexId로 좁힘. 숫자가 아니면 null */
export function parseMadeDexId(value: string | undefined): MadeDexId | null {
    if (!value) return null
    const id = Number(value)
    return Number.isSafeInteger(id) && id > 0 ? id : null
}

/** BE InviteCodeGenerator.LENGTH와 맞춘다 */
export const INVITE_CODE_LENGTH = 6

export interface MadeDexInvite {
    code: string
    /** ISO 문자열. 발급 시각 + 7일 */
    expiresAt: string
}

export interface MadeDexInvitePreview {
    madeDexId: MadeDexId
    name: string
    description: string | null
    memberCount: number
    maxMembers: number
    alreadyMember: boolean
}

/** 입력값을 서버가 보는 형태(대문자 영숫자)로 맞춘다 */
export function normalizeInviteCode(value: string): string {
    return value
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, INVITE_CODE_LENGTH)
}

/** 만료까지 남은 일수(올림). 지났으면 0 */
export function inviteDaysLeft(expiresAt: string, now = Date.now()): number {
    const remain = new Date(expiresAt).getTime() - now
    return remain <= 0 ? 0 : Math.ceil(remain / (24 * 60 * 60 * 1000))
}

/** BE MadeDex.MAX_MEMBERS와 맞춘다 — 넘기면 서버가 MADE_DEX_FULL로 막는다 */
export const MADE_DEX_MAX_MEMBERS = 12

/** 표지를 고르지 않은 도감이 쓰는 기본 이미지 */
export const DEFAULT_MADE_DEX_COVER = '/images/default_made_dex.png'

export interface MadeDexMember {
    userId: number
    nickname: string | null
    profileImageUrl: string | null
    role: MadeDexRole
    /** ISO 문자열 */
    joinedAt: string
    me: boolean
}

export interface MadeDexMembers {
    madeDexId: MadeDexId
    name: string
    maxMembers: number
    myRole: MadeDexRole
    members: MadeDexMember[]
}

export function memberName(member: MadeDexMember): string {
    return member.nickname?.trim() || '이름 없는 참여자'
}

export function memberInitial(member: MadeDexMember): string {
    return memberName(member).charAt(0)
}
