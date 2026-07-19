# 004 — 語意判讀的 IP Rate Limit

日期：2026-07-19

## 問題

網站公開後，每次自由文字判讀都會呼叫 OpenAI API。正常玩家的成本很低，但自動化程式可以重複送出請求，使 lifetime 流量預估失去意義。限制不能讓遊戲在達到上限後壞掉，也不能只在單一 server instance 內計數。

這裡的 **rate limit** 指：限制同一來源在固定時間內可使用付費 LLM 的次數。它不限制影片播放，也不阻止玩家繼續體驗本地 fallback 分支。

## 既有決策

前三份 ADR 規範螢幕替換與倒帶流程，沒有處理 API 成本或請求治理。本決策不推翻既有 ADR。

## 選項

1. 不在網站限流，只依賴 OpenAI project 的每月 usage limit。最簡單，也能限制總損失，但無法阻止單一來源耗盡整月額度。
2. 在 Worker 記憶體中用 `Map` 計數。程式碼少，但 serverless instance 會重啟且有多份，攻擊者能輕易繞過，不能視為真正的 IP limit。
3. 用 Sites D1 保存經 HMAC 雜湊的 IP 與固定時間窗計數。所有 instance 共用同一份計數，資料量小，且不保存原始 IP。
4. 在 Cloudflare 帳號層建立 WAF／Rate Limiting Rule。能在 Worker 前阻擋流量，但它位於專案程式之外、目前部署介面不能一起版本化，而且會直接阻止遊戲而不是降級成 fallback。

## 共用假設

- 公開網路的一般玩家多半各自有 IP；公司、校園或活動 Wi-Fi 可能共用 NAT。
- 一輪完整體驗可能會重玩三個分支，因此上限必須高於三次。
- 被限流後仍可用本地語意規則繼續遊戲，比回傳錯誤更符合 prototype 目的。
- IP 限制無法防禦擁有大量代理 IP 的攻擊者；OpenAI project 的月費上限仍是最終保險。

## 決定

採用選項 3：每個 IP 每 10 分鐘最多呼叫 LLM 12 次。

- 第 13 次起不再呼叫 OpenAI，直接回傳既有 fallback 結果，HTTP 仍為 200。
- 回應附帶 `RateLimit-Limit`、`RateLimit-Remaining`、`RateLimit-Reset` headers。
- D1 只保存 HMAC-SHA256 後的 IP、時間窗、計數與更新時間；HMAC secret 存在 Sites secret environment variable。
- 每個 IP 只保留一列，進入新時間窗時原列就地重設，不累積瀏覽歷史。
- limiter 或資料庫不可用時採 fail-closed-for-cost：遊戲繼續走 fallback，但不發出付費 API 請求。

## 為什麼

這是能在多 instance Sites runtime 中真正共同計數的最小方案。12 次足以讓一個正常玩家重玩所有分支，又把單一 IP 的付費請求壓在每小時最多 72 次。共用 NAT 超過上限時只會降低判讀品質，不會讓網站無法遊玩。
