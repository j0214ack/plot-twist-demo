"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ScreenReplacement, type ScreenOverlayConfig } from "./ScreenReplacement";

type Phase = "observe" | "input" | "matching" | "playback" | "return";

type StoryBranch = {
  id: string;
  title: string;
  matchHint: string;
  keywords: string[];
  videoSrc: string | null;
  rewindSrc: string | null;
  posterSrc: string;
  previewSubtitle: string;
  fallbackDurationSec: number;
  screenOverlay?: ScreenOverlayConfig | null;
};

type StoryConfig = {
  id: string;
  title: string;
  episode: string;
  sceneImage: string;
  sceneVideoSrc?: string | null;
  openingPrompt: string;
  returnPrompt: string;
  branches: StoryBranch[];
};

type MatchResult = {
  branchId: string;
  rationale: string;
  source: "openai" | "fallback";
};

const DEFAULT_STORY: StoryConfig = {
  id: "unsaid-01",
  title: "未說出口",
  episode: "一個平常的晚上",
  sceneImage: "/assets/scene-observe.webp",
  sceneVideoSrc: "/videos/filler-opening-upset-couple.mp4",
  openingPrompt: "你覺得現在發生了什麼？",
  returnPrompt: "你覺得接下來會發生什麼？",
  branches: [
    {
      id: "distance",
      title: "沉默不是冷淡",
      matchHint: "兩人正在冷戰、關係疏遠，或其中一人對另一人感到失望。",
      keywords: ["冷戰", "吵架", "生氣", "疏遠", "分手", "失望", "尷尬", "沉默"],
      videoSrc: "/videos/filler-kitchen-argument.mp4",
      rewindSrc: "/videos/filler-kitchen-argument-reverse.mp4",
      posterSrc: "/assets/scene-playback.webp",
      previewSubtitle: "「你回來了。」她沒有抬頭。桌上的兩個杯子，只有一個還冒著熱氣。",
      fallbackDurationSec: 11,
      screenOverlay: null,
    },
    {
      id: "secret",
      title: "被藏起來的事",
      matchHint: "她似乎隱瞞了秘密、準備驚喜，或正在等待適合開口的時機。",
      keywords: ["秘密", "隱瞞", "驚喜", "禮物", "準備", "等待", "開口", "懷孕"],
      videoSrc: "/videos/filler-secret-surprise.mp4",
      rewindSrc: "/videos/filler-secret-surprise-reverse.mp4",
      posterSrc: "/assets/scene-playback.webp",
      previewSubtitle: "她把手機反扣在桌上，深吸一口氣：「我有一件事，一直不知道怎麼告訴你。」",
      fallbackDurationSec: 11,
      screenOverlay: null,
    },
    {
      id: "threat",
      title: "門外的人",
      matchHint: "房間裡有危險、有人跟蹤他們，或兩人正在躲避某個即將到來的人。",
      keywords: ["危險", "跟蹤", "躲", "門外", "陌生人", "害怕", "威脅", "報警"],
      videoSrc: "/videos/filler-threat-door.mp4",
      rewindSrc: "/videos/filler-threat-door-reverse.mp4",
      posterSrc: "/assets/scene-playback.webp",
      previewSubtitle: "門外傳來第三次敲門聲。她壓低聲音：「不是說好，今晚不要回來嗎？」",
      fallbackDurationSec: 11,
      screenOverlay: null,
    },
  ],
};

const PHASE_LABELS: Record<Phase, string> = {
  observe: "Scene 1 — 場景呈現",
  input: "Scene 2 — 玩家輸入",
  matching: "Scene 3 — 理解中",
  playback: "Scene 4 — 影片播放",
  return: "Scene 5 — 回到場景",
};

