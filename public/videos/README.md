# 影片素材（v4.1 滾動入庫）

舊版 filler、Batch 1 成品、倒帶檔與原始 zip 已於 2026-07-19 清除。新的故事正典與完整分鏡在 `demo-shotlist.md`；Yun 在 v4.1 是短髮、穿深藍夾克的男性角色。

## 目前 Production 狀態

H 敵意線與 C 關心線都已完整並接入 runtime：

`S1 → S3-H → S2-BASE → S2-H → S4-H → S5-H`

`S1 → S3-C → S2-BASE → S2-C → S4-C → S4-C2 → S5-C`

- Opening：`read-0942-opening-v4.mp4`
- H reel：`read-0942-hostile-v4.mp4`
- C reel：`read-0942-caring-v4.mp4`
- Opening／H／C reel 都有對應的 `-reverse.mp4`，由網站以 16× 播放。
- H reel 的實際長度約 40 秒；Opening 約 10 秒。
- C reel 的實際長度約 50 秒；`S2-C` 的原檔沒有音軌，組裝時補入無聲 AAC 以維持同步。

每次 Drive 盤點、下載、處理與 QC 結果記錄在根目錄的 `drive-video-ingest.json`。

## v4.1 素材清單

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

## Runtime 與後製規格

每顆通過的標準化素材放在 `public/videos/shots/`，對應 poster 在 `public/assets/shots/`，metadata JSON 記錄原始 hash、規格與 QC。完整路線再填回 runtime：

```json
{
  "videoSrc": "/videos/read-0942-hostile-v4.mp4",
  "rewindSrc": "/videos/read-0942-hostile-v4-reverse.mp4"
}
```
