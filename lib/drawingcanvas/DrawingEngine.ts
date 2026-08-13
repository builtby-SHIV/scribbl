import { Socket } from "socket.io-client";
import { SmoothBrush } from "./SmoothBrush";
import { hexToRgb } from "../utils";
import type { Tool } from "../types/types";

export class DrawingEngine {
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D | null;
    public isDrawing: boolean;
    public smoothBrush: SmoothBrush;
    public socket: Socket;
    public inputEnabled: boolean;
    public color: string;
    public tool: Tool;

    private onMouseUp!: () => void;
    private onMouseOut!: () => void;
    private onMouseDown!: (e: MouseEvent) => void;
    private onMouseMove!: (e: MouseEvent) => void;

    private onTouchEnd!: () => void;
    private onTouchMove!: (e: TouchEvent) => void;
    private onTouchStart!: (e: TouchEvent) => void;

    private onClick!: (e: MouseEvent) => void;

    constructor(canvas: HTMLCanvasElement, socket: Socket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.isDrawing = false;
        this.inputEnabled = false;
        this.socket = socket;
        this.color = "";
        this.tool = "brush";
        this.smoothBrush = new SmoothBrush(canvas);

        this.setupEventListeners();
        this.configureContext();
    }

    configureContext() {
        if (!this.ctx) 
            return;

        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.imageSmoothingEnabled = false;

        if (this.smoothBrush.ctx) {
            this.smoothBrush.ctx.lineCap = "round";
            this.smoothBrush.ctx.lineJoin = "round";
            this.smoothBrush.ctx.imageSmoothingEnabled = false;
        }
    }

    setupEventListeners() {
        this.onMouseDown = (e) => {
            if (!this.inputEnabled || this.tool !== "brush") 
                return;
            const { x, y } = this.getCoordinates(e);
            this.startDrawing(x, y);
            this.socket.emit("draw-event", {type: "mousedown", x, y});
        }
        this.onMouseMove = (e) => {
            if ((!this.inputEnabled && !this.isDrawing) || this.tool !== "brush") 
                return;
            const { x, y } = this.getCoordinates(e);
            this.draw(x, y);
            this.socket.emit("draw-event", {type: "mousemove", x, y});
        }
        this.onMouseUp = () => {
            if (!this.inputEnabled || this.tool !== "brush") 
                return;
            this.stopDrawing();
            this.socket.emit("draw-event", {type: "mouseup"});
        }
        this.onMouseOut = () => {
            if (!this.inputEnabled  || this.tool !== "brush") 
                return;
            this.stopDrawing();
            this.socket.emit("draw-event", {type: "mouseout"});
        }
        this.onClick = (e) => {
            if (!this.inputEnabled || this.tool !== "bucket")
                return;
            const { x, y } = this.getCoordinates(e);
            const {r, g, b} = hexToRgb(this.color);
            const dpr = this.canvas.width / this.canvas.getBoundingClientRect().width;
            const X = Math.min(this.canvas.width - 1, Math.max(0, Math.floor(x * dpr)));
            const Y = Math.min(this.canvas.height - 1, Math.max(0, Math.floor(y * dpr)));
            this.fillColor({X, Y}, {r, g, b});
        }

        // this.onTouchStart = (e) => {
        //     e.preventDefault();
        //     this.startDrawing(e.touches[0]);
        // };
        // this.onTouchMove = (e) => {
        //     e.preventDefault();
        //     this.draw(e.touches[0]);
        // };
        this.onTouchEnd = () => this.stopDrawing();

        this.canvas.addEventListener("mousedown", this.onMouseDown);
        this.canvas.addEventListener("mousemove", this.onMouseMove);
        this.canvas.addEventListener("mouseup", this.onMouseUp);
        this.canvas.addEventListener("mouseout", this.onMouseOut);
        this.canvas.addEventListener("click", this.onClick);

        this.canvas.addEventListener("touchstart", this.onTouchStart);
        this.canvas.addEventListener("touchmove", this.onTouchMove);
        this.canvas.addEventListener("touchend", this.onTouchEnd);
    }

    invertInputEnabled (val: boolean) {
        this.inputEnabled = val;
    }

    destroy () {
        this.canvas.removeEventListener("mousedown", this.onMouseDown);
        this.canvas.removeEventListener("mousemove", this.onMouseMove);
        this.canvas.removeEventListener("mouseup", this.onMouseUp);
        this.canvas.removeEventListener("mouseout", this.onMouseOut);
        this.canvas.removeEventListener("click", this.onClick);

        this.canvas.removeEventListener("touchstart", this.onTouchStart);
        this.canvas.removeEventListener("touchmove", this.onTouchMove);
        this.canvas.removeEventListener("touchend", this.onTouchEnd);
    }

    getCoordinates (e: MouseEvent | Touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    startDrawing (x: number, y: number) {
        this.isDrawing = true;

        // Start a new path
        if (!this.ctx) 
            return;

        this.smoothBrush.addPoint(x, y);
        this.smoothBrush.reset();
    }

    draw (x: number, y: number) {
        if (!this.isDrawing) 
            return;
        if (!this.ctx) 
            return;

        this.smoothBrush.addPoint(x, y);
    }

    stopDrawing () {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.smoothBrush.reset();
        }
    }

    fillColor (coords: { X: number, Y: number }, color: {r: number, g: number, b: number}) {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const colorLayer = this.ctx?.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const worker = new Worker(new URL("../workers/worker.ts", import.meta.url));

        worker.postMessage({
            coords,
            color,
            canvasHeight,
            canvasWidth,
            colorLayer: colorLayer?.data.buffer
        }, colorLayer? [colorLayer.data.buffer] : []);

        worker.onmessage = (event: MessageEvent<{ colorLayer: ArrayBuffer }>) => {
            const filledArray = new Uint8ClampedArray(event.data.colorLayer);
            const filledImageData = new ImageData(filledArray as unknown as ImageDataArray, canvasWidth, canvasHeight);
            this.ctx?.putImageData(filledImageData, 0, 0);
            worker.terminate();
        };
    }

    setBrush (color: string, size: number, opacity = 1) {
        if (this.smoothBrush.ctx) {
            this.smoothBrush.ctx.strokeStyle = color;
            this.smoothBrush.ctx.lineWidth = size;
            this.smoothBrush.ctx.globalAlpha = opacity;
        }
    }

    clear () {
        if (!this.ctx) 
            return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}