const REWIND_RATE = 4;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Home() {
  const [story, setStory] = useState<StoryConfig>(DEFAULT_STORY);
  const [phase, setPhase] = useState<Phase>("observe");
  const [input, setInput] = useState("");
  const [lastInput, setLastInput] = useState("");
  const [activeBranch, setActiveBranch] = useState<StoryBranch | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isRewinding, setIsRewinding] = useState(false);
  const [rewindVisible, setRewindVisible] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [playerId, setPlayerId] = useState("");
  const stageRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/story.json")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((nextStory: StoryConfig) => {
        if (nextStory?.branches?.length) setStory(nextStory);
      })
      .catch(() => undefined);

    const storedPlayerId = window.localStorage.getItem("unsaid-player-id");
    const nextPlayerId = storedPlayerId || window.crypto.randomUUID();
    window.localStorage.setItem("unsaid-player-id", nextPlayerId);
    setPlayerId(nextPlayerId);
  }, []);

  useEffect(() => {
    if (phase !== "observe" || story.sceneVideoSrc) return;
    const timer = window.setTimeout(() => setPhase("input"), 2600);
    return () => window.clearTimeout(timer);
  }, [phase, story.sceneVideoSrc]);

  useEffect(() => {
    if (phase === "input" || phase === "return") {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 180);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  const fallbackDuration = activeBranch?.fallbackDurationSec ?? 11;
  const isFallbackCut = !activeBranch?.videoSrc || videoFailed;

  const finishPlayback = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const finishRewind = useCallback(() => {
    const revealFirstFrame = () => {
      setInput("");
      setLoopCount((current) => current + 1);
      setIsRewinding(false);
      setRewindVisible(false);
      setPhase("return");
    };

    const originalVideo = videoRef.current;
    if (!originalVideo || originalVideo.currentTime <= 0.04) {
      revealFirstFrame();
      return;
    }

    originalVideo.pause();
    originalVideo.addEventListener("seeked", revealFirstFrame, { once: true });
    originalVideo.currentTime = 0;
  }, []);

  useEffect(() => {
    if (phase !== "playback" || !isFallbackCut || !isPlaying) return;
    const timer = window.setInterval(() => {
      setElapsed((current) => Math.min(fallbackDuration, current + 0.1));
    }, 100);
    return () => window.clearInterval(timer);
  }, [fallbackDuration, isFallbackCut, isPlaying, phase]);

  useEffect(() => {
    if (phase === "playback" && isFallbackCut && elapsed >= fallbackDuration) {
      finishPlayback();
    }
  }, [elapsed, fallbackDuration, finishPlayback, isFallbackCut, phase]);

  useEffect(() => {
    if (phase !== "playback" || !activeBranch?.rewindSrc) return;

    const preload = document.createElement("video");
    preload.preload = "auto";
    preload.muted = true;
    preload.src = activeBranch.rewindSrc;
    preload.load();

    return () => {
      preload.removeAttribute("src");
      preload.load();
    };
  }, [activeBranch?.rewindSrc, phase]);

  const submitInterpretation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const interpretation = input.trim();
    if (!interpretation || phase === "matching") return;

    setLastInput(interpretation);
    setPhase("matching");

    const matchRequest = fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interpretation,
        playerId,
        candidates: story.branches.map(({ id, title, matchHint, keywords }) => ({
          id,
          title,
          matchHint,
          keywords,
        })),
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("match_failed");
        return (await response.json()) as MatchResult;
      })
      .catch(
        (): MatchResult => ({
          branchId: story.branches[loopCount % story.branches.length].id,
          rationale: "Prototype fallback",
          source: "fallback",
        }),
      );

    const [result] = await Promise.all([matchRequest, wait(1450)]);
    const matchedBranch =
      story.branches.find((branch) => branch.id === result.branchId) ?? story.branches[0];

    setActiveBranch(matchedBranch);
    setElapsed(0);
    setIsPlaying(true);
    setIsRewinding(false);
    setRewindVisible(false);
    setVideoFailed(false);
    setPlaybackBlocked(false);
    setPhase("playback");
  };

  const prompt = phase === "return" ? story.returnPrompt : story.openingPrompt;
  const sceneImage = story.sceneImage;
  const continuePlayback = () => {
    videoRef.current?.play().then(() => setPlaybackBlocked(false)).catch(() => undefined);
  };
  const startRewind = () => {
    if (!activeBranch?.rewindSrc) {
      finishRewind();
      return;
    }

    setPlaybackBlocked(false);
    setRewindVisible(false);
    setIsRewinding(true);
  };

  const keepBranchFrame =
    Boolean(activeBranch) &&
    (phase === "playback" || phase === "return" || (phase === "matching" && loopCount > 0));

  return (
    <main
      ref={stageRef}
      className={`story-stage phase-${phase}`}
      aria-label={`${story.title}：${story.episode}`}
    >
      {keepBranchFrame && activeBranch ? (
        activeBranch.videoSrc && !videoFailed ? (
          <video
            ref={videoRef}
            key={activeBranch.videoSrc}
            className="scene-media playback-video"
            src={activeBranch.videoSrc}
            poster={activeBranch.posterSrc}
            autoPlay={phase === "playback" && isPlaying}
            playsInline
            preload="auto"
            onCanPlay={(event) => {
              if (phase !== "playback" || !isPlaying || isRewinding) return;
              event.currentTarget.play().catch(() => setPlaybackBlocked(true));
            }}
            onEnded={() => {
              if (phase === "playback" && !isRewinding) finishPlayback();
            }}
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <img
            className={`scene-media playback-still ${isPlaying ? "is-playing" : ""}`}
            src={activeBranch.posterSrc}
            alt="男人站在餐桌旁，女人坐在桌前回頭看他"
          />
        )
      ) : phase === "observe" && story.sceneVideoSrc ? (
        <video
          className="scene-media opening-video"
          src={story.sceneVideoSrc}
          poster={sceneImage}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={() => setPhase("input")}
        />
      ) : (
        <img
          className="scene-media scene-base"
          src={sceneImage}
          alt="夜晚的公寓裡，一名男人剛回家，一名女人沉默地站在廚房"
          fetchPriority="high"
        />
      )}

      {phase === "playback" && activeBranch?.rewindSrc && isRewinding && (
        <video
          className={`scene-media rewind-video ${rewindVisible ? "is-visible" : ""}`}
          src={activeBranch.rewindSrc}
          muted
          playsInline
          preload="auto"
          onCanPlay={(event) => {
            event.currentTarget.playbackRate = REWIND_RATE;
            event.currentTarget.play().catch(() => undefined);
          }}
          onPlaying={() => setRewindVisible(true)}
          onEnded={finishRewind}
        />
      )}

      {phase === "playback" && activeBranch?.screenOverlay && !isRewinding && (
        <ScreenReplacement
          config={activeBranch.screenOverlay}
          stageRef={stageRef}
          videoRef={videoRef}
          fallbackTime={elapsed}
        />
      )}

      <div className="cinema-vignette" aria-hidden="true" />
      <div className="top-shade" aria-hidden="true" />

      {phase !== "playback" && (
        <header className="scene-header">
          <p className="scene-label">{PHASE_LABELS[phase]}</p>
          <p className="story-mark">
            <span>{story.title}</span>
            <span className="story-mark-divider" aria-hidden="true" />
            <span>{story.episode}</span>
          </p>
        </header>
      )}

      {phase === "observe" && (
        <button className="observe-cue" type="button" onClick={() => setPhase("input")}>
          <span>觀察眼前的場景</span>
          <small>點一下繼續</small>
        </button>
      )}

      {(phase === "input" || phase === "return") && (
        <form className="interpretation-panel" onSubmit={submitInterpretation}>
          {phase === "return" && activeBranch && (
            <p className="loop-note">
              上一段故事：{activeBranch.title}
              <span aria-hidden="true"> · </span>
              再次改寫它
            </p>
          )}
          <label htmlFor="interpretation">{prompt}</label>
          <div className="input-shell">
            <input
              ref={inputRef}
              id="interpretation"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={280}
              autoComplete="off"
              placeholder={phase === "return" ? "輸入你的預測…" : "輸入你的理解…"}
            />
            <button type="submit" disabled={!input.trim()} aria-label="送出你的解讀">
              <span aria-hidden="true">➤</span>
            </button>
          </div>
          <p className="input-hint">沒有選項。說出你真正看見的故事。</p>
        </form>
      )}

      {phase === "matching" && (
        <section className="matching-state" role="status" aria-live="polite">
          <span className="matching-spinner" aria-hidden="true" />
          <h1>正在理解你的想法…</h1>
          <p>「{lastInput}」</p>
          <small>正在尋找最接近的故事分支</small>
        </section>
      )}

      {phase === "playback" && activeBranch && isFallbackCut && (
        <section className="story-continuation" aria-label="故事正在繼續">
          <p className="branch-subtitle">{activeBranch.previewSubtitle}</p>
        </section>
      )}

      {phase === "playback" && playbackBlocked && !videoFailed && (
        <button className="continue-story" type="button" onClick={continuePlayback}>
          <span>繼續故事</span>
          <small>點一下繼續</small>
        </button>
      )}

      {phase === "playback" && activeBranch && !isPlaying && !isRewinding && (
        <button className="rewind-story" type="button" onClick={startRewind}>
          <span className="rewind-symbol" aria-hidden="true">↶</span>
          <strong>倒帶</strong>
          <small>回到故事開始，換一種解讀</small>
        </button>
      )}

      {phase === "playback" && isRewinding && (
        <p className="rewind-status" role="status" aria-live="polite">
          REWIND <span>×{REWIND_RATE}</span>
        </p>
      )}

      <p className="episode-counter" aria-label={`已完成 ${loopCount} 次故事循環`}>
        LOOP {String(loopCount + 1).padStart(2, "0")}
      </p>
    </main>
  );
}
