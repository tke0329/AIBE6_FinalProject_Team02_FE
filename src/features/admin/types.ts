// 관리자 콘솔 도메인 타입. BE의 DTO/enum과 필드명을 일치시킨다.

export type ReportStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type RegistrationRequestStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

/** 미확인 음식 제보 (BE FoodReportResponseDTO) */
export interface FoodReport {
  id: number;
  registrationId: number | null;
  description: string;
  status: ReportStatus;
  createdAt: string; // ISO 문자열
  reporterId : number | null;
  reporterName : string | null;
}

/** 음식 등록 요청 = AI가 못 끝낸 등록 (BE FoodRegistrationRequestResponseDTO) */
export interface FoodRegistrationRequest {
  id: number;
  registrationId: number | null;
  collectionCardId: number | null;
  description: string;          // 음식(칸) 이름
  failureReason: string | null; // AI가 왜 못 끝냈는지
  status: RegistrationRequestStatus;
  evidenceUrl: string | null;   // 증빙 사진 presigned URL (만료됨)
  createdAt: string;
}