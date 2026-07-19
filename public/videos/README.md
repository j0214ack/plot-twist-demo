# 影片素材（v4.1 待入庫）

舊版 filler、Batch 1 成品、倒帶檔與原始 zip 已於 2026-07-19 清除。新的故事正典與完整分鏡在 `demo-shotlist.md`；Yun 在 v4.1 是短髮、穿深藍夾克的男性角色。

## 等待中的素材

11 個 MUST clips：

- `S1`
- `S3-H`、`S3-C`
- `S2-BASE`、`S2-H`、`S2-C`
- `S4-H`、`S4-C`、`S4-C2`
- `S5-H`、`S5-C`

2 個 stretch clips：`S3-N`、`S6-N`。

原始檔可直接使用 shot ID 命名，例如 `S4-C2.mp4`。素材到齊後，後製流程會：

1. 依 shot ID 驗證 H／C／N 路線與順序。
2. 統一為 16:9、24fps、H.264，保留可用音軌。
3. 產生各路線的正向 reel、16× 倒帶版與 poster。
4. 依新成品的實際時間重做訊息 overlay 與心理旁白 cue。
5. 更新 `public/story.json`、測試並發布。

## Runtime 暫存狀態

`public/story.json` 目前刻意將所有 `videoSrc`、`rewindSrc`、`sceneVideoSrc` 與 `sceneRewindSrc` 設為 `null`，並清空舊的 `videoNarration` 時間點，避免新影片到來後誤用 Batch 1 的剪接與旁白 timing。

新的正向／倒帶影片確定後，再依實際檔名填回：

```json
{
  "videoSrc": "/videos/read-0942-hostile-v4.mp4",
  "rewindSrc": "/videos/read-0942-hostile-v4-reverse.mp4"
}
```
