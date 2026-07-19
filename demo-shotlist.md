# 「已讀 9:42」demo 分鏡 + AI 影片生成 prompt 全集 (v4.1)

Working doc for the hackathon demo video and in-game branch videos.
Companion to `HANDOFF-hackathon.md`. Owners: 文浩 (video/UI), 炫錡 (旁白).
v4.1: 朋友角色 Yun 改為男性（短髮、深藍夾克），避免與 Mira 混淆。

## Airtight rules

1. **每一段生成都是無狀態的。** 影片模型沒有上一顆鏡頭的記憶——所以每一條
   prompt 都必須完整自含：場景全描述、角色全描述、服裝、燈光狀態、風格，
   一字不漏地重複。禁止出現 "same bedroom" / "same framing as before"。
2. **場景與角色的描述文字逐字相同**（見 §0 正典），只有鏡頭與表演段落不同。
   跨鏡頭一致性靠「重複到一模一樣的文字」＋（可行時）image-to-video 從同一
   張基底圖出發。
3. **No legible text is ever generated.** 每一顆 AI 鏡頭裡的手機螢幕都是
   空白發光；訊息、時間戳、判讀 chip 全部後製疊加。
4. **分支必須一眼可辨。** 同場景、不同鏡頭語言（見 §2 開頭的分支語言表）。

## 0 · 正典段落（Canon blocks — 逐字複製進每條 prompt，不可改寫）

```
[MIRA] Mira, an East Asian woman in her mid-20s with shoulder-length black
hair tucked behind one ear, wearing an oversized light-gray hoodie, no
makeup, tired expressive eyes.

[YUN] Yun, an East Asian man in his mid-20s with short neat black hair,
wearing a navy-blue jacket over a plain cream sweater, with a gentle face
showing visible exhaustion.

[BEDROOM] a small city-apartment bedroom at night: a double bed with rumpled
light-gray bedding against the wall, a wooden nightstand with a small
warm-shaded bedside lamp, and a large window behind the bed showing distant
out-of-focus city lights.

[HOSPITAL] a quiet hospital corridor at night: pale green-white walls, cold
fluorescent ceiling lights, a row of gray metal bench seats along one wall,
polished linoleum floor reflecting the light; a folded jacket and a brown
paper bag sit on the bench.

[STREET] an ordinary city street corner on an overcast day: gray sky, muted
storefronts with blurred unreadable signage, a zebra crossing, sparse
pedestrians far in the background.

[VENDING] a small hospital vending-machine alcove at night: two tall vending
machines glowing with warm light (labels blurred and unreadable), two
plastic chairs side by side against the wall, warm glow spilling across
polished linoleum — the only warm light in the building.

[STYLE] Cinematic realism, 35mm lens look, shallow depth of field, muted
teal-and-amber color palette, soft film grain, natural motion, 24fps, 16:9.
Any phone screen glows soft blank white with no readable content. No text,
no captions, no watermarks, no UI elements.
```

下面每條 prompt 已把正典段落**全文展開**——直接整條複製即可用，
不需要再手動組裝。

**Negative prompt（所有 clip 共用）:** `readable text, subtitles, captions,
watermark, UI overlays, distorted hands, extra fingers, face morphing,
jump cuts, oversaturated color`

## 1 · Game flow

```
共同開場   UI-1 聊天室(已讀21:42) → S1 房間確立 → UI-2 解讀輸入框
分支 H 敵意 UI-3H 打字「算了，當我沒說」→ S3-H → S2-BASE+S2-H 醫院(冷) →
           UI-4H 拒接 → S4-H → S5-H 三週後街口 → UI-END-H
分支 C 關心 UI-3C 打字「你還好嗎？」→ S3-C → S2-BASE+S2-C 醫院(暖) →
           S4-C 接聽+出門 → S4-C2 電話那頭的Yun → S5-C 販賣機 → UI-END-C
分支 N 中性 UI-3N 手機蓋下 → S3-N 泡茶讀書 → S6-N 隔天早上道歉訊息 → UI-END-N
DEFAULT    → 播分支 N（判讀不明一律走中性）
```

MVP 生成優先序：H 和 C 全部（demo 只放這兩條）；N 是 stretch。

## 2 · AI 生成鏡頭全清單（v4.1・完整自含 prompt）

**分支語言對照表（每顆鏡頭 QC 用）：**

