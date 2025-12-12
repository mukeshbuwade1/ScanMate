import { useCallback } from 'react';
import { runOnJS } from 'react-native-reanimated';
import type { Frame } from 'react-native-vision-camera';
import { useFrameProcessor } from 'react-native-vision-camera';

export type EdgePoint = { x: number; y: number };

export type EdgeBox = {
  top: number;
  left: number;
  width: number;
  height: number;
  confidence?: number;
  points?: EdgePoint[];
  source: 'fp' | 'fallback';
};

type FrameProcessorEdgeResult = {
  top: number;
  left: number;
  width: number;
  height: number;
  confidence?: number;
  points?: EdgePoint[];
};

// Declaration for the frame processor plugin function that should be provided natively.
// eslint-disable-next-line no-var
declare var __scanmateDetectEdges: (frame: Frame) => FrameProcessorEdgeResult | null;

const fallbackFromFrame = (frame: Frame): EdgeBox => {
  'worklet';
  // Basic centered rectangle taking most of the frame when real detection is unavailable.
  const marginX = frame.width * 0.08;
  const marginY = frame.height * 0.1;
  return {
    top: marginY,
    left: marginX,
    width: frame.width - marginX * 2,
    height: frame.height - marginY * 2,
    source: 'fallback',
    confidence: 0.2,
  };
};

export const useEdgeFrameProcessor = (onEdges: (box: EdgeBox | null) => void) => {
  return useFrameProcessor((frame) => {
    'worklet';
    try {
      const result = typeof __scanmateDetectEdges === 'function' ? __scanmateDetectEdges(frame) : null;
      if (result) {
        runOnJS(onEdges)({
          ...result,
          source: 'fp',
        });
        return;
      }
    } catch (err) {
      // fall through to fallback
      console.error('Edge FP error', err);
    }
    const fallbackBox = fallbackFromFrame(frame);
    runOnJS(onEdges)(fallbackBox);
  }, [onEdges]);
};

export const normalizeBox = (
  box: EdgeBox,
  viewWidth: number,
  viewHeight: number,
  frameWidth: number,
  frameHeight: number,
): EdgeBox => {
  // Scales frame coordinates to view coordinates.
  const scaleX = viewWidth / frameWidth;
  const scaleY = viewHeight / frameHeight;
  return {
    ...box,
    top: box.top * scaleY,
    left: box.left * scaleX,
    width: box.width * scaleX,
    height: box.height * scaleY,
    points: box.points?.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY })),
  };
};



