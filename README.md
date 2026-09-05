# AI Daily Radar

个人 Tech + Curiosity 日报 Web App。V1 面向单用户，不做登录、支付、后台管理和复杂推荐系统。

产品有两条内容主线：

- Tech Radar：AI / Agent / Coding / 开发者资讯。
- Curiosity Radar：每天用问题式卡片学习 1 个有趣、小众、值得记住的知识，并保留随机探索。

首页保留 6 个区块：

- 🔥 Today：今天最值得知道的 3 条。
- 🤖 Tech Radar：AI / Agent / Coding / 开源，合并工具类内容。
- 🧪 Product Patterns：每天拆 1-2 个值得学习的产品。
- 🏆 Opportunities：Hackathon / 比赛 / 活动。
- 🧠 Curiosity：先给问题，点击后显示解释。
- 🎲 Surprise Me：随机探索陌生领域。

## Stack

- Next.js App Router + TypeScript
- Supabase PostgreSQL
- GitHub Actions daily scheduler
- OpenAI-compatible LLM API, with heuristic fallback when no key is configured
- RSS/API source adapters

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without Supabase env vars, the static homepage displays richer mock data so UI work and deployment checks still run. With `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, the browser reads today's Tech and Curiosity rows from Supabase.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Add these environment variables locally and in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
LLM_API_KEY=
LLM_API_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-v4-flash
GITHUB_TOKEN=
CURIOSITY_ITEMS_PER_DAY=3
EXTRA_TECH_RSS_SOURCES=
```

For V1, keep Row Level Security simple. The GitHub Actions pipeline should use `SUPABASE_SECRET_KEY` for writes. The static homepage uses the publishable key for reads, so `daily_items` and `curiosity_items` need public read access or a view/policy scoped to this single-user app.

## Pipeline

Run manually:

```bash
npm run pipeline
```

Pipeline:

```text
fetch_sources()
  -> normalize()
  -> deduplicate()
  -> filter_by_recency()
  -> rank_with_llm()
  -> categorize()
  -> explain()
  -> extract_product_patterns()
  -> generate_curiosity()
  -> save_to_supabase()
```

If `LLM_API_KEY` is absent, the pipeline uses deterministic keyword scoring. This keeps local development free and prevents scheduled runs from failing due only to a missing model key.

For each Tech item, the LLM or fallback now writes:

- `tags`
- `what_happened`
- `why_it_matters`
- `action`

For product items, it also writes:

- `product_name`
- `product_one_liner`
- `target_user`
- `product_takeaways`
- `inspiration`

Default V1 sources:

- OpenAI News RSS
- Google AI Blog RSS
- Google Developers Blog RSS
- Google DeepMind Blog RSS
- Hugging Face Blog RSS
- GitHub Blog RSS
- Vercel Blog RSS
- InfoQ 中文 RSS
- OSChina RSS
- Brabble Hackathons RSS
- GitHub repository search
- Hacker News Algolia API

Chinese community sources are second-tier discovery sources. They are keyword-filtered and downranked slightly by the heuristic scorer, so original sources win when duplicates exist. Juejin, CSDN, RSSHub feeds, and personal blogs can be added without code changes through:

```bash
EXTRA_TECH_RSS_SOURCES="稀土掘金|https://example.com/juejin-feed;CSDN|https://example.com/csdn-feed"
```

Curiosity content is generated from a curated, source-backed concept pool by default. This avoids pseudo-science and keeps daily runs free. The homepage stores Curiosity category interest counts in `localStorage` and selects roughly 70% from known interests and 30% from less-seen categories when the user clicks "再学一个"; "Surprise Me" intentionally explores unfamiliar categories and reveals answers only after the user opens them.

## Daily Schedule

GitHub Actions is configured in `.github/workflows/daily-radar.yml`.

- Runs daily at `00:30 UTC`, which is `08:30 Asia/Shanghai`.
- Installs dependencies.
- Runs `npm run pipeline`.
- Requires repository secrets for Supabase and optional LLM/GitHub credentials.

## Vercel Deployment

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Set the same environment variables in Vercel.
4. Deploy on the free `*.vercel.app` domain.

The frontend is a static Next.js export and responsive, so the same deployment works on desktop and mobile. GitHub Actions runs the data pipeline independently and writes to Supabase.

## V1 Scope

Included:

- Responsive daily homepage
- Supabase-backed `daily_items` and `curiosity_items`
- Mock fallback
- RSS/API source adapter structure
- GitHub, Hacker News, Brabble Hackathons, InfoQ 中文, OSChina, and RSS sources
- LLM-compatible ranking/categorization/summarization
- Tags, "what happened / why care / action" explanations
- Product Pattern cards
- Question-first Curiosity with "再学一个" and "Surprise Me"
- GitHub Actions scheduler

Not included:

- Login
- Multi-user personalization
- Payments
- Native apps
- Admin CMS
- Heavy crawlers
- Multi-agent orchestration
