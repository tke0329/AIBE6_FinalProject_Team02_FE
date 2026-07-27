"use client";

import { motion } from "framer-motion";

// 환경변수 없으면 로컬 BE(8080)로 폴백
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type Provider = "google" | "kakao" | "naver";

const PROVIDERS: {
  key: Provider;
  label: string;
  className: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "kakao",
    label: "카카오로 시작해요",
    className:
      "bg-[#FEE500] text-[#191919] hover:bg-[#FDD800] focus-visible:outline-[#FEE500]",
    icon: (
      <svg
        className="w-5 h-5 mr-3 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.707 4.8 4.27 6.054-.176.657-.638 2.383-.73 2.72-.112.416.14.41.295.306.12-.08 1.93-1.312 2.7-1.84a10.37 10.37 0 002.465.295c4.97 0 9-3.185 9-7.115C21 6.185 16.97 3 12 3z" />
      </svg>
    ),
  },
  {
    key: "naver",
    label: "네이버로 시작해요",
    className:
      "bg-[#03C75A] text-white hover:bg-[#02b34f] focus-visible:outline-[#03C75A]",
    icon: (
      <svg
        className="w-4 h-4 mr-3.5 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
      </svg>
    ),
  },
  {
    key: "google",
    label: "Google로 시작해요",
    className:
      "bg-white text-brown-900 border border-cream-200 hover:bg-cream-50 focus-visible:outline-[#C9A87C]",
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
];

