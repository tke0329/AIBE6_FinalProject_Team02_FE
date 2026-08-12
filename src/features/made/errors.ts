import { ApiError, UnauthorizedError } from '@/shared/lib/api'

const MESSAGES: Record<string, string> = {
    MADE_DEX_NOT_FOUND: '사라진 도감이에요.',
    MADE_DEX_NOT_MEMBER: '참여 중인 도감이 아니에요.',
    MADE_DEX_MEMBER_NOT_FOUND: '이미 나간 참여자예요.',
    MADE_DEX_FULL: '인원이 가득 찬 도감이에요.',
    MADE_DEX_ALREADY_JOINED: '이미 이 제작 도감에 참여 중이에요.',
    MADE_DEX_INVITE_CODE_REQUIRED: '초대 코드를 입력해 주세요.',
    MADE_DEX_INVITE_CODE_INVALID: '존재하지 않는 초대 코드예요.',
    MADE_DEX_INVITE_CODE_EXPIRED: '만료된 초대 코드예요. 새 코드를 요청해 주세요.',
}

/** 폴백 문구는 화면마다 달라서 인자로 받는다 */
export function madeErrorMessage(failure: unknown, fallback: string): string {
    if (failure instanceof UnauthorizedError) {
        return '로그인이 풀렸어요. 다시 로그인해 주세요.'
    }
    if (failure instanceof ApiError) {
        return MESSAGES[failure.code] ?? failure.message
    }
    return fallback
}

/** 코드 관리는 그룹장 전용이다. 멤버에게는 에러가 아니라 화면 상태로 다룬다 */
export function isNotOwner(failure: unknown): boolean {
    return failure instanceof ApiError && failure.code === 'MADE_DEX_NOT_OWNER'
}

function hasCode(failure: unknown, code: string): boolean {
    return failure instanceof ApiError && failure.code === code
}

// 슬롯·기록 에러는 서버 문구를 그대로 쓴다. 여기 옮겨 적으면 서버가 문구를 고쳤을 때 둘이 갈라진다.
// 화면이 문구가 아니라 동작을 바꿔야 하는 것만 아래로 분기한다.

/** 다른 멤버가 먼저 순서를 바꿨다. 문구를 띄우기 전에 목록을 다시 읽어야 한다 */
export function isSlotOrderStale(failure: unknown): boolean {
    return hasCode(failure, 'MADE_DEX_SLOT_ORDER_MISMATCH')
}

/** 이름 필드 옆에 붙여야 하는 에러다. 시트를 닫으면 안 된다 */
export function isSlotNameTaken(failure: unknown): boolean {
    return hasCode(failure, 'MADE_DEX_SLOT_NAME_DUPLICATED')
}

/**
 * 폼을 열어 둔 사이 자정을 넘겼다. 문구만 띄우면 사용자는 여전히 어제 화면에 갇힌다 —
 * 화면이 기준일을 다시 받아 오늘로 옮겨 줘야 한다.
 */
export function isPastDate(failure: unknown): boolean {
    return hasCode(failure, 'MADE_DEX_RECORD_PAST_DATE')
}

/** 그 끼니는 이미 찼다. 문구와 함께 어떤 끼니가 남았는지 다시 읽어야 한다 */
export function isSlotTaken(failure: unknown): boolean {
    return hasCode(failure, 'MADE_DEX_RECORD_SLOT_TAKEN')
}

/** 남이 나를 내보냈거나 그룹이 사라졌다. 이 화면에 머무를 수 없다 */
export function isNotMember(failure: unknown): boolean {
    return hasCode(failure, 'MADE_DEX_NOT_MEMBER') || hasCode(failure, 'MADE_DEX_NOT_FOUND')
}
