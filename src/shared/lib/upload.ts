import { apiFetch } from "@/shared/lib/api";

interface PresignedTarget {
  key: string;
  uploadUrl: string;
  publicUrl: string;
}
interface PresignedResponse {
  uploads: PresignedTarget[];
}

/**
 * 이미지를 S3에 직접 업로드하고, 저장용 object key를 반환
 * presigned PUT URL 발급 → 브라우저가 S3로 직접 PUT (서버는 안 거침)
 */
export async function uploadImageToS3(
  blob: Blob,
  fileName: string,
): Promise<{ key: string; publicUrl: string }> {
  const contentType = blob.type || "image/jpeg";

  // presigned URL 발급 (이름·타입만 전송)
  const { uploads } = await apiFetch<PresignedResponse>(
    "/api/v1/uploads/presigned",
    {
      method: "POST",
      body: JSON.stringify({ files: [{ fileName, contentType }] }),
    },
  );
  const target = uploads[0];

  // S3로 직접 PUT — 서버/쿠키 안 거침
  // Content-Type은 presign한 값과 동일해야 서명 유효
  const res = await fetch(target.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!res.ok)
    throw new Error("이미지 업로드에 실패했어요. 다시 시도해 주세요.");

  return { key: target.key, publicUrl: target.publicUrl };
}
