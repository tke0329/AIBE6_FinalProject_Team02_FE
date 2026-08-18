// 공통 API 클라이언트
// - 모든 요청에 credentials:'include'로 httpOnly 쿠키(access/refresh)를 실어 보낸다.
// - access 만료(401) 시 /api/v1/auth/reissue로 재발급한 뒤 원요청을 1회만 재시도한다.
//   (무한 재시도 방지: 딱 한 번만)
// - BASE URL은 환경변수(NEXT_PUBLIC_API_BASE_URL), 없으면 로컬 BE(8080)

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

/** 서버 공통 응답 형태 (AGENTS.md §6) */
export interface ApiResponse<T> {
    success: boolean
    data: T | null
    error: { code: string; message: string } | null
}

/** 인증이 풀렸을 때(재발급도 실패) 던지는 에러. 호출부에서 로그인 화면 유도에 사용. */
export class UnauthorizedError extends Error {
    constructor() {
        super('UNAUTHORIZED')
        this.name = 'UnauthorizedError'
    }
}

/**
 * 서버가 준 에러. message는 사용자 노출용, code는 분기용이다.
 *
 * Error를 상속하므로 `catch (e) { e.message }`로 쓰던 기존 호출부는 그대로 동작한다.
 * 코드로 갈라야 할 때만(예: RETRY_LIMIT_EXCEEDED → 수동 폴백 안내) code를 본다.
 */
export class ApiError extends Error {
    readonly code: string

    constructor(code: string, message: string) {
        super(message)
        this.name = 'ApiError'
        this.code = code
    }
}

/**
 * refresh 재발급 요청 (single-flight).
 * access 만료 시 여러 요청이 동시에 401을 받아도 재발급은 한 번만 나가도록
 * 진행 중인 재발급 Promise를 공유한다. (동시 재발급 → refresh 회전 경쟁 → 세션 드롭 방지)
 */
let reissueInFlight: Promise<boolean> | null = null
function reissue(): Promise<boolean> {
    if (!reissueInFlight) {
        reissueInFlight = fetch(`${API_BASE}/api/v1/auth/reissue`, {
            method: 'POST',
            credentials: 'include',
        })
            .then((res) => res.ok)
            .catch(() => false)
            .finally(() => {
                reissueInFlight = null
            })
    }
    return reissueInFlight
}

// 쿠키 파싱 유틸리티 함수
function getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null // SSR(서버 사이드) 방어

    const value = `; ${document.cookie}`
    // 운영(HTTPS) 환경의 __Host- 쿠키를 먼저 찾고, 없으면 로컬(HTTP) 환경의 일반 쿠키를 찾는다.
    let parts = value.split(`; __Host-XSRF-TOKEN=`)
    if (parts.length !== 2) {
        parts = value.split(`; XSRF-TOKEN=`)
    }

    if (parts.length === 2) {
        return decodeURIComponent(parts.pop()?.split(';').shift() || '')
    }
    return null
}

/**
 * 공용 요청 함수.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    // GET 요청이 아닐 경우에만 CSRF 토큰을 헤더에 추가
    const method = init.method?.toUpperCase() || 'GET'
    const csrfHeaders: Record<string, string> = {}

    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const csrfToken = getCsrfTokenFromCookie()
        if (csrfToken) {
            csrfHeaders['X-XSRF-TOKEN'] = csrfToken
        }
    }

    const doFetch = () =>
        fetch(`${API_BASE}${path}`, {
            ...init,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeaders, // CSRF 헤더 병합
                ...init.headers,
            },
        })

    let res = await doFetch()

    // access 만료로 401이면 → 재발급 시도 → 성공 시 원요청 1회 재시도
    if (res.status === 401) {
        const refreshed = await reissue()
        if (refreshed) res = await doFetch()
        // 재발급 실패했거나, 재시도했는데도 401이면 인증 만료로 처리
        if (!refreshed || res.status === 401) {
            try {
                console.warn('[auth] involuntary_logout', { path })
            } catch {}
            throw new UnauthorizedError()
        }
    }

    const body = (await res.json()) as ApiResponse<T>

    if (!res.ok || !body.success) {
        // 서버가 준 message를 그대로 에러로 전달 (호출부에서 사용자 노출 처리)
        throw new ApiError(body.error?.code ?? 'UNKNOWN', body.error?.message ?? `요청 실패 (${res.status})`)
    }

    return body.data as T
}
