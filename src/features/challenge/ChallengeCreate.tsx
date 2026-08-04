import { resolveBadgeImage } from "@/shared/data/badgeAssets";
import { Badge } from "@/shared/ui/atoms/Badge";
import {
  ArrowLeftIcon,
  BadgeIcon,
  CameraIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { ChallengeData, ChallengeTarget, RewardBadge } from "./types";

interface Props {
  createdThisMonth: number;
  customBadge: RewardBadge | null;
  onBack: () => void;
  onCreate: (challenge: ChallengeData) => void | Promise<void>;
  onCustomBadge: () => void;
  onUsePreset: () => void;
}
// 프리셋(code·이름)과 1:1
// 이미지는 code로 정적 에셋 매핑
const PRESETS = [
  { code: "CHALLENGE_PRESET_EXPLORER", name: "맛집 탐험가" },
  { code: "CHALLENGE_PRESET_FINISHER", name: "챌린지 완주자" },
  { code: "CHALLENGE_PRESET_PIONEER", name: "동네 개척자" },
];
const MIN_TARGETS = 5; // 챌린지 개설 최소 목표 음식 수 (BE와 동일)

export function ChallengeCreate({
  createdThisMonth,
  customBadge,
  onBack,
  onCreate,
  onCustomBadge,
  onUsePreset,
}: Props) {
  const [title, setTitle] = useState("");
  const [targetName, setTargetName] = useState("");
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [targetPreview, setTargetPreview] = useState("");
  const [targets, setTargets] = useState<ChallengeTarget[]>([]);
  const [selectedCode, setSelectedCode] = useState(PRESETS[0].code);
  const [presetName, setPresetName] = useState(PRESETS[0].name); // 프리셋 기본 이름(편집 가능)
  const [submitting, setSubmitting] = useState(false); // 개설 중복 제출 방지
  const canCreate = createdThisMonth < 3;
  const selectedPreset =
    PRESETS.find((p) => p.code === selectedCode) ?? PRESETS[0];
  // 커스텀이 있으면 커스텀 이름, 없으면 편집 가능한 프리셋 이름
  const rewardName = customBadge ? customBadge.name : presetName;
  const rewardImage =
    customBadge?.customImage ??
    resolveBadgeImage(selectedPreset.code, undefined) ??
    undefined;
  const enough = targets.length >= MIN_TARGETS; // 최소 5개 이상이어야 개설 가능
  const fileRef = useRef<HTMLInputElement>(null);
  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setTargetFile(file);
    setTargetPreview(URL.createObjectURL(file));
  };
  const addTarget = () => {
    if (!targetName.trim()) return;
    setTargets((current) => [
      ...current,
      {
        id: `target-${Date.now()}`,
        name: targetName.trim(),
        file: targetFile,
        imageUrl: targetPreview || "/images/default_food.png",
      },
    ]);
    setTargetName("");
    setTargetFile(null);
    setTargetPreview("");
  };
  const create = async () => {
    if (submitting || !title.trim() || !enough || !canCreate) return;
    setSubmitting(true);
    try {
      await onCreate({
      id: `created-${Date.now()}`,
      title: title.trim(),
      emoji: "🏆",
      tag: "음식인증",
      dday: "D-30",
      participants: 1,
      mine: `나 0/${targets.length}`,
      progress: 0,
      owner: "신재락현",
      joined: true,
      isCreator: true,
      target: targets.length,
      targetRestaurants: targets,
      completedTargetIds: [],
      // 실제 뱃지 생성은 개설 시점(page.onCreate)에서 — 여기선 선택만 전달
      rewardBadge: customBadge ?? {
        emoji: "🏆",
        name: presetName.trim() || selectedPreset.name,
        tone: "bg-orange-100 text-orange-700",
        code: selectedPreset.code,
      },
      });
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex items-center gap-3 px-5 py-4">
        <button onClick={onBack} aria-label="뒤로가기">
          <ArrowLeftIcon size={22} />
        </button>
        <span className="font-display text-lg text-brown">챌린지 개설</span>
        <span
          className={`ml-auto rounded-full px-2.5 py-1 text-xs font-bold ${canCreate ? "bg-orange-100 text-orange-600" : "bg-cream-200 text-brown-muted"}`}
        >
          이번 달 {createdThisMonth}/3회
        </span>
      </header>
      <main className="no-scrollbar flex-1 overflow-y-auto px-5">
        {!canCreate && (
          <div className="rounded-2xl bg-orange-50 p-3 text-sm text-orange-700">
            이번 달 개설 가능 횟수(3회)를 모두 사용했어요.
          </div>
        )}
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-bold text-brown">
            챌린지 이름
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 서울 라멘 성지순례"
            className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400"
          />
        </label>
        <section className="mt-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-lg text-brown">
                목표 음식 리스트
              </h2>
              <p className="mt-1 text-xs text-brown-muted">
                참가자가 하나씩 인증해 해금할 음식을 추가하세요.
              </p>
            </div>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">
              목표 {targets.length}개
            </span>
          </div>
          <div className="mt-3 rounded-2xl bg-white p-3 shadow-soft">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="목표 음식 사진 등록"
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-orange-500"
              >
                {targetPreview ? (
                  <img
                    src={targetPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <CameraIcon size={18} />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickFile}
              />
              <input
                value={targetName}
                onChange={(event) => setTargetName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTarget();
                  }
                }}
                placeholder="예: 김치찌개"
                className="min-w-0 flex-1 rounded-xl bg-cream-100 px-3 text-sm outline-none"
              />
              <button
                onClick={addTarget}
                disabled={!targetName.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
                aria-label="목표 음식 추가"
              >
                <PlusIcon size={20} />
              </button>
            </div>
            <p className="mt-2 text-xs text-brown-soft">
              음식 이름과 사진을 함께 등록하세요. 사진은 상세 도감에서 흑백으로
              보이다가, 참가자가 인증하면 컬러로 바뀌어요.
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {targets.map((target, index) => (
              <div
                key={target.id}
                className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-soft"
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-xl">
                  {target.imageUrl ? (
                    <img
                      src={target.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    target.emoji
                  )}
                </span>
                <span className="flex-1 text-sm font-bold text-brown">
                  <small className="mr-1 text-brown-muted">{index + 1}.</small>
                  {target.name}
                </span>
                <button
                  onClick={() =>
                    setTargets((current) =>
                      current.filter((item) => item.id !== target.id),
                    )
                  }
                  aria-label={`${target.name} 삭제`}
                  className="text-brown-muted"
                >
                  <Trash2Icon size={17} />
                </button>
              </div>
            ))}
          </div>
          {!targets.length && (
            <div className="mt-3 rounded-2xl border-2 border-dashed border-cream-300 py-5 text-center text-sm text-brown-muted">
              목표 음식을 추가하면 자동으로 목표 개수가 설정돼요.
            </div>
          )}
        </section>
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <BadgeIcon size={17} className="text-orange-500" />
            <h2 className="font-display text-lg text-brown">
              완주 보상 뱃지 디자인
            </h2>
          </div>
          <p className="mt-1 text-xs text-brown-muted">
            프리셋을 고르거나 나만의 뱃지를 만들어 보세요.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {PRESETS.map((preset) => {
              const selected = !customBadge && selectedCode === preset.code;
              const image = resolveBadgeImage(preset.code, undefined);
              return (
                <button
                  key={preset.code}
                  onClick={() => {
                    setSelectedCode(preset.code);
                    setPresetName(preset.name); // 프리셋 바꾸면 이름도 기본값으로
                    onUsePreset();
                  }}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${selected ? "border-orange-500 bg-orange-50" : "border-transparent bg-white shadow-soft"}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BadgeIcon size={18} className="text-orange-400" />
                    )}
                  </span>
                  <span className="text-sm font-bold text-brown">
                    {preset.name}
                  </span>
                </button>
              );
            })}
            {/* 4번째 칸 — 커스텀 제작 */}
            <button
              onClick={onCustomBadge}
              className={`flex items-center gap-3 rounded-2xl border-2 border-dashed p-3 text-left ${customBadge ? "border-orange-500 bg-orange-50" : "border-orange-300 bg-white text-orange-600"}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-100 text-xl">
                {customBadge?.customImage ? (
                  <img
                    src={customBadge.customImage}
                    alt="커스텀 뱃지"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "✏️"
                )}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm">
                  {customBadge ? customBadge.name : "커스텀하기"}
                </strong>
                <small className="text-xs">직접 그리거나 이미지로</small>
              </span>
            </button>
          </div>
          {!customBadge && (
            <label className="mt-3 block">
              <span className="mb-1.5 block text-sm font-bold text-brown">
                보상 뱃지 이름
              </span>
              <input
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
                maxLength={18}
                placeholder={selectedPreset.name}
                className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400"
              />
            </label>
          )}
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
            <Badge
              variant="reward"
              imageSrc={rewardImage}
              label={`선택한 보상 뱃지 ${rewardName}`}
            >
              🏆
            </Badge>
            <span>
              <p className="text-xs text-brown-muted">완주 보상 미리보기</p>
              <strong className="text-sm text-brown">{rewardName}</strong>
            </span>
          </div>
        </section>
      </main>
      <div className="px-5 pb-8 pt-4">
        {canCreate && !enough && (
          <p className="mb-2 text-center text-xs font-medium text-brown-soft">
            목표 음식을 최소 {MIN_TARGETS}개 등록해야 개설할 수 있어요. (
            {MIN_TARGETS - targets.length}개 더 필요)
          </p>
        )}
        <button
          disabled={submitting || !canCreate || !title.trim() || !enough}
          onClick={create}
          className="h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card disabled:bg-action-disabled-bg disabled:text-action-disabled-text disabled:shadow-none"
        >
          {submitting
            ? '개설 중…'
            : enough
              ? `목표 ${targets.length}개로 챌린지 개설하기`
              : `목표 음식 ${targets.length}/${MIN_TARGETS}`}
        </button>
      </div>
    </div>
  );
}
