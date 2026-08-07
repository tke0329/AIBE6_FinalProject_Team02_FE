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
