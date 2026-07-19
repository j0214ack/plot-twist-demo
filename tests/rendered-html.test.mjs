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
  assert.match(html, /<title>未說出口｜AI 敘事遊戲 Prototype<\/title>/i);
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
        interpretation: "他們剛吵完架，正在冷戰",
        playerId: "prototype-player-001",
        candidates: [
          {
            id: "distance",
            title: "沉默不是冷淡",
            matchHint: "兩人正在冷戰、關係疏遠",
            keywords: ["冷戰", "吵架"],
          },
          {
            id: "secret",
            title: "被藏起來的事",
            matchHint: "她隱瞞了秘密或準備驚喜",
            keywords: ["秘密", "驚喜"],
          },
        ],
      }),
    }),
    environment(),
    context,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    branchId: "distance",
    rationale: "以 prototype 關鍵語意規則完成配對。",
    source: "fallback",
  });
});

test("ships an opening clip plus forward and reverse branch MP4s", async () => {
  const [
    story,
    openingVideo,
    openingRewind,
    distanceVideo,
    secretVideo,
    threatVideo,
    distanceRewind,
    secretRewind,
    threatRewind,
  ] = await Promise.all([
    readFile(new URL("public/story.json", projectRoot), "utf8"),
    stat(new URL("public/videos/filler-opening-upset-couple.mp4", projectRoot)),
    stat(new URL("public/videos/filler-opening-upset-couple-reverse.mp4", projectRoot)),
    stat(new URL("public/videos/filler-kitchen-argument.mp4", projectRoot)),
    stat(new URL("public/videos/filler-secret-surprise.mp4", projectRoot)),
    stat(new URL("public/videos/filler-threat-door.mp4", projectRoot)),
    stat(new URL("public/videos/filler-kitchen-argument-reverse.mp4", projectRoot)),
    stat(new URL("public/videos/filler-secret-surprise-reverse.mp4", projectRoot)),
    stat(new URL("public/videos/filler-threat-door-reverse.mp4", projectRoot)),
  ]);

  assert.match(story, /Hackathon prototype placeholder content only/);
  assert.match(story, /\/videos\/filler-opening-upset-couple\.mp4/);
  assert.match(story, /\/videos\/filler-opening-upset-couple-reverse\.mp4/);
  assert.match(story, /\/videos\/filler-kitchen-argument\.mp4/);
  assert.match(story, /\/videos\/filler-secret-surprise\.mp4/);
  assert.match(story, /\/videos\/filler-threat-door\.mp4/);
  assert.match(story, /\/videos\/filler-kitchen-argument-reverse\.mp4/);
  assert.match(story, /\/videos\/filler-secret-surprise-reverse\.mp4/);
  assert.match(story, /\/videos\/filler-threat-door-reverse\.mp4/);
  assert.ok(openingVideo.size > 1_000_000);
  assert.ok(openingRewind.size > 1_000_000);
  assert.ok(distanceVideo.size > 1_000_000);
  assert.ok(secretVideo.size > 1_000_000);
  assert.ok(threatVideo.size > 1_000_000);
  assert.ok(distanceRewind.size > 1_000_000);
  assert.ok(secretRewind.size > 1_000_000);
  assert.ok(threatRewind.size > 1_000_000);
});
