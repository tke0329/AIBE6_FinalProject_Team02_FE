'use client'

import { motion, useReducedMotion } from 'framer-motion'

// 환경변수 없으면 로컬 BE(8080)로 폴백
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

/** 네이버는 뺐다 (2026-08-13). 되살리려면 여기 + PROVIDERS + BE의 OAuth2 등록이 함께 필요하다 */
type Provider = 'google' | 'kakao'

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
        key: 'google',
        label: 'Google로 시작해요',
        className:
            'bg-white text-neutral-900 border border-neutral-100 hover:bg-white focus-visible:outline-neutral-300',
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

/**
 * 손 위치 — **몸통 그림 크기의 %**다. 몸통을 키우거나 줄여도 따라간다.
 *
 * ## 손을 몸통 **뒤**에 깐다
 *
 * 앞에 얹었을 땐 팔뚝이 가슴 위를 가로질러서, 아무리 크기·위치를 맞춰도 **몸에 붙인
 * 스티커**처럼 보였다. 원래 이 몸통 그림에는 팔이 그려져 있지 않아 어깨 이음새를
 * 만들 방법이 없기 때문이다.
 *
 * 뒤로 깔면 팔뿌리는 몸통에 가려지고 **실루엣 밖으로 나온 발만 보인다.** 이음새를
 * 그릴 필요 자체가 사라져서, 팔을 옆으로 들어 올린 모습으로 자연스럽게 읽힌다.
 *
 * ## 크기·위치는 앞에 뒀을 때 값 그대로다
 *
 * 뒤로 보내면서 한 번 더 바깥(-16%/28%/36%)으로 밀어 봤는데 **팔이 몸에서 떨어져
 * 더 어색했다.** 어깨에 맞춰 둔 값(아래)이 맞고, 바뀐 건 그리는 순서 하나뿐이다.
 *
 * 손 그림은 왼쪽 30%가 흔들림 선이고 실제 팔은 68%다 — 박스 32%면 팔 폭이 40px,
 * 머리 폭의 30%로 고양이의 다른 앞발과 같은 결이다. 손목은 몸통 실루엣에서 잰
 * 어깨(19%, 58%) 바로 안쪽인 (25%, 60%)에 온다.
 *
 * ## 각도가 얕으면 발이 숨는다
 *
 * 뒤에 있으므로 -14°쯤에서는 **발끝과 흔들림 선만** 실루엣 밖에 남는다. 그게
 * 흔들림의 아래쪽 끝이고, -28°에서 발이 온전히 나온다. 더 얕게 잡으면 손이 아예
 * 숨어 깜빡이는 것처럼 보인다.
 *
 * 숫자를 만질 때: `left`를 줄이면 발이 더 바깥으로, `top`을 줄이면 더 높이 든다.
 */
const HAND = { left: '-7%', top: '37%', width: '32%' }
/** 아래 끝(-14°)은 발끝만, 위 끝(-28°)은 발 전체가 나온다 (위 주석) */
const WAVE_ANGLES = [-14, -28, -14]

export function LoginPage({ errorMessage }: { errorMessage?: string }) {
    const reduceMotion = useReducedMotion()

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

            {/*
                마스코트 — 서 있고 **손만 흔든다.**

                그림 두 장을 겹친다. 한 장짜리 `mascot.png`(1.3MB)로는 팔만 움직일 수
                없어서, 몸통(`catcheat_body`)과 손(`catcheat_hand`)을 나눴다.
                `.webp`로 바꿔 **두 장 합쳐 14KB** — GIF로 같은 연출을 구우면 1.4MB다.

                **몸이 위아래로 통통 튀던 연출은 뺐다.** 인사와 튀기가 같이 돌면 눈이
                둘 중 어디를 봐야 할지 흩어지고, 로그인 버튼을 고르는 화면에서 배경이
                계속 움직이는 것도 성가시다. 지금은 움직이는 것이 손 하나뿐이라
                "인사한다"가 곧바로 읽힌다
            */}
            <div className="flex flex-1 items-center justify-center py-6">
                <motion.div
                    // 몸통 그림 비율(200:278). 손 위치를 %로 잡으므로 이 비율이 기준자다
                    className="relative h-64 select-none"
                    style={{ aspectRatio: '200 / 278' }}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    {/*
                        손이 **먼저** 그려져 몸통 아래로 깔린다. 순서를 뒤집으면
                        팔뚝이 가슴 위를 가로질러 스티커처럼 보인다 (HAND 주석)
                    */}
                    <motion.img
                        src="/images/catcheat_hand.webp"
                        alt=""
                        aria-hidden
                        draggable={false}
                        className="absolute"
                        style={{ ...HAND, transformOrigin: 'bottom right' }}
                        animate={reduceMotion ? { rotate: WAVE_ANGLES[0] } : { rotate: WAVE_ANGLES }}
                        transition={
                            reduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
                        }
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/catcheat_body.webp"
                        alt="캣칫 마스코트"
                        draggable={false}
                        className="relative h-full w-full object-contain"
                    />
                </motion.div>
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
