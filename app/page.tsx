"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScreenReplacement, type ScreenOverlayConfig } from "./ScreenReplacement";

type Phase = "observe" | "input" | "matching" | "echo" | "playback" | "return";
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
  interpretationEcho?: string;
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
  echo: string;
  source: "openai" | "fallback";
};

const DEFAULT_STORY: StoryConfig = {
  id: "read-0942-mvp",
  title: "已讀 9:42",
  episode: "同一個晚上",
  sceneImage: "/assets/read-0942-opening-poster.jpg",
  sceneVideoSrc: "/videos/read-0942-opening-s1.mp4",
  sceneRewindSrc: "/videos/read-0942-opening-s1-reverse.mp4",
  openingPrompt: "她讀了訊息，卻沒有回。你覺得這代表什麼？",
  returnPrompt: "同一個已讀。這一次，你怎麼解讀？",
  branches: [
    {
      id: "hostile",
      title: "她根本不在乎我",
      matchHint: "玩家把已讀不回解讀為冷淡、忽視、拒絕、敷衍或帶有敵意。",
      keywords: ["不在乎", "故意", "敷衍", "討厭", "冷淡", "生氣", "不想回", "已讀不回", "拒絕", "算了"],
      videoSrc: "/videos/read-0942-hostile-s3h-s2base.mp4",
      rewindSrc: "/videos/read-0942-hostile-s3h-s2base-reverse.mp4",
      posterSrc: "/assets/read-0942-hostile-poster.jpg",
      previewSubtitle: "她把沉默讀成拒絕，於是也用一句冷淡的話回應。鏡頭轉向醫院的走廊。",
      interpretationEcho: "你把她的沉默讀成拒絕：她看見了，卻選擇不在乎。",
      fallbackDurationSec: 15,
      screenOverlay: null,
    },
    {
      id: "caring",
      title: "會不會是她那邊出事了",
      matchHint: "玩家暫緩負面判斷，擔心對方遇到事情、正在忙、需要照顧或需要幫忙。",
      keywords: ["出事", "還好嗎", "擔心", "忙", "醫院", "原因", "遇到事情", "照顧", "需要幫忙", "沒事吧"],
      videoSrc: "/videos/read-0942-caring-s3c-s2base.mp4",
      rewindSrc: "/videos/read-0942-caring-s3c-s2base-reverse.mp4",
      posterSrc: "/assets/read-0942-caring-poster.jpg",
      previewSubtitle: "她沒有急著定罪，而是先問了一句：妳還好嗎？鏡頭轉向醫院的走廊。",
      interpretationEcho: "你沒有急著定罪；你懷疑，沉默也許是她正在求救。",
      fallbackDurationSec: 20,
      screenOverlay: null,
    },
  ],
};

const PHASE_LABELS: Record<Phase, string> = {
  observe: "Scene 1 — 場景呈現",
  input: "Scene 2 — 玩家輸入",
  matching: "Scene 3 — 理解中",
  echo: "Scene 4 — 故事回應",
  playback: "Scene 5 — 影片播放",
  return: "Scene 6 — 回到場景",
};

const REWIND_RATE = 16;
const BRIDGE_MIN_DURATION_MS = 900;
const MATCHING_MIN_DURATION_MS = 700;
const ECHO_DURATION_MS = 1800;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function useAmbientRoomTone() {
  useEffect(() => {
    let context: AudioContext | null = null;
    let roomTone: AudioBufferSourceNode | null = null;
    let hum: OscillatorNode | null = null;

    const removeStartListeners = () => {
      window.removeEventListener("pointerdown", startRoomTone);
      window.removeEventListener("keydown", startRoomTone);
    };

    const startRoomTone = () => {
      removeStartListeners();

      if (context) {
        void context.resume();
        return;
      }

      const AudioContextConstructor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return;

      context = new AudioContextConstructor();
      const durationSeconds = 3;
      const noiseBuffer = context.createBuffer(
        1,
        context.sampleRate * durationSeconds,
        context.sampleRate,
      );
      const samples = noiseBuffer.getChannelData(0);
      let lastSample = 0;

      for (let index = 0; index < samples.length; index += 1) {
        const whiteNoise = Math.random() * 2 - 1;
        lastSample = lastSample * 0.985 + whiteNoise * 0.015;
        samples[index] = lastSample;
      }

      roomTone = context.createBufferSource();
      roomTone.buffer = noiseBuffer;
      roomTone.loop = true;

      const highpass = context.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 70;

      const lowpass = context.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 520;

      const roomGain = context.createGain();
      roomGain.gain.value = 0.022;
      roomTone.connect(highpass).connect(lowpass).connect(roomGain).connect(context.destination);

      hum = context.createOscillator();
      hum.type = "sine";
      hum.frequency.value = 58;
      const humGain = context.createGain();
      humGain.gain.value = 0.004;
      hum.connect(humGain).connect(context.destination);

      roomTone.start();
      hum.start();
      void context.resume();
    };

    window.addEventListener("pointerdown", startRoomTone, { once: true });
    window.addEventListener("keydown", startRoomTone, { once: true });

    return () => {
      removeStartListeners();
      roomTone?.stop();
      hum?.stop();
      if (context) void context.close();
    };
  }, []);
}

