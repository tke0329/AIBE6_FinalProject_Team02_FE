"use client";

import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  MapPinIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { RegisterPhoto, useRegisterFlow } from "./RegisterFlowContext";
import { CardInput, LocationInput } from "./confirmApi";

const MEMO_MAX = 100;

interface Props {
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: (cards: CardInput[], location: LocationInput | null) => void;
}

interface Draft {
  photoKeys: string[];
  thumbnailKey: string | null;
  memo: string;
}

/**
 * 음식별 기록.
 *
 * 모든 입력이 선택이다 — 사진을 안 고르면 분석 사진이 자동으로 붙고, 메모·위치는 비워도 된다.
 * 기록을 강제하면 등록 이탈이 생긴다는 것이 기획 원칙이다.
 * 위치는 카드마다가 아니라 등록 건 전체에 일괄 적용된다.
 */
export function RegisterRecord({ submitting, error, onBack, onSubmit }: Props) {
  const { recordSlots, photos, analysisPhoto } = useRegisterFlow();

  const [step, setStep] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [location, setLocation] = useState("");

  const uploaded = useMemo(
    () =>
      photos.filter((photo): photo is RegisterPhoto & { key: string } =>
        Boolean(photo.key),
      ),
    [photos],
  );

  const slot = recordSlots[step];
  const total = recordSlots.length;
  const last = step === total - 1;

  const draft = drafts[slot?.slotId] ?? {
    photoKeys: [],
    thumbnailKey: null,
    memo: "",
  };

  const patch = (change: Partial<Draft>) =>
    setDrafts((current) => ({
      ...current,
      [slot.slotId]: { ...draft, ...change },
    }));

  const togglePhoto = (key: string) => {
    const next = draft.photoKeys.includes(key)
      ? draft.photoKeys.filter((selected) => selected !== key)
      : [...draft.photoKeys, key];
    patch({
      photoKeys: next,
      // 썸네일로 쓰던 사진을 빼면 지정도 함께 푼다
      thumbnailKey: next.includes(draft.thumbnailKey ?? "")
        ? draft.thumbnailKey
        : null,
    });
  };

  const submit = () => {
    const cards: CardInput[] = recordSlots.map((passed) => {
      const saved = drafts[passed.slotId] ?? {
        photoKeys: [],
        thumbnailKey: null,
        memo: "",
      };
      return {
        slotId: passed.slotId,
        cardPhotoKeys: saved.photoKeys,
        thumbnailKey: saved.thumbnailKey,
        memo: saved.memo.trim() || null,
      };
    });
    onSubmit(
      cards,
      location.trim() ? { name: location.trim(), lat: null, lng: null } : null,
    );
  };

  if (!slot) return null;

  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex shrink-0 items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={() => (step === 0 ? onBack() : setStep(step - 1))}
          aria-label="뒤로가기"
        >
          <ArrowLeftIcon size={22} aria-hidden className="text-brown" />
        </button>
        <span className="font-display text-lg text-content-primary">
          음식별 기록
        </span>
        <span className="ml-auto rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-content-link">
          {step + 1} / {total}
        </span>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-xl text-content-primary">
            {slot.slotName}
          </h1>
          <span className="text-xs text-content-secondary">
            {slot.category}
          </span>
        </div>

        {/* AI가 확인하지 못한 칸은 검토를 거쳐야 열린다 — 기록 시점에 미리 알린다 */}
        {!slot.matched && (
          <p className="mt-2 flex items-start gap-1.5 rounded-2xl bg-surface-accent p-3 text-xs leading-5 text-content-secondary">
            <ClockIcon
              size={14}
              aria-hidden
              className="mt-0.5 shrink-0 text-content-link"
            />
            <span>
              이 음식은 사진으로 확인되지 않아{" "}
              <strong className="text-content-link">검토 후</strong> 도감이
              열려요. 지금 남긴 기록은 그대로 저장돼요.
            </span>
          </p>
        )}

        <section className="mt-5" aria-label="카드 사진 고르기">
          <p className="text-sm font-medium text-content-secondary">
            카드에 넣을 사진 <span className="text-xs">(선택)</span>
          </p>
          <p className="mt-0.5 text-xs text-content-secondary">
            안 고르면 분석 사진이 자동으로 들어가요
          </p>

          <div className="mt-2.5 grid grid-cols-3 gap-2.5">
            {uploaded.map((photo) => {
              const picked = draft.photoKeys.includes(photo.key);
              const isThumbnail = draft.thumbnailKey === photo.key;
              return (
                <div key={photo.id} className="relative">
                  <button
                    type="button"
                    onClick={() => togglePhoto(photo.key)}
                    aria-pressed={picked}
                    aria-label={`${photo.file.name} ${picked ? "빼기" : "넣기"}`}
                    className={`aspect-square w-full overflow-hidden rounded-2xl border-2 ${
                      picked ? "border-edge-active" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob: 미리보기 */}
                    <img
                      src={photo.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>

                  {picked && (
                    <button
                      type="button"
                      onClick={() => patch({ thumbnailKey: photo.key })}
                      className={`absolute bottom-1 left-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                        isThumbnail
                          ? "bg-action-primary text-content-on-action"
                          : "bg-white/90 text-content-secondary"
                      }`}
                    >
                      {isThumbnail ? "대표" : "대표로"}
                    </button>
                  )}

                  {photo.id === analysisPhoto?.id && (
                    <span className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-xs text-content-secondary">
                      분석
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6" aria-label="메모">
          <label
            htmlFor="memo"
            className="text-sm font-medium text-content-secondary"
          >
            메모 <span className="text-xs">(선택)</span>
          </label>
          <textarea
            id="memo"
            value={draft.memo}
            maxLength={MEMO_MAX}
            onChange={(event) => patch({ memo: event.target.value })}
            placeholder={`${slot.slotName} 어땠나요?`}
            className="mt-1.5 h-24 w-full resize-none rounded-2xl border border-edge-default bg-surface-card px-4 py-3 text-sm outline-none focus:border-edge-active"
          />
          <p className="mt-1 text-right text-xs text-content-secondary">
            {draft.memo.length} / {MEMO_MAX}
          </p>
        </section>

        <section className="mt-4" aria-label="수집 위치">
          <label
            htmlFor="location"
            className="text-sm font-medium text-content-secondary"
          >
            수집 위치{" "}
            <span className="text-xs">(선택 · 모든 음식에 함께 적용돼요)</span>
          </label>
          <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-edge-default bg-surface-card px-4 py-3">
            <MapPinIcon size={18} aria-hidden className="text-content-muted" />
            <input
              id="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="식당 이름을 적어 주세요"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {location && (
              <button
                type="button"
                onClick={() => setLocation("")}
                className="shrink-0 text-xs text-content-secondary"
              >
                지우기
              </button>
            )}
          </div>
        </section>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-center gap-1.5 text-xs text-feedback-error"
          >
            <AlertCircleIcon size={14} aria-hidden />
            {error}
          </p>
        )}
      </main>

      <div className="shrink-0 px-5 pb-8 pt-4">
        <button
          type="button"
          disabled={submitting}
          onClick={() => (last ? submit() : setStep(step + 1))}
          className="flex h-cta w-full items-center justify-center gap-2 rounded-2xl bg-action-primary font-display text-lg text-content-on-action shadow-card disabled:opacity-40"
        >
          {last && <CheckIcon size={18} aria-hidden />}
          {submitting ? "등록하는 중…" : last ? "등록 완료" : "다음"}
        </button>
      </div>
    </div>
  );
}
