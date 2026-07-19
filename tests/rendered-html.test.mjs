import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

function environment() {
  return {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
}

const context = {
  waitUntil() {},
  passThroughOnException() {},
};

test("renders the narrative game shell and finished metadata", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    environment(),
    context,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>已讀 9:42｜AI 敘事遊戲 Prototype<\/title>/i);
  assert.match(html, /觀察眼前的場景/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("matches a player interpretation without an API key", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interpretation: "他已讀不回，根本就是故意不在乎我",
        playerId: "prototype-player-001",
        candidates: [
          {
            id: "hostile",
            title: "他根本不在乎我",
            matchHint: "玩家把已讀不回解讀為冷淡、忽視或帶有敵意",
            keywords: ["不在乎", "故意", "已讀不回"],
            interpretationEcho: "你把他的沉默讀成拒絕：他看見了，卻選擇不在乎。",
          },
          {
            id: "caring",
            title: "會不會是他那邊出事了",
            matchHint: "玩家擔心對方遇到事情或需要幫忙",
            keywords: ["出事", "擔心", "幫忙"],
          },
        ],
      }),
    }),
    environment(),
    context,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    branchId: "hostile",
    rationale: "以 prototype 關鍵語意規則完成配對。",
    echo: "你把他的沉默讀成拒絕：他看見了，卻選擇不在乎。",
    source: "fallback",
  });
});

test("keeps the v4.1 runtime clear of superseded video assets", async () => {
  const [story, shotlist, videoFiles] = await Promise.all([
    readFile(new URL("public/story.json", projectRoot), "utf8"),
    readFile(new URL("demo-shotlist.md", projectRoot), "utf8"),
    readdir(new URL("public/videos/", projectRoot)),
  ]);

  assert.match(shotlist, /v4\.1/);
  assert.match(shotlist, /Yun, an East Asian man/);
  assert.match(shotlist, /S4-C2/);
  assert.doesNotMatch(story, /\/videos\//);
  assert.equal(videoFiles.some((name) => /\.(?:mp4|mov|webm|mkv)$/i.test(name)), false);
  assert.match(story, /"sceneMessageOverlay"/);
  assert.match(story, /已讀 · 21:42/);
  assert.match(story, /算了，當我沒說。/);
  assert.match(story, /你還好嗎？/);
  assert.match(story, /"priming"/);
  assert.match(story, /"videoNarration"/);
  assert.match(story, /她把受傷翻成生氣/);
  assert.match(story, /"videoNarration": \[\]/);
});
