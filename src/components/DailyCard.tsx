import type { DailyItem } from "@/src/types/daily-item";

function formatSource(item: DailyItem) {
  const published = item.published_at
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        timeZone: "Asia/Shanghai"
      }).format(new Date(item.published_at))
    : null;

  return [item.source, published].filter(Boolean).join(" / ");
}

function detail(label: string, value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return (
    <div className="card-detail">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

export function DailyCard({
  item,
  compact = false
}: {
  item: DailyItem;
  compact?: boolean;
}) {
  const href = item.url || "#";
  const tags = item.tags?.slice(0, 5) ?? [];
  const whatHappened = item.what_happened || item.summary;
  const whyItMatters = item.why_it_matters || item.reason;

  return (
    <article className={`card ${compact ? "compact" : ""}`}>
      <div>
        <div className="card-top">
          <h3>{item.title}</h3>
          <span aria-label={`score ${item.score ?? 0}`} className="score">
            {item.score ?? 0}
          </span>
        </div>
        {tags.length > 0 ? (
          <div className="tag-row" aria-label="tags">
            {tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {detail("发生了什么", whatHappened)}
        {detail("为什么值得看", whyItMatters)}
        {detail("可以怎么用", item.action)}
      </div>
      <div className="card-footer">
        <span className="source">{formatSource(item)}</span>
        {item.url ? (
          <a className="link" href={href} rel="noreferrer" target="_blank">
            原文
          </a>
        ) : null}
      </div>
    </article>
  );
}
