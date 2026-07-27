import { motion } from "framer-motion";
import { useState } from "react";

const STEPS = [
  {
    emoji: "📖",
    title: "먹은 음식을 도감으로 모아요",
    desc: "매번 기록하는 게 아니라,\n 먹은 걸 한 칸씩 수집해요.",
  },
  {
    emoji: "📸",
    title: "사진 한 장이면 칸이 채워져요",
    desc: "먹고 사진만 남기면 끝!\n위치·메모는 선택이에요.",
  },
];

export function Onboarding({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-xl text-orange-600">캣칫 CatchEat</h1>
        <button
          onClick={onDone}
          className="min-h-touch px-2 text-sm text-brown-soft"
        >
          건너뛰기
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center"
        >
          <div className="mb-8 flex h-40 w-40 items-center justify-center rounded-full bg-orange-50 text-7xl shadow-soft">
            {STEPS[step].emoji}
          </div>
          <h2 className="mb-3 font-display text-xl text-brown">
            {STEPS[step].title}
          </h2>
          <p className="whitespace-pre-line text-sm leading-6 text-brown-soft">
            {STEPS[step].desc}
          </p>
        </motion.div>
      </div>

      <div className="px-6 pb-10">
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-orange-500" : "w-2 bg-cream-300"}`}
            />
          ))}
        </div>
        <button
          onClick={() => (last ? onDone?.() : setStep((s) => s + 1))}
          className="h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card transition active:scale-[0.98]"
        >
          {last ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
