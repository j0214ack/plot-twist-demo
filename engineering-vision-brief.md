# 工程願景 Brief：從分支影片到即時敘事世界

日期：2026-07-19  
狀態：Hackathon 決賽論述工作稿  
受眾：團隊、評審簡報與工程問答  

## 這份 Brief 的目的

這份文件保留工程論述演進的完整脈絡：

1. 第一版從目前 Prototype 出發，強調 runtime contract、語意路由與內容量產。
2. 第二版回應「需要更敢賣未來」的修正，加入即時生成、預測式生成與多模態互動。
3. 最終修正指出：這些能力不全是空泛 roadmap；同一專案的 `leave-the-door-open` PoC 已經實作或定義了大部分 narrative control plane。

敘事治療與產品價值由其他團隊成員負責。本文件只處理工程意義、技術演進與可以誠實提出的未來願景。

---

## Executive Summary

最精準的總論述是：

> 我們不是在做一棵分支更多的故事樹，而是在做一個敘事編譯器：把玩家說的話、看的地方與做的動作，即時編譯成一個有因果、會記得玩家，而且能直接被看見的世界。

目前團隊其實有兩個互補的 vertical slices：

```text
Leave the Door Open
敘事狀態、角色、因果、記憶、時間、生成邊界、eval
                         ↓
Plot Twist Demo
自由輸入、影音呈現、倒帶、畫面互動、未來即時 renderer
```

- `leave-the-door-open` 驗證 narrative control plane：世界如何持續運作、角色如何記憶與改變、生成模型擁有什麼權限、因果如何被測試。
- `plot-twist-demo` 驗證 audiovisual experience loop：玩家自由解讀、系統選擇視覺後果、播放、倒帶，再次解讀。
- 真正的下一步不是從零發明即時生成遊戲，而是把兩個已驗證的邊界接起來。

---

## 目前 Prototype 驗證了什麼

`plot-twist-demo` 現在完成的是最小體驗閉環：

```text
呈現日常情境
→ 玩家用自由文字解讀
→ 系統映射到作者批准的故事分支
→ 隱藏播放器並呈現影音後果
→ 停在最後一幀
→ 玩家主動倒帶
→ 回到起點重新解讀
```

目前內容仍是預製影片，分支有限，沒有宣稱已經即時生成世界。它驗證的是一個重要互動語法：

> 解讀 → 世界回應 → 看見後果 → 倒帶 → 重新解讀。

---

## 第一版工程論述：把 Demo 做成可替換、可測試的系統

第一版的重點較務實，主要有三個支柱。

### 1. 導演語言與 runtime 解耦

`demo-shotlist.md` 是導演與影片生成端的 authoring artifact；網站 runtime 消費的是正規化 branch manifest。

- 導演可以改 shot list、prompt、生成模型與剪輯方式。
- Runtime 只在乎 branch ID、匹配提示、正向影片、倒帶影片與畫面 overlay。
- 一條分支可以由許多 shot 組成，但交付給 runtime 時可以先剪成一個 branch package。
- 未來 shot list 到 branch package 的中間層，可以發展成 story compiler。

### 2. AI 是受限路由，不是自由編劇

玩家可以自由輸入，但 AI 只能回傳作者批准的 branch ID，不能自行新增劇情。

這把看似主觀的問題轉成可以回歸測試的分類系統：

- 同一意圖的不同自然說法是否穩定落到相同分支？
- 模糊輸入如何處理？
- 改 prompt 或模型後，錯分方向是否改變？
- API 失敗時，體驗如何安全 fallback？

### 3. 影片只是可替換的 content provider

目前 branch package 包含：

- `videoSrc`：正向故事影片。
- `rewindSrc`：預先倒序、無聲的倒帶影片。
- `screenOverlay`：可選的螢幕替換資料。
- branch metadata：語意提示、fallback 與播放設定。

今天由離線生成與剪輯產生 package；未來可以由即時生成服務產生。只要交付相同 contract，玩家輸入、路由、播放、倒帶與 overlay 不必重寫。

### 第一版有價值，但不足以支撐決賽願景

這一版能證明系統設計扎實，卻容易讓評審只聽見「我們把 AI 接到影片播放器」。它說清楚了如何量產既有分支，卻沒有充分回答：這個媒介未來會變成什麼？

---

## 第二版工程願景：不是更多分支，而是生成一個會回應的世界

