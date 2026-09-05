import type { DailyItem } from "@/src/types/daily-item";

const now = new Date().toISOString();

export const mockDailyItems: DailyItem[] = [
  {
    category: "ai_news",
    created_at: now,
    published_at: now,
    reason: "Agent 能力和开发者工作流直接相关，值得优先跟进 API 与产品形态变化。",
    score: 94,
    source: "OpenAI",
    summary: "新模型与工具调用能力更新，强化了复杂编码任务和长链路自动化场景。",
    title: "OpenAI 发布面向开发者的新 Agent 能力",
    url: "https://openai.com/news/"
  },
  {
    category: "tool",
    created_at: now,
    published_at: now,
    reason: "可以作为个人项目的底层能力，也适合写进后端与 AI Coding 简历项目。",
    score: 90,
    source: "GitHub",
    summary: "一个快速增长的开源 MCP 工具集，提供常用 SaaS 与本地开发环境连接能力。",
    title: "新的 MCP Server 工具集在 GitHub 快速增长",
    url: "https://github.com/topics/mcp"
  },
  {
    category: "hackathon",
    created_at: now,
    published_at: now,
    reason: "在线参赛门槛低，题目适合做成可展示的 Agent 项目。",
    score: 88,
    source: "Brabble Hackathons",
    summary: "一个面向 AI 应用开发者的线上 Hackathon 开放报名，关注 Agent 与自动化应用。",
    title: "AI Agent Hackathon 开放报名",
    url: "https://devpost.com/hackathons"
  },
  {
    category: "product",
    created_at: now,
    published_at: now,
    reason: "说明垂直场景的小而深产品仍有机会，适合独立开发者验证。",
    score: 84,
    source: "Hacker News",
    summary: "开发者讨论一个把代码审查、Issue 分析和发布说明串联起来的 AI 产品。",
    title: "面向小团队的软件交付 Agent 产品受到关注",
    url: "https://news.ycombinator.com/"
  },
  {
    category: "try_today",
    created_at: now,
    published_at: now,
    reason: "半天内可以完成最小 Demo，用来验证 MCP 与个人知识库结合的价值。",
    score: 86,
    source: "Today Try",
    summary: "搭一个最小 MCP Server，把本地项目 README、Issue 和提交记录暴露给 AI Coding 工具。",
    title: "今天尝试：为自己的项目做一个 MCP Server",
    url: "https://modelcontextprotocol.io/"
  }
];
