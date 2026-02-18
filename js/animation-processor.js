// Fade animation processor for hologram format
class AnimationProcessor {
    static isLikelyLowMemoryDevice() {
        const ua = navigator.userAgent || '';
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const lowRam = navigator.deviceMemory && navigator.deviceMemory <= 4;
        return isIOS || !!lowRam;
    }

    static buildAlphaSequence(totalFrames, direction) {
        const values = [];
        for (let i = 0; i < totalFrames; i++) {
            values.push(totalFrames <= 1 ? 1 : i / (totalFrames - 1));
        }
        if (direction === 'reverse') {
            values.reverse();
        } else if (direction === 'pingpong' && values.length > 2) {
            values.push(...values.slice(1, -1).reverse());
        }
        return values;
    }

    /**
     * Generate hologram-formatted fade frames between two images.
     */
    static generateFadeAnimation(imageA, imageB, options = {}) {
        const lowMemoryMode = this.isLikelyLowMemoryDevice();
        const durationSeconds = Number(options.durationSeconds || 2);
        const requestedFps = Number(options.fps || 24);
        const fps = lowMemoryMode ? Math.min(requestedFps, 16) : requestedFps;
        const direction = options.direction || 'pingpong';
        const maxFrames = lowMemoryMode ? 48 : 160;
        const totalFrames = Math.max(2, Math.min(maxFrames, Math.round(durationSeconds * fps)));
        const alphaValues = this.buildAlphaSequence(totalFrames, direction);
        const frames = [];

        for (const alpha of alphaValues) {
            const source = this.createBlendedFrame(imageA, imageB, alpha, lowMemoryMode);
            const hologram = ImageProcessor.formatForHologram(source);
            frames.push(hologram);
            // Hint GC quickly on Safari by dropping backing store.
            source.width = 1;
            source.height = 1;
        }

        return frames;
    }

    /**
     * Create one blended source frame (before hologram formatting).
     */
    static createBlendedFrame(imageA, imageB, alphaB, lowMemoryMode = false) {
        const width = Math.max(imageA.width, imageB.width);
        const height = Math.max(imageA.height, imageB.height);
        const maxDim = lowMemoryMode ? 1024 : 1800;
        const scaleDown = Math.min(1, maxDim / Math.max(width, height));
        const targetWidth = Math.max(2, Math.round(width * scaleDown));
        const targetHeight = Math.max(2, Math.round(height * scaleDown));
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw A with inverse opacity, then B with direct opacity.
        const aOpacity = 1 - alphaB;
        if (aOpacity > 0) {
            ctx.globalAlpha = aOpacity;
            this.drawCoverImage(ctx, imageA, targetWidth, targetHeight);
        }
        if (alphaB > 0) {
            ctx.globalAlpha = alphaB;
            this.drawCoverImage(ctx, imageB, targetWidth, targetHeight);
        }
        ctx.globalAlpha = 1;

        return canvas;
    }

    static drawCoverImage(ctx, image, width, height) {
        const scale = Math.max(width / image.width, height / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const dx = (width - drawWidth) / 2;
        const dy = (height - drawHeight) / 2;
        ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
    }

    /**
     * Export animation frames as video using MediaRecorder + canvas stream.
     */
    static exportAsVideo(frames, fps = 24, onProgress = null) {
        return VideoProcessor.encodeCanvasFramesToVideo(frames, fps, onProgress);
    }

    /**
     * Export animation frames as animated GIF using gif.js.
     */
    static exportAsGIF(frames, fps = 24, onProgress = null) {
        return new Promise((resolve, reject) => {
            if (!window.GIF) {
                reject(new Error('gif.js library is not loaded.'));
                return;
            }
            if (!frames || !frames.length) {
                reject(new Error('No frames to export.'));
                return;
            }

            const frameDelay = Math.max(20, Math.round(1000 / Math.max(1, fps)));
            const gif = new GIF({
                workers: 2,
                quality: 10,
                workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js',
                width: frames[0].width,
                height: frames[0].height
            });

            for (const frame of frames) {
                gif.addFrame(frame, { delay: frameDelay, copy: true });
            }

            gif.on('finished', (blob) => resolve(blob));
            gif.on('abort', () => reject(new Error('GIF export aborted.')));
            gif.on('progress', (ratio) => {
                if (typeof onProgress === 'function') {
                    onProgress(Math.max(0, Math.min(100, Math.round(ratio * 100))));
                }
            });
            gif.render();
        });
    }
}