### Moonshot thesis

> 讓每一個玩家的理解，都變成一個可以被看見、被進入，而且會繼續回應他的世界。

長期穩定的工程管線不是綁定某一個影片模型，而是：

```text
文字／語音／點擊／視線／角色操作
                ↓
         Player Intent / Action
                ↓
       Persistent World State
                ↓
     Narrative & Shot Planning
                ↓
影片／3D／語音／角色行為 Renderer
```

生成模型可以不斷替換；真正持續累積的資產是 intent schema、world state、角色與敘事規則、authoring system、品質評估、latency orchestration 與玩家行為證據。

### Phase 1：有限分支，接受無限說法

這是目前 Prototype：

- 玩家不按 A／B／C，而是用自己的話描述情境。
- 系統將無限說法映射到有限、作者批准的分支。
- 所有影片與主要劇情仍預製。
- AI 選路，但不創造新的世界狀態。

### Phase 2：Hybrid Generation

下一步不應暴力預製一千支完整影片，而是：

- 預製角色、場景、關鍵劇情節點與高價值 anchor shots。
- 即時生成玩家真正走到的 reaction、短對白、表情、轉場與局部鏡頭。
- 生成失敗、超時或品質不夠時，無縫退回預製素材。
- 只生成玩家實際抵達的路徑，而不是事先窮舉整棵 branch tree。

這一階段需要一份 Narrative IR，至少記錄：

- 角色知道與不知道的事。
- 角色當下相信什麼。
- 角色彼此關係與情緒位置。
- 玩家剛才改變了什麼。
- 哪些世界事實不可被生成模型改寫。
- 哪些後果之後必須被記得。

### 預測式生成：敘事的 speculative execution

影片即時生成仍有延遲，因此 runtime 可以在玩家觀看與思考時預測最可能的下一步：

1. 根據目前 world state 與玩家歷史預測 top-k intents。
2. 平行生成幾個候選下一鏡或先生成共用前綴。
3. 玩家做出動作後，只接上命中的未來。
4. 未命中的結果被丟棄、降級成 reusable asset，或保留在 cache。

這類似 CPU branch prediction／speculative execution，只是被預測的是敘事未來。它能把生成延遲藏在上一幕的播放時間裡。

目前專案已有 latency 分層、Persona-first 呈現與 continuation 等前身，但 top-k 影音 speculative generation 尚未實作，應明確標為新研發。

### Phase 3：Multimodal Agency

文字輸入只是第一種介面。未來玩家可以：

- 點擊角色手上的手機。
- 查看桌上的藥袋或信件。
- 走向門口、留在房間或靠近某個角色。
- 用自己的聲音說話，讓語氣與停頓也成為訊號。
- 避開角色的視線，或凝視某個物件而被角色察覺。
- 直接操作畫面內的手機或電腦 UI。

不同輸入應先被正規化成共用 semantic actions：

```text
inspect(phone)
approach(Yun)
leave(room)
avoid_eye_contact
say(intent=concern, tone=hesitant)
```

如此一來，UI 不綁死在某個按鈕或某支影片。文字、語音、點擊、視線與角色操作，只是改變世界狀態的不同 input adapters。

### Phase 4：Living Narrative World

終局不是每次生成一支更長的影片，而是 cutscene、對話與 gameplay 的界線逐漸消失。

作者不再預寫完整 branch tree，而是定義：

- 角色 identity、慾望與關係。
- 世界事實與不可違反的規則。
- 情緒與敘事目標。
- 哪些變化有意義、哪些結果不能發生。
- 如何判斷一段生成體驗仍然屬於這部作品。

終局不是取消作者，而是讓作者從「寫完每一條路」轉為「設計一個能持續產生好故事的可能性空間」。

---

## 最終修正：這些不是全部停留在未來式

一開始只把 `leave-the-door-open` 當成 eval 案例是不完整的。它實際上已對應大部分上述 control-plane 能力。

狀態分類：

- **已實作**：存在可執行程式、測試或已保存的 live evidence。
- **已有 contract**：架構與資料邊界已定義，但完整視覺 host 尚未接上。
- **真正未來研發**：目前只有方向，不能在簡報中說成已完成。

