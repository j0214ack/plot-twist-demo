"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScreenReplacement, type ScreenOverlayConfig } from "./ScreenReplacement";

type Phase = "observe" | "input" | "matching" | "echo" | "playback" | "return";
type RewindStage = "idle" | "branch" | "bridge" | "opening";

type CinematicMessageOverlayConfig = {
  sender: string;
  messages: string[];
  meta: string;
  tone?: "neutral" | "hostile" | "caring";
  startSec?: number;
  endSec?: number;
};

type BranchPriming = {
  innerNarration: string;
  nextAction: string;
};

type VideoNarrationCue = {
  startSec: number;
  endSec: number;
  label: string;
  text: string;
  tone?: "neutral" | "hostile" | "caring";
};

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
  messageOverlay?: CinematicMessageOverlayConfig | null;
  priming?: BranchPriming | null;
  videoNarration?: VideoNarrationCue[];
};

type StoryConfig = {
  id: string;
  title: string;
  episode: string;
  defaultBranchId?: string;
  sceneImage: string;
  sceneVideoSrc?: string | null;
  sceneRewindSrc?: string | null;
  sceneMessageOverlay?: CinematicMessageOverlayConfig | null;
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

const MAX_INTERPRETATION_LENGTH = 100;

const DEFAULT_STORY: StoryConfig = {
  id: "read-0942-mvp",
  title: "已讀 9:42",
  episode: "同一個晚上",
  defaultBranchId: "neutral",
  sceneImage: "/assets/shots/S1.jpg",
  sceneVideoSrc: "/videos/read-0942-opening-v4.mp4",
  sceneRewindSrc: "/videos/read-0942-opening-v4-reverse.mp4",
  sceneMessageOverlay: {
    sender: "MIRA → YUN",
    messages: ["你到家了嗎？", "方便的話，回我一下。"],
    meta: "已讀 · 21:42",
    tone: "neutral",
    startSec: 0.65,
  },
  openingPrompt: "他讀了訊息，卻沒有回。你覺得這代表什麼？",
  returnPrompt: "同一個已讀。這一次，你怎麼解讀？",
  branches: [
    {
      id: "hostile",
      title: "他根本不在乎我",
      matchHint: "玩家把已讀不回解讀為冷淡、忽視、拒絕、敷衍或帶有敵意。",
      keywords: ["不在乎", "故意", "敷衍", "討厭", "冷淡", "生氣", "不想回", "已讀不回", "拒絕", "算了"],
      videoSrc: "/videos/read-0942-hostile-v4.mp4",
      rewindSrc: "/videos/read-0942-hostile-v4-reverse.mp4",
      posterSrc: "/assets/shots/S3-H.jpg",
      previewSubtitle: "她把他的沉默讀成拒絕；同一晚，醫院裡的他收到冷淡訊息。三週後，兩人在街口擦身而過。",
      interpretationEcho: "你把他的沉默讀成拒絕：他看見了，卻選擇不在乎。",
      fallbackDurationSec: 40,
      screenOverlay: null,
      messageOverlay: {
        sender: "MIRA → YUN",
        messages: ["算了，當我沒說。"],
        meta: "已送出 · 22:03",
        tone: "hostile",
        startSec: 0.65,
        endSec: 7.85,
      },
      priming: {
        innerNarration:
          "不確定讓 Mira 很難受。為了不再等，她把受傷翻成生氣，也把猜測當成答案。先推開對方，至少感覺比較有尊嚴。",
        nextAction: "她會刪掉原本想問的話，只留下：「算了，當我沒說。」",
      },
      videoNarration: [
        {
          startSec: 0.65,
          endSec: 7.85,
          label: "MIRA · 心理活動",
          text: "「既然你不在乎，我也不要再顯得那麼在乎。」受傷被她包成一句冷淡的話。",
          tone: "hostile",
        },
        {
          startSec: 8.2,
          endSec: 23.8,
          label: "YUN · 另一端",
          text: "她不知道的是，Yun 正在醫院陪媽媽。而他收到的，是那句「算了，當我沒說」。",
          tone: "neutral",
        },
        {
          startSec: 32.2,
          endSec: 39.8,
          label: "三週後",
          text: "之後，什麼事都沒有發生。你們只是慢慢地，不講話了。",
          tone: "hostile",
        },
      ],
    },
    {
      id: "caring",
      title: "會不會是他那邊出事了",
      matchHint: "玩家暫緩負面判斷，擔心對方遇到事情、正在忙、需要照顧或需要幫忙。",
      keywords: ["出事", "還好嗎", "擔心", "忙", "醫院", "原因", "遇到事情", "照顧", "需要幫忙", "沒事吧"],
      videoSrc: "/videos/read-0942-caring-v4.mp4",
      rewindSrc: "/videos/read-0942-caring-v4-reverse.mp4",
      posterSrc: "/assets/shots/S3-C.jpg",
      previewSubtitle: "她沒有急著定罪，而是先問了一句：你還好嗎？鏡頭轉向醫院的走廊。",
      interpretationEcho: "你沒有急著定罪；你懷疑，沉默也許是他正在求救。",
      fallbackDurationSec: 50,
      screenOverlay: null,
      messageOverlay: {
        sender: "MIRA → YUN",
        messages: ["不急著回。", "你還好嗎？"],
        meta: "已送出 · 22:03",
        tone: "caring",
        startSec: 0.65,
        endSec: 7.85,
      },
      priming: {
        innerNarration:
          "Mira 還是害怕自己被忽略。但她提醒自己：沉默也可能來自對方的處境。她不必先知道真相，才能先留下一點關心。",
        nextAction: "她會把追問改成一句沒有期限的訊息：「不急著回。你還好嗎？」",
      },
      videoNarration: [
        {
          startSec: 0.65,
          endSec: 7.85,
          label: "MIRA · 心理活動",
          text: "「也許不是不在乎。先問一句，至少別讓猜測替我做決定。」她把害怕留在原地，選擇先關心。",
          tone: "caring",
        },
        {
          startSec: 8.2,
          endSec: 25.8,
          label: "YUN · 另一端",
          text: "她不知道的是，Yun 正在醫院陪媽媽。這次他收到的，不是指責，而是一句「你還好嗎？」",
          tone: "neutral",
        },
        {
          startSec: 26.2,
          endSec: 33.8,
          label: "MIRA · 決定",
          text: "電話響起時，她沒有再躲。聽見醫院走廊的聲音，她決定現在就去找他。",
          tone: "caring",
        },
        {
          startSec: 34.2,
          endSec: 41.8,
          label: "YUN · 鬆開",
          text: "Yun 原本準備承受另一場失望。聽見她的聲音，他終於鬆開一直撐著的力氣。",
          tone: "caring",
        },
        {
          startSec: 42.2,
          endSec: 49.8,
          label: "同一個晚上",
          text: "她沒有解決所有問題，只是坐到他身邊。這一次，他不用一個人撐著。",
          tone: "caring",
        },
      ],
    },
    {
      id: "neutral",
      title: "我現在還不知道",
      matchHint: "玩家承認資訊不足，暫緩判斷，決定先等待、休息或把注意力帶回自己。",
      keywords: ["不知道", "不確定", "先等等", "等一下", "晚點", "可能只是忙", "先放著", "明天", "睡了", "別想太多"],
      videoSrc: "/videos/read-0942-neutral-v4.mp4",
      rewindSrc: "/videos/read-0942-neutral-v4-reverse.mp4",
      posterSrc: "/assets/shots/S3-N.jpg",
      previewSubtitle: "她承認自己還不知道答案，先放下手機。隔天早上，沉默終於有了原因。",
      interpretationEcho: "你沒有急著替沉默定義；你決定先讓答案留到明天。",
      fallbackDurationSec: 16,
      screenOverlay: null,
      messageOverlay: null,
      priming: {
        innerNarration:
          "Mira 還是覺得不舒服，但她承認自己現在不知道原因。她決定先把注意力帶回自己，不在資訊不足時替沉默下結論。",
        nextAction: "她不再追問，也不急著反擊；她把手機蓋下，去泡茶、讀書，讓答案留到明天。",
      },
      videoNarration: [
        {
          startSec: 0.65,
          endSec: 7.8,
          label: "MIRA · 心理活動",
          text: "「我現在還不知道發生了什麼。」她先把手機放下，讓今晚不必立刻有答案。",
          tone: "neutral",
        },
        {
          startSec: 8.2,
          endSec: 15.8,
          label: "隔天早上",
          text: "Yun 的訊息終於到了。沉默有了原因，而她昨晚沒有先讓猜測傷害彼此。",
          tone: "caring",
        },
      ],
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function CinematicMessageOverlay({
  config,
  context,
}: {
  config: CinematicMessageOverlayConfig;
  context: "opening" | "branch";
}) {
  return (
    <aside
      className={`cinematic-message-overlay message-context-${context} tone-${config.tone ?? "neutral"}`}
      aria-label={`${config.sender} 的手機訊息：${config.messages.join("；")}，${config.meta}`}
    >
      <p className="message-overlay-sender">{config.sender}</p>
      <div className="message-overlay-copy">
        {config.messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>
      <p className="message-overlay-meta">
        <span aria-hidden="true" />
        {config.meta}
      </p>
    </aside>
  );
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
  const [openingTime, setOpeningTime] = useState(0);
  const [branchTime, setBranchTime] = useState(0);
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
      setOpeningTime(0);
      setBranchTime(0);
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
        defaultBranchId: story.defaultBranchId,
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
          branchId:
            story.branches.find((branch) => branch.id === story.defaultBranchId)?.id ??
            story.branches[loopCount % story.branches.length].id,
          rationale: "Prototype fallback",
          echo:
            story.branches.find((branch) => branch.id === story.defaultBranchId)?.interpretationEcho ??
            story.branches[loopCount % story.branches.length].interpretationEcho ??
            "你從這份沉默裡，看見了另一個故事。",
          source: "fallback",
        }),
      );

    const [result] = await Promise.all([matchRequest, wait(MATCHING_MIN_DURATION_MS)]);
    const matchedBranch =
      story.branches.find((branch) => branch.id === result.branchId) ??
      story.branches.find((branch) => branch.id === story.defaultBranchId) ??
      story.branches[0];
    const nextEcho =
      result.echo?.trim() ||
      matchedBranch.interpretationEcho ||
      `你從眼前的沉默裡，看見了「${matchedBranch.title}」。`;

    setActiveBranch(matchedBranch);
    setInterpretationEcho(nextEcho);
    setElapsed(0);
    setBranchTime(0);
    setIsPlaying(true);
    setRewindStage("idle");
    setBranchVisible(false);
    setBranchRewindVisible(false);
    setOpeningRewindVisible(false);
    setVideoFailed(false);
    setPlaybackBlocked(false);
    setPhase("echo");
  };

  const prompt = phase === "return" ? story.returnPrompt : story.openingPrompt;
  const sceneImage = story.sceneImage;
  const continuePlayback = () => {
    videoRef.current?.play().then(() => setPlaybackBlocked(false)).catch(() => undefined);
  };
  const continueFromPriming = () => {
    setPhase("playback");
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
    setOpeningTime(target);
    openingVideo.currentTime = target;
  };

  const showBranchLayer =
    phase === "playback" &&
    Boolean(activeBranch) &&
    (rewindStage === "idle" || rewindStage === "branch");
  const openingMessageOverlay = story.sceneMessageOverlay;
  const showOpeningMessageOverlay =
    Boolean(openingMessageOverlay) &&
    rewindStage === "idle" &&
    (phase === "observe" || phase === "input" || phase === "return") &&
    (!story.sceneVideoSrc || openingTime >= (openingMessageOverlay?.startSec ?? 0));
  const branchMessageOverlay = activeBranch?.messageOverlay;
  const branchMessageTime = isFallbackCut ? elapsed : branchTime;
  const showBranchMessageOverlay =
    Boolean(branchMessageOverlay) &&
    phase === "playback" &&
    rewindStage === "idle" &&
    isPlaying &&
    branchMessageTime >= (branchMessageOverlay?.startSec ?? 0) &&
    branchMessageTime <= (branchMessageOverlay?.endSec ?? Number.POSITIVE_INFINITY);
  const activeVideoNarration = activeBranch?.videoNarration?.find(
    (cue) => branchMessageTime >= cue.startSec && branchMessageTime <= cue.endSec,
  );
  const showVideoNarration =
    Boolean(activeVideoNarration) &&
    phase === "playback" &&
    rewindStage === "idle" &&
    isPlaying;

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
          onTimeUpdate={(event) => setOpeningTime(event.currentTarget.currentTime)}
          onEnded={() => {
            if (rewindStage === "idle" && phase === "observe") showOpeningPrompt();
          }}
        />
      ) : (
        <img
          className="scene-media scene-base"
          src={sceneImage}
          alt="夜晚的臥室裡，Mira 獨自看著亮起的手機等待回覆"
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
            onTimeUpdate={(event) => setBranchTime(event.currentTarget.currentTime)}
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
            alt="Mira 在夜晚的臥室裡看著手機，故事即將因她的解讀分岔"
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

      {showOpeningMessageOverlay && openingMessageOverlay && (
        <CinematicMessageOverlay
          key={`opening-${loopCount}`}
          config={openingMessageOverlay}
          context="opening"
        />
      )}

      {showBranchMessageOverlay && branchMessageOverlay && (
        <CinematicMessageOverlay
          key={`branch-${activeBranch?.id}`}
          config={branchMessageOverlay}
          context="branch"
        />
      )}

      {showVideoNarration && activeVideoNarration && activeBranch && (
        <aside
          key={`${activeBranch.id}-${activeVideoNarration.startSec}`}
          className={`video-narration tone-${activeVideoNarration.tone ?? "neutral"}`}
          aria-live="polite"
        >
          <span>{activeVideoNarration.label}</span>
          <p>{activeVideoNarration.text}</p>
        </aside>
      )}

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
              maxLength={MAX_INTERPRETATION_LENGTH}
              aria-describedby="interpretation-hint interpretation-remaining"
              autoComplete="off"
              placeholder={phase === "return" ? "這一次，你看見了什麼？" : "輸入你的理解…"}
            />
            <button type="submit" disabled={!input.trim()} aria-label="送出你的解讀">
              <span aria-hidden="true">➤</span>
            </button>
          </div>
          <div className="input-meta">
            <p id="interpretation-hint" className="input-hint">
              沒有選項。說出你真正看見的故事。
            </p>
            <p id="interpretation-remaining" className="input-remaining" aria-live="polite">
              還可以寫 {MAX_INTERPRETATION_LENGTH - input.length} 字
            </p>
          </div>
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

      {phase === "echo" && interpretationEcho && activeBranch && (
        <section
          className="understanding-echo priming-page"
          aria-label="你的解讀與故事鋪墊"
        >
          <span>你是這樣理解的</span>
          <blockquote>{interpretationEcho}</blockquote>
          {activeBranch.priming && (
            <div className="priming-details">
              <article>
                <strong>心理活動</strong>
                <p>{activeBranch.priming.innerNarration}</p>
              </article>
              <article>
                <strong>接下來</strong>
                <p>{activeBranch.priming.nextAction}</p>
              </article>
            </div>
          )}
          <button className="priming-continue" type="button" onClick={continueFromPriming}>
            <span>看看這個解讀會帶來什麼</span>
            <span aria-hidden="true">→</span>
          </button>
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
