# 影片素材

目前三個 placeholder 分支各自指向一支不同的填充影片，只用來驗證語意路由、隱形播放、結束事件與循環流程。它們不是正式劇情素材。

把預先產生的影片放在這個資料夾，建議使用 H.264 編碼的 MP4：

- `distance.mp4`
- `secret.mp4`
- `threat.mp4`

接著在 `public/story.json` 的對應分支設定正向影片與倒帶影片，例如：

```json
"videoSrc": "/videos/distance.mp4",
"rewindSrc": "/videos/distance-reverse.mp4"
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

## 目前的填充影片

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
