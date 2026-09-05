<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AI Daily Radar Agent Notes

## 注意事项

- 每次改动完成后，都必须创建一个对应的 Git commit，以便后续追踪和回滚。
- 每次改动后，都必须编写或更新相关测试，并在交付给用户前，确保所有测试和验证全部通过。

## 产品主线

- Tech Radar：AI / Agent / Coding / 开发者资讯。
- Curiosity Radar：每天学习 1-3 个有趣、小众、值得记住的知识。

## 内容原则

- Tech Radar 优先引用原始来源，例如官方 Blog、官方技术文档、工程 Blog、GitHub release/changelog 和开源项目主页。
- 中文技术社区作为二级发现源，用于发现框架、工具、工程实践、Java / Backend、Agent、AI Coding、MCP 和开源项目使用经验。
- 如果二级来源转载了原始来源，展示和入库时优先保留原始来源。
- Curiosity Radar 必须避免伪科学，解释要帮助用户真正理解概念，而不是只给冷知识段子。

## 工程约束

- V1 保持单用户、低成本、可三天上线，不增加登录、支付、后台管理、复杂推荐或重型 crawler。
- Source adapter、LLM provider 和内容分类应保持可替换、可扩展。
- 不提交 API key、service role key、token 或 `.env` 文件。

