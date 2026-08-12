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
        ]
    },
}

export default nextConfig
