import type { CuriosityItem } from "@/src/types/curiosity-item";

export function questionKey(item: CuriosityItem) {
  return (item.question || item.title)
    .toLocaleLowerCase()
    .replace(/[\s\p{P}]/gu, "");
}

export function uniqueQuestions(items: CuriosityItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = questionKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function nextExploration(
  items: CuriosityItem[],
  seen: string[],
  category?: string,
  random = Math.random,
) {
  const unread = uniqueQuestions(items).filter(
    (item) => !seen.includes(questionKey(item)),
  );
  const different = unread.filter((item) => item.category !== category);
  const pool = different.length ? different : unread;
  return pool.length ? pool[Math.floor(random() * pool.length)] : null;
}