export function LoginPage() {
  const startLogin = (provider: Provider) => {
    window.location.href = `${API_BASE}/oauth2/authorization/${provider}`;
  };

  return (
    <main className="flex h-full flex-col justify-between py-12 px-6 bg-cream-50 select-none overflow-y-auto no-scrollbar">
      {/* 상단 로고 및 서비스 타이틀 */}
      <header className="flex flex-col items-center text-center mt-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative flex items-center justify-center w-24 h-24 mb-4"
        >
          {/* 캐릭터 식판/로고 데코레이션 */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full text-orange-500 fill-current"
          >
            {/* 귀여운 고양이 귀 */}
            <path d="M 25 35 L 12 8 L 38 22 Z" fill="#D98E33" />
            <path d="M 75 35 L 88 8 L 62 22 Z" fill="#D98E33" />
            {/* 식판 / 동그란 얼굴 */}
            <circle
              cx="50"
              cy="55"
              r="35"
              fill="#FFF"
              stroke="#D98E33"
              strokeWidth="6"
            />
            {/* 얼굴 디테일 */}
            <circle cx="37" cy="52" r="4" fill="#3E2D18" />
            <circle cx="63" cy="52" r="4" fill="#3E2D18" />
            {/* 수염 */}
            <line
              x1="12"
              y1="52"
              x2="22"
              y2="54"
              stroke="#3E2D18"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="13"
              y1="60"
              x2="23"
              y2="58"
              stroke="#3E2D18"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="88"
              y1="52"
              x2="78"
              y2="54"
              stroke="#3E2D18"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="87"
              y1="60"
              x2="77"
              y2="58"
              stroke="#3E2D18"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* 입/코 */}
            <path
              d="M 47 62 Q 50 64 53 62"
              stroke="#3E2D18"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <polygon points="48,58 52,58 50,60" fill="#3E2D18" />
            {/* 볼터치 */}
            <circle cx="28" cy="58" r="4" fill="#D9534F" opacity="0.35" />
            <circle cx="72" cy="58" r="4" fill="#D9534F" opacity="0.35" />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="font-display text-4xl text-brown-900 tracking-wide">
            캣칫 <span className="text-orange-500 font-display">CatchEat</span>
          </h1>
          <p className="mt-2.5 text-sm text-brown-800 font-medium">
            먹을수록 채워지는 나의 도감 📖
          </p>
        </motion.div>
      </header>

      {/* 중앙 미니 도감 카드 컬렉션 애니메이션 */}
      <div className="relative flex items-center justify-center h-48 my-8">
        {/* 뒤쪽 왼쪽 카드: 초밥 */}
        <motion.div
          initial={{ opacity: 0, x: -50, rotate: -25, scale: 0.8 }}
          animate={{ opacity: 1, x: -70, rotate: -15, scale: 0.9 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          className="absolute w-28 h-36 bg-white border border-cream-200 rounded-xl shadow-card p-2 flex flex-col justify-between items-center"
        >
          <div className="w-full h-20 bg-cream-50 rounded-lg flex items-center justify-center">
            {/* 초밥 SVG */}
            <svg viewBox="0 0 100 100" className="w-14 h-14">
              <path d="M 15 50 Q 50 12 85 50 Q 50 65 15 50 Z" fill="#FF7B54" />
              <path
                d="M 30 36 Q 45 40 60 28"
                stroke="#FFF"
                strokeWidth="2.5"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M 40 44 Q 55 48 70 36"
                stroke="#FFF"
                strokeWidth="2.5"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M 25 50 Q 50 78 75 50"
                stroke="#EFE3CC"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
              />
              <rect
                x="44"
                y="40"
                width="12"
                height="24"
                rx="2"
                fill="#3E2D18"
              />
            </svg>
          </div>
          <div className="text-center w-full">
            <p className="text-[12px] font-bold text-brown-900 leading-tight">
              연어초밥
            </p>
            <p className="text-[10px] text-orange-500 font-bold mt-0.5">★★★</p>
          </div>
        </motion.div>

        {/* 뒤쪽 오른쪽 카드: 미해금 (Locked) */}
        <motion.div
          initial={{ opacity: 0, x: 50, rotate: 25, scale: 0.8 }}
          animate={{ opacity: 1, x: 70, rotate: 15, scale: 0.9 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          className="absolute w-28 h-36 bg-cream-200 border border-cream-300 rounded-xl shadow-card p-2 flex flex-col justify-between items-center"
        >
          <div className="w-full h-20 bg-cream-100 rounded-lg flex items-center justify-center">
            <span className="text-3xl font-display text-brown-300">?</span>
          </div>
          <div className="text-center w-full">
            <p className="text-[12px] font-bold text-brown-300 leading-tight">
              미해금
            </p>
            <p className="text-[10px] text-brown-300 font-bold mt-0.5">☆☆☆</p>
          </div>
        </motion.div>

        {/* 가운데 탑 카드: 라멘 */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            y: [0, -6, 0],
            rotate: -2,
            scale: 1,
          }}
          transition={{
            opacity: { delay: 0.6, duration: 0.4 },
            scale: { delay: 0.6, type: "spring", stiffness: 100 },
            y: {
              repeat: Infinity,
              duration: 4,
              ease: "easeInOut",
            },
          }}
          className="absolute z-10 w-32 h-40 bg-white border-2 border-orange-400 rounded-2xl shadow-modal p-2.5 flex flex-col justify-between items-center"
        >
          <div className="w-full h-24 bg-orange-50 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-1 left-1.5 bg-orange-500 text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold">
              New
            </div>
            {/* 라멘 SVG */}
            <svg viewBox="0 0 100 100" className="w-16 h-16">
              <line
                x1="25"
                y1="20"
                x2="85"
                y2="35"
                stroke="#9A6A32"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="25"
                y1="28"
                x2="85"
                y2="43"
                stroke="#9A6A32"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 22 50 C 35 35, 65 35, 78 50"
                fill="none"
                stroke="#E8A24C"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 26 53 C 38 42, 62 42, 74 53"
                fill="none"
                stroke="#E8A24C"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path d="M 20 50 Q 20 85 50 85 Q 80 85 80 50 Z" fill="#D9534F" />
              <rect x="16" y="47" width="68" height="6" rx="3" fill="#EFE3CC" />
              <circle cx="50" cy="55" r="10" fill="#FFF" />
              <circle cx="50" cy="55" r="5" fill="#E8A24C" />
            </svg>
          </div>
          <div className="text-center w-full">
            <p className="text-sm font-bold text-brown-900 leading-tight">
              돈코츠라멘
            </p>
            <p className="text-[11px] text-orange-500 font-bold mt-0.5">★★☆</p>
          </div>
        </motion.div>
      </div>

      {/* 하단 소셜 로그인 가입 섹션 */}
      <footer className="w-full flex flex-col items-center gap-6 mt-4">
        <div className="w-full max-w-xs flex flex-col gap-3">
          <p className="text-xs text-brown-800 text-center font-medium opacity-85 mb-1">
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

        <p className="text-[10px] text-brown-300 text-center leading-normal max-w-xs px-4">
          로그인 시 캣칫의{" "}
          <a href="#" className="underline hover:text-brown-800">
            이용약관
          </a>{" "}
          및{" "}
          <a href="#" className="underline hover:text-brown-800">
            개인정보처리방침
          </a>
          에 동의하게 됩니다.
        </p>
      </footer>
    </main>
  );
}
