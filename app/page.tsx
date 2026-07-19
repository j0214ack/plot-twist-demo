"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ScreenReplacement, type ScreenOverlayConfig } from "./ScreenReplacement";

type Phase = "observe" | "input" | "matching" | "playback" | "return";
type RewindStage = "idle" | "branch" | "bridge" | "opening";

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
  sceneRewindSrc?: string | null;
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
  sceneRewindSrc: "/videos/filler-opening-upset-couple-reverse.mp4",
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

const REWIND_RATE = 16;
const BRIDGE_MIN_DURATION_MS = 900;

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
  const [rewindStage, setRewindStage] = useState<RewindStage>("idle");
  const [branchVisible, setBranchVisible] = useState(false);
  const [branchRewindVisible, setBranchRewindVisible] = useState(false);
  const [openingRewindVisible, setOpeningRewindVisible] = useState(false);
  const [openingBufferReady, setOpeningBufferReady] = useState(false);
  const [bridgeStartedAt, setBridgeStartedAt] = useState<number | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [playerId, setPlayerId] = useState("");
  const stageRef = useRef<HTMLElement>(null);
  const openingVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const openingRewindVideoRef = useRef<HTMLVideoElement>(null);
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
    const openingVideo = openingVideoRef.current;
    if (!openingVideo || !story.sceneVideoSrc) return;

    if (phase === "observe" && rewindStage === "idle") {
      openingVideo.play().catch(() => undefined);
    } else {
      openingVideo.pause();
    }
  }, [phase, rewindStage, story.sceneVideoSrc]);

  useEffect(() => {
    if (phase === "input" || phase === "return") {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 180);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  const fallbackDuration = activeBranch?.fallbackDurationSec ?? 11;
  const isFallbackCut = !activeBranch?.videoSrc || videoFailed;
  const showOpeningPrompt = useCallback(() => {
    setPhase(loopCount > 0 ? "return" : "input");
  }, [loopCount]);

  const finishPlayback = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const finishOpeningRewind = useCallback(() => {
    const restartOpening = () => {
      setInput("");
      setLoopCount((current) => current + 1);
      setIsPlaying(true);
      setBranchVisible(false);
      setBranchRewindVisible(false);
      setOpeningRewindVisible(false);
      setOpeningBufferReady(false);
      setBridgeStartedAt(null);
      setRewindStage("idle");
      setPhase("observe");
    };

    const openingVideo = openingVideoRef.current;
    if (!openingVideo || openingVideo.currentTime <= 0.04) {
      restartOpening();
      return;
    }

    openingVideo.pause();
    openingVideo.addEventListener("seeked", restartOpening, { once: true });
    openingVideo.currentTime = 0;
  }, []);

  const finishBranchRewind = useCallback(() => {
    if (!story.sceneRewindSrc) {
      finishOpeningRewind();
      return;
    }

    setBranchRewindVisible(false);
    setOpeningRewindVisible(false);
    setOpeningBufferReady(false);
    setBridgeStartedAt(window.performance.now());
    setRewindStage("bridge");
  }, [finishOpeningRewind, story.sceneRewindSrc]);

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
    if (phase !== "playback" || rewindStage !== "idle" || !activeBranch?.rewindSrc) return;

    const preload = document.createElement("video");
    preload.preload = "auto";
    preload.muted = true;
    preload.src = activeBranch.rewindSrc;
    preload.load();

    return () => {
      preload.removeAttribute("src");
      preload.load();
    };
  }, [activeBranch?.rewindSrc, phase, rewindStage]);

  useEffect(() => {
    if (rewindStage !== "bridge" || !openingBufferReady || bridgeStartedAt === null) return;

    const elapsedMs = window.performance.now() - bridgeStartedAt;
    const remainingMs = Math.max(0, BRIDGE_MIN_DURATION_MS - elapsedMs);
    const timer = window.setTimeout(() => setRewindStage("opening"), remainingMs);
    return () => window.clearTimeout(timer);
  }, [bridgeStartedAt, openingBufferReady, rewindStage]);

  useEffect(() => {
    if (rewindStage !== "opening") return;
    const openingRewindVideo = openingRewindVideoRef.current;
    if (!openingRewindVideo) return;

    openingRewindVideo.playbackRate = REWIND_RATE;
    openingRewindVideo.currentTime = 0;
    openingRewindVideo.play().catch(() => undefined);
  }, [rewindStage]);

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
    setRewindStage("idle");
    setBranchVisible(false);
    setBranchRewindVisible(false);
    setOpeningRewindVisible(false);
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
      finishBranchRewind();
      return;
    }

    setPlaybackBlocked(false);
    setBranchRewindVisible(false);
    setRewindStage("branch");
  };

  const skipOpening = () => {
    const openingVideo = openingVideoRef.current;
    if (!openingVideo || !Number.isFinite(openingVideo.duration)) {
      showOpeningPrompt();
      return;
    }

    openingVideo.pause();
    const target = Math.max(0, openingVideo.duration - 0.04);
    if (Math.abs(openingVideo.currentTime - target) <= 0.04) {
      showOpeningPrompt();
      return;
    }

    openingVideo.addEventListener("seeked", showOpeningPrompt, { once: true });
    openingVideo.currentTime = target;
  };

  const showBranchLayer =
    phase === "playback" &&
    Boolean(activeBranch) &&
    (rewindStage === "idle" || rewindStage === "branch");

  return (
    <main
      ref={stageRef}
      className={`story-stage phase-${phase}`}
      aria-label={`${story.title}：${story.episode}`}
    >
      {story.sceneVideoSrc ? (
        <video
          ref={openingVideoRef}
          key={story.sceneVideoSrc}
          className="scene-media opening-video"
          src={story.sceneVideoSrc}
          poster={sceneImage}
          muted
          playsInline
          preload="auto"
          onEnded={() => {
            if (rewindStage === "idle" && phase === "observe") showOpeningPrompt();
          }}
        />
      ) : (
        <img
          className="scene-media scene-base"
          src={sceneImage}
          alt="夜晚的公寓裡，一名男人剛回家，一名女人沉默地站在廚房"
          fetchPriority="high"
        />
      )}

      {showBranchLayer && activeBranch &&
        (activeBranch.videoSrc && !videoFailed ? (
          <video
            ref={videoRef}
            key={activeBranch.videoSrc}
            className={`scene-media playback-video branch-video ${branchVisible ? "is-visible" : ""}`}
            src={activeBranch.videoSrc}
            poster={activeBranch.posterSrc}
            autoPlay={rewindStage === "idle" && isPlaying}
            playsInline
            preload="auto"
            onCanPlay={(event) => {
              if (rewindStage !== "idle" || !isPlaying) return;
              event.currentTarget.play().catch(() => setPlaybackBlocked(true));
            }}
            onPlaying={() => setBranchVisible(true)}
            onEnded={() => {
              if (rewindStage === "idle") finishPlayback();
            }}
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <img
            className={`scene-media playback-still ${isPlaying ? "is-playing" : ""}`}
            src={activeBranch.posterSrc}
            alt="男人站在餐桌旁，女人坐在桌前回頭看他"
          />
        ))}

      {phase === "playback" && activeBranch?.rewindSrc && rewindStage === "branch" && (
        <video
          className={`scene-media rewind-video ${branchRewindVisible ? "is-visible" : ""}`}
          src={activeBranch.rewindSrc}
          muted
          playsInline
          preload="auto"
          onCanPlay={(event) => {
            event.currentTarget.playbackRate = REWIND_RATE;
            event.currentTarget.play().catch(() => undefined);
          }}
          onPlaying={() => setBranchRewindVisible(true)}
          onEnded={finishBranchRewind}
        />
      )}

      {story.sceneRewindSrc && (rewindStage === "bridge" || rewindStage === "opening") && (
        <video
          ref={openingRewindVideoRef}
          className={`scene-media rewind-video ${openingRewindVisible ? "is-visible" : ""}`}
          src={story.sceneRewindSrc}
          muted
          playsInline
          preload="auto"
          onCanPlay={(event) => {
            setOpeningBufferReady(true);
            if (rewindStage === "opening") {
              event.currentTarget.playbackRate = REWIND_RATE;
              event.currentTarget.play().catch(() => undefined);
            }
          }}
          onPlaying={() => setOpeningRewindVisible(true)}
          onEnded={finishOpeningRewind}
        />
      )}

      {phase === "playback" && activeBranch?.screenOverlay && rewindStage === "idle" && (
        <ScreenReplacement
          config={activeBranch.screenOverlay}
          stageRef={stageRef}
          videoRef={videoRef}
          fallbackTime={elapsed}
        />
      )}

      <div className="cinema-vignette" aria-hidden="true" />
      <div className="top-shade" aria-hidden="true" />

      {(phase !== "playback" || rewindStage === "bridge") && (
        <header className="scene-header">
          <p className="scene-label">
            {rewindStage === "bridge" ? PHASE_LABELS.input : PHASE_LABELS[phase]}
          </p>
          <p className="story-mark">
            <span>{story.title}</span>
            <span className="story-mark-divider" aria-hidden="true" />
            <span>{story.episode}</span>
          </p>
        </header>
      )}

      {phase === "observe" && (
        <button className="observe-cue" type="button" onClick={skipOpening}>
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

      {rewindStage === "bridge" && (
        <section className="interpretation-panel rewind-bridge-panel" aria-label="剛才的解讀">
          <p className="loop-note">剛才，你在這裡改變了故事</p>
          <p className="rewind-bridge-prompt">{story.openingPrompt}</p>
          <div className="input-shell">
            <input value={lastInput} readOnly aria-label="玩家剛才輸入的解讀" />
            <button type="button" disabled aria-hidden="true">
              <span>↶</span>
            </button>
          </div>
          <p className="input-hint rewind-buffer-status">
            {openingBufferReady ? "更早的畫面已就緒…" : "正在準備更早的畫面…"}
          </p>
        </section>
      )}

      {phase === "matching" && (
        <section className="matching-state" role="status" aria-live="polite">
          <span className="matching-spinner" aria-hidden="true" />
          <h1>正在理解你的想法…</h1>
          <p>「{lastInput}」</p>
          <small>正在尋找最接近的故事分支</small>
        </section>
      )}

      {phase === "playback" && rewindStage === "idle" && activeBranch && isFallbackCut && (
        <section className="story-continuation" aria-label="故事正在繼續">
          <p className="branch-subtitle">{activeBranch.previewSubtitle}</p>
        </section>
      )}

      {phase === "playback" && rewindStage === "idle" && playbackBlocked && !videoFailed && (
        <button className="continue-story" type="button" onClick={continuePlayback}>
          <span>繼續故事</span>
          <small>點一下繼續</small>
        </button>
      )}

      {phase === "playback" && activeBranch && !isPlaying && rewindStage === "idle" && (
        <button className="rewind-story" type="button" onClick={startRewind}>
          <span className="rewind-symbol" aria-hidden="true">↶</span>
          <strong>倒帶</strong>
          <small>回到故事開始，換一種解讀</small>
        </button>
      )}

      {phase === "playback" && (rewindStage === "branch" || rewindStage === "opening") && (
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
