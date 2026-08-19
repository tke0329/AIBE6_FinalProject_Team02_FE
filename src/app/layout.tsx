import { AuthProvider } from '@/features/auth/AuthContext'
import { AuthGate } from '@/features/auth/AuthGate'
import { NotificationProvider } from '@/features/notification/NotificationContext'
import { GuideProvider } from '@/features/onboarding/GuideProvider'
import { ServiceWorkerRegister } from '@/shared/pwa/ServiceWorkerRegister'
import { AppStateProvider } from '@/shared/store/AppStateProvider'
import { ToastProvider } from '@/shared/ui'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
    // 서비스 이름은 CatchEat 하나로 쓴다. 여기에만 '먹킷리스트 도감'이 남아 있었음
    title: 'CatchEat',
    description: '먹은 음식을 도감으로 모으는 기록 서비스',
    applicationName: 'CatchEat',
    /**
     * `app/manifest.ts`가 만드는 경로. 규약상 link가 자동으로 붙지만 명시해 둔다 —
     * 홈 화면 설치가 되는지는 이 한 줄에 달려서 조용히 빠지면 원인 찾기가 어렵다
     */
    manifest: '/manifest.webmanifest',
    appleWebApp: {
        // iOS에서 홈 화면 아이콘을 눌렀을 때 사파리가 아니라 앱처럼 뜨게 하는 스위치
        capable: true,
        title: 'CatchEat',
        /**
         * 'black-translucent'는 내용이 상태바 아래로 파고든다. 그건 안전 영역을
         * 전부 처리한 뒤에 켤 것 (viewport.viewportFit과 한 묶음) — 아래 주석 참고
         */
        statusBarStyle: 'default',
    },
    /**
     * Next 15의 `appleWebApp.capable`은 표준 이름인 `mobile-web-app-capable`만
     * 내보낸다(빌드 산출물에서 확인). iOS 16.4부터는 manifest의 `display`를 읽으니
     * 그것만으로도 앱처럼 뜨지만, 그 아래 버전은 애플 접두사 쪽을 본다.
     * 폐기 예정 이름이라도 무해하니 같이 붙여 둔다
     */
    other: { 'apple-mobile-web-app-capable': 'yes' },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    // maximumScale은 두지 않는다 — 확대를 막으면 WCAG 2.2 §1.4.4(Resize Text) 위반.
    // 입력 포커스 시 iOS 자동 확대는 폰트 16px 이상으로 막고 있다
    //
    /**
     * 설치형 상태바 색. 앱 배경(--surface-app)과 같게 둬서 경계가 안 보이게 한다
     */
    themeColor: '#FFFFFF',
    /**
     * `viewportFit: 'cover'`는 **아직 켜지 않는다.**
     *
     * 켜면 노치·홈바 자리까지 뷰포트가 되면서 `env(safe-area-inset-*)`가 실제 값을
     * 갖는다. 그런데 지금 안전 영역을 더하는 곳은 아래쪽 세 군데(`.pb-cta`,
     * `ScreenFooter`, `ToastProvider`)뿐이고 **위쪽이 없어서 머리글이 노치로 들어간다.**
     *
     * 위쪽을 `.app-shell-content`에 padding으로 주면 해결되지만, 그 요소가
     * `transform`으로 만든 컨테이닝 블록이라 **`fixed` 오버레이의 기준이 padding
     * 상자로 줄어든다** — 딤이 노치 띠를 못 덮어서 어두운 딤 위에 흰 줄이 남는다.
     * 그래서 Dialog·BottomSheet·Toast 세 곳까지 같이 손봐야 하고, 실기기 없이
     * 맞추기 어려운 종류의 작업이다.
     *
     * 켜지 않으면 standalone에서도 뷰포트가 안전 영역 안쪽에 놓여 **아무것도
     * 가려지지 않는다.** 위 세 군데의 계산이 0이 되는 것뿐이라 손해가 없다.
     * 실기기로 확인 가능한 마무리 단계에 한 묶음으로 켠다
     */
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="ko">
            <body className="h-full">
                {/* 그리는 것은 없다. 프로덕션에서만 sw.js를 등록한다 */}
                <ServiceWorkerRegister />
                <AuthProvider>
                    {/* me의 seenGuides를 읽으므로 AuthProvider 안에 있어야 한다 */}
                    <GuideProvider>
                        <AppStateProvider>
                            <AuthGate>
                                {/* 폰 폭 컬럼은 반드시 이 한 겹이어야 한다.
                                페이지가 Fragment를 반환하면 모달·시트가 화면과 형제가 되는데,
                                컬럼 스타일을 자식 선택자로 걸면 오버레이까지 컬럼으로 취급된다 */}
                                <div className="app-shell">
                                    {/* ToastProvider가 컬럼 **안**에 있어야 한다 — 토스트는 fixed로 뜨는데
                                        컨테이닝 블록을 만드는 건 이 컬럼이라, 밖에 두면 데스크톱에서
                                        브라우저 창 전체 폭으로 퍼진다 */}
                                    <div className="app-shell-content">
                                        <ToastProvider>
                                            <NotificationProvider>{children}</NotificationProvider>
                                        </ToastProvider>
                                    </div>
                                </div>
                            </AuthGate>
                        </AppStateProvider>
                    </GuideProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
