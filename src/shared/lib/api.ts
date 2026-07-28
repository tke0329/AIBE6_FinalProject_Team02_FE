// 공통 API 클라이언트
// - 모든 요청에 credentials:'include'로 httpOnly 쿠키(access/refresh)를 실어 보낸다.
// - access 만료(401) 시 /api/v1/auth/reissue로 재발급한 뒤 원요청을 1회만 재시도한다.
//   (무한 재시도 방지: 딱 한 번만)
// - BASE URL은 환경변수(NEXT_PUBLIC_API_BASE_URL), 없으면 로컬 BE(8080)

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/** 서버 공통 응답 형태 (AGENTS.md §6) */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

/** 인증이 풀렸을 때(재발급도 실패) 던지는 에러. 호출부에서 로그인 화면 유도에 사용. */
export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/**
 * 서버가 준 에러. message는 사용자 노출용, code는 분기용이다.
 *
 * Error를 상속하므로 `catch (e) { e.message }`로 쓰던 기존 호출부는 그대로 동작한다.
 * 코드로 갈라야 할 때만(예: RETRY_LIMIT_EXCEEDED → 수동 폴백 안내) code를 본다.
 */
export class ApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

/** refresh 재발급 요청. 성공하면 새 쿠키가 자동으로 세팅된다. */
async function reissue(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/v1/auth/reissue`, {
    method: "POST",
    credentials: "include",
  });
  return res.ok;
}

/**
 * 공용 요청 함수.
 * @param path  "/api/v1/..." 형태의 경로
 * @param init  fetch 옵션 (method, body 등)
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include", // 쿠키 전송 필수
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

  let res = await doFetch();

  // access 만료로 401이면 → 재발급 시도 → 성공 시 원요청 1회 재시도
  if (res.status === 401) {
    const refreshed = await reissue();
    if (refreshed) res = await doFetch();
    // 재발급 실패했거나, 재시도했는데도 401이면 인증 만료로 처리
    if (!refreshed || res.status === 401) throw new UnauthorizedError();
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !body.success) {
    // 서버가 준 message를 그대로 에러로 전달 (호출부에서 사용자 노출 처리)
    throw new ApiError(
      body.error?.code ?? "UNKNOWN",
      body.error?.message ?? `요청 실패 (${res.status})`,
    );
  }

  return body.data as T;
}
