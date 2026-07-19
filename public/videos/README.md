# 影片素材

目前三個 placeholder 分支各自指向一支不同的填充影片，只用來驗證語意路由、隱形播放、結束事件與循環流程。它們不是正式劇情素材。

把預先產生的影片放在這個資料夾，建議使用 H.264 編碼的 MP4：

- `distance.mp4`
- `secret.mp4`
- `threat.mp4`

接著在 `public/story.json` 的對應分支把 `videoSrc` 從 `null` 改成，例如：

```json
"videoSrc": "/videos/distance.mp4"
```

若 `videoSrc` 是 `null`，網站會播放內建的 prototype cut，方便沒有正式影片時展示完整流程。

## 目前的填充影片

- 來源：Mixkit — Couple arguing in the kitchen
- 網頁：https://mixkit.co/free-stock-video/couple-arguing-in-the-kitchen-4501/
- 授權：Mixkit Stock Video Free License（可供個人與商業用途）

- 來源：Mixkit — Boy surprised by great news from his girlfriend
- 網頁：https://mixkit.co/free-stock-video/boy-surprised-by-great-news-from-his-girlfriend-8751/
- 授權：Mixkit Stock Video Free License（可供個人與商業用途）

- 來源：Mixkit — Silhouette lurks at glass door under eerie moonlight
- 網頁：https://mixkit.co/free-stock-video/silhouette-lurks-at-glass-door-under-eerie-moonlight-100577/
- 授權：Mixkit Stock Video Free License（可供個人與商業用途）
