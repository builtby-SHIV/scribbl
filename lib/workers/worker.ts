import type { WorkerInput } from "../types/types";

const ctx: DedicatedWorkerGlobalScope = self as any;

/** Per-channel tolerance for matching anti-aliased fringe pixels. */
const COLOR_TOLERANCE = 32;

ctx.onmessage = (event: MessageEvent<WorkerInput>) => {
  const { 
        coords,
        color,
        canvasHeight,
        canvasWidth,
        colorLayer, 
    } = event.data;
    
    const { X, Y } = coords;
    const { r, g, b } = color;
    const fillA = 255;
    const pixelStack = [[X, Y]];
    const clampedArray = new Uint8ClampedArray(colorLayer);
    const imageData = new ImageData(clampedArray as ImageDataArray, canvasWidth, canvasHeight);
    let newPos, x: number, y: number, pixelPos, reachLeft, reachRight, startR: number, startG: number, startB: number, startA: number;

    pixelPos = (Y * canvasWidth + X) * 4;
    if (imageData) {
        startR = imageData.data[pixelPos];	
        startG = imageData.data[pixelPos+1];	
        startB = imageData.data[pixelPos+2];
        startA = imageData.data[pixelPos+3];

        if (r === startR && g === startG && b === startB && fillA === startA) {
            ctx.postMessage({ colorLayer: imageData.data.buffer }, [imageData.data.buffer]);
            return;
        }
    }

    while(pixelStack.length) {
        newPos = pixelStack.pop();
        if (newPos) {
            x = newPos[0];
            y = newPos[1];
            pixelPos = (y*canvasWidth + x) * 4;

            while(y-- >= 0 && matchStartColor(pixelPos))
                pixelPos -= canvasWidth * 4;

            pixelPos += canvasWidth * 4;
            ++y;
            reachLeft = false;
            reachRight = false;
            while(y++ < canvasHeight-1 && matchStartColor(pixelPos))
            {
                colorPixel(pixelPos);

                if(x > 0) {
                    if(matchStartColor(pixelPos - 4)) {
                        if(!reachLeft) {
                            pixelStack.push([x - 1, y]);
                            reachLeft = true;
                        }
                    }
                    else if(reachLeft)
                        reachLeft = false;
                }
                
                if(x < canvasWidth-1) {
                    if(matchStartColor(pixelPos + 4))
                    {
                        if(!reachRight) {
                            pixelStack.push([x + 1, y]);
                            reachRight = true;
                        }
                    }
                    else if(reachRight)
                        reachRight = false;
                }
                        
                pixelPos += canvasWidth * 4;
            }
        }
    }
    
    function matchStartColor(pixelPos: number) {
        if (!imageData) return false;

        const pr = imageData.data[pixelPos];
        const pg = imageData.data[pixelPos + 1];
        const pb = imageData.data[pixelPos + 2];
        const pa = imageData.data[pixelPos + 3];

        return (
            Math.abs(pr - startR) <= COLOR_TOLERANCE &&
            Math.abs(pg - startG) <= COLOR_TOLERANCE &&
            Math.abs(pb - startB) <= COLOR_TOLERANCE &&
            Math.abs(pa - startA) <= COLOR_TOLERANCE
        );
    }

    function colorPixel(pixelPos: number) {
        if (imageData) {
            imageData.data[pixelPos] = r;
            imageData.data[pixelPos+1] = g;
            imageData.data[pixelPos+2] = b;
            imageData.data[pixelPos+3] = fillA;
        }
    }

    const bufferToTransfer = imageData.data.buffer;
    ctx.postMessage({ colorLayer: imageData.data.buffer }, [bufferToTransfer]);
};