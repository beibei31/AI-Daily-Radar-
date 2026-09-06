"use client";

import { useState } from "react";
import { ArrowUpRight, Check, ChevronDown, Share2, Radio } from "lucide-react";
import { safeImageUrl } from "@/src/lib/feed-view";
import type { DailyItem } from "@/src/types/daily-item";

function formatSource(item: DailyItem) {
  const published = item.published_at
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        timeZone: "Asia/Shanghai",
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
  compact = false,
}: {
  item: DailyItem;
  compact?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const imageUrl = safeImageUrl(item.image_url);
  async function share() {
    if (!item.url) return;
    try {
      if (navigator.share)
        await navigator.share({ title: item.title, url: item.url });
      else {
        await navigator.clipboard.writeText(item.url);
        setShareStatus("链接已复制");
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setShareStatus("复制失败，请使用原文链接");
    }
  }
  const href = item.url || "#";
  const tags = item.tags?.slice(0, 5) ?? [];
  const whatHappened = item.what_happened || item.summary;
  const whyItMatters = item.why_it_matters || item.reason;

  return (
    <article className={`card ${compact ? "compact" : ""}`}>
      <div>
        <div className="news-meta">
          <span>
            <Radio size={13} /> {item.source || "资讯"}
          </span>
          {item.url && (
            <button
              className="icon-button"
              title="分享原文链接"
              aria-label="分享原文链接"
              onClick={share}
            >
              {shareStatus === "链接已复制" ? (
                <Check size={16} />
              ) : (
                <Share2 size={16} />
              )}
            </button>
          )}
        </div>
        {imageUrl && !imageFailed && (
          <img
            className="article-image"
            src={imageUrl}
            alt={item.product_name || item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        )}
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
        <div className="news-summary">{detail("发生了什么", whatHappened)}</div>
        {(whyItMatters || item.action) && (
          <details className="news-analysis">
            <summary>
              <span className="when-closed">展开解读</span>
              <span className="when-open">收起解读</span>
              <ChevronDown size={15} />
            </summary>
            {detail("为什么值得看", whyItMatters)}
            {detail("可以怎么用", item.action)}
          </details>
        )}
      </div>
      <div className="card-footer">
        <span className="source">{formatSource(item)}</span>
        {item.url ? (
          <a className="link" href={href} rel="noreferrer" target="_blank">
            原文 <ArrowUpRight size={16} />
          </a>
        ) : null}
      </div>
      {shareStatus && (
        <span className="share-status" role="status">
          {shareStatus}
        </span>
      )}
    </article>
  );
}
