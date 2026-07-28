import { apiFetch } from "@/shared/lib/api";

/** 등록 1건당 사진 1~5장 */
export const MAX_PHOTOS = 5;
/** 장당 최대 10MB */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
/** BE S3PresignedUrlService.ALLOWED_CONTENT_TYPES와 같은 목록을 유지해야 한다 */
export const ACCEPTED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
];

export const PHOTO_INPUT_ACCEPT = ACCEPTED_PHOTO_TYPES.join(",");

export interface UploadTarget {
  key: string;
  uploadUrl: string;
}

interface PresignedUploadResponse {
  uploads: UploadTarget[];
}

/**
 * 클라이언트 1차 검증. 서버도 형식을 다시 보지만, 사용자에게 즉시 알려 주려면 여기서도 본다.
 *
 * 용량은 presigned PUT 구조상 서버가 볼 수 없다 — 바이트가 서버를 거치지 않기 때문이다.
 * 등록 확정 시 서버가 S3 HeadObject로 실제 크기를 재확인해야 ("클라이언트 검증만 믿지 않는다")이 성립한다.
 */
export function validatePhotoFile(file: File): string | null {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    return `"${file.name}" — JPG·PNG·HEIC만 올릴 수 있어요`;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return `"${file.name}" — 사진 한 장은 10MB까지예요`;
  }
  return null;
}

/** 파일 순서와 응답 uploads 순서는 1:1로 대응한다. */
export async function requestUploadTargets(
  files: File[],
): Promise<UploadTarget[]> {
  const response = await apiFetch<PresignedUploadResponse>(
    "/api/v1/uploads/presigned",
    {
      method: "POST",
      body: JSON.stringify({
        files: files.map((file) => ({
          fileName: file.name,
          contentType: file.type,
        })),
      }),
    },
  );
  return response.uploads;
}

/**
 * S3에 직접 PUT.
 *
 * 공통 apiFetch를 쓰지 않는다 — S3는 우리 응답 래퍼를 쓰지 않고, 인증 쿠키를 실어 보내면 안 된다.
 * 서명에 contentType이 포함돼 있으므로 PUT도 반드시 같은 Content-Type으로 보내야 한다.
 */
export async function uploadPhotoToS3(
  file: File,
  target: UploadTarget,
): Promise<void> {
  const response = await fetch(target.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`사진을 올리지 못했어요 (${response.status})`);
  }
}
