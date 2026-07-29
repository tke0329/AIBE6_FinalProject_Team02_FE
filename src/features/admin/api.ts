import { apiFetch } from '@/shared/lib/api';
import type { FoodRegistrationRequest, FoodReport, ReportStatus } from './types';

// ===== 제보 큐 =====

export function fetchPendingReports() {
  return apiFetch<FoodReport[]>('/api/v1/admin/reports');
}
// 제보 목록 (상태별). 기본은 대기.
export function fetchReports(status: ReportStatus = 'PENDING') {
  return apiFetch<FoodReport[]>(`/api/v1/admin/reports?status=${status}`);
}

export function acceptReport(reportId: number) {
  return apiFetch<void>(`/api/v1/admin/reports/${reportId}/accept`, { method: 'PATCH' });
}

export function rejectReport(reportId: number, reason: string) {
  return apiFetch<void>(`/api/v1/admin/reports/${reportId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

// ===== 등록 요청 큐 =====

export function fetchPendingRequests() {
  return apiFetch<FoodRegistrationRequest[]>('/api/v1/admin/registration-requests');
}

/** 등록 완료 — 이 순간 도감 칸이 열린다 */
export function completeRequest(requestId: number) {
  return apiFetch<void>(`/api/v1/admin/registration-requests/${requestId}/complete`, {
    method: 'PATCH',
  });
}

export function rejectRequest(requestId: number, reason: string) {
  return apiFetch<void>(`/api/v1/admin/registration-requests/${requestId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}