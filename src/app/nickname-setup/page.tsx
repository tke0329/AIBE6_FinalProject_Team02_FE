"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { postInitialNickname } from "@/features/my/api";
import { NicknameSetup } from "@/features/my/NicknameSetup";
import { useState } from "react";

/**
 * 온보딩 전 최초 닉네임 세팅
 */
export default function NicknameSetupPage() {
  const { refresh } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (nickname: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await postInitialNickname(nickname);
      await refresh(); // me 갱신 → 게이트가 온보딩으로 진행
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "문제가 발생했어요. 다시 시도해 주세요.",
      );
      setSubmitting(false); // 성공 시엔 게이트가 화면을 떠나므로 해제 불필요
    }
  };

  return (
    <NicknameSetup
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
    />
  );
}
