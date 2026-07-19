# 「已讀 9:42」demo 分鏡 + AI 影片生成 prompt 全集 (v2)

Working doc for the hackathon demo video and in-game branch videos.
Companion to `HANDOFF-hackathon.md`. Owners: 文浩 (video/UI), 炫錡 (旁白).

## Airtight rules

1. **No legible text is ever generated.** Every phone screen in every AI clip
   glows blank; messages, timestamps, and chips are composited in post.
2. **Character blocks are pasted verbatim into every prompt** (cross-shot
   consistency). Generate paired variants from the same base still
   (image-to-video) where marked.
3. **Reuse is the rhetoric.** Base scenes generated once, re-performed with
   different emotion; one musical motif, three orchestrations. Same world,
   three readings.

## 0 · Paste-blocks（每個 prompt 開頭原封貼上）

```
[CHARACTER A — "Mira"] An East Asian woman in her mid-20s, shoulder-length
black hair tucked behind one ear, oversized light-gray hoodie, no makeup,
tired but expressive eyes.

[CHARACTER B — "Yun"] An East Asian woman in her mid-20s, long dark hair in
a loose low ponytail, beige overcoat over a plain sweater, gentle face with
visible exhaustion.

[STYLE] Cinematic realism, 35mm lens look, shallow depth of field, muted
teal-and-amber color palette, soft film grain, slow deliberate camera moves,
natural indoor lighting. All phone screens glow soft blank white with no
readable content. No text, no captions, no watermarks, no UI elements.
16:9, 24fps.
```

**Negative prompt（所有 clip 共用）:** `readable text, subtitles, captions,
watermark, UI overlays, distorted hands, extra fingers, face morphing,
jump cuts, camera shake, oversaturated color`

## 1 · Game flow

```
共同開場   UI-1 聊天室(已讀21:42) → S1 房間確立 → UI-2 解讀輸入框
分支 H 敵意 UI-3H 打字「算了，當我沒說」→ S3-H → S2-BASE+S2-H 醫院(冷) →
           UI-4H 拒接 → S4-H → S5-H 三週後街口 → UI-END-H
分支 C 關心 UI-3C 打字「妳還好嗎？」→ S3-C → S2-BASE+S2-C 醫院(暖) →
           S4-C 接聽+出門 → S5-C 販賣機 → UI-END-C
分支 N 中性 UI-3N 手機蓋下 → S3-N 泡茶讀書 → S6-N 隔天早上道歉訊息 → UI-END-N
DEFAULT    → 播分支 N（判讀不明一律走中性）
```

MVP 生成優先序：H 和 C 全部（demo 只放這兩條）；N 是 stretch。

## 2 · AI 生成鏡頭全清單

### S1 — 房間確立（所有分支共用）
- 時長 5s ｜ 用於 開場
- Prompt: `[CHARACTER A][STYLE] Night. A small dim bedroom lit only by a
  phone screen. Over-the-shoulder shot from behind Mira sitting cross-legged
  on her bed, holding her phone with both hands. The blank white glow of the
  screen lights her face from below. She is completely still, waiting. The
  camera pushes in very slowly toward the phone. Outside the window, distant
  city lights are out of focus.`
- Audio: 房間底噪＋掛鐘秒針。無音樂。
- Post: 聊天室畫面（UI-1）疊在手機上；「已讀 21:42」。

### S3-H — 樞紐・冷訊息（敵意分支）
- 時長 6s ｜ 用於 H
- Prompt: `[CHARACTER A][STYLE] Same dim bedroom, closer now: a medium
  close-up of Mira's face lit by phone glow. Her jaw is tight, eyes narrowed
  and wet at the edges. She types fast and hard with both thumbs, stops,
  deletes, types again shorter, and hits send with one sharp decisive tap.
  Immediately after sending she tosses the phone face-down onto the blanket
  and turns away from it.`
- Performance: 憤怒蓋住受傷——動作快、猛、決絕。
- Audio: motif 首次出現：單音鋼琴，稀疏、冷。
- Post: 打字內容以 UI 疊加：「算了，當我沒說。」＋時間戳 22:03。

### S3-C — 樞紐・暖訊息（關心分支，S3-H 的鏡像）
- 時長 6s ｜ 用於 C
- Prompt: `[CHARACTER A][STYLE] Same dim bedroom, same medium close-up
  framing as before: Mira's face lit by phone glow. Her brow is furrowed
  with worry, not anger. She types slowly and carefully, pauses to reread,
  softens, and taps send gently. She sets the phone down face-up beside her,
  still glowing, and keeps glancing at it.`
