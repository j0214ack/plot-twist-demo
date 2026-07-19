import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
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
        interpretation: "她已讀不回，根本就是故意不在乎我",
        playerId: "prototype-player-001",
        candidates: [
          {
            id: "hostile",
            title: "她根本不在乎我",
            matchHint: "玩家把已讀不回解讀為冷淡、忽視或帶有敵意",
            keywords: ["不在乎", "故意", "已讀不回"],
            interpretationEcho: "你把她的沉默讀成拒絕：她看見了，卻選擇不在乎。",
          },
          {
            id: "caring",
            title: "會不會是她那邊出事了",
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
    echo: "你把她的沉默讀成拒絕：她看見了，卻選擇不在乎。",
    source: "fallback",
  });
});

test("ships the real batch-one opening plus forward and reverse H/C reels", async () => {
  const [
    story,
    openingVideo,
    openingRewind,
    hostileVideo,
    caringVideo,
    hostileRewind,
    caringRewind,
  ] = await Promise.all([
    readFile(new URL("public/story.json", projectRoot), "utf8"),
    stat(new URL("public/videos/read-0942-opening-s1.mp4", projectRoot)),
    stat(new URL("public/videos/read-0942-opening-s1-reverse.mp4", projectRoot)),
    stat(new URL("public/videos/read-0942-hostile-s3h-s2base.mp4", projectRoot)),
    stat(new URL("public/videos/read-0942-caring-s3c-s2base.mp4", projectRoot)),
    stat(new URL("public/videos/read-0942-hostile-s3h-s2base-reverse.mp4", projectRoot)),
    stat(new URL("public/videos/read-0942-caring-s3c-s2base-reverse.mp4", projectRoot)),
  ]);

  assert.match(story, /Batch 1 experiment/);
  assert.match(story, /\/videos\/read-0942-opening-s1\.mp4/);
  assert.match(story, /\/videos\/read-0942-opening-s1-reverse\.mp4/);
  assert.match(story, /\/videos\/read-0942-hostile-s3h-s2base\.mp4/);
  assert.match(story, /\/videos\/read-0942-caring-s3c-s2base\.mp4/);
  assert.match(story, /\/videos\/read-0942-hostile-s3h-s2base-reverse\.mp4/);
  assert.match(story, /\/videos\/read-0942-caring-s3c-s2base-reverse\.mp4/);
  assert.ok(openingVideo.size > 500_000);
  assert.ok(openingRewind.size > 500_000);
  assert.ok(hostileVideo.size > 1_000_000);
  assert.ok(caringVideo.size > 1_000_000);
  assert.ok(hostileRewind.size > 1_000_000);
  assert.ok(caringRewind.size > 1_000_000);
});
