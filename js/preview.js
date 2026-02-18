// Preview functionality
class Preview {
    static animationHandle = null;
    static lastAnimatedFrames = [];
    static lastAnimatedFps = 24;
    static lastAnimatedLoop = true;

    static showPreview(canvas) {
        this.stopAnimation();
        const previewCanvas = document.getElementById('preview-canvas');
        const ctx = previewCanvas.getContext('2d');
        
        // Calculate display size (max 800px width)
        const maxWidth = 800;
        const scale = Math.min(maxWidth / canvas.width, maxWidth / canvas.height, 1);
        
        previewCanvas.width = canvas.width * scale;
        previewCanvas.height = canvas.height * scale;
        
        // Draw with scaling
        ctx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);

        // Guide lines through center for cross layout (preview only; export has no guides)
        this.drawCrossGuides(ctx, previewCanvas.width, previewCanvas.height);
    }

    static showAnimatedPreview(frames, fps = 24, loop = true) {
        this.stopAnimation();
        if (!frames || !frames.length) return;

        this.lastAnimatedFrames = frames;
        this.lastAnimatedFps = fps;
        this.lastAnimatedLoop = loop;

        const previewCanvas = document.getElementById('preview-canvas');
        const ctx = previewCanvas.getContext('2d');
        const first = frames[0];
        const maxWidth = 800;
        const scale = Math.min(maxWidth / first.width, maxWidth / first.height, 1);
        previewCanvas.width = Math.round(first.width * scale);
        previewCanvas.height = Math.round(first.height * scale);

        let frameIndex = 0;
        const frameDelay = 1000 / Math.max(1, fps);
        let lastTime = performance.now();

        const drawFrame = (ts) => {
            if (ts - lastTime >= frameDelay) {
                ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                const frame = frames[frameIndex];
                ctx.drawImage(frame, 0, 0, previewCanvas.width, previewCanvas.height);
                this.drawCrossGuides(ctx, previewCanvas.width, previewCanvas.height);
                frameIndex += 1;
                if (frameIndex >= frames.length) {
                    if (loop) {
                        frameIndex = 0;
                    } else {
                        this.animationHandle = null;
                        return;
                    }
                }
                lastTime = ts;
            }
            this.animationHandle = requestAnimationFrame(drawFrame);
        };

        this.animationHandle = requestAnimationFrame(drawFrame);
    }

    static stopAnimation() {
        if (this.animationHandle) {
            cancelAnimationFrame(this.animationHandle);
            this.animationHandle = null;
        }
    }

    /**
     * Draw cross through center to show TOP/RIGHT/BOTTOM/LEFT (preview only).
     */
    static drawCrossGuides(ctx, width, height) {
        const cx = width / 2;
        const cy = height / 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}