- Performance: 擔心而非委屈——動作慢、輕、捨不得放。
- Audio: 同一段 motif，鋼琴＋一層暖弦樂墊。
- Post: 「不急著回。妳還好嗎？」＋時間戳 22:03（同一時刻，鏡像構圖）。

### S2-BASE — 醫院走廊（基底，兩分支共用）
- 時長 4s ｜ 用於 H、C 開頭共用
- Prompt: `[CHARACTER B][STYLE] Night. A quiet hospital corridor with cold
  fluorescent light and a row of metal bench seats against the wall. Wide
  shot: Yun sits alone on the bench, coat still on, elbows on knees, staring
  at the floor. A folded jacket and a paper bag sit beside her. At the end of
  the corridor, a nurse walks past out of focus. Her phone lies dark on the
  bench next to her. It lights up silently.`
- Audio: 日光燈嗡鳴、遠處儀器聲。音樂懸停。
- Post: 手機亮起瞬間疊訊息通知（H 疊冷句／C 疊暖句）——同一段素材用兩次。

### S2-H — 走廊反應・冷
- 時長 6s ｜ 用於 H
- Prompt: `[CHARACTER B][STYLE] Same hospital corridor, medium close-up on
  Yun on the bench. She picks up the glowing phone, reads. Her face falls —
  a small crumple of hurt, then blankness. She exhales through her nose,
  starts to type a reply with one thumb, stops mid-motion, locks the screen,
  and slides the phone into her coat pocket. She leans her head back against
  the wall and closes her eyes.`
- Performance: 被最後一根稻草壓到——不是大哭，是「連這個也要處理」的放棄。
- Audio: motif 停止。只剩走廊環境音。
- Post: 無字。

### S2-C — 走廊反應・暖（同構圖鏡像）
- 時長 6s ｜ 用於 C
- Prompt: `[CHARACTER B][STYLE] Same hospital corridor, same medium close-up
  framing: Yun picks up the glowing phone, reads. Her eyes well up and she
  presses the back of her hand to her mouth — relief cracking through
  exhaustion, a broken half-smile. She takes one steadying breath, stands
  up, and raises the phone to her ear as she walks a few steps down the
  corridor.`
- Performance: 「終於有人接住我」——疲憊裡裂開的一絲鬆動。
- Audio: motif 回來，暖配器，第一次加入大提琴。
- Post: 撥號 UI 一閃即收。

### S4-H — 拒接（敵意分支）
- 時長 5s ｜ 用於 H
- Prompt: `[CHARACTER A][STYLE] The dim bedroom later that night. Mira lies
  on her side in bed facing away. On the nightstand her phone vibrates and
  glows, rattling softly. She rolls over, looks at it — close-up of her
  thumb hovering over the screen for a long beat — then she presses once,
  the glow dies, and she pulls the blanket over her shoulder and turns back
  away. The room goes dark.`
- Performance: 猶豫要看得見——懸停那一拍是全片最貴的一秒。
- Audio: 震動聲突然停止＝聲音上的「拒接」。
- Post: 來電畫面疊加（Yun＋23:58）→ 按下拒接。

### S4-C — 接聽・出門（關心分支鏡像）
- 時長 7s ｜ 用於 C
- Prompt: `[CHARACTER A][STYLE] The dim bedroom later that night. Mira's
  phone vibrates and glows on the nightstand. She grabs it immediately and
  sits up, phone to her ear, listening — her expression shifts from worry
  to resolve in two seconds. Cut within the shot: she stands, pulls a coat
  on over the hoodie one arm at a time while still holding the phone to her
  ear, and walks out of frame toward the door. The hallway light flicks on.`
- Audio: motif 進入行進節奏（加入輕微 pulse）。
- Post: 通話中 UI（23:58・接聽）。

### S5-H — 三週後・街口（敵意分支終點）
- 時長 6s ｜ 用於 H
- Prompt: `[STYLE] Daytime, an ordinary city street corner, overcast soft
  light. Wide static shot. [CHARACTER A] walks in from the left looking down
  at her phone; [CHARACTER B] walks in from the right, also looking down.
  They pass within arm's reach of each other at the center of the frame —
  neither looks up. They exit opposite sides. The street stays empty for a
  beat.`
