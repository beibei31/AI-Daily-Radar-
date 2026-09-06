"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Radio,
  Terminal,
  Zap,
} from "lucide-react";
import type { DailyItem } from "@/src/types/daily-item";

export function HeadlineCarousel({ items }: { items: DailyItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const touch = useRef<number | null>(null);
  const activeIndex = index % Math.max(items.length, 1);
  const active = items[activeIndex];
  const stopped =
    paused || hovered || focused || reducedMotion || items.length < 2;
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (stopped) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setElapsed((value) => value + 100);
    }, 100);
    return () => window.clearInterval(timer);
  }, [stopped]);
  useEffect(() => {
    if (elapsed < 8000) return;
    setIndex((value) => (value + 1) % Math.max(items.length, 1));
    setElapsed(0);
  }, [elapsed, items.length]);
  function go(next: number) {
    setIndex((next + items.length) % items.length);
    setElapsed(0);
  }

  if (!active)
    return (
      <section className="headline-empty" id="today">
        <Radio size={30} />
        <h1>今天的信号，正在路上。</h1>
        <p>日报生成后，最值得关注的内容会出现在这里。</p>
      </section>
    );
  return (
    <section
      id="today"
      className="headline"
      aria-label="今日头条"
      aria-roledescription="轮播"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      onTouchStart={(event) => {
        touch.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touch.current !== null) {
          const delta = touch.current - event.changedTouches[0].clientX;
          if (Math.abs(delta) > 60) go(activeIndex + (delta > 0 ? 1 : -1));
        }
        touch.current = null;
      }}
    >
      <div className="headline-top">
        <span className="eyebrow">
          <Radio size={14} /> TODAY / 今日焦点
        </span>
        <div className="slide-controls">
          <span className="mono">
            0{activeIndex + 1} <span className="muted">/ 0{items.length}</span>
          </span>
          <button
            className="icon-button"
            title={paused ? "自动播放" : "暂停轮播"}
            aria-label={paused ? "自动播放" : "暂停轮播"}
            onClick={() => setPaused(!paused)}
            disabled={items.length < 2}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            className="icon-button"
            aria-label="上一条头条"
            title="上一条头条"
            onClick={() => go(activeIndex - 1)}
            disabled={items.length < 2}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="icon-button"
            aria-label="下一条头条"
            title="下一条头条"
            onClick={() => go(activeIndex + 1)}
            disabled={items.length < 2}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="headline-deck">
        {items.map((active, n) => (
          <div
            className={`headline-content ${n === activeIndex ? "is-current" : ""}`}
            aria-hidden={n !== activeIndex}
            inert={n !== activeIndex}
            key={`${active.title}-${n}`}
          >
            <div className="headline-copy">
              <div className="headline-meta">
                <span className="tag">{active.tags?.[0] || "精选资讯"}</span>
                <span>{active.source || "原始来源"}</span>
              </div>
              <h1>{active.title}</h1>
              <p className="headline-summary">
                {active.what_happened || active.summary}
              </p>
              <div className="headline-insights">
                <div>
                  <Zap size={18} />
                  <div>
                    <h3>为什么值得关注</h3>
                    <p>
                      {active.why_it_matters || active.reason || "暂无详细解读"}
                    </p>
                  </div>
                </div>
                <div>
                  <Terminal size={18} />
                  <div>
                    <h3>可以怎么用</h3>
                    <p>
                      {active.action || "阅读原始发布，了解适用场景与限制。"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <aside className="headline-signal">
              <span className="eyebrow">RADAR SCORE</span>
              <div className="signal-number">
                {active.score ?? "--"}
                <small>/100</small>
              </div>
              <span className="muted">综合推荐分</span>
              <div className="signal-bars" aria-hidden="true">
                {Array.from({ length: 20 }, (_, n) => (
                  <i
                    key={n}
                    className={n < (active.score ?? 0) / 5 ? "lit" : ""}
                  />
                ))}
              </div>
              <p>{active.source}</p>
              {active.url && (
                <a
                  className="text-link"
                  href={active.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  查看原始发布 <ArrowUpRight size={17} />
                </a>
              )}
            </aside>
          </div>
        ))}
      </div>
      <div className="slide-bottom">
        <div className="slide-dots">
          {items.map((item, n) => (
            <button
              key={`${item.title}-${n}`}
              aria-label={`查看第 ${n + 1} 条头条`}
              aria-current={n === activeIndex ? "true" : undefined}
              onClick={() => go(n)}
            >
              <span className={n === activeIndex ? "active" : ""} />
            </button>
          ))}
        </div>
        <span className="mono muted">
          {stopped ? "已暂停" : `${Math.ceil((8000 - elapsed) / 1000)}s`}
        </span>
      </div>
      <div className="slide-progress" aria-hidden="true">
        <span style={{ width: `${elapsed / 80}%` }} />
      </div>
    </section>
  );
}
