import assert from "node:assert/strict";
import { mkdtemp, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const root = process.cwd();
const temporary = await mkdtemp(join(tmpdir(), "pulseai-ui-"));
const output = resolve("artifacts/ui");
await mkdir(output, { recursive: true });
const compiledCss = await postcss([tailwind()]).process(
  await readFile(join(root, "app/globals.css"), "utf8"),
  { from: join(root, "app/globals.css") },
);
await build({
  entryPoints: ["tests/ui-fixture.tsx"],
  bundle: true,
  outfile: join(temporary, "test.js"),
  platform: "browser",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
});
const html =
  '<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/test.js"></script></body></html>';
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/style.css") {
    response.setHeader("Content-Type", "text/css");
    response.end(compiledCss.css);
    return;
  }
  const files = {
    "/test.js": [join(temporary, "test.js"), "text/javascript"],
    "/style.css": [join(root, "app/globals.css"), "text/css"],
    "/pulse-emblem.png": [join(root, "public/pulse-emblem.png"), "image/png"],
  };
  if (pathname === "/invalid.png") {
    response.writeHead(404);
    response.end();
    return;
  }
  try {
    const file = files[pathname];
    response.setHeader(
      "Content-Type",
      file ? file[1] : "text/html; charset=utf-8",
    );
    response.end(file ? await readFile(file[0]) : html);
  } catch {
    response.writeHead(500);
    response.end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    channel: process.env.UI_BROWSER_CHANNEL || undefined,
    args: [
      "--enable-webgl",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://fixture.test/image.png", (route) =>
      route.fulfill({
        path: join(root, "public/pulse-emblem.png"),
        contentType: "image/png",
      }),
    );
    await page.goto(url);
    await page.locator(".headline-content.is-current").waitFor();
    const initialHeight = (await page.locator(".headline").boundingBox())
      .height;
    await page.getByRole("button", { name: "下一条头条", exact: true }).click();
    assert.equal(
      (await page.locator(".headline").boundingBox()).height,
      initialHeight,
      "Carousel must not shift layout",
    );
    await page.getByRole("button", { name: "查看第 3 条头条" }).click();
    assert.equal(
      (await page.locator(".headline").boundingBox()).height,
      initialHeight,
    );
    await page
      .getByRole("button", { name: "Agent / MCP", exact: true })
      .click();
    assert.equal(await page.locator("#radar .card").count(), 3);
    await page.getByRole("textbox", { name: "搜索今日资讯" }).fill("NOT_FOUND");
    assert.equal(await page.locator("#radar .card").count(), 0);
    await page.getByRole("button", { name: "清除搜索" }).click();
    await page.getByRole("button", { name: "全部洞察", exact: true }).click();
    await page.locator("#radar .news-analysis summary").first().click();
    assert.equal(await page.locator("#radar .news-analysis[open]").count(), 1);
    await page.getByLabel("资讯排序").selectOption("newest");
    assert.match(
      await page.locator("#radar .card h3").first().innerText(),
      /开源工作流/,
    );
    assert.equal(await page.locator("#curiosity .curiosity-body").count(), 0);
    assert.equal(await page.locator("#curiosity .curiosity-hook").count(), 0);
    await page
      .locator("#curiosity")
      .getByRole("button", { name: "揭晓答案" })
      .click();
    assert.equal(await page.locator("#curiosity .curiosity-body").count(), 1);
    await page.getByRole("button", { name: "多给我这类" }).click();
    assert.ok(
      await page.evaluate(() =>
        localStorage.getItem("ai-daily-radar-curiosity-interests"),
      ),
    );
    await page.getByRole("button", { name: "继续追问" }).click();
    assert.equal(await page.locator("#curiosity .follow-up").isVisible(), true);
    await page.getByRole("button", { name: "再学一个", exact: true }).click();
    assert.equal(await page.locator("#curiosity .curiosity-body").count(), 0);
    await page.getByRole("button", { name: "抽取一个未知问题" }).click();
    assert.equal(await page.locator("#surprise .curiosity-body").count(), 0);
    await page
      .locator("#surprise")
      .getByRole("button", { name: "揭晓答案" })
      .click();
    assert.equal(await page.locator("#surprise .curiosity-body").count(), 1);
    const previous = await page.locator("#surprise h3").innerText();
    await page.getByRole("button", { name: "换一个领域", exact: true }).click();
    assert.notEqual(await page.locator("#surprise h3").innerText(), previous);
    assert.equal(await page.locator("#surprise .curiosity-body").count(), 0);
    const drawn = new Set([
      previous,
      await page.locator("#surprise h3").innerText(),
    ]);
    while (
      await page
        .getByRole("button", { name: "换一换，再探索", exact: true })
        .count()
    ) {
      await page
        .getByRole("button", { name: "换一换，再探索", exact: true })
        .click();
      const title = await page.locator("#surprise h3").innerText();
      assert.ok(
        !drawn.has(title),
        "Exploration must not repeat before exhaustion",
      );
      drawn.add(title);
    }
    assert.equal(
      drawn.size,
      6,
      "Archive must expose more than today's three questions",
    );
    assert.ok(
      await page.getByRole("button", { name: "本轮已全部探索" }).isDisabled(),
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `Horizontal overflow at ${width}px`,
    );
    assert.equal(
      await page.locator('.article-image[src="/invalid.png"]').count(),
      0,
    );
    assert.ok(
      await page
        .locator(".brand img")
        .first()
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    );
    await page
      .locator("#surprise")
      .screenshot({ path: join(output, `surprise-${width}.png`) });
    await page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.screenshot({
      path: join(output, `desktop-${width}.png`),
      fullPage: true,
    });
    await page.screenshot({ path: join(output, `viewport-${width}.png`) });
    assert.deepEqual(errors, []);
    await page.goto(`${url}/?empty`);
    assert.equal(await page.locator(".card").count(), 0);
    assert.ok(
      await page.getByRole("button", { name: "等待今日知识更新" }).isDisabled(),
    );
    await page.screenshot({
      path: join(output, `empty-${width}.png`),
      fullPage: true,
    });
    await page.evaluate(() =>
      localStorage.removeItem("pulseai-exploration-seen"),
    );
    await page.goto(`${url}/?single`);
    await page.evaluate(() =>
      localStorage.setItem("ai-daily-radar-curiosity-interests", "null"),
    );
    await page.getByRole("button", { name: "抽取一个未知问题" }).click();
    assert.ok(
      await page.getByRole("button", { name: "本轮已全部探索" }).isDisabled(),
    );
    await page.close();
    console.log(
      `PASS ${width}px: carousel, search, filter, sorting, reveal, feedback, surprise, images, empty state`,
    );
  }
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 },
  });
  await page.goto(url);
  await page.locator(".headline").waitFor();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(8500);
  assert.ok(
    await page
      .getByRole("button", { name: "查看第 2 条头条" })
      .getAttribute("aria-current"),
  );
  await page.mouse.move(450, 120);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(200);
  const pixels = await page.locator("canvas").evaluate((canvas) => {
    const gl = canvas.getContext("webgl");
    if (!gl) return null;
    // Redraw synchronously because the drawing buffer is not preserved between frames.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    const bytes = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      bytes,
    );
    const chromatic = bytes.filter(
      (value, n) => n % 4 === 1 && value > 65,
    ).length;
    return chromatic > canvas.width * canvas.height * 0.03;
  });
  assert.equal(pixels, true, "WebGL ripple must produce visible pixels");
  await page.screenshot({ path: join(output, "ripple.png") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.locator("canvas").isVisible(), false);
  console.log("PASS autoplay, WebGL pixels and reduced motion");
  if (process.env.UI_LIVE_URL) {
    const liveErrors = [];
    page.on("pageerror", (error) => liveErrors.push(error.message));
    const response = await page.goto(process.env.UI_LIVE_URL, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    assert.equal(response.status(), 200);
    assert.equal(await page.title(), "PulseAI | AI Daily Radar");
    console.log(
      "LIVE homepage:",
      JSON.stringify({
        articles: await page.locator("#radar .card").count(),
        curiosity: await page.locator("#curiosity .curiosity-card").count(),
        notice: await page.locator(".notice").count(),
        hydrationErrors: liveErrors.length,
      }),
    );
    await page.screenshot({ path: join(output, "live-homepage.png") });
    assert.deepEqual(liveErrors, []);
  }
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
