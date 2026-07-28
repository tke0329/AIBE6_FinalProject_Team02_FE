"use client";

import { DexEntry } from "@/shared/data/dex";
import { ArrowLeftIcon } from "lucide-react";
import { FoodNamePicker } from "./FoodNamePicker";
import { PhotoUploader } from "./PhotoUploader";

interface Props {
  /** 도감 200칸. AppStateProvider가 이미 받아 둔 것을 그대로 쓴다 */
  entries: DexEntry[];
  /** 사진 업로드 완료 + 음식 이름 1개 이상 */
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
}

/**
 * 등록 1단계 — 사진과 음식 이름.
 *
 * 둘 다 필수다 ("사진과 음식 이름이 등록의 필수 입력").
 * 사진 없는 등록 경로도, 이름 없이 AI에게 맞히게 하는 경로도 만들지 않는다.
 */
export function RegisterUpload({ entries, canProceed, onBack, onNext }: Props) {
  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex shrink-0 items-center gap-3 px-5 py-4">
        <button type="button" onClick={onBack} aria-label="뒤로가기">
          <ArrowLeftIcon size={22} aria-hidden className="text-brown" />
        </button>
        <span className="font-display text-lg text-brown">음식 등록</span>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">
        <h1 className="font-display text-xl text-brown">
          음식 사진을 올려 주세요
        </h1>
        <p className="mt-1 text-sm text-brown-soft">
          한 상 사진도 OK · 최소 1장 ~ 최대 5장
        </p>

        <PhotoUploader />
        <FoodNamePicker entries={entries} />
      </main>

      <div className="shrink-0 px-5 pb-8 pt-4">
        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className="w-full rounded-2xl bg-orange-500 py-4 font-display text-lg text-white shadow-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}
