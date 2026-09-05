import type { DailyItem } from "@/src/types/daily-item";

export type ProductPattern = DailyItem & {
  category: "product";
  product_name?: string | null;
  product_one_liner?: string | null;
  target_user?: string | null;
  product_takeaways?: string[] | null;
  inspiration?: string | null;
};

export function isProductPattern(item: DailyItem): item is ProductPattern {
  return item.category === "product";
}