| 工程願景 | `leave-the-door-open` 的對應 | 狀態 |
|---|---|---|
| Persistent World State | deterministic World、Routine、Action、Evidence、Observation | 已實作 |
| 角色知道與相信什麼 | Character Core、Biography、MindState atoms、Memory | 已實作 |
| 自由語言改變角色 | catalog-blind Persona＋bounded Judge | 已實作並有 live witness |
| 不窮舉完整 branch tree | authored causal beats＋有限心理狀態轉移 | 已實作 |
| Hybrid Generation | 作者決定語意與結果，Performance Director 只生成 bounded staging | 已有 contract 與文字實作 |
| 文字／2D／3D 共用 runtime | WorldView／UIView、renderer-neutral Presentation Operations | contract 已定義；完整視覺 host 未完成 |
| 點擊物件與 UI interaction | PlayerCommand、InputAdapter、UI hit-testing 優先、world picking | 邊界已設計；完整視覺 interaction 未完成 |
| 長期持續世界 | server checkpoint、browser identity、observer journal | 已實作 |
| Story CI／eval | witness、replay、authority gates、human-play evidence hierarchy | 已實作 |
| 低延遲 orchestration | Persona-first 顯示、post-Persona continuation、模型路徑合併 | 已實作／驗證 |
| 即時生成影片 | 將 Performance／Presentation Operations 接到 video renderer | 真正下一步 |
| Top-k 預測式生成 | 播放當下預生成候選下一幕 | 真正下一步 |
| 語音、視線等 multimodal perception | 將感知正規化成 PlayerCommand／semantic action | 真正下一步 |

因此，更準確的說法不是：

> 未來我們也許可以建立 world state、角色記憶和 eval。

而是：

> 我們已經用另一個 playable PoC 驗證敘事控制層：角色有受控記憶與心理狀態，世界有時間、物件、行動、證據與因果，生成模型不能直接竄改世界；關鍵狀態轉移也有可重播的工程證據。這次 Hackathon 做的是另一端——讓玩家的解讀透過影音被立即看見。

---

## 合併後的目標架構

```text
┌──────────────────────────────────────────────┐
│ Input Adapters                               │
│ 文字、語音、點擊、視線、物件操作、角色移動  │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ Intent / Action Layer                        │
│ 把多模態訊號正規化成受控 semantic actions   │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ Narrative Control Plane                      │
│ World、Character、MindState、Evidence、Time  │
│ Controller、Persona、Judge、Memory、Causality│
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ Narrative / Presentation IR                  │
│ semantic operations、shot plan、continuity   │
│ constraints、direction brief、fallback       │
└──────────────────────┬───────────────────────┘
                       ↓
┌──────────────────────────────────────────────┐
│ Renderer Providers                           │
│ 預製影片 → Hybrid Generation → 即時影片／3D  │
└──────────────────────────────────────────────┘
```

三種權限必須維持分離：

1. **Deterministic authority**：世界事實、因果、物件狀態、時間與持久後果。
2. **Generative performance**：角色語言、表情、手勢、局部演出與鏡頭變體。
3. **Authored intent**：角色本質、敘事邊界、可接受結果與作品意義。

影片模型只回答「這一幕看起來如何」。Narrative control plane 還必須回答：

- 為什麼會發生這一幕？
- 角色此刻知道什麼？
- 玩家剛才改變了什麼？
- 哪些事之後必須記得？
- 生成失敗時，如何不讓世界崩掉？

---

## Meta Engineering：真正可累積的工程資產

影片模型可能快速商品化；較有防禦性的資產是：

### 1. Narrative IR 與 state ledger

角色、關係、世界、心理與因果使用穩定 ID 和受控狀態，而不是只存在 prompt 或影片文字描述中。

### 2. Story compiler 與 branch package contract

把導演的 shot list、角色 bible、生成 prompt、共用素材與 post-production 規則，轉換成 runtime 可驗收的 package。

### 3. Story CI 與 evidence hierarchy

不同主張必須由不同證據支撐：

1. deterministic tests 證明 authority 與 schema。
2. authored probes 證明決策區域存在。
3. saved-state replay 隔離模型或 Judge 變因。
4. live witness 證明至少一條路可達。
5. human playtest 才能判斷是否可信、可發現、節奏合適或好玩。

### 4. Pairwise transition witnesses

不必每次重跑整個故事。每個相鄰故事節點可以獨立驗證是否存在短而有效的因果路徑，再以 end-to-end playtest 驗證組合結果。

### 5. Latency orchestration 與 fallback

