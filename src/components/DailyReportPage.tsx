"use client";

import * as React from "react";
import { DailyCard } from "@/src/components/DailyCard";
import { ProductPatternCard } from "@/src/components/ProductPatternCard";
import { curiosityCategoryLabels } from "@/src/lib/curiosity-data";
import { formatShanghaiDate } from "@/src/lib/date";
import type {
  CuriosityCategory,
  CuriosityItem
} from "@/src/types/curiosity-item";
import type { DailyItem } from "@/src/types/daily-item";
import { isProductPattern } from "@/src/types/product-pattern";

type DataStatus = "ready" | "empty" | "missing_env" | "error";

type DailyReportState = {
  date: Date;
  curiosityIndex: number;
  surpriseIndex: number;
  curiosityItems: CuriosityItem[];
  curiosityStatus: DataStatus;
  dailyStatus: DataStatus;
  items: DailyItem[];
};

type RevealState = {
  curiosity: boolean;
  surprise: boolean;
};

type DailyReportPageProps = {
  initialCuriosityItems: CuriosityItem[];
  initialCuriosityStatus: DataStatus;
  initialDailyStatus: DataStatus;
  initialDate: string;
  initialItems: DailyItem[];
};

const curiosityStorageKey = "ai-daily-radar-curiosity-interests";

function itemKey(item: DailyItem | CuriosityItem) {
  return "url" in item ? item.url || `${item.source}-${item.title}` : item.title;
}

