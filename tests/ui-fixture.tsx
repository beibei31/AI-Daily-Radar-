import React from "react";
import { createRoot } from "react-dom/client";
import { DailyReportPage } from "../src/components/DailyReportPage";
import type { DailyItem } from "../src/types/daily-item";
import type { CuriosityItem } from "../src/types/curiosity-item";

// Browser-only test fixture. Never imported by an application route or the pipeline.
const titles = [
  "测试：MCP Agent 开发工具",
  "测试：Java Backend 工程实践",
  "测试：一条很长的产品发布标题用于验证轮播区域切换时不会上下跳动和挤压其他控件",
  "测试：开源模型更新",
  "测试：AI Coding 工具",
  "测试：开源工作流",
  "测试：独立开发产品",
  "测试：开发者活动",
];
const items: DailyItem[] = titles.map((title, n) => ({
  title,
  id: n + 1,
  category:
    n === 6 ? "product" : n === 7 ? "hackathon" : n % 2 ? "ai_news" : "tool",
  summary: "这是自动化测试内容，用于验证真实数据结构下的布局和交互。",
  why_it_matters: "理解工程方法与产品取舍，把有价值的技术引入自己的项目。",
  action: "先在小型测试项目中验证，再评估适用场景。",
  reason: null,
  score: 96 - n * 4,
  url: `https://example.com/article/${n}`,
  source: n % 2 ? "Engineering Blog" : "GitHub",
  tags: n % 2 ? ["Java", "Backend"] : ["MCP", "Agent"],
  published_at: `2026-09-0${n + 1}T00:00:00Z`,
  image_url:
    n === 0
      ? "/invalid.png"
      : n === 1
        ? "https://fixture.test/image.png"
        : null,
  product_name: n === 6 ? "测试产品" : null,
  product_takeaways: n === 6 ? ["明确的任务入口", "可验证的结果反馈"] : null,
}));
const curiosity: CuriosityItem[] = [
  "为什么指南针不总是指向地理北极？",
  "为什么烤面包会产生香味？",
  "为什么地球上会出现四季？",
].map((title, n) => ({
  id: n + 1,
  title,
  category: n === 0 ? "tools" : n === 1 ? "food_science" : "astronomy",
  hook: "测试提示：这里包含部分答案，揭晓前也需要隐藏。",
  explanation: "这是测试答案，只应在用户点击揭晓之后出现。",
  key_fact: "理解原理，而不只是记住结论。",
  related_topics: ["原理", "日常观察", "科学"],
  difficulty: 2,
  source: "测试知识来源",
  source_url: "https://example.com/knowledge",
  next_question: "还可以继续研究什么？",
}));
const params = new URLSearchParams(location.search);
const empty = params.has("empty");
const single = params.has("single");
createRoot(document.getElementById("root")!).render(
  <DailyReportPage
    initialExplorationItems={
      empty
        ? []
        : single
          ? curiosity.slice(0, 1)
          : [
              ...curiosity,
              ...curiosity.map((item, n) => ({
                ...item,
                title: `归档测试问题 ${n}：为什么会发生？`,
                report_date: "2026-09-01",
              })),
            ]
    }
    initialCuriosityItems={
      empty ? [] : single ? curiosity.slice(0, 1) : curiosity
    }
    initialCuriosityStatus={empty ? "empty" : "ready"}
    initialDailyStatus={empty ? "empty" : "ready"}
    initialDate="2026-09-06T02:00:00.000Z"
    initialItems={empty ? [] : items}
  />,
);
