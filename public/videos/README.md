# 影片素材

目前網站已改用導演生成的第一批「已讀 9:42」素材。`demo-shotlist.md` 只負責描述故事節點；真正的 runtime 設定仍然放在 `public/story.json`。

## Batch 1 對照

- `S1.mp4` → `read-0942-opening-s1.mp4`：共同開場
- `S3-H.mp4` + `S2-BASE.mp4` → `read-0942-hostile-s3h-s2base.mp4`：敵意解讀 MVP
- `S3-C.mp4` + `S2-BASE.mp4` → `read-0942-caring-s3c-s2base.mp4`：關心解讀 MVP

醫院素材原始比例與其他鏡頭不同，因此 branch reel 組接時統一裁成 1280×720、24fps、H.264。這批影片沒有音軌，網站會維持自己的連續環境底噪。Neutral 所需的 `S3-N`、`S6-N` 尚未在這批素材中，因此目前可玩版本只開放 H/C 兩條真正的影片分支。

每支 runtime 影片都配有反向 MP4，網站會在倒帶時以 16× 播放：

```json
"videoSrc": "/videos/read-0942-hostile-s3h-s2base.mp4",
"rewindSrc": "/videos/read-0942-hostile-s3h-s2base-reverse.mp4"
```

若 `videoSrc` 是 `null`，網站會播放內建的 prototype cut，方便沒有正式影片時展示完整流程。
`rewindSrc` 是同一段畫面反向、移除聲音後的 MP4；網站會以 16× 播放它。
共同 opening 也需提供反向影片，設定在故事根層的 `sceneRewindSrc`。
正向 opening 會保留在最後一幀作為 Prompt 背景；完整倒帶會以 16× 依序播放
分支 reverse 與 opening reverse。

產生 reverse MP4 的參考指令：

```bash
ffmpeg -i branch.mp4 -vf reverse -an -c:v libx264 -crf 23 -preset medium \
  -pix_fmt yuv420p -movflags +faststart branch-reverse.mp4
```

## 舊版填充影片

下列 Mixkit 影片保留在資料夾中作為開發 fallback，但目前的 `story.json` 已不再引用：

- 來源：Mixkit — An upset couple while watching television
- 用途：共同 opening scene
- 網頁：https://mixkit.co/free-stock-video/an-upset-couple-while-watching-television-42971/
- 授權：Mixkit Stock Video Free License（可供個人與商業用途）

- 來源：Mixkit — Couple arguing in the kitchen
- 網頁：https://mixkit.co/free-stock-video/couple-arguing-in-the-kitchen-4501/
- 授權：Mixkit Stock Video Free License（可供個人與商業用途）

- 來源：Mixkit — Boy surprised by great news from his girlfriend
- 網頁：https://mixkit.co/free-stock-video/boy-surprised-by-great-news-from-his-girlfriend-8751/
- 授權：Mixkit Stock Video Free License（可供個人與商業用途）

- 來源：Mixkit — Silhouette lurks at glass door under eerie moonlight
- 網頁：https://mixkit.co/free-stock-video/silhouette-lurks-at-glass-door-under-eerie-moonlight-100577/
- 授權：Mixkit Stock Video Free License（可供個人與商業用途）
