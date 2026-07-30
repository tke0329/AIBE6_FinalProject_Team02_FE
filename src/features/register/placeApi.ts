import { apiFetch } from "@/shared/lib/api";

/** 검색 결과 한 줄. 좌표는 화면에 안 보이고 등록 요청에만 실린다 */
export interface PlaceSummary {
  placeId: string;
  name: string;
  category: string | null;
  /** 도로명주소가 없는 장소가 있어 null 가능 — 그때는 address를 쓴다 */
  roadAddress: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export interface SearchCoords {
  lat: number;
  lng: number;
}

/**
 * 식당 검색. 카카오 REST 키가 브라우저로 내려오면 안 되므로 서버를 거친다.
 *
 * 좌표를 주면 반경 안에서 가까운 순으로, 없으면 전국에서 정확도순으로 나온다.
 */
export async function searchPlaces(
  query: string,
  coords?: SearchCoords,
): Promise<PlaceSummary[]> {
  const params = new URLSearchParams({ query });
  if (coords) {
    params.set("lat", String(coords.lat));
    params.set("lng", String(coords.lng));
  }
  return apiFetch<PlaceSummary[]>(`/api/v1/places?${params.toString()}`);
}

/** 목록에 보여줄 주소 한 줄. 도로명 우선, 없으면 지번 */
export function displayAddress(place: PlaceSummary): string | null {
  return place.roadAddress ?? place.address;
}
