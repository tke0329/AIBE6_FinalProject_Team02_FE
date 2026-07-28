"use client";

import { LoginPage } from "@/features/auth/LoginPage";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/** OAuth 실패 시 콜백이 `?error=<code>`로 되돌려 보낸다. 코드별 사용자 문구 매핑. */
const ERROR_MESSAGES: Record<string, string> = {
  withdrawn: "탈퇴한 회원이에요. 이 계정으로는 다시 로그인할 수 없어요.",
  login_failed: "로그인에 실패했어요. 잠시 후 다시 시도해 주세요.",
};

function LoginWithError() {
  const error = useSearchParams().get("error");
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.login_failed)
    : undefined;
  return <LoginPage errorMessage={errorMessage} />;
}

/** `/login` 소셜 로그인 화면 (useSearchParams는 Suspense로 감싼다) */
export default function Login() {
  return (
    <Suspense fallback={<LoginPage />}>
      <LoginWithError />
    </Suspense>
  );
}
