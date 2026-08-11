import type { Config } from 'tailwindcss'

/** globals.css의 CSS 변수를 Tailwind 색상으로 노출. alpha modifier 지원용 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
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
                lime: {
                    DEFAULT: token('lime-500'),
                    500: token('lime-500'),
                    soft: token('lime-soft'),
                    text: token('lime-text'),
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
                    success: token('lime-text'),
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
        },
    },
    plugins: [],
}

export default config
