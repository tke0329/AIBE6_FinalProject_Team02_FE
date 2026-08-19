import { expect, test, jest } from '@jest/globals'

test('동시 401이어도 reissue는 한 번만 호출된다', async () => {
    let reissueCalls = 0
    global.fetch = jest.fn(async (url: string | Request | URL) => {
        const urlStr = url.toString()
        if (urlStr.endsWith('/api/v1/auth/reissue')) {
            reissueCalls++
            await new Promise((r) => setTimeout(r, 20)) // 재발급 지연
            return { ok: true } as Response
        }
        const expired = reissueCalls === 0 // 재발급 전엔 401
        return {
            ok: !expired,
            status: expired ? 401 : 200,
            json: async () => ({ success: true, data: {}, error: null }),
        } as Response
    }) as unknown as typeof fetch

    // 테스트 간 격리를 위해 모듈 초기화 (jest.resetModules() 와 유사 효과)
    const { apiFetch } = await import('@/shared/lib/api')

    // 동시에 3개의 API 호출
    await Promise.all([
        apiFetch('/api/v1/x').catch(() => {}),
        apiFetch('/api/v1/y').catch(() => {}),
        apiFetch('/api/v1/z').catch(() => {}),
    ])

    // 변경 후: 1, 변경 전: 3
    expect(reissueCalls).toBe(1)
})
