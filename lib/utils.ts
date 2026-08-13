import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { DrawEventPayload } from "./types/types"
import type React from "react";
import type { DrawingEngine } from "./drawingcanvas/DrawingEngine";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function canvasStrokes (payload: DrawEventPayload, engineRef: React.RefObject<DrawingEngine | null>) {
  switch (payload.type) {
    case "mousedown":
        engineRef.current?.startDrawing(payload.x, payload.y);
        break;
    case "mousemove":
        engineRef.current?.draw(payload.x, payload.y);
        break;
    case "mouseup":
        engineRef.current?.stopDrawing();
    case "mouseout":
        engineRef.current?.stopDrawing();
        break;
    case "setbrush":
        engineRef.current?.setBrush(payload.color, payload.size);
        break;
    case "clear":
        engineRef.current?.clear();
  }
}

export function hexToRgb(hex: string) {
  // Remove the hash if it exists
  let cleanHex = hex.replace('#', '');

  // If shorthand notation (e.g., "F00"), expand it to 6 digits ("FF0000")
  if (cleanHex.length === 3)
    cleanHex = cleanHex.split('').map(char => char + char).join('');

  // Parse the hex pairs into Base-10 integers
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return {r, g, b};
}