- 先顯示玩家立即需要的角色回應，再背景完成後續判斷。
- 在上一幕播放時生成下一幕。
- 先用低成本模型或 deterministic gate，必要時才升級。
- 即時生成失敗時，回到作者批准的預製素材或 neutral presentation。

### 6. Provenance 與 replay

每個生成結果保存模型、prompt、輸入狀態、輸出、latency、usage、版本與判斷證據，讓同一份結果可以在 rubric 改變後重新評估，而不需重新付費生成。

---

## 未來 12–36 個月的工程判斷

以下是方向判斷，不是產品時程保證。

### 最可能先消失的邊界

- 預製素材與生成素材：短 reaction、過場、語音、局部畫面與 UI 變體會先進入 near-real-time workflow。
- 選單與自然輸入：文字、語音與簡單物件點擊會逐漸正規化成同一套 semantic actions。
- 剪輯與 runtime：鏡頭選擇、轉場、配樂與 overlay 會逐步由 runtime 依狀態組裝。
- 固定 branch 與 on-demand scene：在受控角色、固定場景與短鏡頭下，系統可一邊播放、一邊生成下一幕。

### 不會因為影片模型進步就自動消失的問題

- 長時間角色 identity 與視覺一致性。
- 複雜因果、角色知識邊界與 persistent memory。
- Latency、成本、失敗回復與裝置限制。
- 玩家任意行動與戲劇節奏的衝突。
- Safety、版權、角色 likeness 與素材 lineage。
- 「生成得像」與「故事值得看」之間的差距。
- 作者控制與完全開放生成的取捨。

最適合收束的判斷是：

> 未來最先消失的，會是「這個鏡頭是否必須事先做好」；不會消失的是「這個世界為什麼如此回應玩家」。前者會被生成模型逐步解決，後者才是我們真正要工程化的核心。

---

## 決賽 Pitch

### 30 秒版本：務實工程版

> 我們做的不只是一個 AI 選影片的 demo。我們把互動敘事拆成三層：導演用 shot list 描述故事與可重用鏡頭；AI 把玩家的自由文字受限地路由到作者批准的分支；runtime 只播放標準化的 branch package。這讓每一層都能獨立替換與評估。今天內容是預生成 MP4，未來即時生成只需要取代內容供應端，不需要重寫整個遊戲。真正讓它能量產的，不只是生成模型，而是 prompt template、素材 lineage、routing eval 和 media quality gate 這套 Meta Engineering。

### 60–90 秒版本：最終願景版

> 今天，玩家輸入一句話，我們讓 AI 判斷他的解讀，再讓世界用一段影片回答他。但這只是第一步。
>
> 我們真正想做的，不是一棵擁有更多分支的故事樹，而是一個敘事編譯器：把玩家說的話、看的地方與做的動作，即時編譯成一個有因果、會記得玩家，而且可以直接被看見的世界。
>
> 我們已經用另一個 playable PoC 驗證底層敘事控制系統：角色有受控記憶與心理狀態，世界有時間、物件、因果和可觀察的證據；生成模型可以表演，但不能任意改寫世界；關鍵狀態轉移也有可重播的 eval。這次 Hackathon 驗證的是另一端：玩家自由解讀一個情境，世界用影音呈現後果，再讓玩家倒帶重來。
>
> 下一步，我們只預製角色、場景和關鍵劇情骨架。玩家觀看上一幕時，系統預測幾個最可能的下一步，提前生成候選鏡頭，最後只接上玩家真正走到的未來。再下一步，文字也不再是唯一介面：你可以點擊手機、走向門口、避開她的眼神，甚至直接開口；這些行為都會改變角色知道的事、彼此的關係，以及下一幕。
>
> 這不只是影片生成。影片模型只回答「這一幕看起來如何」；我們要工程化的是「為什麼發生、世界改變了什麼，以及角色之後必須記得什麼」。今天我們完成的是解讀、後果、倒帶、重新解讀。未來要拿掉的，是預製影片與即時世界之間的邊界。

---

## Demo 與簡報建議

不要只放一張充滿 buzzwords 的 architecture slide。建議用兩個畫面完成論證。

### 畫面一：兩個 vertical slices

```text
Narrative Control Plane                Audiovisual Experience
World / Character / Memory             Free interpretation
Causality / Evidence / Eval      +      Video consequence
Text/browser playable                   Rewind and reinterpret
```

