"use client";

import { DexEntry } from "@/shared/data/dex";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DexAliasMap, fetchDexAliases } from "./api";
import { ConfirmResult } from "./confirmApi";
import {
  MAX_PHOTOS,
  requestUploadTargets,
  uploadPhotoToS3,
  validatePhotoFile,
} from "./uploadApi";
import { SlotVerdict } from "./verificationApi";

/** 한 상 사진은 이름을 여러 개 보낸다. 상한 5개 */
export const MAX_FOOD_NAMES = 5;

export type PhotoStatus = "uploading" | "uploaded" | "failed";

export interface RegisterPhoto {
  /** 클라이언트 전용 식별자. S3 key는 업로드가 끝나야 생긴다 */
  id: string;
  file: File;
  /** URL.createObjectURL — 제거·언마운트 시 revoke한다 */
  previewUrl: string;
  status: PhotoStatus;
  /** 업로드 완료 후 S3 object key. 등록 확정 시 서버로 보낸다 */
  key?: string;
}

interface RegisterFlowStore {
  /** AI에 함께 보낼 음식 이름들. 도감에서 고른 칸만 들어온다 (자유 타이핑 금지) */
  selectedSlots: DexEntry[];
  addSlot: (slot: DexEntry) => void;
  removeSlot: (slotId: number) => void;
  clearSlots: () => void;
  canAddMore: boolean;
  /** 도감 칸 id → 별칭. 검색이 표기 흔들림을 흡수하는 데 쓴다 */
  aliases: DexAliasMap;

  photos: RegisterPhoto[];
  addPhotos: (files: File[]) => void;
  removePhoto: (photoId: string) => void;
  retryPhoto: (photoId: string) => void;
  photoError: string | null;
  clearPhotoError: () => void;
  /** 업로드가 전부 끝났는지 — 하나라도 진행 중이면 다음 단계로 못 넘어간다 */
  photosReady: boolean;

  /** AI에 보낼 단 한 장. 지정하지 않으면 첫 장 */
  analysisPhotoId: string | null;
  setAnalysisPhotoId: (photoId: string) => void;
  analysisPhoto: RegisterPhoto | null;

  /** 검증을 시작하면 서버가 만들어 준다. 재시도 때 그대로 보내야 상한이 이어서 세어진다 */
  registrationId: number | null;
  setRegistrationId: (id: number) => void;
  /** 검증을 통과해 해금 대상이 된 칸들. 기록 화면이 이걸로 화면 수를 정한다 */
  recordSlots: SlotVerdict[];
  setRecordSlots: (slots: SlotVerdict[]) => void;

  /** AI에 보낼 사진의 S3 key와 위치 — 업로드가 끝난 사진만 대상 */
  uploadedPhotoKeys: string[];
  analysisPhotoIndex: number;

  /** 해금 결과. 연출 화면이 첫 해금/중복 수집을 갈라 쓴다 (§5.1) */
  unlockResult: ConfirmResult | null;
  setUnlockResult: (result: ConfirmResult) => void;
}

const RegisterFlowContext = createContext<RegisterFlowStore | null>(null);

/**
 * 등록 플로우 진행 상태 (Context는 등록 플로우 진행 상태에 사용).
 *
 * 전역 AppStateProvider가 아니라 /register 하위에만 붙인다.
 * 등록을 벗어나면 초기화되는 것이 옳은 동작이고, 전역 상태를 등록 전용 필드로 불리지 않는다.
 */