| 維度 | H 敵意分支 | C 關心分支 |
|---|---|---|
| 鏡頭運動 | 鎖死不動，或緩慢下壓 | 跟著人走（手持／dolly follow） |
| 構圖 | 越來越緊，人縮進角落，留白吃人 | 越來越開，門和走廊被打開 |
| 光 | 光源一個一個**熄滅**，冷藍 | 光源一個一個**亮起**，暖琥珀滲入 |
| 身體方向 | 向下：縮、躺、垮、背對 | 向上：站、走、開門、面向 |
| 兩人距離 | 全片不同框；擦肩那顆也互不看 | 越靠越近，直到頭靠肩 |

---

### S1 — 房間確立（所有分支共用，分岔前保持中性）
- 時長 5s ｜ 用於 開場
- Prompt:
  ```
  Night, inside a small city-apartment bedroom: a double bed with rumpled
  light-gray bedding against the wall, a wooden nightstand with a small
  warm-shaded bedside lamp that is switched OFF, and a large window behind
  the bed showing distant out-of-focus city lights. The room is lit only by
  a phone screen. Over-the-shoulder shot from behind Mira, an East Asian
  woman in her mid-20s with shoulder-length black hair tucked behind one
  ear, wearing an oversized light-gray hoodie, no makeup, tired expressive
  eyes. She sits cross-legged on the bed holding her phone with both hands;
  the blank white glow of the screen lights her face from below. She is
  completely still, waiting. The camera pushes in very slowly toward the
  phone. Cinematic realism, 35mm lens look, shallow depth of field, muted
  teal-and-amber color palette, soft film grain, 24fps, 16:9. The phone
  screen glows soft blank white with no readable content. No text, no
  captions, no watermarks, no UI elements.
  ```
- Audio: 房間底噪＋秒針。無音樂。 ｜ Post: UI-1「已讀 21:42」疊在手機上。

### S3-H — 樞紐・冷訊息（敵意分支）
- 時長 6s ｜ 用於 H
- Prompt:
  ```
  Night, inside a small city-apartment bedroom: a double bed with rumpled
  light-gray bedding against the wall, a wooden nightstand with a small
  warm-shaded bedside lamp that is switched OFF, and a large window behind
  the bed showing distant out-of-focus city lights. HIGH-ANGLE shot looking
  down: Mira, an East Asian woman in her mid-20s with shoulder-length black
  hair tucked behind one ear, wearing an oversized light-gray hoodie, no
  makeup, tired expressive eyes, has wedged herself into the corner between
  the bed and the wall, knees pulled up, blanket bunched around her like a
  barricade. The only light is the cold blue glow of the phone held close
  to her face. She types fast and hard, deletes everything, types something
  much shorter, and stabs send with one finger. Then she hurls the phone
  onto the far end of the bed — it lands face-down and its glow is snuffed
  out, dropping the room into near-total darkness. The camera slowly sinks
  downward toward her throughout the shot. Cinematic realism, 35mm lens
  look, shallow depth of field, muted cold teal color palette, soft film
  grain, 24fps, 16:9. The phone screen glows soft blank white with no
  readable content. No text, no captions, no watermarks, no UI elements.
  ```
- Performance: 憤怒蓋住受傷。鏡頭語言＝下壓、變暗、縮角落。
- Audio: motif 首現，單音鋼琴，冷。 ｜ Post: 「算了，當我沒說。」＋22:03。
- **對照點：光被「摔熄」。**

### S3-C — 樞紐・暖訊息（關心分支）
- 時長 7s ｜ 用於 C
- Prompt:
  ```
  Night, inside a small city-apartment bedroom: a double bed with rumpled
  light-gray bedding against the wall, a wooden nightstand with a small
  warm-shaded bedside lamp that is switched OFF at the start of the shot,
  and a large window behind the bed showing distant out-of-focus city
  lights. EYE-LEVEL tracking shot: Mira, an East Asian woman in her mid-20s
  with shoulder-length black hair tucked behind one ear, wearing an
  oversized light-gray hoodie, no makeup, tired expressive eyes, gets up
  off the bed and walks slowly to the window while typing on her phone, the
  camera dollying alongside her, out-of-focus city lights drifting behind
  her. She stops, rereads what she wrote, softens, and taps send gently.
  Then she reaches over and clicks ON the warm bedside lamp — amber light
  blooms across half the room — and sets the phone face-up beside the lamp,
  screen still glowing, where she can see it. Cinematic realism, 35mm lens
  look, shallow depth of field, teal night tones warming into amber, soft
  film grain, 24fps, 16:9. The phone screen glows soft blank white with no
  readable content. No text, no captions, no watermarks, no UI elements.
  ```
