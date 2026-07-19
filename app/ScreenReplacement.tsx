"use client";

import { RefObject, useEffect, useRef } from "react";

export type Point = [number, number];
export type Quad = [Point, Point, Point, Point];

export type ScreenOverlayKeyframe = {
  at: number;
  corners: Quad;
};

export type ScreenOverlayConfig = {
  contentSrc: string;
  contentSize: [number, number];
  videoSize: [number, number];
  opacity?: number;
  keyframes: ScreenOverlayKeyframe[];
};

type ScreenReplacementProps = {
  config: ScreenOverlayConfig;
  stageRef: RefObject<HTMLElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  fallbackTime: number;
};

function interpolatePoint(from: Point, to: Point, progress: number): Point {
  return [from[0] + (to[0] - from[0]) * progress, from[1] + (to[1] - from[1]) * progress];
}

export function interpolateQuad(keyframes: ScreenOverlayKeyframe[], time: number): Quad | null {
  if (!keyframes.length) return null;
  const ordered = [...keyframes].sort((a, b) => a.at - b.at);
  if (time <= ordered[0].at) return ordered[0].corners;
  if (time >= ordered[ordered.length - 1].at) return ordered[ordered.length - 1].corners;

  const nextIndex = ordered.findIndex((keyframe) => keyframe.at >= time);
  const previous = ordered[nextIndex - 1];
  const next = ordered[nextIndex];
  const duration = Math.max(0.0001, next.at - previous.at);
  const progress = (time - previous.at) / duration;

  return previous.corners.map((point, index) =>
    interpolatePoint(point, next.corners[index], progress),
  ) as Quad;
}

function solveLinearSystem(matrix: number[][], values: number[]) {
  const size = values.length;
  const augmented = matrix.map((row, index) => [...row, values[index]]);

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }

    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column];
    if (Math.abs(divisor) < 1e-10) return null;

    for (let index = column; index <= size; index += 1) augmented[column][index] /= divisor;

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let index = column; index <= size; index += 1) {
        augmented[row][index] -= factor * augmented[column][index];
      }
    }
  }

  return augmented.map((row) => row[size]);
}

export function perspectiveMatrix(contentSize: [number, number], destination: Quad) {
  const [width, height] = contentSize;
  const source: Quad = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  const equations: number[][] = [];
  const values: number[] = [];

  for (let index = 0; index < 4; index += 1) {
    const [x, y] = source[index];
    const [targetX, targetY] = destination[index];
    equations.push([x, y, 1, 0, 0, 0, -x * targetX, -y * targetX]);
    values.push(targetX);
    equations.push([0, 0, 0, x, y, 1, -x * targetY, -y * targetY]);
    values.push(targetY);
  }

  const homography = solveLinearSystem(equations, values);
  if (!homography) return "none";
  const [h0, h1, h2, h3, h4, h5, h6, h7] = homography;

  return `matrix3d(${h0},${h3},0,${h6},${h1},${h4},0,${h7},0,0,1,0,${h2},${h5},0,1)`;
}

function fitVideoPoint(point: Point, stageSize: [number, number], videoSize: [number, number]): Point {
  const [stageWidth, stageHeight] = stageSize;
  const [videoWidth, videoHeight] = videoSize;
  const scale = Math.max(stageWidth / videoWidth, stageHeight / videoHeight);
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;
  const offsetX = (stageWidth - renderedWidth) / 2;
  const offsetY = (stageHeight - renderedHeight) / 2;

  return [offsetX + point[0] * renderedWidth, offsetY + point[1] * renderedHeight];
}

export function ScreenReplacement({
  config,
  stageRef,
  videoRef,
  fallbackTime,
}: ScreenReplacementProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const fallbackTimeRef = useRef(fallbackTime);

  useEffect(() => {
    fallbackTimeRef.current = fallbackTime;
  }, [fallbackTime]);

  useEffect(() => {
    let animationFrame = 0;

    const update = () => {
      const stage = stageRef.current;
      const overlay = overlayRef.current;
      if (stage && overlay) {
        const bounds = stage.getBoundingClientRect();
        const time = videoRef.current?.currentTime ?? fallbackTimeRef.current;
        const normalizedQuad = interpolateQuad(config.keyframes, time);
        if (normalizedQuad) {
          const destination = normalizedQuad.map((point) =>
            fitVideoPoint(point, [bounds.width, bounds.height], config.videoSize),
          ) as Quad;
          overlay.style.transform = perspectiveMatrix(config.contentSize, destination);
          overlay.style.visibility = "visible";
        }
      }
      animationFrame = window.requestAnimationFrame(update);
    };

    animationFrame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [config, stageRef, videoRef]);

  return (
    <div
      ref={overlayRef}
      className="screen-replacement"
      style={{
        width: config.contentSize[0],
        height: config.contentSize[1],
        opacity: config.opacity ?? 1,
      }}
      aria-hidden="true"
    >
      <img src={config.contentSrc} alt="" />
    </div>
  );
}
