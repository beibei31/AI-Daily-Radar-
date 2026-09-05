export const pipelineConfig = {
  maxCandidates: Number(process.env.PIPELINE_MAX_CANDIDATES || 60),
  minScoreToSave: Number(process.env.PIPELINE_MIN_SCORE || 55),
  recencyHours: Number(process.env.PIPELINE_RECENCY_HOURS || 72),
  llmBatchSize: Number(process.env.LLM_BATCH_SIZE || 10),
  curiosityItemsPerDay: Number(process.env.CURIOSITY_ITEMS_PER_DAY || 3)
};

export const personalPreferences = {
  boost: [
    "AI Agent",
    "AI Coding",
    "MCP",
    "Java",
    "Backend",
    "indie hacking",
    "new AI product",
    "hackathon",
    "developer event",
    "resume-worthy project",
    "personal developer technology"
  ],
  chineseDiscovery: [
    "稀土掘金",
    "CSDN",
    "InfoQ 中文",
    "优质个人技术博客",
    "开发者社区文章"
  ],
  downrank: [
    "funding announcement",
    "corporate press release",
    "duplicate news",
    "generic AI news",
    "clickbait"
  ]
};
