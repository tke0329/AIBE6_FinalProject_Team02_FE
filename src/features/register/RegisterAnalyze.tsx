"use client";

import { ApiError } from "@/shared/lib/api";
import { motion } from "framer-motion";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  Loader2Icon,
  RotateCwIcon,
  XCircleIcon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useRegisterFlow } from "./RegisterFlowContext";
import {
  RETRY_LIMIT_EXCEEDED,
  SlotVerdict,
  VerificationResult,
  verifyFoods,
} from "./verificationApi";

interface Props {
  onBack: () => void;
  /** 기록 단계로 넘어간다 */
  onProceed: () => void;
}

type Phase = "verifying" | "done" | "error" | "exhausted";

/**
 * AI 검증 결과
 *
 * 후보를 고르는 화면이 아니다 — 음식 이름은 앞 단계에서 유저가 이미 골랐고,
 * AI는 사진이 그 이름과 맞는지만 판정한다. 여기서는 통과/불일치와 사유를 보여준다.
 */
export function RegisterAnalyze({ onBack, onProceed }: Props) {
  const {
    selectedSlots,
    uploadedPhotoKeys,
    analysisPhotoIndex,
    registrationId,
    setRegistrationId,
    setRecordSlots,
  } = useRegisterFlow();

  const [phase, setPhase] = useState<Phase>("verifying");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [slow, setSlow] = useState(false);

  // StrictMode의 이펙트 2회 실행이 재시도 횟수를 2번 깎지 않도록 한 번만 보낸다
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    // 목표 응답 5초. 넘어가면 기다리라고 알린다
    const slowTimer = window.setTimeout(() => setSlow(true), 5000);

    verifyFoods({
      registrationId,
      photoKeys: uploadedPhotoKeys,
      analysisPhotoIndex,
      slotIds: selectedSlots.map((slot) => slot.id),
    })
      .then((verification) => {
        setRegistrationId(verification.registrationId);
        setResult(verification);
        setPhase("done");
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === RETRY_LIMIT_EXCEEDED) {
          setPhase("exhausted");
          return;
        }
        setErrorMessage(
          error instanceof Error ? error.message : "음식 확인에 실패했어요",
        );
        setPhase("error");
      })
      .finally(() => window.clearTimeout(slowTimer));

    return () => window.clearTimeout(slowTimer);
  }, [
    registrationId,
    uploadedPhotoKeys,
    analysisPhotoIndex,
    selectedSlots,
    setRegistrationId,
  ]);

  const passed = result?.verdicts.filter((verdict) => verdict.matched) ?? [];
  const failed = result?.verdicts.filter((verdict) => !verdict.matched) ?? [];
  // 재시도가 남아 있으면 미통과 칸은 아직 등록할 수 없다 — 먼저 다시 확인해야 한다 (§5.2)
  const exhausted = result?.retriesLeft === 0;

  /** 기록 화면으로 넘길 칸을 정한다. 상한을 다 썼으면 미통과 칸도 함께 간다(검토 요청) */
  const proceedWith = (slots: SlotVerdict[]) => {
    setRecordSlots(slots);
    onProceed();
  };

  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex shrink-0 items-center gap-3 px-5 py-4">
        <button type="button" onClick={onBack} aria-label="뒤로가기">
          <ArrowLeftIcon size={22} aria-hidden className="text-brown" />
        </button>
        <span className="font-display text-lg text-brown">음식 확인</span>
      </header>

      {phase === "verifying" && <Verifying slow={slow} />}

      {phase === "error" && (
        <Centered
          icon={
            <AlertTriangleIcon
              size={40}
              aria-hidden
              className="text-feedback-error"
            />
          }
          title="음식을 확인하지 못했어요"
          description={errorMessage}
          primary={{
            label: "다시 시도",
            onClick: () => window.location.reload(),
          }}
          secondary={{ label: "사진·음식 고치기", onClick: onBack }}
        />
      )}

      {/* 서버가 이미 상한 초과로 막은 경우 — 판정 결과 없이 도착한다 */}
      {phase === "exhausted" && (
        <Centered
          icon={
            <AlertTriangleIcon
              size={40}
              aria-hidden
              className="text-content-link"
            />
          }
          title="다시 확인할 수 있는 횟수를 다 썼어요"
          description="처음부터 다시 등록하거나, 앞 화면에서 검토 요청으로 진행해 주세요."
          primary={{ label: "사진·음식 고치기", onClick: onBack }}
          secondary={{ label: "그만두기", onClick: onBack }}
        />
      )}

      {phase === "done" && result && (
        <>
          <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">
            <h1 className="font-display text-xl text-content-primary">
              {result.allMatched
                ? `${passed.length}개 모두 확인했어요`
                : passed.length > 0
                  ? `${passed.length}개만 확인했어요`
                  : "사진과 맞는 음식이 없어요"}
            </h1>
            <p className="mt-1 text-sm text-content-secondary">
              {result.allMatched
                ? "이제 기록을 남기면 도감이 열려요"
                : exhausted
                  ? "확인되지 않은 음식은 검토를 거쳐 열려요"
                  : "통과하지 않은 음식은 도감이 열리지 않아요"}
            </p>

            <ul className="mt-5 space-y-2.5" aria-label="확인 결과">
              {result.verdicts.map((verdict) => (
                <VerdictRow key={verdict.slotId} verdict={verdict} />
              ))}
            </ul>

            {failed.length > 0 && !exhausted && (
              <p className="mt-4 rounded-2xl bg-surface-accent p-3 text-xs leading-5 text-content-secondary">
                사진을 바꾸거나 음식을 다시 고르면 한 번 더 확인할 수 있어요.
                <strong className="text-content-link">
                  {" "}
                  {result.retriesLeft}번
                </strong>{" "}
                남았어요.
              </p>
            )}

            {failed.length > 0 && exhausted && (
              <p className="mt-4 rounded-2xl bg-surface-accent p-3 text-xs leading-5 text-content-secondary">
                확인 횟수를 다 썼어요. 그대로 등록하면{" "}
                <strong className="text-content-link">
                  확인되지 않은 {failed.length}개
                </strong>
                는 사진을 증빙으로 검토를 요청하고, 통과되면 도감이 열려요.
              </p>
            )}
          </main>

          <div className="shrink-0 space-y-2 px-5 pb-8 pt-4">
            {/*
              상한을 다 썼으면 미통과 칸도 함께 넘긴다 — 서버가 그것들만 검토 대기로 만든다.
              재시도가 남아 있으면 미통과 칸은 아직 등록할 수 없어 통과분만 넘긴다 (§5.2).
            */}
            {(passed.length > 0 || exhausted) && (
              <button
                type="button"
                onClick={() =>
                  proceedWith(exhausted ? result.verdicts : passed)
                }
                className="w-full rounded-2xl bg-action-primary py-4 font-display text-lg text-content-on-action shadow-card"
              >
                {result.allMatched
                  ? "기록하러 가기"
                  : exhausted
                    ? `${result.verdicts.length}개 기록하고 검토 요청하기`
                    : `확인된 ${passed.length}개만 등록하기`}
              </button>
            )}

            {passed.length > 0 && exhausted && (
              <button
                type="button"
                onClick={() => proceedWith(passed)}
                className="min-h-touch w-full rounded-2xl border-2 border-orange-400 font-medium text-orange-600"
              >
                확인된 {passed.length}개만 등록하기
              </button>
            )}

            {failed.length > 0 && !exhausted && (
              <button
                type="button"
                onClick={onBack}
                className="flex min-h-touch w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-orange-400 font-medium text-orange-600"
              >
                <RotateCwIcon size={16} aria-hidden />
                사진·음식 고쳐서 다시 확인 ({result.retriesLeft}번 남음)
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Verifying({ slow }: { slow: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2Icon size={48} aria-hidden className="text-action-primary" />
      </motion.div>
      <p className="mt-5 font-display text-lg text-content-primary">
        사진을 확인하고 있어요
      </p>
      <p className="mt-1 text-sm text-content-secondary">
        {slow ? "조금만 기다려 주세요…" : "금방 끝나요"}
      </p>
    </div>
  );
}

interface CenteredProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primary: { label: string; onClick: () => void };
  secondary: { label: string; onClick: () => void };
}

function Centered({
  icon,
  title,
  description,
  primary,
  secondary,
}: CenteredProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
      {icon}
      <h1 className="mt-4 font-display text-xl text-content-primary">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-content-secondary">
        {description}
      </p>

      <div className="mt-8 w-full space-y-2">
        <button
          type="button"
          onClick={primary.onClick}
          className="w-full rounded-2xl bg-action-primary py-4 font-display text-lg text-content-on-action shadow-card"
        >
          {primary.label}
        </button>
        <button
          type="button"
          onClick={secondary.onClick}
          className="min-h-touch w-full text-sm text-content-secondary"
        >
          {secondary.label}
        </button>
      </div>
    </div>
  );
}

function VerdictRow({ verdict }: { verdict: SlotVerdict }) {
  return (
    <li
      className={`flex items-start gap-3 rounded-2xl border-2 p-3 ${
        verdict.matched
          ? "border-edge-active bg-surface-card"
          : "border-edge-default bg-surface-card"
      }`}
    >
      {verdict.matched ? (
        <CheckCircle2Icon
          size={20}
          aria-hidden
          className="mt-0.5 shrink-0 text-feedback-success"
        />
      ) : (
        <XCircleIcon
          size={20}
          aria-hidden
          className="mt-0.5 shrink-0 text-content-muted"
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <strong className="text-content-primary">{verdict.slotName}</strong>
          <span className="text-xs text-content-secondary">
            {verdict.category}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-5 text-content-secondary">
          {verdict.matched ? "사진에서 확인했어요" : verdict.reason}
        </p>
      </div>

      <span className="sr-only">
        {verdict.matched ? "확인됨" : "확인되지 않음"}
      </span>
    </li>
  );
}