export function RegisterFlowProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedSlots, setSelectedSlots] = useState<DexEntry[]>([]);
  const [aliases, setAliases] = useState<DexAliasMap>({});
  const [photos, setPhotos] = useState<RegisterPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [analysisPhotoId, setAnalysisPhotoId] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [recordSlots, setRecordSlots] = useState<SlotVerdict[]>([]);
  const [unlockResult, setUnlockResult] = useState<ConfirmResult | null>(null);

  // addPhotos는 비동기라 클로저에 갇힌 photos를 믿을 수 없다. 남은 자리 계산에만 쓴다.
  const photosRef = useRef<RegisterPhoto[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // 별칭 사전은 등록 플로우 진입 시 한 번만 받는다 (약 5.5KB).
  // 실패해도 등록을 막지 않는다 — 별칭이 없어도 이름·초성 검색은 그대로 된다.
  useEffect(() => {
    let cancelled = false;
    fetchDexAliases()
      .then((map) => {
        if (!cancelled) setAliases(map);
      })
      .catch(() => {
        // 검색 품질만 떨어질 뿐 플로우는 계속된다
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 미리보기 URL은 브라우저가 자동으로 놓아주지 않는다. 화면을 뜰 때 정리한다.
  useEffect(
    () => () => {
      photosRef.current.forEach((photo) =>
        URL.revokeObjectURL(photo.previewUrl),
      );
    },
    [],
  );

  const markPhoto = useCallback(
    (photoId: string, patch: Partial<RegisterPhoto>) => {
      setPhotos((current) =>
        current.map((photo) =>
          photo.id === photoId ? { ...photo, ...patch } : photo,
        ),
      );
    },
    [],
  );

  /** 한 장씩 올린다. 한 장이 실패해도 나머지는 살린다 — 전부 다시 고르게 하면 이탈한다. */
  const uploadPhotos = useCallback(
    async (targets: RegisterPhoto[]) => {
      try {
        const uploadTargets = await requestUploadTargets(
          targets.map((photo) => photo.file),
        );

        await Promise.all(
          targets.map(async (photo, index) => {
            const target = uploadTargets[index];
            try {
              await uploadPhotoToS3(photo.file, target);
              markPhoto(photo.id, { status: "uploaded", key: target.key });
            } catch {
              markPhoto(photo.id, { status: "failed" });
            }
          }),
        );
      } catch {
        // presigned 발급 자체가 실패하면 이번에 고른 사진 전부가 실패다
        targets.forEach((photo) => markPhoto(photo.id, { status: "failed" }));
        setPhotoError("사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요");
      }
    },
    [markPhoto],
  );

  const addPhotos = useCallback(
    (files: File[]) => {
      setPhotoError(null);

      const room = MAX_PHOTOS - photosRef.current.length;
      if (room <= 0) {
        setPhotoError(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요`);
        return;
      }

      const valid: File[] = [];
      for (const file of files) {
        const problem = validatePhotoFile(file);
        if (problem) {
          setPhotoError(problem);
          continue;
        }
        valid.push(file);
      }

      if (valid.length > room) {
        setPhotoError(
          `사진은 최대 ${MAX_PHOTOS}장까지예요. ${room}장만 담았어요`,
        );
      }

      const accepted: RegisterPhoto[] = valid.slice(0, room).map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "uploading",
      }));

      if (accepted.length === 0) return;

      setPhotos((current) => [...current, ...accepted]);
      void uploadPhotos(accepted);
    },
    [uploadPhotos],
  );

  const removePhoto = useCallback((photoId: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === photoId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((photo) => photo.id !== photoId);
    });
    // 분석 사진을 지웠으면 지정을 풀어 첫 장으로 되돌린다
    setAnalysisPhotoId((current) => (current === photoId ? null : current));
  }, []);

  const retryPhoto = useCallback(
    (photoId: string) => {
      const target = photosRef.current.find((photo) => photo.id === photoId);
      if (!target) return;
      setPhotoError(null);
      markPhoto(photoId, { status: "uploading" });
      void uploadPhotos([target]);
    },
    [markPhoto, uploadPhotos],
  );

  const addSlot = useCallback((slot: DexEntry) => {
    setSelectedSlots((current) => {
      if (current.length >= MAX_FOOD_NAMES) return current;
      if (current.some((selected) => selected.id === slot.id)) return current;
      return [...current, slot];
    });
  }, []);

  const removeSlot = useCallback((slotId: number) => {
    setSelectedSlots((current) => current.filter((slot) => slot.id !== slotId));
  }, []);

  const clearSlots = useCallback(() => setSelectedSlots([]), []);

  // 지정이 없으면 첫 장이 분석 사진이다 (1장만 올렸으면 자동 지정)
  const analysisPhoto = useMemo(
    () =>
      photos.find((photo) => photo.id === analysisPhotoId) ?? photos[0] ?? null,
    [photos, analysisPhotoId],
  );

  // 업로드가 끝난 사진만 서버로 보낸다. key는 업로드 완료 시점에 생긴다
  const uploadedPhotos = useMemo(
    () =>
      photos.filter((photo): photo is RegisterPhoto & { key: string } =>
        Boolean(photo.key),
      ),
    [photos],
  );
  const uploadedPhotoKeys = useMemo(
    () => uploadedPhotos.map((photo) => photo.key),
    [uploadedPhotos],
  );
  const analysisPhotoIndex = useMemo(() => {
    const index = uploadedPhotos.findIndex(
      (photo) => photo.id === analysisPhoto?.id,
    );
    return index >= 0 ? index : 0;
  }, [uploadedPhotos, analysisPhoto]);

  const value = useMemo<RegisterFlowStore>(
    () => ({
      selectedSlots,
      addSlot,
      removeSlot,
      clearSlots,
      canAddMore: selectedSlots.length < MAX_FOOD_NAMES,
      aliases,
      photos,
      addPhotos,
      removePhoto,
      retryPhoto,
      photoError,
      clearPhotoError: () => setPhotoError(null),
      photosReady:
        photos.length > 0 &&
        photos.every((photo) => photo.status === "uploaded"),
      analysisPhotoId,
      setAnalysisPhotoId,
      analysisPhoto,
      registrationId,
      setRegistrationId,
      recordSlots,
      setRecordSlots,
      uploadedPhotoKeys,
      analysisPhotoIndex,
      unlockResult,
      setUnlockResult,
    }),
    [
      selectedSlots,
      addSlot,
      removeSlot,
      clearSlots,
      aliases,
      photos,
      addPhotos,
      removePhoto,
      retryPhoto,
      photoError,
      analysisPhotoId,
      analysisPhoto,
      registrationId,
      recordSlots,
      uploadedPhotoKeys,
      analysisPhotoIndex,
      unlockResult,
    ],
  );

  return (
    <RegisterFlowContext.Provider value={value}>
      {children}
    </RegisterFlowContext.Provider>
  );
}

export function useRegisterFlow() {
  const store = useContext(RegisterFlowContext);
  if (!store) {
    throw new Error(
      "useRegisterFlow는 RegisterFlowProvider 안에서만 쓸 수 있어요.",
    );
  }
  return store;
}
