"use client";

import { ArrowLeftIcon, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  nickname: string;
  currentImageUrl: string | null;
  submitting: boolean;
  error: string | null;
  /** 크롭된 정사각 이미지(Blob) 업로드 */
  onSubmit: (blob: Blob) => void;
  /** 사진 제거 → 닉네임 첫 글자로 */
  onRemove: () => void;
  onBack: () => void;
}

const V = 256; // 크롭 뷰포트 한 변(px)
const OUTPUT = 512; // 저장 이미지 한 변(px)

/** 프로필 사진 변경 — 이미지를 골라 원형으로 위치 조정 후 등록, 없으면 닉네임 첫 글자 */
export function ProfilePhotoChange({
  nickname,
  currentImageUrl,
  submitting,
  error,
  onSubmit,
  onRemove,
  onBack,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);

  const letter = nickname.trim().charAt(0) || "?";

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSrc(URL.createObjectURL(file));
    setNat(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    e.target.value = ""; // 같은 파일 재선택 허용
  };

  const onImgLoad = () => {
    const el = imgRef.current;
    if (el) setNat({ w: el.naturalWidth, h: el.naturalHeight });
  };

  // 이미지가 항상 뷰포트를 덮도록 offset을 제한
  const clamp = (off: { x: number; y: number }, z: number) => {
    if (!nat) return off;
    const base = V / Math.min(nat.w, nat.h);
    const maxX = Math.max(0, (nat.w * base * z - V) / 2);
    const maxY = Math.max(0, (nat.h * base * z - V) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, off.x)),
      y: Math.max(-maxY, Math.min(maxY, off.y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOffset(
      clamp(
        {
          x: drag.current.ox + (e.clientX - drag.current.sx),
          y: drag.current.oy + (e.clientY - drag.current.sy),
        },
        zoom,
      ),
    );
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const changeZoom = (z: number) => {
    setZoom(z);
    setOffset((o) => clamp(o, z));
  };

  // 화면 표시와 동일한 변환으로 원본에서 크롭 영역을 계산해 canvas로 추출
  const apply = () => {
    const img = imgRef.current;
    if (!img || !nat || submitting) return;
    const base = V / Math.min(nat.w, nat.h);
    const scale = base * zoom;
    const dispW = nat.w * scale;
    const dispH = nat.h * scale;
    const imgLeft = V / 2 + offset.x - dispW / 2;
    const imgTop = V / 2 + offset.y - dispH / 2;
    const sx = -imgLeft / scale;
    const sy = -imgTop / scale;
    const sSize = V / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob((blob) => blob && onSubmit(blob), "image/jpeg", 0.9);
  };

  const base = nat ? V / Math.min(nat.w, nat.h) : 1;

  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex items-center gap-3 px-5 py-4">
        <button onClick={onBack} aria-label="뒤로가기">
          <ArrowLeftIcon size={21} className="text-brown" />
        </button>
        <h1 className="font-display text-xl text-brown">프로필 사진</h1>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pt-4">
        {src ? (
          // 크롭 모드
          <>
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              className="relative touch-none overflow-hidden rounded-full bg-cream-200 shadow-inner"
              style={{ width: V, height: V, cursor: "grab" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt=""
                draggable={false}
                onLoad={onImgLoad}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: nat ? nat.w * base * zoom : "auto",
                  height: nat ? nat.h * base * zoom : "auto",
                  visibility: nat ? "visible" : "hidden",
                  maxWidth: "none",
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
              <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/70" />
            </div>
            <p className="mt-3 text-xs text-brown-muted">
              드래그로 위치, 아래 슬라이더로 확대를 조절하세요.
            </p>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => changeZoom(Number(e.target.value))}
              aria-label="확대"
              className="mt-4 w-full max-w-xs accent-orange-500"
            />
          </>
        ) : (
          // 선택 전: 현재 프로필 미리보기
          <div className="flex h-64 w-64 items-center justify-center overflow-hidden rounded-full bg-orange-100">
            {currentImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImageUrl}
                alt="현재 프로필"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-display text-6xl text-orange-700">
                {letter}
              </span>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-orange-600">{error}</p>}
        {/* 숨은 파일 입력 */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif"
          onChange={pickFile}
          className="hidden"
        />
      </main>

      <div className="space-y-3 px-6 pb-10">
        {src ? (
          <button
            onClick={apply}
            disabled={submitting}
            className="h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card transition active:scale-[0.98] disabled:bg-cream-300 disabled:text-brown-muted"
          >
            {submitting ? "저장 중…" : "이 사진으로 등록"}
          </button>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={submitting}
            className="flex h-cta w-full items-center justify-center gap-2 rounded-full bg-orange-500 font-display text-lg text-white shadow-card transition active:scale-[0.98] disabled:opacity-60"
          >
            <ImageIcon size={20} /> 앨범에서 선택
          </button>
        )}

        {!src && currentImageUrl && (
          <button
            onClick={onRemove}
            disabled={submitting}
            className="min-h-touch w-full text-center text-sm text-brown-soft disabled:opacity-60"
          >
            기본 이미지로 변경
          </button>
        )}
        {src && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={submitting}
            className="min-h-touch w-full text-center text-sm text-brown-soft disabled:opacity-60"
          >
            다른 사진 선택
          </button>
        )}
      </div>
    </div>
  );
}
