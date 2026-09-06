"use client";

import * as React from "react";
import {
  Activity,
  ArrowUpRight,
  Brain,
  Check,
  ChevronDown,
  Code2,
  FlaskConical,
  Search,
  Shuffle,
  Sparkles,
  X,
} from "lucide-react";
import { HeadlineCarousel } from "@/src/components/HeadlineCarousel";
import { RippleBackground } from "@/src/components/RippleBackground";
import {
  filterFeed,
  type FeedFilter,
  type FeedSort,
} from "@/src/lib/feed-view";
import { DailyCard } from "@/src/components/DailyCard";
import { ProductPatternCard } from "@/src/components/ProductPatternCard";
import { getCuriosityTopicOptions } from "@/src/lib/curiosity-interactions";
import { curiosityCategoryLabels } from "@/src/lib/curiosity-data";
import { formatShanghaiDate } from "@/src/lib/date";
import type {
  CuriosityCategory,
  CuriosityItem,
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

type LearningCardKey = "curiosity" | "surprise";

type CuriosityReaction = "remembered" | "surprising" | "more";

type CardInteraction = {
  reaction: CuriosityReaction | null;
  revealed: boolean;
  selectedTopic: string | null;
  showFollowUp: boolean;
};

type InteractionState = Record<LearningCardKey, CardInteraction>;

type DailyReportPageProps = {
  initialCuriosityItems: CuriosityItem[];
  initialCuriosityStatus: DataStatus;
  initialDailyStatus: DataStatus;
  initialDate: string;
  initialItems: DailyItem[];
};

const curiosityStorageKey = "ai-daily-radar-curiosity-interests";

function createCardInteraction(): CardInteraction {
  return {
    reaction: null,
    revealed: false,
    selectedTopic: null,
    showFollowUp: false,
  };
}

function createInteractionState(): InteractionState {
  return {
    curiosity: createCardInteraction(),
    surprise: createCardInteraction(),
  };
}

function itemKey(item: DailyItem | CuriosityItem) {
  return "url" in item
    ? item.url || `${item.source}-${item.title}`
    : item.title;
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
  excludedKeys: Set<string>,
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
  compact = false,
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
        <span className="section-count">
          {countLabel ?? `${items.length} 条`}
        </span>
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
    <section id="products" className="section product-section">
      <div className="section-header">
        <div className="section-title">
          <span aria-hidden className="marker product" />
          <h2>
            <FlaskConical size={22} /> Product Patterns <small>产品拆解</small>
          </h2>
        </div>
        <span className="section-count">{products.length} 个产品</span>
      </div>
      {products.length > 0 ? (
        <div className="product-list">
          {products.map((item) => (
            <ProductPatternCard
              key={`${itemKey(item)}-${item.score ?? 0}`}
              item={item}
            />
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
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([category, weight]) =>
      Object.hasOwn(curiosityCategoryLabels, category) &&
      typeof weight === "number" && Number.isFinite(weight) && weight >= 0
    ));
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
  mode: "balanced" | "surprise",
) {
  if (items.length <= 1) {
    return 0;
  }

  let candidates = items
    .map((item, index) => ({ index, item }))
    .filter((entry) => entry.index !== currentIndex);
  if (mode === "surprise") {
    const unfamiliar = candidates.filter((entry) => entry.item.category !== items[currentIndex]?.category);
    if (unfamiliar.length) candidates = unfamiliar;
  }
  const interests = readCuriosityInterests();

  if (mode === "surprise" || Math.random() < 0.3) {
    const leastSeen = [...candidates].sort((a, b) => {
      return (
        (interests[a.item.category] ?? 0) - (interests[b.item.category] ?? 0)
      );
    });
    const pool = leastSeen.slice(
      0,
      Math.max(1, Math.ceil(leastSeen.length / 2)),
    );
    return pool[Math.floor(Math.random() * pool.length)].index;
  }

  const weighted = candidates.map((entry) => ({
    ...entry,
    weight: Math.max(1, interests[entry.item.category] ?? 0),
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
  interaction,
  marker,
  title,
  countLabel,
  onReaction,
  onSelectTopic,
  onToggleFollowUp,
  onToggleReveal,
  onNext,
  nextLabel,
  canNext,
}: {
  item: CuriosityItem | null;
  interaction: CardInteraction;
  marker: string;
  title: string;
  countLabel: string;
  onReaction(reaction: CuriosityReaction): void;
  onSelectTopic(topic: string): void;
  onToggleFollowUp(): void;
  onToggleReveal(): void;
  onNext(): void;
  nextLabel: string;
  canNext: boolean;
}) {
  const categoryLabel = item
    ? (curiosityCategoryLabels[item.category] ?? item.category)
    : "";
  const topicOptions = item
    ? getCuriosityTopicOptions(item.related_topics, categoryLabel)
    : [];

  return (
    <section
      id={marker === "surprise" ? "surprise" : "curiosity"}
      className={`section curiosity-section ${marker === "surprise" ? "surprise-section" : ""}`}
    >
      <div className="section-header">
        <div className="section-title">
          <span aria-hidden className={`marker ${marker}`} />
          <h2>
            {marker === "surprise" ? (
              <Shuffle size={22} />
            ) : (
              <Brain size={22} />
            )}
            {title}
          </h2>
        </div>
        <span className="section-count">{countLabel}</span>
      </div>

      {!item ? (
        <EmptyContent message="今天的知识问题尚未就绪，日报更新后再来探索。" />
      ) : (
        <article
          className={`curiosity-card ${interaction.revealed ? "is-revealed" : ""}`}
        >
          <div>
            <div className="curiosity-meta">
              <span>{categoryLabel}</span>
              <span>难度 {item.difficulty}/5</span>
            </div>
            <h3>{curiosityQuestion(item)}</h3>
            {interaction.revealed && (
              <p className="curiosity-hook">{item.hook}</p>
            )}
          </div>

          {!interaction.revealed ? (
            <div className="curiosity-guess">
              <span>先猜一个关键词</span>
              <div className="choice-row">
                {topicOptions.map((topic) => (
                  <button
                    aria-pressed={interaction.selectedTopic === topic}
                    className={`choice-button ${
                      interaction.selectedTopic === topic ? "is-active" : ""
                    }`}
                    key={topic}
                    onClick={() => onSelectTopic(topic)}
                    type="button"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          ) : (
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
                <div className="follow-up" hidden={!interaction.showFollowUp}>
                  <span>下一问</span>
                  <p>{item.next_question}</p>
                </div>
              ) : null}

              <div className="reaction-row" aria-label="学习反馈">
                <button
                  aria-pressed={interaction.reaction === "remembered"}
                  className={
                    interaction.reaction === "remembered" ? "is-active" : ""
                  }
                  onClick={() => onReaction("remembered")}
                  type="button"
                >
                  <Check size={15} /> 记住了
                </button>
                <button
                  aria-pressed={interaction.reaction === "surprising"}
                  className={
                    interaction.reaction === "surprising" ? "is-active" : ""
                  }
                  onClick={() => onReaction("surprising")}
                  type="button"
                >
                  <Sparkles size={15} /> 有点意外
                </button>
                <button
                  aria-pressed={interaction.reaction === "more"}
                  className={interaction.reaction === "more" ? "is-active" : ""}
                  onClick={() => onReaction("more")}
                  type="button"
                >
                  多给我这类
                </button>
              </div>
            </>
          )}

          <div className="card-footer">
            <div className="curiosity-actions">
              <button
                className="primary-button"
                aria-expanded={interaction.revealed}
                onClick={onToggleReveal}
                type="button"
              >
                <Sparkles size={17} />
                {interaction.revealed ? "收起答案" : "揭晓答案"}
              </button>
              {interaction.revealed && item.next_question ? (
                <button
                  className="ghost-button"
                  onClick={onToggleFollowUp}
                  type="button"
                >
                  {interaction.showFollowUp ? "收起追问" : "继续追问"}
                </button>
              ) : null}
              <button
                className="ghost-button"
                onClick={onNext}
                type="button"
                disabled={!canNext}
              >
                <Shuffle size={16} /> {canNext ? nextLabel : "今日暂无更多问题"}
              </button>
            </div>
            {interaction.revealed ? (
              <a
                className="link"
                href={item.source_url}
                rel="noreferrer"
                target="_blank"
              >
                {item.source}
                <ArrowUpRight size={16} />
              </a>
            ) : null}
          </div>
        </article>
      )}
    </section>
  );
}

function dataNoticeText(report: DailyReportState) {
  if (
    report.dailyStatus === "missing_env" ||
    report.curiosityStatus === "missing_env"
  ) {
    return "日报数据连接尚未配置完成。";
  }

  if (report.dailyStatus === "error" || report.curiosityStatus === "error") {
    return "部分日报暂时读取失败，请稍后刷新重试。";
  }

  return "今天的日报尚未全部就绪。已更新的内容会照常展示。";
}

export function DailyReportPage({
  initialCuriosityItems,
  initialCuriosityStatus,
  initialDailyStatus,
  initialDate,
  initialItems,
}: DailyReportPageProps) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<FeedFilter>("all");
  const [sort, setSort] = React.useState<FeedSort>("score");
  const [surpriseDrawn, setSurpriseDrawn] = React.useState(false);
  const [interactions, setInteractions] = React.useState<InteractionState>(
    createInteractionState,
  );
  const [report, setReport] = React.useState<DailyReportState>({
    curiosityIndex: 0,
    curiosityItems: initialCuriosityItems,
    curiosityStatus: initialCuriosityStatus,
    dailyStatus: initialDailyStatus,
    date: new Date(initialDate),
    items: initialItems,
    surpriseIndex: initialCuriosityItems.length > 1 ? 1 : 0,
  });

  const topItems = getTopItems(report.items);
  const techItems = getSectionItems(
    report.items,
    ["ai_news", "tool", "try_today"],
    40,
    new Set(),
  );
  const productItems = getSectionItems(report.items, ["product"], 2, new Set());
  const opportunityItems = getSectionItems(
    report.items,
    ["hackathon"],
    3,
    new Set(),
  );
  const curiosityItem = report.curiosityItems[report.curiosityIndex] ?? null;
  const surpriseItem = report.curiosityItems[report.surpriseIndex] ?? null;
  const filteredItems = filterFeed(techItems, query, filter, sort);
  const sources = new Set(
    report.items.map((item) => item.source).filter(Boolean),
  ).size;

  function handleLearnAnother() {
    if (!curiosityItem) {
      return;
    }

    recordCuriosityInterest(curiosityItem.category);
    setInteractions((current) => ({
      ...current,
      curiosity: createCardInteraction(),
    }));
    setReport((current) => ({
      ...current,
      curiosityIndex: pickCuriosityIndex(
        current.curiosityItems,
        current.curiosityIndex,
        "balanced",
      ),
    }));
  }

  function handleSurprise() {
    if (!surpriseItem) {
      return;
    }

    setInteractions((current) => ({
      ...current,
      surprise: createCardInteraction(),
    }));
    setReport((current) => ({
      ...current,
      surpriseIndex: pickCuriosityIndex(
        current.curiosityItems,
        current.surpriseIndex,
        "surprise",
      ),
    }));
  }

  function selectTopic(card: LearningCardKey, topic: string) {
    setInteractions((current) => ({
      ...current,
      [card]: {
        ...current[card],
        selectedTopic: topic,
      },
    }));
  }

  function toggleReveal(card: LearningCardKey, item: CuriosityItem | null) {
    if (!item) {
      return;
    }

    if (!interactions[card].revealed) {
      recordCuriosityInterest(item.category);
    }

    setInteractions((current) => ({
      ...current,
      [card]: {
        ...current[card],
        revealed: !current[card].revealed,
        showFollowUp: current[card].revealed
          ? false
          : current[card].showFollowUp,
      },
    }));
  }

  function toggleFollowUp(card: LearningCardKey) {
    setInteractions((current) => ({
      ...current,
      [card]: {
        ...current[card],
        showFollowUp: !current[card].showFollowUp,
      },
    }));
  }

  function reactToCard(
    card: LearningCardKey,
    item: CuriosityItem | null,
    reaction: CuriosityReaction,
  ) {
    if (!item) {
      return;
    }

    if (reaction === "more") {
      recordCuriosityInterest(item.category);
    }

    setInteractions((current) => ({
      ...current,
      [card]: {
        ...current[card],
        reaction,
      },
    }));
  }

  const hasMissingData =
    report.dailyStatus !== "ready" || report.curiosityStatus !== "ready";

  return (
    <>
      <RippleBackground />
      <a className="skip-link" href="#radar">
        跳到今日资讯
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#today" aria-label="PulseAI 首页">
            <img src="/pulse-emblem.png" width="36" height="36" alt="" />
            <span>
              Pulse<span className="brand-ai">AI</span>
            </span>
          </a>
          <nav aria-label="页面导航">
            <a href="#radar">
              每日热榜 <small>Daily Feed</small>
            </a>
            <a href="#products">
              产品拆解 <small>Products</small>
            </a>
            <a href="#opportunities">
              开发者机会 <small>Opportunities</small>
            </a>
            <a href="#explore">
              未知探索 <small>Explore</small>
            </a>
          </nav>
          <a
            className="icon-button header-search"
            href="#feed-search"
            title="搜索今日资讯"
            aria-label="搜索今日资讯"
          >
            <Search size={20} />
          </a>
        </div>
      </header>
      <main className="page">
        <div className="pulse-strip">
          <span className="live-label">
            <Activity size={15} /> DAILY PULSE
          </span>
          <span>
            今日精选 <strong>{report.items.length}</strong> 条
          </span>
          <span>
            信息来源 <strong>{sources}</strong> 个
          </span>
          <time dateTime={initialDate}>{formatShanghaiDate(report.date)}</time>
        </div>

        {hasMissingData ? (
          <div className="notice">
            <span>{dataNoticeText(report)}</span>
          </div>
        ) : null}

        <HeadlineCarousel items={topItems} />

        <section id="radar" className="section radar-section">
          <div className="section-header">
            <div className="section-title">
              <h2>
                <Code2 size={22} /> Tech Radar <small>前沿信号</small>
              </h2>
            </div>
            <span className="section-count">{filteredItems.length} 条精选</span>
          </div>
          <div className="feed-toolbar">
            <div className="filter-tabs" role="group" aria-label="资讯分类">
              {(
                [
                  ["all", "全部洞察"],
                  ["agent", "Agent / MCP"],
                  ["coding", "AI Coding"],
                  ["tool", "开源与工具"],
                ] as const
              ).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="feed-controls">
              <label className="search-field">
                <Search size={17} />
                <input
                  id="feed-search"
                  aria-label="搜索今日资讯"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索标题、来源、标签"
                />
                {query && (
                  <button
                    className="icon-button"
                    title="清除搜索"
                    aria-label="清除搜索"
                    onClick={() => setQuery("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
              <label className="sort-field">
                <select
                  aria-label="资讯排序"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as FeedSort)}
                >
                  <option value="score">推荐优先</option>
                  <option value="newest">最新发布</option>
                </select>
                <ChevronDown size={14} />
              </label>
            </div>
          </div>
          {filteredItems.length ? (
            <div className="grid">
              {filteredItems.map((item) => (
                <DailyCard key={itemKey(item)} item={item} />
              ))}
            </div>
          ) : (
            <div className="empty">
              {techItems.length
                ? "没有匹配的资讯，试试其他关键词或分类。"
                : "今天的技术资讯尚未就绪。"}
            </div>
          )}
        </section>

        <ProductPatternsSection items={productItems} />

        <div id="opportunities">
          <Section
            compact
            countLabel={`${opportunityItems.length} 条`}
            items={opportunityItems}
            marker="hackathon"
            title="Opportunities · 开发者机会"
          />
        </div>

        <div id="explore" className="explore-intro">
          <span className="eyebrow">
            <Sparkles size={16} /> A LITTLE OUTSIDE YOUR ORBIT
          </span>
          <h2>每天，发现一点新世界。</h2>
          <p>从今天的一个问题，到意料之外的一个领域。</p>
        </div>

        <CuriosityRevealCard
          countLabel="今日问题"
          interaction={interactions.curiosity}
          item={curiosityItem}
          marker="curiosity"
          nextLabel="再学一个"
          canNext={report.curiosityItems.length > 1}
          onNext={handleLearnAnother}
          onReaction={(reaction) =>
            reactToCard("curiosity", curiosityItem, reaction)
          }
          onSelectTopic={(topic) => selectTopic("curiosity", topic)}
          onToggleFollowUp={() => toggleFollowUp("curiosity")}
          onToggleReveal={() => toggleReveal("curiosity", curiosityItem)}
          title="Curiosity · 今日一问"
        />

        <div className="surprise-draw">
          <span className="eyebrow">
            <Shuffle size={16} /> SURPRISE ME / 随机探索
          </span>
          <h2>下一站，会遇见什么？</h2>
          <p>天文、气味、艺术、日常科学……让好奇心决定方向。</p>
          <button
            type="button"
            className="primary-button draw-button"
            disabled={
              !surpriseItem ||
              (surpriseDrawn && report.curiosityItems.length <= 1)
            }
            onClick={() => {
              handleSurprise();
              setSurpriseDrawn(true);
            }}
          >
            <Sparkles size={22} />
            {!surpriseItem
              ? "等待今日知识更新"
              : surpriseDrawn
                ? "换一换，再探索"
                : "抽取一个未知问题"}
          </button>
          {surpriseDrawn && report.curiosityItems.length <= 1 && (
            <p className="muted">
              今天只有一个问题，更多内容将在下次日报更新。
            </p>
          )}
        </div>
        {surpriseDrawn && (
          <CuriosityRevealCard
            countLabel="随机陌生领域"
            interaction={interactions.surprise}
            item={surpriseItem}
            marker="surprise"
            nextLabel="换一个领域"
            canNext={report.curiosityItems.length > 1}
            onNext={handleSurprise}
            onReaction={(reaction) =>
              reactToCard("surprise", surpriseItem, reaction)
            }
            onSelectTopic={(topic) => selectTopic("surprise", topic)}
            onToggleFollowUp={() => toggleFollowUp("surprise")}
            onToggleReveal={() => toggleReveal("surprise", surpriseItem)}
            title="你的探索发现"
          />
        )}
        <footer className="site-footer">
          <a className="brand" href="#today">
            <img src="/pulse-emblem.png" width="26" height="26" alt="" />
            PulseAI
          </a>
          <span>AI Daily Radar · 保持好奇，独立思考。</span>
          <a href="#today">回到顶部 ↑</a>
        </footer>
      </main>
    </>
  );
}
