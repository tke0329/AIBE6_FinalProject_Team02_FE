'use client'

import { motion } from 'framer-motion'

// 환경변수 없으면 로컬 BE(8080)로 폴백
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

type Provider = 'google' | 'kakao' | 'naver'

const PROVIDERS: {
    key: Provider
    label: string
    className: string
    icon: React.ReactNode
}[] = [
    {
        key: 'kakao',
        label: '카카오로 시작해요',
        className: 'bg-[#FEE500] text-[#191919] hover:bg-[#FDD800] focus-visible:outline-[#FEE500]',
        icon: (
            <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.707 4.8 4.27 6.054-.176.657-.638 2.383-.73 2.72-.112.416.14.41.295.306.12-.08 1.93-1.312 2.7-1.84a10.37 10.37 0 002.465.295c4.97 0 9-3.185 9-7.115C21 6.185 16.97 3 12 3z" />
            </svg>
        ),
    },
    {
        key: 'naver',
        label: '네이버로 시작해요',
        className: 'bg-[#03C75A] text-white hover:bg-[#02b34f] focus-visible:outline-[#03C75A]',
        icon: (
            <svg className="w-4 h-4 mr-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
            </svg>
        ),
    },
    {
        key: 'google',
        label: 'Google로 시작해요',
        className: 'bg-white text-neutral-900 border border-neutral-100 hover:bg-white focus-visible:outline-neutral-300',
        icon: (
            <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24">
                <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.927h6.6c-.29 1.5-.145 2.77-1.12 3.427l1.09 1.155a11.96 11.96 0 004.175-6.438z"
                />
                <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.84-2.99c-1.08.72-2.47 1.15-4.12 1.15-3.17 0-5.85-2.14-6.81-5.02l-3.97 3.07C3.18 21.36 7.23 24 12 24z"
                />
                <path
                    fill="#FBBC05"
                    d="M5.19 14.23a7.18 7.18 0 010-4.46l-3.97-3.07a11.983 11.983 0 000 10.6l3.97-3.07z"
                />
                <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.23 0 3.18 2.64 1.22 6.57l3.97 3.07c.96-2.88 3.64-5.02 6.81-5.02z"
                />
            </svg>
        ),
    },
]

export function LoginPage({ errorMessage }: { errorMessage?: string }) {
    const startLogin = (provider: Provider) => {
        window.location.href = `${API_BASE}/oauth2/authorization/${provider}`
    }

    return (
        <main className="flex h-full flex-col justify-between py-12 px-6 bg-white select-none overflow-y-auto no-scrollbar">
            {/* 상단 서비스 타이틀 */}
            <header className="mt-8 flex flex-col items-center text-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    <h1 className="font-display text-4xl tracking-wide text-neutral-900">
                        캣칫 <span className="font-display text-watermelon-500">CatchEat</span>
                    </h1>
                    <p className="mt-2.5 text-sm font-medium text-neutral-800">먹을수록 채워지는 나의 도감</p>
                </motion.div>
            </header>

            {/* 마스코트 — 통통 튀는 무한 애니메이션 (긴 주기) */}
            <div className="flex flex-1 items-center justify-center py-6">
                <motion.img
                    src="/images/mascot.png"
                    alt="캣칫 마스코트"
                    draggable={false}
                    className="h-64 w-auto select-none"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -18, 0] }}
                    transition={{
                        opacity: { duration: 0.5, ease: 'easeOut' },
                        scale: { duration: 0.5, ease: 'easeOut' },
                        // 통통 튀는 느낌: 올라갈 땐 감속, 내려올 땐 가속 / 무한 반복 + 긴 주기
                        y: { repeat: Infinity, duration: 3.6, ease: ['easeOut', 'easeIn'] },
                    }}
                />
            </div>

            {/* 하단 소셜 로그인 가입 섹션 */}
            <footer className="w-full flex flex-col items-center gap-6 mt-4">
                <div className="w-full max-w-xs flex flex-col gap-3">
                    {errorMessage && (
                        <p
                            role="alert"
                            className="mb-1 rounded-xl bg-red-50 px-4 py-2.5 text-center text-xs font-medium text-red-600"
                        >
                            {errorMessage}
                        </p>
                    )}
                    <p className="text-xs text-neutral-800 text-center font-medium opacity-85 mb-1">
                        소셜 계정으로 간편하게 시작해요
                    </p>

                    {PROVIDERS.map(({ key, label, className, icon }) => (
                        <motion.button
                            key={key}
                            type="button"
                            onClick={() => startLogin(key)}
                            aria-label={label}
                            whileHover={{ y: -2, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center justify-center h-12 w-full rounded-xl text-sm font-bold shadow-card transition-colors duration-200 outline-none ${className}`}
                        >
                            {icon}
                            {label}
                        </motion.button>
                    ))}
                </div>

                <p className="text-xs text-neutral-400 text-center leading-normal max-w-xs px-4">
                    로그인 시 캣칫의{' '}
                    <a href="#" className="underline hover:text-neutral-800">
                        이용약관
                    </a>{' '}
                    및{' '}
                    <a href="#" className="underline hover:text-neutral-800">
                        개인정보처리방침
                    </a>
                    에 동의하게 됩니다.
                </p>
            </footer>
        </main>
    )
}
