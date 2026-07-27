import { DexEntry, DEX_ENTRIES, FoodCategory } from "@/shared/data/dex";
import { apiFetch } from "@/shared/lib/api";

interface BasicDexResponse {
  id: number;
  name: string;
  category: string;
  illustrationUrl: string | null;
}

const DEFAULT_FOOD_ICON = "🍽️";

const CATEGORY_LABELS: Record<string, FoodCategory> = {
  "밥·죽·한그릇": "밥·죽·한 그릇",
  "밥·죽·한 그릇": "밥·죽·한 그릇",
  "면": "면",
  "국·탕·찌개": "국·탕·찌개",
  "고기·구이·볶음": "고기 구이·볶음",
  "고기 구이·볶음": "고기 구이·볶음",
  "튀김·치킨·가스": "튀김·치킨·까스",
  "튀김·치킨·까스": "튀김·치킨·까스",
  "해산물·회": "해산물·회",
  "분식·길거리": "분식·길거리",
  "빵·버거·피자·브런치": "빵·버거·피자·브런치",
  "디저트·음료": "디저트·음료",
};

export async function fetchBasicDexEntries(): Promise<DexEntry[]> {
  const items = await apiFetch<BasicDexResponse[]>("/api/v1/dex/basic");
  return items.map((item) => {
    const local = DEX_ENTRIES.find(
      (entry) => entry.id === item.id || entry.name === item.name,
    );

    return {
      ...local,
      id: item.id,
      name: item.name,
      emoji: local?.emoji ?? DEFAULT_FOOD_ICON,
      category: CATEGORY_LABELS[item.category] ?? "밥·죽·한 그릇",
      illustrationUrl: item.illustrationUrl ?? undefined,
      collected: local?.collected ?? false,
    };
  });
}
