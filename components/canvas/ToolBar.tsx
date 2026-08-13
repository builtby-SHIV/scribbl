"use client";

import React, { useState } from 'react'
import { DrawingEngine } from '@/lib/drawingcanvas/DrawingEngine';
import { Brush, PaintBucket, Trash2 } from 'lucide-react';
import { useGameStore } from '@/app/providers/game-store-provider';
import { socket } from '@/app/socket';
import { DrawEventPayload, type Tool } from '@/lib/types/types';

type ToolbarProps = {
    engineRef: React.RefObject<DrawingEngine | null>;
};

const ToolBar = ({ engineRef }: ToolbarProps) => {
    const { sendBrushEvent } = useGameStore((state) => state.actions);

    const [size, setSize] = useState(3);
    const [color, setColor] = useState("#000000");
    const [tool, setTool] = useState<Tool>("brush");

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextColor = e.target.value;

        if (engineRef.current)
            engineRef.current.color = nextColor;

        setColor(nextColor);
        if (tool === "brush") {
            engineRef.current?.setBrush(nextColor, size);
            sendBrushEvent({type: "setbrush", color: nextColor, size});
        }
        else{
        }
            // call function for paint bucket and ws event for the same
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextSize = Number.parseInt(e.target.value, 10);
        setSize(nextSize);
        if (tool === "brush") {
            engineRef.current?.setBrush(color, nextSize);
            sendBrushEvent({type: "setbrush", color, size: nextSize});
        }
    };

    const brushSelected = () => {
        setTool("brush")
        if (engineRef.current) {
            engineRef.current.setBrush(color, size);
            engineRef.current.tool = "brush";
        }
        sendBrushEvent({type: "setbrush", color, size});
    };

    const paintBucketSelected = () => {
        setTool("bucket");
        if (engineRef.current) {
            engineRef.current.tool = "bucket";
            engineRef.current.color = color;
        }
    }

    return (
        <div className="flex h-full w-full items-center justify-center gap-6 rounded-lg border border-border/50 bg-muted/20 px-4 py-2">
            <input 
                type="color" 
                value={color}
                onChange={handleColorChange}
                className="size-10 cursor-pointer rounded-md border border-border bg-transparent"
            />
            <input 
                type="range" 
                min="1" 
                max="100" 
                value={size}
                onChange={handleSizeChange}
                className="w-32 cursor-pointer accent-primary"
            />
            <button
                type="button"
                onClick={brushSelected}
                className={`surface-btn flex size-10 items-center justify-center cursor-pointer transition-colors`}
            >
                <Brush className={`size-4 ${tool === "brush" ? "text-yellow-400": ""}`} />
            </button>
            <button
                type="button"
                onClick={paintBucketSelected}
                className={`surface-btn flex size-10 items-center justify-center cursor-pointer `}
            >
                <PaintBucket className={`size-4 ${tool === "bucket" ? "text-yellow-400": ""}`} />
            </button>
            <button
                type="button"
                onClick={() => {engineRef.current?.clear(); socket.emit("draw-event", {type: "clear"})}}
                className="surface-btn flex size-10 items-center justify-center cursor-pointer"
            >
                <Trash2 className="size-4" />
            </button>
        </div>
    )
}

export default ToolBar