中央箭頭寫：`Next: connect through Presentation IR`。

### 畫面二：同一刻產生不同未來

畫面左側播放共同情境，右側顯示兩句玩家輸入：

```text
「他根本不在乎我」             → hostile intent
「會不會她那邊出事了？」       → care intent
```

接著讓畫面分成兩個不同後果，再倒帶回同一刻。工程 trace 只出現在評審簡報或 debug view，不出現在玩家 UI。

---

## 避免過度宣稱

- 不說「已經可以無限生成故事」；說「已經有可持續擴充的 world／state／renderer contract」。
- 不說「AI 理解玩家心理」；說「AI 將自然訊號轉成受控 intent 或作者批准的狀態轉移」。
- 不說「已經支援即時影片生成」；說「控制層與影音層已有各自原型，下一步是用共同 Presentation IR 接起來」。
- 不說「已有完整 multimodal gameplay」；PlayerCommand 與 semantic operation 邊界已有設計，視覺 picking、語音與視線仍待實作。
- 不說「已有 top-k speculative generation」；目前只有 latency orchestration 的前身，預測式影音生成是明確的新研發。
- 不說「自動 keyframe tracking 已完成」；目前支援 keyframe 資料格式與插值，自動追蹤工具尚未完成。
- 不用 automated eval 證明「好玩」或「有治療效果」；這些必須由人類 playtest 與另外的研究設計回答。

---

## 決賽前最高 ROI 的工程工作

### 1. 建立兩個 PoC 的 bridge contract

定義一份最小 `NarrativeOutcome → PresentationRequest`：

- world／character state delta。
- player intent。
- exact narrative node。
- continuity constraints。
- required entities／objects。
- direction brief。
- fallback branch package。

這會讓「把兩個 vertical slices 接起來」不只是簡報箭頭。

### 2. 建立 routing eval harness

- 準備 H／C／N／ambiguous 的標註語句。
- 固定 prompt、model 與 branch definitions。
- 輸出 accuracy、confusion matrix、ambiguous／abstain rate。
- 每次改 prompt、模型或 branch 描述時跑 regression。
- 正式處理「判讀不明走 N，但 N 又是 stretch」的內容衝突。

### 3. 做一個 Hybrid Generation spike

不要先追求完整即時長影片。選一個低風險短鏡頭，例如角色收到訊息後的 reaction：

- 固定角色、場景、構圖與世界結果。
- 只讓玩家語氣改變表情、短對白或鏡頭距離。
- 設定 latency／品質門檻與預製 fallback。

### 4. 做一個畫面內物件互動 spike

讓玩家點擊影片中的手機或門，輸出一個穩定 semantic action，再回到同一套 intent／world state／presentation pipeline。這能最直接證明「整個畫面都可以成為介面」。

---

## 參考工程資產

本 Demo：

- `demo-shotlist.md`
- `public/story.json`
- `decisions/001-screen-replacement-layer.md`
- `decisions/002-rewind-transition.md`

Narrative control plane PoC：

- `/Users/yo/workspace/plot-twist/pocs/leave-the-door-open/README.md`
- `/Users/yo/workspace/plot-twist/pocs/leave-the-door-open/initial-thoughts.md`
- `/Users/yo/workspace/plot-twist/pocs/leave-the-door-open/evaluation-strategy.md`
- `/Users/yo/workspace/plot-twist/pocs/leave-the-door-open/visual-renderer.md`
- `/Users/yo/workspace/plot-twist/pocs/leave-the-door-open/decisions/0002-separate-world-simulation-from-rendering.md`
- `/Users/yo/workspace/plot-twist/pocs/leave-the-door-open/decisions/0010-author-hints-and-generate-bounded-performance.md`
- `/Users/yo/workspace/plot-twist/pocs/leave-the-door-open/decisions/0025-validate-story-arcs-with-pairwise-transition-witnesses.md`
- `/Users/yo/workspace/plot-twist/pocs/leave-the-door-open/decisions/0030-project-structured-semantic-presentation-operations.md`
- `/Users/yo/workspace/plot-twist/pocs/leave-the-door-open/decisions/0035-collapse-runtime-dialogue-to-persona-and-one-post-persona-judge.md`
- `/Users/yo/workspace/plot-twist/pocs/leave-the-door-open/decisions/0036-persist-browser-scoped-player-checkpoints-and-observer-journals.md`
