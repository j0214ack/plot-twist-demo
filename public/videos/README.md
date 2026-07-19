# 影片素材

目前三個分支都暫時指向 `filler-kitchen-argument.mp4`，只用來驗證隱形播放、結束事件與循環流程。它不是正式劇情素材。

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
