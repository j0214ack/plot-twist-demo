# 003 — 以 Prompt UI 串接分支與共同開場的兩段式倒帶

日期：2026-07-19

## 問題

ADR 002 只把分支影片倒回分支第一幀，沒有回到共同 opening 的起點；輸入 Prompt 階段也因 opening `<video>` 被卸載而退回靜態 placeholder 圖片。新的體驗要求是：

1. Opening 播完後，Prompt 必須直接疊在 opening 的真實最後一幀。
2. 分支播完後，倒帶速度由 4× 提高為 16×。
3. 倒帶必須先倒完整支分支，再倒完整支 opening，回到整個體驗最早的影格。
4. 兩支來源不同的影片若無法做成連續剪接，切換點要停在 opening 最後一幀的 Prompt UI；該 UI 既重現玩家剛才做選擇的時刻，也為 opening reverse 提供真實的背景載入時間。

這裡的 **Prompt bridge** 指分支倒完、opening 倒帶開始前的一個短暫決策畫面。它不是額外圖片，也不接受新的輸入。

## 既有決策

- ADR 001 的螢幕替換層不受影響。
- ADR 002 選擇預先產生 reverse MP4 而非 runtime backward seek；這個選擇保留。
- 本決策推翻 ADR 002 中「最開始只指分支第一幀」、「倒帶結束立即進入下一輪輸入」與固定 4× 的部分。

## 選項

1. 維持只倒分支，opening 不參與。素材最少，但不符合回到整個故事起點的體驗要求。
2. 為每個分支離線製作一支包含 `branch reverse → prompt → opening reverse` 的完整轉場影片。播放最順，但每個分支都重複 opening，Prompt 文字也被 bake 進影片，無法顯示玩家真正輸入的內容。
3. Runtime 依序播放兩支 reverse MP4，中間用 opening 原影片停住的最後一幀與真實 Prompt UI 作 bridge，bridge 背景載入 opening reverse。兩段素材可獨立重用，且 UI 可以顯示本次玩家輸入。
4. 用 Canvas/WebCodecs 在 runtime 解碼兩支正向影片並反向繪製。可建立單一時間軸，但複雜度、記憶體與瀏覽器相容性超出 Hackathon prototype。

## 共用假設

- Opening 與分支是兩支獨立影片，不保證最後／第一影格在視覺上可直接相接。
- Prompt UI 本來就代表兩支影片之間的決策時刻，因此可把素材斷點轉化為有意義的敘事節點。
- 倒帶不需要反向音訊。
- 16× 的目的在於轉場節奏，而非逐格檢視。
- 完整循環在 opening reverse 抵達第一幀後重新正向播放 opening；Prompt 仍只在 opening 正向播放完的最後一幀出現。

## 決定

採用選項 3。

Runtime 使用一個明確的 `rewindStage`：

```text
idle → branch → bridge → opening → idle
```

- Opening 正向 `<video>` 在整個 session 中保持掛載。它在輸入與 matching 階段停在真實最後一幀，不再切回 `sceneImage`。
- 分支正向影片疊在 opening 上方；開始播放第一幀前保持透明，避免 branch poster 閃現。
- `branch` 播放 branch `rewindSrc`，16×、靜音。
- `bridge` 移除分支層，露出仍停在最後一幀的 opening 正向影片，並顯示不可編輯的 Prompt UI 與玩家上次輸入。同時才建立並載入 `sceneRewindSrc`。
- opening reverse 至少可播放且 bridge 已停留一個最短辨識時間後，進入 `opening`，16×、靜音播放。
- opening reverse 結束後，先把底層 opening 正向影片 seek 到 0；收到 `seeked` 才移除 reverse 層並重新正向播放 opening。
- 下一輪 Prompt 仍由 opening 正向播放完的 `ended` 事件觸發，因此一定停在 opening 的真實最後一幀。

## 為什麼

這個設計把不能保證連續的素材切換放在玩家已經理解的「做出解讀」畫面，而不是用黑畫面或 placeholder 掩飾。Opening 正向影片長駐也讓 Prompt、matching 與 bridge 共用同一個真實影格。兩支 reverse asset 保持獨立，避免每個 branch 重複儲存共同 opening；未來換正式素材時，只需重新產生各自的 reverse MP4。