- Performance: 擔心而非委屈。鏡頭語言＝起身、移動、開燈。
- Audio: 同 motif，鋼琴＋暖弦樂墊。 ｜ Post: 「不急著回。你還好嗎？」＋22:03。
- **對照點：同一時刻，H 熄了光，C 開了燈。**

### S2-BASE — 醫院走廊（收到訊息之前，兩分支共用）
- 時長 4s ｜ 用於 H、C
- Prompt:
  ```
  Night, inside a quiet hospital corridor: pale green-white walls, cold
  fluorescent ceiling lights, a row of gray metal bench seats along one
  wall, polished linoleum floor reflecting the light. Wide shot: Yun, an
  East Asian man in his mid-20s with short neat black hair, wearing a
  navy-blue jacket over a plain cream sweater, with a gentle face showing
  visible exhaustion, sits alone on the bench, elbows on knees, staring at
  the floor. A folded jacket and a brown paper bag sit on the bench beside
  him. At the far end of the corridor a nurse walks past, out of focus. His
  phone lies dark on the bench next to him — then it lights up silently.
  Cinematic realism, 35mm lens look, shallow depth of field, muted cold
  teal color palette, soft film grain, 24fps, 16:9. The phone screen glows
  soft blank white with no readable content. No text, no captions, no
  watermarks, no UI elements.
  ```
- Audio: 日光燈嗡鳴、遠處儀器聲。音樂懸停。
- Post: 亮起瞬間各疊冷／暖訊息——**唯一仍共用的醫院素材，先生成這顆。**

### S2-H — 走廊反應・冷
- 時長 6s ｜ 用於 H
- Prompt:
  ```
  Night, inside a quiet hospital corridor: pale green-white walls, cold
  fluorescent ceiling lights, a row of gray metal bench seats along one
  wall, polished linoleum floor reflecting the light; a folded jacket and a
  brown paper bag sit on the bench. LOCKED-OFF WIDE SHOT that never moves:
  Yun, an East Asian man in his mid-20s with short neat black hair, wearing
  a navy-blue jacket over a plain cream sweater, with a gentle face showing
  visible exhaustion, is a small lone figure on the bench surrounded by a
  long stretch of empty corridor. He picks up the glowing phone, reads, and
  his whole posture deflates — he slides lower on the bench, slips the
  phone into his jacket pocket, tips his head back against the wall and
  closes his eyes. At the far end of the corridor one section of
  fluorescent lights flickers and goes dark. No one comes. The camera
  holds, indifferent. Cinematic realism, 35mm lens look, deep quiet frame,
  muted cold teal color palette, soft film grain, 24fps, 16:9. The phone
  screen glows soft blank white with no readable content. No text, no
  captions, no watermarks, no UI elements.
  ```
- Performance: 放棄不是崩潰，是整個人「消氣」。鏡頭語言＝遠、靜、光又熄一段。
- Audio: motif 停止，只剩日光燈嗡鳴。 ｜ Post: 無字。

### S2-C — 走廊反應・暖
- 時長 7s ｜ 用於 C
- Prompt:
  ```
  Night, inside a quiet hospital corridor: pale green-white walls, cold
  fluorescent ceiling lights, a row of gray metal bench seats along one
  wall, polished linoleum floor reflecting the light; a folded jacket and a
  brown paper bag sit on the bench. HANDHELD CLOSE shot: Yun, an East Asian
  man in his mid-20s with short neat black hair, wearing a navy-blue jacket
  over a plain cream sweater, with a gentle face showing visible
  exhaustion, reads his glowing phone and presses the back of his hand to
  his mouth, eyes welling. He stands up — the camera rises with him — and
  walks quickly down the corridor while dialing, the camera following at
  his shoulder. As he passes an open doorway, warm light sweeps across his
  face. The shot ends on his profile in close-up, phone to his ear, his
  frown breaking apart into relief — a wet, broken half-laugh. Cinematic
  realism, 35mm lens look, shallow depth of field, cold teal warming into
  amber as he walks, soft film grain, 24fps, 16:9. The phone screen glows
  soft blank white with no readable content. No text, no captions, no
  watermarks, no UI elements.
  ```
- Performance: 「終於有人接住我」。鏡頭語言＝站起、前進、暖光掃臉。
- Audio: motif 回來，首次加入大提琴。 ｜ Post: 撥號 UI 一閃即收。
- **對照點：H 是坐著熄滅，C 是站起來走向光。**

