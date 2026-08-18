/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        /**
         * `@/shared/ui` 배럴을 실제 파일 import로 바꿔 준다.
         * 없으면 ServerBadge 하나 쓰는 화면도 공통 UI 전체(framer-motion·Calendar 등)를 끌고 온다
         */
        optimizePackageImports: ['@/shared/ui'],
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**.s3.ap-northeast-2.amazonaws.com' },
            { protocol: 'https', hostname: '**.amazonaws.com' },
        ],
    },
    async headers() {
        return [
            {
                /**
                 * 서비스워커 스크립트는 캐시되면 안 된다.
                 *
                 * CDN이 물고 있으면 배포해도 **새 워커가 내려오지 않는다.** 워커는
                 * 한번 등록되면 브라우저에 남아서, 이 한 줄이 빠지면 나중에 캐싱
                 * 전략을 바꿀 때 사용자에게 반영할 방법이 없어진다
                 */
                source: '/sw.js',
                headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
            },
            {
                /**
                 * 기본도감 일러스트. `public/` 기본값은 `max-age=0`이라 방문할 때마다
                 * 칸 수만큼 조건부 요청(304)이 왕복한다. 도감은 한 화면에 수십 칸이라
                 * 그 왕복이 그대로 체감되므로 하루를 물려 둔다.
                 *
                 * 파일명에 해시가 없어서 그림을 교체하면 최대 하루까지 옛 그림이 남는다.
                 * 급히 반영해야 하면 파일명을 바꾸고 매니페스트를 다시 구우면 된다
                 * (`npm run build:illustrations`)
                 */
                source: '/illustrate/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
            },
        ]
    },
}

export default nextConfig
