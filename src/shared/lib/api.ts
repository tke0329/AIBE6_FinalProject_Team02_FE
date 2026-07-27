/**
 * 공용 API 클라이언트.
 * - 모든 요청에 credentials:'include'로 httpOnly 쿠키(access/refresh)를 실어 보낸다.
 * - access 만료(401) 시 /api/v1/auth/reissue로 재발급한 뒤 원요청을 1회만 재시도한다.
 *   (무한 재시도 방지: 재시도 플래그로 딱 한 번만)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/** 서버 공통 응답 형태 (AGENTS.md §6) */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

/** 인증이 풀렸을 때(재발급도 실패) 던지는 에러. 호출부에서 로그인 화면 유도에 사용. */
export class UnauthorizedError extends Error {
  constructor() {
    super('UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/** refresh 재발급 요청. 성공하면 새 쿠키가 자동으로 세팅된다. */
async function reissue(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/v1/auth/reissue`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.ok;
}

/**
 * 공용 요청 함수.
 * @param path  "/api/v1/..." 형태의 경로
 * @param init  fetch 옵션 (method, body 등)
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include', // 쿠키 전송 필수
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

  let res = await doFetch();

  // access 만료로 401이면 → 재발급 시도 → 성공 시 원요청 1회 재시도
  if (res.status === 401) {
    const refreshed = await reissue();
    if (refreshed) {
      res = await doFetch();
    }
    // 재발급 실패했거나, 재시도했는데도 401이면 인증 만료로 처리
    if (!refreshed || res.status === 401) {
      throw new UnauthorizedError();
    }
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !body.success) {
    // 서버가 준 code/message를 그대로 에러로 전달 (호출부에서 사용자 노출 처리)
    throw new Error(body.error?.message ?? `요청 실패 (${res.status})`);
  }

  return body.data as T;
}