### S4-H — 拒接（敵意分支）- 炫錡
- 時長 6s ｜ 用於 H
- Prompt:
  ```
  Night, inside a small city-apartment bedroom now almost completely dark:
  a double bed with rumpled light-gray bedding against the wall, a wooden
  nightstand with a small warm-shaded bedside lamp that is switched OFF,
  and a large window behind the bed where distant city lights look very
  small and far away. STATIC shot: Mira, an East Asian woman in her
  mid-20s with shoulder-length black hair tucked behind one ear, wearing an
  oversized light-gray hoodie, lies on her side in bed facing away from
  camera, only the curve of her shoulder visible under the blanket. On the
  nightstand her phone vibrates and glows, each pulse throwing trembling
  shadows across the ceiling. Insert: extreme close-up of her thumb
  hovering over the glowing screen for a long beat — then one press. The
  glow dies instantly. Hold on the dark room for a full beat. Cinematic
  realism, 35mm lens look, shallow depth of field, muted cold teal color
  palette, soft film grain, 24fps, 16:9. The phone screen glows soft blank
  white with no readable content. No text, no captions, no watermarks, no
  UI elements.
  ```
- Performance: 懸停那一拍是全片最貴的一秒。
- Audio: 震動聲戛然而止＝聲音上的拒接。 ｜ Post: 來電畫面（Yun・23:58）→拒接。

### S4-C — 接聽・出門（關心分支）
- 時長 7s ｜ 用於 C
- Prompt:
  ```
  Night, inside a small city-apartment bedroom: a double bed with rumpled
  light-gray bedding against the wall, a wooden nightstand with a small
  warm-shaded bedside lamp that is switched ON, filling the room with soft
  amber light, and a large window behind the bed showing distant
  out-of-focus city lights. The phone on the nightstand vibrates once and
  Mira, an East Asian woman in her mid-20s with shoulder-length black hair
  tucked behind one ear, wearing an oversized light-gray hoodie, grabs it
  immediately and sits up, phone to her ear, listening — her expression
  shifting from worry to resolve within two seconds. She stands, pulls a
  coat on over the hoodie one arm at a time without lowering the phone,
  and walks toward the bedroom door. The camera FOLLOWS HER THROUGH THE
  DOORWAY as she opens it and the hallway light flicks on — the open door
  and spilling warm light fill the frame. Cinematic realism, 35mm lens
  look, shallow depth of field, amber-warm palette, soft film grain, 24fps,
  16:9. The phone screen glows soft blank white with no readable content.
  No text, no captions, no watermarks, no UI elements.
  ```
- Audio: motif 進入行進節奏，加入輕微 pulse。 ｜ Post: 通話中（23:58・接聽）。
- **對照點：H 收在黑掉的房間，C 收在被推開的門。**

### S4-C2 — 電話那頭的 Yun（關心分支・新增）
- 時長 6s ｜ 用於 C（接在 S4-C 之後，或與其交叉剪接）
- Prompt:
  ```
  Night, inside a quiet hospital corridor: pale green-white walls, cold
  fluorescent ceiling lights, a row of gray metal bench seats along one
  wall, polished linoleum floor reflecting the light. MEDIUM CLOSE-UP:
  Yun, an East Asian man in his mid-20s with short neat black hair, wearing
  a navy-blue jacket over a plain cream sweater, with a gentle face showing
  visible exhaustion, paces slowly with a phone pressed to his ear, his
  other arm wrapped tightly around himself, brow knotted, jaw tense —
  braced for the call to go badly. Then a voice comes through the phone and
  his face releases: the frown melts into open relief. He stops pacing,
  leans his back against the wall, lets out a small wet laugh, and wipes
  his eye with his jacket sleeve. Warm light from a nearby open doorway
  falls across him. Cinematic realism, 35mm lens look, shallow depth of
  field, cold teal with warm amber falling on his face, soft film grain,
  24fps, 16:9. No readable text anywhere, no captions, no watermarks, no
  UI elements.
  ```
- Performance: **皺眉→鬆一口氣**，全片情緒轉變最明確的一顆，多留 retry 預算。
- Audio: motif 暖版持續＋輕微電話白噪。 ｜ Post: 無字。