- Audio: motif 只剩一顆音，然後完全靜音兩秒收尾。
- Post: 「三週後」字卡；前接聊天室快捲（UI 製作）：訊息越來越稀疏，
  最後一則＝「算了，當我沒說。」
- 全片唯一雙人同框、唯一靜態鏡頭——「什麼都沒發生」就是壞結局。

### S5-C — 販賣機・並肩（關心分支終點）
- 時長 7s ｜ 用於 C
- Prompt: `[CHARACTER A][CHARACTER B][STYLE] Night, a hospital vending
  machine alcove with warm light spilling from the machines — the only warm
  light in the building. Medium-wide static shot from the side: Mira and Yun
  sit side by side on plastic chairs, each holding a paper cup of hot drink,
  steam rising. Yun is talking quietly, gesturing small with one hand; Mira
  listens and nods. Yun stops talking, exhales, and lets her head rest on
  Mira's shoulder. Neither moves. Hold.`
- Performance: 不哭、不擁抱——「終於可以不用撐著」的重量。
- Audio: motif 完整版，暖、慢，最後和弦不解決（留給 ledger 畫面）。
- Post: 無字。

### 分支 N（stretch；DEFAULT fallback 也播這條）
- S3-N（5s）: `[CHARACTER A][STYLE] The dim bedroom. Mira looks at the
  glowing phone for a beat, shrugs slightly, places it face-down on the
  nightstand, stretches her arms, and walks out of frame. Cut within shot:
  the small kitchen, warm light, she pours hot water into a mug, steam
  rising, and settles into a chair with a book.` — motif 的 lo-fi 版。
  Post: 22:03 手機蓋下。
- S6-N（6s）: `[CHARACTER A][STYLE] Morning, the same bedroom flooded with
  soft daylight. Mira wakes, reaches for the phone; it glows. She reads, and
  relief spreads into a small smile. She types a short reply while falling
  back onto the pillow, phone held above her face.` —
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

## 5 · 重用矩陣（生成預算）

9 個 MUST clips: S1, S3-H, S3-C, S2-BASE, S2-H, S2-C, S4-H, S4-C, S5-H,
S5-C（S2-BASE 服務兩分支；S3/S4 兩兩同構圖，可用 image-to-video 從同一張
基底圖出發）。+2 stretch: S3-N, S6-N。60 秒 demo 影片完全由這批遊戲素材
剪出，不需另拍。

## 6 · 生成注意事項

- S4-H 的懸停拇指、S2-H 的打字打到一半停住：全片論證最重的兩個半動作，
  也是模型最容易做壞的——保留最多 retry 預算。
- 先生成 S2-BASE：兩個分支繼承它的走廊、長椅、Yun 的造型；基底不對，
  下游全部重來。

## 7 · 60 秒 demo 影片剪法（引用上面素材）

| # | 時間 | 內容 | 旁白 |
|---|------|------|------|
| 1 | 0:00–0:06 | UI-1 + S1 | 「晚上九點四十二分，她讀了妳的訊息。然後——沒有然後。」 |
| 2 | 0:06–0:11 | UI-2 輸入「她根本不在乎我」→ chip 敵意解讀 | 「妳決定了這代表什麼。」 |
| 3 | 0:11–0:15 | S3-H | （靜默） |
| 4 | 0:15–0:20 | S2-BASE + S2-H | 「她在醫院陪媽媽。她收到的，不是妳的心情——是妳的解讀替妳送出的那句話。」 |
| 5 | 0:20–0:24 | S4-H | （靜默） |
| 6 | 0:24–0:29 | 聊天室快捲 + S5-H | 「什麼都沒發生。這就是壞結局的長相。」 |
| 7 | 0:29–0:34 | 倒帶轉場 → 輸入「會不會是她那邊出事了？」→ chip 關心解讀 | 「倒帶。同一個晚上、同一個已讀。換一個解讀。」 |
| 8 | 0:34–0:38 | S3-C | （靜默） |
| 9 | 0:38–0:43 | S2-BASE + S2-C | 「同一條走廊。同一次震動。不同的那句話。」 |
| 10 | 0:43–0:48 | S4-C + S5-C 前段 | （靜默） |
| 11 | 0:48–0:55 | 分割畫面 + ledger | 「情境從來沒變。變的是解讀，和解讀替妳做出的行為。臨床上，練習這件事叫解讀偏誤訓練 CBM-I——我們把它做成一分鐘一局。」 |
| 12 | 0:55–1:00 | 結尾卡 | 「你怎麼解讀世界，世界就怎麼回答你。」 |