export default function Home() {
  useAmbientRoomTone();

  const [story, setStory] = useState<StoryConfig>(DEFAULT_STORY);
  const [phase, setPhase] = useState<Phase>("observe");
  const [input, setInput] = useState("");
  const [lastInput, setLastInput] = useState("");
  const [interpretationEcho, setInterpretationEcho] = useState("");
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
  const stageRef = useRef<HTMLElement>(null);
  const openingVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const openingRewindVideoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const playerIdRef = useRef("");
  const mediaSources = useMemo(
    () =>
      Array.from(
        new Set(
          [
            story.sceneVideoSrc,
            story.sceneRewindSrc,
            ...story.branches.flatMap((branch) => [branch.videoSrc, branch.rewindSrc]),
          ].filter((source): source is string => Boolean(source)),
        ),
      ),
    [story],
  );

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
    playerIdRef.current = nextPlayerId;
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
    const progressTimer = window.setInterval(() => {
      setElapsed((current) => Math.min(fallbackDuration, current + 0.1));
    }, 100);
    const finishTimer = window.setTimeout(finishPlayback, fallbackDuration * 1000);
    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(finishTimer);
    };
  }, [fallbackDuration, finishPlayback, isFallbackCut, isPlaying, phase]);

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
    setInterpretationEcho("");
    setPhase("matching");

    const matchRequest = fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interpretation,
        playerId: playerIdRef.current,
        candidates: story.branches.map(({ id, title, matchHint, keywords, interpretationEcho }) => ({
          id,
          title,
          matchHint,
          keywords,
          interpretationEcho,
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
          echo:
            story.branches[loopCount % story.branches.length].interpretationEcho ??
            "你從這份沉默裡，看見了另一個故事。",
          source: "fallback",
        }),
      );

    const [result] = await Promise.all([matchRequest, wait(MATCHING_MIN_DURATION_MS)]);
    const matchedBranch =
      story.branches.find((branch) => branch.id === result.branchId) ?? story.branches[0];
    const nextEcho =
      result.echo?.trim() ||
      matchedBranch.interpretationEcho ||
      `你從眼前的沉默裡，看見了「${matchedBranch.title}」。`;

    setActiveBranch(matchedBranch);
    setInterpretationEcho(nextEcho);
    setElapsed(0);
    setIsPlaying(true);
    setRewindStage("idle");
    setBranchVisible(false);
    setBranchRewindVisible(false);
    setOpeningRewindVisible(false);
    setVideoFailed(false);
    setPlaybackBlocked(false);
    setPhase("echo");
    await wait(ECHO_DURATION_MS);
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
      className={`story-stage phase-${phase} ${loopCount > 0 ? "has-memory" : ""}`}
      aria-label={`${story.title}：${story.episode}`}
    >
      <div className="media-preload-rack" aria-hidden="true">
        {mediaSources.map((source) => (
          <video key={source} src={source} muted playsInline preload="auto" tabIndex={-1} />
        ))}
      </div>

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
          <span>{loopCount > 0 ? "你又回到了這一刻" : "觀察眼前的場景"}</span>
          <small>{loopCount > 0 ? "這一次，留意不同的細節" : "點一下繼續"}</small>
        </button>
      )}

      {phase === "observe" && loopCount > 0 && lastInput && (
        <aside className="loop-memory" aria-label="上一輪留下的記憶">
          <span>記憶殘響</span>
          <p>「{lastInput}」</p>
        </aside>
      )}

      {(phase === "input" || phase === "return") && (
        <form className="interpretation-panel" onSubmit={submitInterpretation}>
          {phase === "return" && activeBranch && (
            <p className="loop-note">
              上一輪，你說：「{lastInput}」
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
              placeholder={phase === "return" ? "這一次，你看見了什麼？" : "輸入你的理解…"}
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
          <small>讓這個解讀沉進眼前的場景</small>
        </section>
      )}

      {phase === "echo" && interpretationEcho && (
        <section className="understanding-echo" role="status" aria-live="polite">
          <span>你是這樣理解的</span>
          <blockquote>{interpretationEcho}</blockquote>
          <small>故事正在回應你的目光</small>
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
