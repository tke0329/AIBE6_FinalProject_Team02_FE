import type { MetadataRoute } from 'next'

/**
 * `/manifest.webmanifest` — 홈 화면에 설치될 때 OS가 읽는 앱 정보.
 *
 * 정적 `public/manifest.json`이 아니라 이 파일로 두는 이유는 타입 검사를 받기
 * 때문이다. 오타 난 필드는 조용히 무시되기만 해서 배포 후에야 알게 된다.
 *
 * ## 아이콘이 세 장인 이유
 *
 * 플랫폼이 알파를 다르게 다룬다. `scripts/build-icons.mjs`가 원본 한 장에서 뽑는다.
 *
 *   - `any`      — 안드로이드·데스크톱. 알파를 그대로 그려서 투명 배경이 더 깔끔하다
 *   - `maskable` — 런처가 원·스퀴클로 자른다. 잘린 안쪽을 채워야 해서 배경 + 여백본
 *   - iOS        — `src/app/apple-icon.png` (Next 규약, link 태그 자동 생성)
 *
 * ## display: 'standalone'
 *
 * 주소창이 사라진다. **브라우저 뒤로가기도 같이 사라지므로** 화면 안에 돌아갈
 * 길이 반드시 있어야 한다 (DESIGN.md §2.0.1)
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        // 홈 화면 아이콘 아래 적히는 글자. 12자를 넘으면 잘려서 short_name을 따로 둔다
        name: 'CatchEat',
        short_name: 'CatchEat',
        description: '먹은 음식을 도감으로 모으는 기록 서비스',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // 폰 폭 단일 레이아웃(tailwind screens 봉인)이라 가로는 지원 대상이 아니다
        orientation: 'portrait',
        /**
         * 앱을 켜는 동안 잠깐 보이는 스플래시 바탕. 앱 배경(--surface-app)과 같게 둔다.
         * theme_color(상태바)는 viewport에서 정한다 — Next 14부터 그쪽으로 옮겨졌음
         */
        background_color: '#FFFFFF',
        theme_color: '#FFFFFF',
        icons: [
            { src: '/icon/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    }
}
