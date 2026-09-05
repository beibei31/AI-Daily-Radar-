import type { ProductPattern } from "@/src/types/product-pattern";

function sourceLine(item: ProductPattern) {
  const published = item.published_at
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        timeZone: "Asia/Shanghai"
      }).format(new Date(item.published_at))
    : null;

  return [item.source, published].filter(Boolean).join(" / ");
}

export function ProductPatternCard({ item }: { item: ProductPattern }) {
  const takeaways = item.product_takeaways?.slice(0, 5) ?? [];
  const tags = item.tags?.slice(0, 4) ?? [];

  return (
    <article className="product-card">
      <div className="product-card-main">
        <div className="product-heading">
          <div>
            <span className="product-kicker">产品</span>
            <h3>{item.product_name || item.title}</h3>
          </div>
          <span aria-label={`score ${item.score ?? 0}`} className="score">
            {item.score ?? 0}
          </span>
        </div>

        {tags.length > 0 ? (
          <div className="tag-row">
            {tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="product-grid">
          <div>
            <span>做什么</span>
            <p>{item.product_one_liner || item.summary}</p>
          </div>
          <div>
            <span>给谁</span>
            <p>{item.target_user || "开发者、独立开发者或小团队"}</p>
          </div>
          <div>
            <span>为什么值得关注</span>
            <p>{item.why_it_matters || item.reason}</p>
          </div>
          <div>
            <span>我的启发</span>
            <p>{item.inspiration || item.action}</p>
          </div>
        </div>
      </div>

      <div className="takeaway-panel">
        <span>可以偷师</span>
        <ul>
          {takeaways.length > 0 ? (
            takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)
          ) : (
            <li>记录它如何把复杂能力包装成一个明确用户任务。</li>
          )}
        </ul>
        <div className="card-footer">
          <span className="source">{sourceLine(item)}</span>
          {item.url ? (
            <a className="link" href={item.url} rel="noreferrer" target="_blank">
              原文
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