### S5-H — 三週後・街口（敵意分支終點）- Andy
- 時長 6s ｜ 用於 H
- Prompt:
  ```
  Daytime, an ordinary city street corner on an overcast day: gray sky,
  muted storefronts with blurred unreadable signage, a zebra crossing,
  sparse pedestrians far in the background. WIDE STATIC SHOT that never
  moves, drained desaturated color. Mira, an East Asian woman in her
  mid-20s with shoulder-length black hair tucked behind one ear, wearing an
  oversized light-gray hoodie under an open dark coat, walks in from the
  left looking down at her phone. Yun, an East Asian man in his mid-20s
  with short neat black hair, wearing a navy-blue jacket over a plain cream
  sweater, walks in from the right, also looking down at his phone. A city
  bus sweeps through the foreground between them, briefly wiping the frame
  — when it clears, they have already passed each other. Neither looks up.
  They exit opposite sides and the street stays empty for a long beat.
  Cinematic realism, 35mm lens look, deep focus, muted gray palette, soft
  film grain, 24fps, 16:9. No readable text anywhere, no captions, no
  watermarks, no UI elements.
  ```
- Audio: motif 只剩一顆音，然後完全靜音兩秒收尾。
- Post: 「三週後」字卡；前接聊天室快捲（UI）：訊息越來越稀疏，
  最後一則＝「算了，當我沒說。」
- 全片唯一雙人同框——**同框卻互不看見，「什麼都沒發生」就是壞結局。**

### S5-C — 販賣機・並肩（關心分支終點）
- 時長 7s ｜ 用於 C
- Prompt:
  ```
  Night, inside a small hospital vending-machine alcove: two tall vending
  machines glowing with warm light (labels blurred and unreadable), two
  plastic chairs side by side against the wall, warm glow spilling across
  polished linoleum — the only warm light in the building. MEDIUM-WIDE shot
  from the side, with a VERY SLOW GENTLE PUSH-IN: Mira, an East Asian woman
  in her mid-20s with shoulder-length black hair tucked behind one ear,
  wearing an oversized light-gray hoodie, and Yun, an East Asian man in his
  mid-20s with short neat black hair, wearing a navy-blue jacket over a
  plain cream sweater, sit side by side on the plastic chairs, each holding
  a paper cup of hot drink, steam rising. Yun talks quietly, gesturing
  small with one hand; Mira listens and nods. Yun stops talking, exhales,
  and lowers his head, pressing the heels of his hands to his eyes; Mira
  rests a steady hand on his shoulder. Neither moves. Hold. Cinematic
  realism, 35mm lens look, shallow depth of field, warm amber palette, soft
  film grain, 24fps, 16:9. No readable text anywhere, no captions, no
  watermarks, no UI elements.
  ```
- Performance: 不哭、不擁抱——「終於可以不用撐著」的重量。
- Audio: motif 完整版，暖、慢，最後和弦不解決（留給 ledger）。 ｜ Post: 無字。
- **對照點：全片唯一「朝人推進」的鏡頭運動，對照 S5-H 的死不動。**

### 分支 N（stretch；DEFAULT fallback 也播這條）

- **S3-N**（5s）:
  ```
  Night, inside a small city-apartment bedroom: a double bed with rumpled
  light-gray bedding against the wall, a wooden nightstand with a small
  warm-shaded bedside lamp that is switched OFF, and a large window behind
  the bed showing distant out-of-focus city lights. Mira, an East Asian
  woman in her mid-20s with shoulder-length black hair tucked behind one
  ear, wearing an oversized light-gray hoodie, looks at her glowing phone
  for a beat, shrugs slightly, places it face-down on the nightstand,
  stretches her arms, and walks out of frame. Cut within the shot to a
  small warm-lit apartment kitchen: she pours hot water into a mug, steam
  rising, and settles into a chair with a book. Cinematic realism, 35mm
  lens look, shallow depth of field, cozy neutral warm palette, soft film
  grain, 24fps, 16:9. The phone screen glows soft blank white with no
  readable content. No text, no captions, no watermarks, no UI elements.
  ```
  motif 的 lo-fi 版。 Post: 22:03 手機蓋下。
- **S6-N**（6s）:
  ```
  Morning, inside a small city-apartment bedroom flooded with soft
  daylight: a double bed with rumpled light-gray bedding against the wall,
  a wooden nightstand with a small warm-shaded bedside lamp that is
  switched OFF, and a large window behind the bed with bright hazy morning
  light. Mira, an East Asian woman in her mid-20s with shoulder-length
  black hair tucked behind one ear, wearing an oversized light-gray hoodie,
  wakes and reaches for her phone; it glows. She reads, and relief spreads
  into a small smile. She types a short reply while falling back onto the
  pillow, phone held above her face. Cinematic realism, 35mm lens look,
  shallow depth of field, bright soft morning palette, soft film grain,
  24fps, 16:9. The phone screen glows soft blank white with no readable
  content. No text, no captions, no watermarks, no UI elements.
  ```
  Post: Yun「抱歉！我媽昨晚住院，亂成一團，晚點打給妳🙏」＋
  Mira「要我帶咖啡過去嗎？」

