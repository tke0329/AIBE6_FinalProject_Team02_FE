import { apiFetch } from "@/shared/lib/api";

/** 재분석 상한을 다 썼을 때 서버가 주는 코드. 수동 폴백 안내로 갈린다 (§5.2) */
export const RETRY_LIMIT_EXCEEDED = "RETRY_LIMIT_EXCEEDED";

/** 음식 이름 하나에 대한 판정. matched=false면 그 칸은 해금되지 않는다 */
export interface SlotVerdict {
  slotId: number;
  slotName: string;
  category: string;
  matched: boolean;
  confidence: number;
  reason: string;
}

export interface VerificationResult {
  /** 재시도 때 그대로 돌려보내야 상한이 이어서 세어진다 */
  registrationId: number;
  verdicts: SlotVerdict[];
  allMatched: boolean;
  retriesLeft: number;
}

interface VerificationRequest {
  registrationId: number | null;
  photoKeys: string[];
  analysisPhotoIndex: number;
  slotIds: number[];
}

export async function verifyFoods(
  request: VerificationRequest,
): Promise<VerificationResult> {
  return apiFetch<VerificationResult>("/api/v1/register/verifications", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
