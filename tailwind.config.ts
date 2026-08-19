import type { Config } from 'tailwindcss'

/** globals.css의 CSS 변수를 Tailwind 색상으로 노출. alpha modifier 지원용 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        /* 뷰포트 브레이크포인트 봉인.
           앱은 `--layout-max` 폭 컬럼 안에서만 그려지는데 `md:`/`lg:`는 컬럼이 아니라
           **브라우저 창** 폭을 본다. 데스크톱에서 창이 넓으면 컬럼은 430px 그대로인데
           `md:grid-cols-4`가 걸려 430px 안에 4열이 들어차는 식으로 어긋난다.
           비워 두면 `md:`가 CSS를 아예 생성하지 않아 실수해도 조용히 무시된다.
           (현재 사용처 0곳 — 늘어나기 전에 막아 둔다) */
        screens: {},
        extend: {
            colors: {
                /* --- Primitive (DESIGN.md §1.1) — Watermelon Splash ---
                   값은 globals.css의 CSS 변수에서 정의. 신규 코드는 이 이름을 쓴다. */
                watermelon: {
                    DEFAULT: token('watermelon-500'),
                    50: token('watermelon-50'),
                    100: token('watermelon-100'),
                    200: token('watermelon-200'),
                    300: token('watermelon-300'),
                    400: token('watermelon-400'),
                    500: token('watermelon-500'),
                    600: token('watermelon-600'),
                    700: token('watermelon-700'),
                    800: token('watermelon-800'),
                    900: token('watermelon-900'),
                },
                neutral: {
                    DEFAULT: token('neutral-900'),
                    50: token('neutral-50'),
                    100: token('neutral-100'),
                    200: token('neutral-200'),
                    300: token('neutral-300'),
                    400: token('neutral-400'),
                    500: token('neutral-500'),
                    600: token('neutral-600'),
                    700: token('neutral-700'),
                    800: token('neutral-800'),
                    900: token('neutral-900'),
                },
                /* §1.1 포인트 초록 — "된 것"(진행·달성·수집·성공)에만 쓴다 */
                rind: {
                    DEFAULT: token('rind-500'),
                    500: token('rind-500'),
                    soft: token('rind-soft'),
                    text: token('rind-text'),
                },
                mint: {
                    DEFAULT: token('mint-500'),
                    500: token('mint-500'),
                    soft: token('mint-soft'),
                    border: token('mint-border'),
                    ink: token('mint-ink'),
                },
                red: {
                    400: token('red-500'),
                    500: token('red-500'),
                },

                /* --- Semantic (DESIGN.md §1.2) — 신규 코드 권장 --- */
                surface: {
                    app: token('surface-app'),
                    card: token('surface-card'),
                    'card-locked': token('surface-card-locked'),
                    raised: token('surface-raised'),
                    accent: token('surface-accent'),
                },
                content: {
                    primary: token('text-primary'),
                    secondary: token('text-secondary'),
                    muted: token('text-muted'),
                    /** 핑크 면 위 — 어두운 색이다 (globals.css 주석 참고) */
                    'on-action': token('text-on-action'),
                    /** 어두운 면(에러 버튼·토스트) 위 — 흰색 */
                    'on-dark': token('text-on-dark'),
                    link: token('text-link'),
                },
                action: {
                    primary: token('action-primary'),
                    hover: token('action-primary-hover'),
                    'disabled-bg': token('action-disabled-bg'),
                    'disabled-text': token('action-disabled-text'),
                    soft: token('action-soft'),
                    'soft-text': token('action-soft-text'),
                },
                edge: {
                    default: token('border-default'),
                    active: token('border-active'),
                    recent: token('border-recent'),
                },
                feedback: {
                    error: token('red-500'),
                    success: token('rind-text'),
                },
                /* §1.7 메달 색 — 순위 단상의 1·2·3위에만 쓴다.
                   글자는 text-content-primary 하나로 충분하다 (금 10.38 · 은 11.13 · 동 6.25) */
                medal: {
                    gold: token('medal-gold'),
                    silver: token('medal-silver'),
                    bronze: token('medal-bronze'),
                },
                /* §1.6 사람 색 — 사진 없는 아바타를 구분한다.
                   글자는 항상 text-content-primary 하나로 충분하다 (7색 전부 12.2:1 이상) */
                person: {
                    1: token('person-1'),
                    2: token('person-2'),
                    3: token('person-3'),
                    4: token('person-4'),
                    5: token('person-5'),
                    6: token('person-6'),
                    7: token('person-7'),
                },
            },

            /* §1.4 타이포 스케일 — xs가 최소 크기. 그 아래 값 사용 금지.
               5xl 이상은 이모지·이니셜 한 글자용이라 읽는 글자 스케일에 넣지 않는다.

               **딩궁딩굴 기준으로 한 단계씩 올려 잡았다.** 이 글꼴은 x-height가 39로
               Pretendard(53)의 74%라, 같은 px 값이면 눈에는 그만큼 작게 보인다.
               괄호 안이 이전(Pretendard 기준) 값이다 — 숫자만 보고 "왜 이렇게 크지"
               하지 않도록 남겨 둔다.

               크기를 더 키우거나 줄이려면 **이 표만** 고친다. 화면에는 px가 박혀 있지 않다. */
            fontSize: {
                xs: ['14px', '20px'], //  (12/16)  날짜·카드 하단
                sm: ['16px', '23px'], //  (14/20)  보조 설명·라벨
                base: ['18px', '27px'], //  (16/24)  본문
                lg: ['21px', '30px'], //  (18/26)  섹션 제목
                xl: ['25px', '34px'], //  (22/30)  화면 제목
                '2xl': ['28px', '38px'], //  (24/32)
                '3xl': ['34px', '42px'], //  (30/36)  해금 연출
                '4xl': ['41px', '48px'], //  (36/40)
            },
            fontWeight: {
                regular: '400',
                medium: '500',
                bold: '700',
            },
            /* 글꼴은 하나뿐이다. Pretendard는 딩궁딩굴에 없는 글자를 받는 폴백 */
            fontFamily: {
                sans: ['Dinggul', 'Pretendard', '-apple-system', 'system-ui', 'sans-serif'],
                display: ['Dinggul', 'Pretendard', 'sans-serif'],
            },

            /* §1.5 라운드 — 3단계 + full. 레거시 xl/2xl/3xl도 토큰값으로 고정 */
            borderRadius: {
                sm: 'var(--radius-sm)',
                md: 'var(--radius-sm)',
                lg: 'var(--radius-sm)',
                xl: 'var(--radius-md)',
                '2xl': 'var(--radius-md)',
                '3xl': 'var(--radius-lg)',
                full: 'var(--radius-full)',
            },

            /* §1.5 그림자 — 2단계만. soft/pop은 레거시 별칭 */
            boxShadow: {
                card: '0 2px 8px rgba(0, 0, 0, 0.06)',
                modal: '0 8px 32px rgba(0, 0, 0, 0.16)',
                soft: '0 2px 8px rgba(0, 0, 0, 0.06)',
                pop: '0 8px 32px rgba(0, 0, 0, 0.16)',
            },

            /* §5 최소 터치 타깃 / §2 고정 CTA 높이 */
            minHeight: {
                touch: 'var(--layout-touch-min)',
                cta: 'var(--layout-cta-height)',
            },
            minWidth: {
                touch: 'var(--layout-touch-min)',
            },
            height: {
                cta: 'var(--layout-cta-height)',
            },
            spacing: {
                'safe-b': 'env(safe-area-inset-bottom)',
            },

            /* 로딩 연출용 (shared/ui/molecules/loadingScenes.tsx) */
            keyframes: {
                /* 사진 위를 훑는 스캔선. 위 밖에서 시작해 아래 밖으로 빠진다 */
                scan: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(300%)' },
                },
            },
        },
    },
    plugins: [],
}

export default config
