"use client";

import * as React from "react";
import { createClient } from "@supabase/supabase-js";
import { DailyCard } from "@/src/components/DailyCard";
import { getCategoryLabel, sectionMeta } from "@/src/lib/categories";
import {
  curiosityCategoryLabels,
  mockCuriosityItems
} from "@/src/lib/curiosity-data";
import { getShanghaiDayBounds, formatShanghaiDate } from "@/src/lib/date";
import { mockDailyItems } from "@/src/lib/mock-data";
import type {
  CuriosityCategory,
  CuriosityItem
} from "@/src/types/curiosity-item";
import type { DailyItem } from "@/src/types/daily-item";

type DailyReportState = {
  date: Date;
  curiosityIndex: number;
  curiosityItems: CuriosityItem[];
  isFallback: boolean;
  isLoading: boolean;
  items: DailyItem[];
};

const curiosityStorageKey = "ai-daily-radar-curiosity-interests";

function getTopItems(items: DailyItem[]) {
  return [...items]
    .filter((item) => item.category !== "try_today")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);
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
            <DailyCard key={`${item.url}-${item.title}`} compact={compact} item={item} />
          ))}
        </div>
      ) : (
        <div className="empty">今天暂时没有进入该分类的高质量信息。</div>
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

async function loadDailyItems(date: Date): Promise<DailyItem[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const bounds = getShanghaiDayBounds(date);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });
  const { data, error } = await supabase
    .from("daily_items")
    .select("*")
    .gte("created_at", bounds.start.toISOString())
    .lt("created_at", bounds.end.toISOString())
    .order("score", { ascending: false })
    .limit(40);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data as DailyItem[];
}

async function loadCuriosityItems(date: Date): Promise<CuriosityItem[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const bounds = getShanghaiDayBounds(date);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });
  const { data, error } = await supabase
    .from("curiosity_items")
    .select("*")
    .gte("created_at", bounds.start.toISOString())
    .lt("created_at", bounds.end.toISOString())
    .order("difficulty", { ascending: true })
    .limit(3);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data as CuriosityItem[];
}

function CuriosityCard({
  item,
  onLearnAnother,
  onRecordInterest,
  onSurprise
}: {
  item: CuriosityItem;
  onLearnAnother(): void;
  onRecordInterest(): void;
  onSurprise(): void;
}) {
  return (
    <section className="section curiosity-section">
      <div className="section-header">
        <div className="section-title">
          <span aria-hidden className="marker curiosity" />
          <h2>🧠 Curiosity of the Day</h2>
        </div>
        <button className="ghost-button" onClick={onSurprise} type="button">
          🎲 Surprise Me
        </button>
      </div>

      <article className="curiosity-card">
        <div>
          <div className="curiosity-meta">
            <span>{curiosityCategoryLabels[item.category]}</span>
            <span>Difficulty {item.difficulty}/5</span>
          </div>
          <h3>{item.title}</h3>
          <p className="curiosity-hook">{item.hook}</p>
        </div>

        <div className="curiosity-body">
          <div>
            <h4>这是什么？</h4>
            <p>{item.explanation}</p>
          </div>
          <div>
            <h4>最值得记住的一句话</h4>
            <p>{item.key_fact}</p>
          </div>
        </div>

        <div className="topic-row">
          {item.related_topics.map((topic) => (
            <span key={topic}>{topic}</span>
          ))}
        </div>

        <div className="card-footer">
          <a
            className="link"
            href={item.source_url}
            onClick={onRecordInterest}
            rel="noreferrer"
            target="_blank"
          >
            {item.source}
          </a>
          <button className="link button-link" onClick={onLearnAnother} type="button">
            再学一个
          </button>
        </div>
      </article>
    </section>
  );
}

export function DailyReportPage() {
  const [report, setReport] = React.useState<DailyReportState>({
    curiosityIndex: 0,
    curiosityItems: mockCuriosityItems,
    date: new Date(),
    isFallback: true,
    isLoading: true,
    items: mockDailyItems
  });

  React.useEffect(() => {
    let isMounted = true;
    const date = new Date();

    Promise.all([loadDailyItems(date), loadCuriosityItems(date)])
      .then(([items, curiosityItems]) => {
        if (!isMounted) {
          return;
        }

        setReport({
          curiosityIndex: 0,
          curiosityItems: curiosityItems ?? mockCuriosityItems,
          date,
          isFallback: !items || !curiosityItems,
          isLoading: false,
          items: items ?? mockDailyItems
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setReport({
          curiosityIndex: 0,
          curiosityItems: mockCuriosityItems,
          date,
          isFallback: true,
          isLoading: false,
          items: mockDailyItems
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const topItems = getTopItems(report.items);
  const curiosityItem =
    report.curiosityItems[report.curiosityIndex] ?? mockCuriosityItems[0];

  function handleLearnAnother() {
    recordCuriosityInterest(curiosityItem.category);
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
    setReport((current) => ({
      ...current,
      curiosityIndex: pickCuriosityIndex(
        current.curiosityItems,
        current.curiosityIndex,
        "surprise"
      )
    }));
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI Daily Radar</p>
          <h1>Good Morning ☀️</h1>
          <p className="subtitle">
            Tech Radar 追踪 AI / Agent / Coding / 开发者资讯；Curiosity Radar
            每天帮你发现一点新世界。
          </p>
        </div>
        <div className="date-pill">{formatShanghaiDate(report.date)}</div>
      </header>

      {report.isFallback ? (
        <div className="notice">
          <span>
            {report.isLoading
              ? "正在读取今日内容；如果没有配置 Supabase，将展示内置样例。"
              : "当前未读取到 Supabase 当日完整数据，页面正在展示内置样例。配置数据库后会自动切换为真实内容。"}
          </span>
        </div>
      ) : null}

      <Section
        countLabel="优先级最高"
        items={topItems}
        marker="hot"
        title="🔥 Today"
      />

      {sectionMeta.map((section) => {
        const items = report.items
          .filter((item) => item.category === section.category)
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, section.limit);

        return (
          <Section
            compact
            items={items}
            key={section.category}
            marker={section.marker}
            title={getCategoryLabel(section.category)}
          />
        );
      })}

      <CuriosityCard
        item={curiosityItem}
        onLearnAnother={handleLearnAnother}
        onRecordInterest={() => recordCuriosityInterest(curiosityItem.category)}
        onSurprise={handleSurprise}
      />
    </main>
  );
}
