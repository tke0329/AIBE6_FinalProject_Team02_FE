// 닉네임 공통 규칙 — 2~8자, 한글/영문/숫자/밑줄
export const NICKNAME_RE = /^[가-힣a-zA-Z0-9_]{2,8}$/
export const NICKNAME_MAX = 8
export const NICKNAME_HINT = '2~8자, 한글·영문·숫자·밑줄만 쓸 수 있어요.'

/** 앞뒤 공백 제거 후 형식 통과 여부 */
export function isValidNickname(value: string): boolean {
    return NICKNAME_RE.test(value.trim())
}
