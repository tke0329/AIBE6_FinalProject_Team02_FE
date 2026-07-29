import type { FoodReport } from '@/features/admin/types';
import { apiFetch } from '@/shared/lib/api';

/** 도감에 없는 음식 제보 (BE POST /api/v1/reports) */
export function createReport(name: string) {
  return apiFetch<FoodReport>('/api/v1/reports', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}