# Screen replacement 資料格式

`public/story.json` 的每個 branch 都可加上 `screenOverlay`。沒有螢幕替換時設為 `null`。

## 靜止螢幕

```json
{
  "screenOverlay": {
    "contentSrc": "/overlays/phone-chat.png",
    "contentSize": [1170, 2532],
    "videoSize": [1920, 1080],
    "opacity": 0.96,
    "keyframes": [
      {
        "at": 0,
        "corners": [
          [0.612, 0.348],
          [0.726, 0.369],
          [0.711, 0.684],
          [0.592, 0.653]
        ]
      }
    ]
  }
}
```

`corners` 固定依照左上、右上、右下、左下排列。座標是相對於原始影片寬高的 0–1 比例，因此換播放器尺寸或全螢幕時不需要重標。

## 輕微移動

再加入時間點即可。播放器會在相鄰 keyframes 之間線性插值四個角：

```json
{
  "at": 2.4,
  "corners": [[0.615, 0.35], [0.73, 0.372], [0.715, 0.686], [0.595, 0.655]]
}
```

通常只需要在螢幕方向或位置明顯改變時加 keyframe，不需要每一幀都手動標。

## 素材要求

- `contentSrc`：同網域 PNG、JPEG 或 WebP；建議依螢幕比例輸出。
- `contentSize`：介面素材的原始 `[width, height]`。
- `videoSize`：標座標時使用的影片原始 `[width, height]`。
- `opacity`：選填，預設 1。可稍微降低，讓原片反光與質感透出。
- `keyframes`：至少一筆，時間單位為秒。

## 目前不處理

- 手或人物穿過螢幕前方的逐幀遮罩。
- 螢幕曲面、折疊、嚴重 motion blur。
- 網站內的 keyframe 編輯器。
- 瀏覽器內即時電腦視覺追蹤。

未來的逐幀分析工具應輸出同一份 keyframes 格式；播放器不需要知道座標是人標的還是模型分析的。
