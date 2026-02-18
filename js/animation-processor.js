// Fade animation processor for hologram format
class AnimationProcessor {
    /**
     * Generate hologram-formatted fade frames between two images.
     */
    static generateFadeAnimation(imageA, imageB, options = {}) {
        const durationSeconds = Number(options.durationSeconds || 2);
        const fps = Number(options.fps || 24);
        const direction = options.direction || 'pingpong';

        const totalFrames = Math.max(2, Math.round(durationSeconds * fps));
        const sourceFrames = [];

        for (let i = 0; i < totalFrames; i++) {
            const t = totalFrames <= 1 ? 1 : i / (totalFrames - 1);
            sourceFrames.push(this.createBlendedFrame(imageA, imageB, t));
        }

        if (direction === 'reverse') {
            sourceFrames.reverse();
        } else if (direction === 'pingpong' && sourceFrames.length > 2) {
            const backward = sourceFrames.slice(1, -1).reverse();
            sourceFrames.push(...backward);
        }

        return sourceFrames.map((frame) => ImageProcessor.formatForHologram(frame));
    }

    /**
     * Create one blended source frame (before hologram formatting).
     */
    static createBlendedFrame(imageA, imageB, alphaB) {
        const width = Math.max(imageA.width, imageB.width);
        const height = Math.max(imageA.height, imageB.height);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Draw A with inverse opacity, then B with direct opacity.
        const aOpacity = 1 - alphaB;
        if (aOpacity > 0) {
            ctx.globalAlpha = aOpacity;
            this.drawCoverImage(ctx, imageA, width, height);
        }
        if (alphaB > 0) {
            ctx.globalAlpha = alphaB;
            this.drawCoverImage(ctx, imageB, width, height);
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
