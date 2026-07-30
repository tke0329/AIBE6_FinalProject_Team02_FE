"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchCoords } from "./placeApi";

const GEO_OPTIONS: PositionOptions = {
  // 반경 20km 안에서 고르는 용도라 수백 m 오차는 무의미하고, 실내에서 GPS는 느리거나 실패한다
  enableHighAccuracy: false,
  // 사용자가 권한 창에서 "허용"을 누르기까지의 시간이 이 타임아웃에 포함된다
  timeout: 15000,
  maximumAge: 5 * 60 * 1000,
};

/** `denied`만 영구다 — 나머지는 일시적이라 다시 눌러 볼 수 있다 */
export type NearbyStatus =
  | "idle"
  | "asking"
  | "granted"
  | "denied"
  | "unavailable";

// 세션 캐시 — 언마운트 후 돌아와도 다시 묻지 않는다. 거부는 브라우저가 기억해 재요청이 막힌다
let cachedCoords: SearchCoords | null = null;
let cachedDenied = false;

export function useNearbyCoords() {
  const [coords, setCoords] = useState<SearchCoords | null>(cachedCoords);
  const [status, setStatus] = useState<NearbyStatus>(
    cachedCoords ? "granted" : cachedDenied ? "denied" : "idle",
  );

  // navigator가 서버에 없으므로 첫 렌더는 true로 두고 마운트 후 고친다 (하이드레이션 불일치 방지)
  const [supported, setSupported] = useState(true);
  useEffect(() => setSupported(Boolean(navigator.geolocation)), []);

  const request = useCallback(() => {
    if (coords) return; // 이미 받았으면 다시 묻지 않는다

    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const found = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        cachedCoords = found;
        setCoords(found);
        setStatus("granted");
      },
      (error) => {
        // 화면에는 뭉뚱그려 보여주므로 원인은 콘솔에 남긴다
        console.warn(`[내 주변] 위치 실패 (code ${error.code}): ${error.message}`);

        if (error.code === error.PERMISSION_DENIED) {
          cachedDenied = true;
          setStatus("denied");
          return;
        }
        // 타임아웃·위치 못 찾음은 일시적이라 캐시하지 않고 재시도를 열어 둔다
        setStatus("unavailable");
      },
      GEO_OPTIONS,
    );
  }, [coords]);

  return { coords, status, supported, request };
}
