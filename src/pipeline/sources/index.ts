import { GitHubRepoSourceAdapter } from "@/src/pipeline/sources/github";
import { HackerNewsSourceAdapter } from "@/src/pipeline/sources/hacker-news";
import { RssSourceAdapter } from "@/src/pipeline/sources/rss";
import type { SourceAdapter } from "@/src/pipeline/types";

const aiKeywords = [
  "agent",
  "agents",
  "mcp",
  "model context protocol",
  "coding",
  "developer",
  "llm",
  "ai",
  "open source",
  "java",
  "backend",
  "tool"
];

const chineseTechKeywords = [
  ...aiKeywords,
  "人工智能",
  "智能体",
  "大模型",
  "代码生成",
  "编程",
  "开发者",
  "后端",
  "Java",
  "架构",
  "框架",
  "开源",
  "实践",
  "踩坑"
];

function getExtraRssSources() {
  const raw = process.env.EXTRA_TECH_RSS_SOURCES;

  if (!raw) {
    return [];
  }

  return raw
    .split(/[;\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => {
      const [label, url] = entry.split("|").map((part) => part.trim());

      if (!label || !url) {
        return null;
      }

      return new RssSourceAdapter({
        id: `extra-rss-${index}`,
        includeKeywords: chineseTechKeywords,
        label,
        url
      });
    })
    .filter((adapter): adapter is RssSourceAdapter => Boolean(adapter));
}

export function getSourceAdapters(): SourceAdapter[] {
  return [
    new RssSourceAdapter({
      id: "openai",
      label: "OpenAI",
      url: "https://openai.com/news/rss.xml"
    }),
    new RssSourceAdapter({
      id: "google-blog-ai",
      includeKeywords: aiKeywords,
      label: "Google AI Blog",
      url: "https://blog.google/technology/ai/rss/"
    }),
    new RssSourceAdapter({
      id: "google-developers",
      includeKeywords: aiKeywords,
      label: "Google Developers Blog",
      url: "https://blog.google/technology/developers/rss/"
    }),
    new RssSourceAdapter({
      id: "deepmind",
      label: "Google DeepMind",
      url: "https://deepmind.google/blog/feed/basic/"
    }),
    new RssSourceAdapter({
      id: "hugging-face",
      label: "Hugging Face",
      url: "https://huggingface.co/blog/feed.xml"
    }),
    new RssSourceAdapter({
      id: "github-blog",
      includeKeywords: aiKeywords,
      label: "GitHub Blog",
      url: "https://github.blog/feed/"
    }),
    new RssSourceAdapter({
      id: "vercel",
      includeKeywords: aiKeywords,
      label: "Vercel Blog",
      url: "https://vercel.com/blog/rss.xml"
    }),
    new RssSourceAdapter({
      id: "infoq-cn",
      includeKeywords: chineseTechKeywords,
      label: "InfoQ 中文",
      url: "https://www.infoq.cn/feed"
    }),
    new RssSourceAdapter({
      id: "oschina-news",
      includeKeywords: chineseTechKeywords,
      label: "OSChina",
      url: "https://www.oschina.net/news/rss"
    }),
    new RssSourceAdapter({
      categoryHint: "hackathon",
      id: "brabble-hackathons",
      includeKeywords: ["ai", "agent", "developer", "code", "hackathon", "llm"],
      label: "Brabble Hackathons",
      url: "https://brabble.ai/rss/hackathons.xml"
    }),
    new GitHubRepoSourceAdapter(),
    new HackerNewsSourceAdapter(),
    ...getExtraRssSources()
  ];
}
