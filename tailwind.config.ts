import type { Config } from 'tailwindcss'

/** globals.css의 CSS 변수를 Tailwind 색상으로 노출. alpha modifier 지원용 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            colors: {
                /* --- Primitive (DESIGN.md §1.1) --- */
                cream: {
                    DEFAULT: token('cream-50'),
                    50: token('cream-50'),
                    100: token('cream-100'),
                    200: token('cream-200'),
                    300: token('cream-300'),
                },
                brown: {
                    DEFAULT: token('brown-900'),
                    300: token('brown-300'),
                    500: token('brown-500'),
                    600: token('brown-600'),
                    800: token('brown-800'),
                    900: token('brown-900'),
                    /* 레거시 별칭 — 기존 컴포넌트 클래스명 유지용 */
                    soft: token('brown-800'),
                    muted: token('brown-300'),
                },
                orange: {
                    DEFAULT: token('orange-500'),
                    50: token('orange-50'),
                    100: token('orange-100'),
                    400: token('orange-400'),
                    500: token('orange-500'),
                    600: token('orange-600'),
                },
                blue: {
                    300: token('blue-300'),
                    400: token('blue-300'),
                    500: token('blue-500'),
                },
                red: {
                    400: token('red-500'),
                    500: token('red-500'),
                },
                green: {
                    500: token('green-500'),
                },

                /* --- Semantic (DESIGN.md §1.2) — 신규 코드는 이쪽을 사용 --- */
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
                    'on-action': token('text-on-action'),
                    link: token('text-link'),
                },
                action: {
                    primary: token('action-primary'),
                    hover: token('action-primary-hover'),
                    'disabled-bg': token('action-disabled-bg'),
                    'disabled-text': token('action-disabled-text'),
                },
                edge: {
                    default: token('border-default'),
                    active: token('border-active'),
                    recent: token('border-recent'),
                },
                feedback: {
                    error: token('red-500'),
                    success: token('green-500'),
                },
            },

            /* §1.4 타이포 스케일 — xs가 최소 크기. 그 아래 값 사용 금지 */
            fontSize: {
                xs: ['12px', '16px'],
                sm: ['14px', '20px'],
                base: ['16px', '24px'],
                lg: ['18px', '26px'],
                xl: ['22px', '30px'],
            },
            fontWeight: {
                regular: '400',
                medium: '500',
                bold: '700',
            },
            fontFamily: {
                sans: ['Pretendard', '-apple-system', 'system-ui', 'sans-serif'],
                display: ['Jua', 'Pretendard', 'sans-serif'],
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
                card: '0 2px 8px rgba(62, 45, 24, 0.06)',
                modal: '0 8px 32px rgba(62, 45, 24, 0.16)',
                soft: '0 2px 8px rgba(62, 45, 24, 0.06)',
                pop: '0 8px 32px rgba(62, 45, 24, 0.16)',
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
        },
    },
    plugins: [],
}

export default config
