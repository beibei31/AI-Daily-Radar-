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

export function DailyCard({
  item,
  compact = false
}: {
  item: DailyItem;
  compact?: boolean;
}) {
  const href = item.url || "#";

  return (
    <article className={`card ${compact ? "compact" : ""}`}>
      <div>
        <div className="card-top">
          <h3>{item.title}</h3>
          <span aria-label={`score ${item.score ?? 0}`} className="score">
            {item.score ?? 0}
          </span>
        </div>
        {item.summary ? <p className="summary">{item.summary}</p> : null}
        {item.reason ? <p className="reason">{item.reason}</p> : null}
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