## 3 · 音樂規格（一條 motif，三種說法）

| 分支 | 配器 | 收尾 |
|------|------|------|
| H 敵意 | 單音鋼琴，音與音之間留空 | 剩一顆音 → 兩秒全靜音 |
| C 關心 | 同 motif＋弦樂墊＋大提琴，後段加 pulse | 完整和弦，不解決 |
| N 中性 | 同 motif 的 lo-fi chill 編曲 | 自然淡出 |

## 4 · UI／動態圖形清單（不進生成模型）

UI-1 聊天室＋已讀21:42 ｜ UI-2 輸入框＋判讀 chip（敵意／關心／中性）｜
UI-3 打字動畫×3 句 ｜ UI-4 來電/拒接/接聽 ｜ 倒帶轉場（時間軸刷回21:42）｜
三週後聊天室快捲 ｜ 分割畫面＋時間軸分岔（21:42/22:03/23:58）＋ledger
趨勢線 ｜ 結尾卡「這是其中一種可能，不是預言。」×3 分支各一行結語

## 5 · 生成預算

**11 個 MUST clips**: S1, S3-H, S3-C, S2-BASE, S2-H, S2-C, S4-H, S4-C,
S4-C2, S5-H, S5-C。**+2 stretch**: S3-N, S6-N。
（v4 起 S2-H／S2-C 不再共用構圖——分支視覺分化優先於素材重用；
仍共用的只有 S2-BASE 和所有正典描述文字。）
60 秒 demo 影片完全由這批遊戲素材剪出，不需另拍。

## 6 · 生成注意事項

- **先生成 S2-BASE 和 S1**：走廊／房間的長相以最先成功的那版為準，之後所有
  同場景 prompt 若與成品有出入（牆色、床品、燈位），以成品回改 prompt 正典
  再生成後續鏡頭。
- 半動作最容易壞、論證最重，多留 retry：S4-H 懸停拇指、
  **S4-C2 皺眉→鬆一口氣**。
- 每一條 prompt 都是自含的——不要為了省字刪掉場景／角色描述，
  影片模型沒有上一顆鏡頭的記憶。

## 7 · 60 秒 demo 影片剪法（引用上面素材）

| # | 時間 | 內容 | 旁白 |
|---|------|------|------|
| 1 | 0:00–0:06 | UI-1 + S1 | 「晚上九點四十二分，他讀了妳的訊息。一整個晚上，都沒有回。」 |
| 2 | 0:06–0:11 | UI-2 輸入「他根本不在乎我」→ chip 敵意解讀 | 「妳覺得，這是什麼意思？把心裡那句話，打進去。」 |
| 3 | 0:11–0:15 | S3-H | 「妳說——他根本不在乎我。那就照這個想法，走走看。」 |
| 4 | 0:15–0:20 | S2-BASE + S2-H | 「妳不知道的是，他在醫院陪媽媽。而他收到的，是妳那句『算了』。」 |
| 5 | 0:20–0:24 | S4-H | （靜默——震動聲停止就是台詞） |
| 6 | 0:24–0:29 | 聊天室快捲 + S5-H | 「之後，什麼事都沒有發生。你們只是慢慢地，不講話了。」 |
| 7 | 0:29–0:34 | 倒帶轉場 → 輸入「會不會是他那邊出事了？」→ chip 關心解讀 | 「回到同一個晚上。這次妳想的是——他會不會，是出事了？」 |
| 8 | 0:34–0:38 | S3-C | （靜默） |
| 9 | 0:38–0:43 | S2-BASE + S2-C | 「同一條走廊，同一次震動。這次他看到的是：『你還好嗎？』」 |
| 10 | 0:43–0:48 | S4-C + S4-C2 | 「那通電話，這一次，妳接了。」（之後靜默） |
| 11 | 0:48–0:55 | S5-C 前段 → 分割畫面 + ledger | 「事情只發生了一次。變的，是妳的解讀，和它替妳做出的每一個決定。心理學把這種練習叫『解讀偏誤訓練』——我們把它做成了一分鐘一局的遊戲。」 |
| 12 | 0:55–1:00 | 結尾卡 | 「同一個晚上，兩種結局。分岔點，只是妳心裡的一句話。」 |
