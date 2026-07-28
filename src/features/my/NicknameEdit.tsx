"use client";

import {
  NICKNAME_HINT,
  NICKNAME_MAX,
  NICKNAME_RE,
} from "@/features/my/nickname";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";

interface Props {
  currentNickname: string;
  /** 지금 변경 가능한지 (1개월 제한 통과 여부) */
  changeable: boolean;
  /** 다음 변경 가능 시각. null이면 즉시 가능 */
  changeableAt: string | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (nickname: string) => void;
  onBack: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** 닉네임 변경 화면. 1개월 1회 제한 — 아직 불가하면 다음 가능일을 안내하고 잠근다. */
export function NicknameEdit({
  currentNickname,
  changeable,
  changeableAt,
  submitting,
  error,
  onSubmit,
  onBack,
}: Props) {
  const [value, setValue] = useState(currentNickname);
  const trimmed = value.trim();
  const formatOk = NICKNAME_RE.test(trimmed);
  const unchanged = trimmed === currentNickname;
  // 형식이 틀렸을 때만 형식 안내 노출 (변경 없음은 조용히 버튼만 비활성)
  const showFormatHint = trimmed.length > 0 && !formatOk;
  const canSubmit = changeable && formatOk && !unchanged && !submitting;

  const submit = () => {
    if (canSubmit) onSubmit(trimmed);
  };

  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex items-center gap-3 px-5 py-4">
        <button onClick={onBack} aria-label="뒤로가기" className="min-h-touch">
          <ArrowLeftIcon size={21} className="text-brown" />
        </button>
        <h1 className="font-display text-lg text-brown">닉네임 수정</h1>
      </header>

      <div className="flex flex-1 flex-col px-8 pt-4">
        <p className="text-sm text-brown-soft">
          닉네임은 한 달에 한 번만 바꿀 수 있어요. 2~8자, 한글·영문·숫자·밑줄.
        </p>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          maxLength={NICKNAME_MAX}
          disabled={!changeable || submitting}
          aria-label="닉네임"
          className="mt-6 h-cta w-full rounded-2xl border-2 border-cream-300 bg-white px-4 font-display text-lg text-brown outline-none focus:border-orange-400 disabled:bg-cream-200 disabled:text-brown-muted"
        />

        {/* 우선순위: 변경 불가 안내 → 형식 안내 → 서버 에러 */}
        <p className="mt-2 min-h-[1.25rem] text-sm text-orange-600">
          {!changeable && changeableAt
            ? `${formatDate(changeableAt)}부터 바꿀 수 있어요.`
            : showFormatHint
              ? NICKNAME_HINT
              : (error ?? "")}
        </p>
      </div>

      <div className="px-6 pb-10">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card transition active:scale-[0.98] disabled:bg-cream-300 disabled:text-brown-muted disabled:shadow-none"
        >
          {submitting ? "저장 중…" : "변경하기"}
        </button>
      </div>
    </div>
  );
}