function sortByScore(items: DailyItem[]) {
  return [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

function getTopItems(items: DailyItem[]) {
  return sortByScore(items)
    .filter((item) => item.category !== "try_today")
    .slice(0, 3);
}

function getSectionItems(
  items: DailyItem[],
  categories: DailyItem["category"][],
  limit: number,
  excludedKeys: Set<string>
) {
  return sortByScore(items)
    .filter((item) => categories.includes(item.category))
    .filter((item) => !excludedKeys.has(itemKey(item)))
    .slice(0, limit);
}

function Section({
  title,
  marker,
  countLabel,
  items,
  compact = false
}: {
  title: string;
  marker: string;
  countLabel?: string;
  items: DailyItem[];
  compact?: boolean;
}) {
  return (
    <section className="section">
      <div className="section-header">
        <div className="section-title">
          <span aria-hidden className={`marker ${marker}`} />
          <h2>{title}</h2>
        </div>
        <span className="section-count">{countLabel ?? `${items.length} 条`}</span>
      </div>
      {items.length > 0 ? (
        <div className={items.length === 1 ? "grid two" : "grid"}>
          {items.map((item) => (
            <DailyCard
              key={`${itemKey(item)}-${item.category}-${item.score ?? 0}`}
              compact={compact}
              item={item}
            />
          ))}
        </div>
      ) : (
        <div className="empty">今天暂时没有进入该分类的高质量信息。</div>
      )}
    </section>
  );
}

function ProductPatternsSection({ items }: { items: DailyItem[] }) {
  const products = items.filter(isProductPattern);

  return (
    <section className="section product-section">
      <div className="section-header">
        <div className="section-title">
          <span aria-hidden className="marker product" />
          <h2>🧪 Product Patterns</h2>
        </div>
        <span className="section-count">{products.length} 个产品</span>
      </div>
      {products.length > 0 ? (
        <div className="product-list">
          {products.map((item) => (
            <ProductPatternCard key={`${itemKey(item)}-${item.score ?? 0}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="empty">今天暂时没有值得单独拆解的产品。</div>
      )}
    </section>
  );
}

function readCuriosityInterests(): Partial<Record<CuriosityCategory, number>> {
  try {
    const raw = window.localStorage.getItem(curiosityStorageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function recordCuriosityInterest(category: CuriosityCategory) {
  try {
    const interests = readCuriosityInterests();
    interests[category] = (interests[category] ?? 0) + 1;
    window.localStorage.setItem(curiosityStorageKey, JSON.stringify(interests));
  } catch {
    // Local preference tracking is optional; the app should work without storage.
  }
}

function pickCuriosityIndex(
  items: CuriosityItem[],
  currentIndex: number,
  mode: "balanced" | "surprise"
) {
  if (items.length <= 1) {
    return 0;
  }

  const candidates = items
    .map((item, index) => ({ index, item }))
    .filter((entry) => entry.index !== currentIndex);
  const interests = readCuriosityInterests();

  if (mode === "surprise" || Math.random() < 0.3) {
    const leastSeen = [...candidates].sort((a, b) => {
      return (interests[a.item.category] ?? 0) - (interests[b.item.category] ?? 0);
    });
    const pool = leastSeen.slice(0, Math.max(1, Math.ceil(leastSeen.length / 2)));
    return pool[Math.floor(Math.random() * pool.length)].index;
  }

  const weighted = candidates.map((entry) => ({
    ...entry,
    weight: Math.max(1, interests[entry.item.category] ?? 0)
  }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = Math.random() * total;

  for (const entry of weighted) {
    cursor -= entry.weight;

    if (cursor <= 0) {
      return entry.index;
    }
  }

  return candidates[0].index;
}

function curiosityQuestion(item: CuriosityItem) {
  return item.question || item.title;
}

function EmptyContent({ message }: { message: string }) {
  return <div className="empty">{message}</div>;
}

function CuriosityRevealCard({
  item,
  marker,
  title,
  countLabel,
  revealed,
  onReveal,
  onNext,
  nextLabel
}: {
  item: CuriosityItem | null;
  marker: string;
  title: string;
  countLabel: string;
  revealed: boolean;
  onReveal(): void;
  onNext(): void;
  nextLabel: string;
}) {
  return (
    <section className="section curiosity-section">
      <div className="section-header">
        <div className="section-title">
          <span aria-hidden className={`marker ${marker}`} />
          <h2>{title}</h2>
        </div>
        <span className="section-count">{countLabel}</span>
      </div>

      {!item ? (
        <EmptyContent message="今天暂时没有 Curiosity 数据。运行 pipeline 后，这里会显示当天问题。" />
      ) : (
      <article className="curiosity-card">
        <div>
          <div className="curiosity-meta">
            <span>{curiosityCategoryLabels[item.category]}</span>
            <span>Difficulty {item.difficulty}/5</span>
          </div>
          <h3>{curiosityQuestion(item)}</h3>
          <p className="curiosity-hook">{item.hook}</p>
        </div>

        {revealed ? (
          <>
            <div className="curiosity-body">
              <div>
                <h4>这是什么？</h4>
                <p>{item.explanation}</p>
              </div>
              <div>
                <h4>记住一句</h4>
                <p>{item.key_fact}</p>
              </div>
            </div>

            <div className="topic-row">
              {item.related_topics.map((topic) => (
                <span key={topic}>{topic}</span>
              ))}
            </div>

            {item.next_question ? (
              <p className="next-question">想继续：{item.next_question}</p>
            ) : null}
          </>
        ) : null}

        <div className="card-footer">
          <div className="curiosity-actions">
            <button className="primary-button" onClick={onReveal} type="button">
              Reveal Answer
            </button>
            <button className="ghost-button" onClick={onNext} type="button">
              {nextLabel}
            </button>
          </div>
          {revealed ? (
            <a className="link" href={item.source_url} rel="noreferrer" target="_blank">
              {item.source}
            </a>
          ) : null}
        </div>
      </article>
      )}
    </section>
  );
}

function dataNoticeText(report: DailyReportState) {
  if (report.dailyStatus === "missing_env" || report.curiosityStatus === "missing_env") {
    return "服务端缺少 Supabase 环境变量。请检查 .env.local 或 Vercel / GitHub Secrets。";
  }

  if (report.dailyStatus === "error" || report.curiosityStatus === "error") {
    return "读取 Supabase 时出错。请检查表结构、RLS 权限，或终端里的 Next 日志。";
  }

  return "当前未读取到 Supabase 当日完整数据。请确认已执行 report_date 迁移，并重新运行 npm run pipeline。";
}

export function DailyReportPage({
  initialCuriosityItems,
  initialCuriosityStatus,
  initialDailyStatus,
  initialDate,
  initialItems
}: DailyReportPageProps) {
  const [revealed, setRevealed] = React.useState<RevealState>({
    curiosity: false,
    surprise: false
  });
  const [report, setReport] = React.useState<DailyReportState>({
    curiosityIndex: 0,
    curiosityItems: initialCuriosityItems,
    curiosityStatus: initialCuriosityStatus,
    dailyStatus: initialDailyStatus,
    date: new Date(initialDate),
    items: initialItems,
    surpriseIndex: initialCuriosityItems.length > 1 ? 1 : 0
  });

  const topItems = getTopItems(report.items);
  const topKeys = new Set(topItems.map(itemKey));
  const techItems = getSectionItems(
    report.items,
    ["ai_news", "tool", "try_today"],
    8,
    topKeys
  );
  const productItems = getSectionItems(report.items, ["product"], 2, topKeys);
  const opportunityItems = getSectionItems(
    report.items,
    ["hackathon"],
    3,
    topKeys
  );
  const curiosityItem =
    report.curiosityItems[report.curiosityIndex] ?? null;
  const surpriseItem = report.curiosityItems[report.surpriseIndex] ?? null;

  function handleLearnAnother() {
    if (!curiosityItem) {
      return;
    }

    recordCuriosityInterest(curiosityItem.category);
    setRevealed((current) => ({ ...current, curiosity: false }));
    setReport((current) => ({
      ...current,
      curiosityIndex: pickCuriosityIndex(
        current.curiosityItems,
        current.curiosityIndex,
        "balanced"
      )
    }));
  }

  function handleSurprise() {
    if (!surpriseItem) {
      return;
    }

    setRevealed((current) => ({ ...current, surprise: false }));
    setReport((current) => ({
      ...current,
      surpriseIndex: pickCuriosityIndex(
        current.curiosityItems,
        current.surpriseIndex,
        "surprise"
      )
    }));
  }

  function revealCuriosity() {
    if (!curiosityItem) {
      return;
    }

    recordCuriosityInterest(curiosityItem.category);
    setRevealed((current) => ({ ...current, curiosity: true }));
  }

  function revealSurprise() {
    if (!surpriseItem) {
      return;
    }

    recordCuriosityInterest(surpriseItem.category);
    setRevealed((current) => ({ ...current, surprise: true }));
  }

  const hasMissingData =
    (report.dailyStatus !== "ready" || report.curiosityStatus !== "ready");

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI Daily Radar</p>
          <h1>Good Morning</h1>
          <p className="subtitle">每天帮你筛选、解释、启发，也发现一点新世界。</p>
        </div>
        <div className="date-pill">
          {formatShanghaiDate(report.date)}
        </div>
      </header>

      {hasMissingData ? (
        <div className="notice">
          <span>{dataNoticeText(report)}</span>
        </div>
      ) : null}

      <Section
        countLabel="今天最值得知道的 3 条"
        items={topItems}
        marker="hot"
        title="🔥 Today"
      />

      <Section
        compact
        countLabel={`${techItems.length} 条`}
        items={techItems}
        marker=""
        title="🤖 Tech Radar"
      />

      <ProductPatternsSection items={productItems} />

      <Section
        compact
        countLabel={`${opportunityItems.length} 条`}
        items={opportunityItems}
        marker="hackathon"
        title="🏆 Opportunities"
      />

      <CuriosityRevealCard
        countLabel="今日问题"
        item={curiosityItem}
        marker="curiosity"
        nextLabel="再学一个"
        onNext={handleLearnAnother}
        onReveal={revealCuriosity}
        revealed={revealed.curiosity}
        title="🧠 Curiosity"
      />

      <CuriosityRevealCard
        countLabel="随机陌生领域"
        item={surpriseItem}
        marker="surprise"
        nextLabel="换一个领域"
        onNext={handleSurprise}
        onReveal={revealSurprise}
        revealed={revealed.surprise}
        title="🎲 Surprise Me"
      />
    </main>
  );
}
