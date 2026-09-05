import type { NormalizedItem } from "@/src/pipeline/types";

export function filterByRecency(items: NormalizedItem[], hours: number) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;

  return items.filter((item) => {
    if (!item.publishedAt) {
      return true;
    }

    const time = new Date(item.publishedAt).getTime();

    if (Number.isNaN(time)) {
      return true;
    }

    return time >= cutoff;
  });
}

export function recencyScore(publishedAt: string | null) {
  if (!publishedAt) {
    return 6;
  }

  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / (60 * 60 * 1000);

  if (ageHours <= 12) {
    return 10;
  }

  if (ageHours <= 24) {
    return 9;
  }

  if (ageHours <= 48) {
    return 7;
  }

  if (ageHours <= 72) {
    return 5;
  }

  return 2;
}

