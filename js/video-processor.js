// Video processing for hologram formatting
// Same cross layout as ImageProcessor: TOP, RIGHT, BOTTOM, LEFT around center
class VideoProcessor {
    static CENTER_GAP_RATIO = 0.25;

    /**
     * Format a video frame for 4-face hologram display (cross layout).
     */
    static formatForHologram(videoElement, videoFile, callback) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const videoWidth = videoElement.videoWidth || 640;
        const videoHeight = videoElement.videoHeight || 480;
        const faceSize = Math.max(videoWidth, videoHeight);
        const gap = Math.round(faceSize * VideoProcessor.CENTER_GAP_RATIO);
        canvas.width = 2 * gap + faceSize;
        canvas.height = 2 * gap + faceSize;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.drawVideoFrame(videoElement, ctx, faceSize, gap);
        callback(canvas);
    }

    /**
     * Draw a video frame in cross layout: TOP 0°, RIGHT +90°, BOTTOM 180°, LEFT -90°.
     */
    static drawVideoFrame(video, ctx, faceSize, gap) {
        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 480;
        const sx = 0;
        const sy = 0;
        const cropW = videoWidth;
        const cropH = videoHeight;
        const drawSize = Math.min(faceSize, Math.floor(gap * Math.SQRT2 * 1.05));
        const half = drawSize / 2;
        const scale = Math.max(drawSize / cropW, drawSize / cropH);
        const dw = cropW * scale;
        const dh = cropH * scale;
        const dHalfW = dw / 2;
        const dHalfH = dh / 2;

        const canvasWidth = 2 * gap + faceSize;
        const canvasHeight = 2 * gap + faceSize;
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;

        // TOP at (cx, cy - gap), 0°, trapezoid
        ctx.save();
        ctx.translate(cx, cy - gap);
        ImageProcessor.clipPanelTrapezoid(ctx, 'TOP', half);
        ctx.drawImage(video, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // RIGHT at (cx + gap, cy), +90°
        ctx.save();
        ctx.translate(cx + gap, cy);
        ctx.rotate(Math.PI / 2);
        ImageProcessor.clipPanelTrapezoid(ctx, 'RIGHT', half);
        ctx.drawImage(video, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // BOTTOM at (cx, cy + gap), 180°
        ctx.save();
        ctx.translate(cx, cy + gap);
        ctx.rotate(Math.PI);
        ImageProcessor.clipPanelTrapezoid(ctx, 'BOTTOM', half);
        ctx.drawImage(video, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // LEFT at (cx - gap, cy), -90°
        ctx.save();
        ctx.translate(cx - gap, cy);
        ctx.rotate(-Math.PI / 2);
        ImageProcessor.clipPanelTrapezoid(ctx, 'LEFT', half);
        ctx.drawImage(video, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();
    }
    
    /**
     * Download formatted video
     * Note: Full video processing requires MediaRecorder API
     */
    static downloadVideo(canvas, fileName) {
        // Backward compatibility with previous signature (canvas, fileName)
        if (canvas instanceof HTMLCanvasElement) {
            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}_hologram.png`;
                a.click();
                URL.revokeObjectURL(url);
            }, 'image/png');
            return Promise.resolve();
        }

        // New signature: (inputVideoFile, fileName) -> process full video, then download.
        return this.processVideoBlobToHologram(canvas).then((blob) => {
            const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}_hologram.${ext}`;
            a.click();
            URL.revokeObjectURL(url);
        }).catch(() => {
            // iPad/Safari fallback when MediaRecorder/captureStream is limited: export a hologram PNG frame.
            return this.downloadVideoFrame(canvas, fileName);
        });
    }

    static downloadVideoFrame(videoBlob, fileName) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.playsInline = true;
            const src = URL.createObjectURL(videoBlob);
            video.src = src;

            video.addEventListener('loadeddata', () => {
                this.formatForHologram(video, videoBlob, (canvas) => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            URL.revokeObjectURL(src);
                            resolve();
                            return;
                        }
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${fileName}_hologram.png`;
                        a.click();
                        URL.revokeObjectURL(url);
                        URL.revokeObjectURL(src);
                        resolve();
                    }, 'image/png');
                });
            }, { once: true });

            video.addEventListener('error', () => {
                URL.revokeObjectURL(src);
                resolve();
            }, { once: true });
        });
    }
    
    /**
     * Get video frames for viewer mode
     */
    static getVideoFrames(videoElement, callback) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        const updateFrame = () => {
            ctx.drawImage(videoElement, 0, 0);
            callback(canvas);
        };
        
        videoElement.addEventListener('timeupdate', updateFrame);
        updateFrame();
    }

    static getSupportedMediaRecorderMimeType() {
        const mimeTypes = [
            'video/mp4',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm'
        ];
        for (const mimeType of mimeTypes) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported(mimeType)) {
                return mimeType;
            }
        }
        return '';
    }

    static createMediaRecorder(stream) {
        const mimeType = this.getSupportedMediaRecorderMimeType();
        if (mimeType) {
            return new MediaRecorder(stream, { mimeType });
        }
        return new MediaRecorder(stream);
    }

    /**
     * Encode canvases to a video blob.
     */
    static encodeCanvasFramesToVideo(frames, fps = 24, onProgress = null) {
        return new Promise((resolve, reject) => {
            if (!window.MediaRecorder) {
                reject(new Error('MediaRecorder not supported.'));
                return;
            }
            if (!frames || !frames.length) {
                reject(new Error('No frames provided.'));
                return;
            }

            const width = frames[0].width;
            const height = frames[0].height;
            const outputCanvas = document.createElement('canvas');
            const outputCtx = outputCanvas.getContext('2d');
            outputCanvas.width = width;
            outputCanvas.height = height;
            if (typeof outputCanvas.captureStream !== 'function') {
                reject(new Error('captureStream not supported.'));
                return;
            }

            const stream = outputCanvas.captureStream(Math.max(1, fps));
            let recorder;
            try {
                recorder = this.createMediaRecorder(stream);
            } catch (err) {
                reject(err);
                return;
            }

            const chunks = [];
            recorder.addEventListener('dataavailable', (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            });
            recorder.addEventListener('error', (e) => {
                reject(e.error || new Error('Video encoding failed.'));
            });
            recorder.addEventListener('stop', () => {
                const mimeType = recorder.mimeType || 'video/webm';
                resolve(new Blob(chunks, { type: mimeType }));
            });

            const frameDelay = 1000 / Math.max(1, fps);
            let frameIndex = 0;
            recorder.start(200);
            if (typeof onProgress === 'function') {
                onProgress(0);
            }

            const drawNext = () => {
                const frame = frames[frameIndex];
                outputCtx.clearRect(0, 0, width, height);
                outputCtx.drawImage(frame, 0, 0);
                frameIndex += 1;
                if (typeof onProgress === 'function') {
                    onProgress(Math.max(0, Math.min(100, Math.round((frameIndex / frames.length) * 100))));
                }
                if (frameIndex < frames.length) {
                    setTimeout(drawNext, frameDelay);
                } else {
                    setTimeout(() => recorder.stop(), frameDelay);
                }
            };
            drawNext();
        });
    }

    /**
     * Convert input video Blob/File to hologram-formatted video Blob.
     */
    static processVideoBlobToHologram(videoBlob, options = {}) {
        return new Promise((resolve, reject) => {
            if (!window.MediaRecorder) {
                reject(new Error('MediaRecorder not supported in this browser.'));
                return;
            }

            const video = document.createElement('video');
            video.preload = 'auto';
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = 'anonymous';

            const src = URL.createObjectURL(videoBlob);
            video.src = src;

            video.addEventListener('loadedmetadata', () => {
                const videoWidth = video.videoWidth || 640;
                const videoHeight = video.videoHeight || 480;
                const faceSize = Math.max(videoWidth, videoHeight);
                const gap = Math.round(faceSize * VideoProcessor.CENTER_GAP_RATIO);

                const outputCanvas = document.createElement('canvas');
                const outputCtx = outputCanvas.getContext('2d');
                outputCanvas.width = 2 * gap + faceSize;
                outputCanvas.height = 2 * gap + faceSize;
                if (typeof outputCanvas.captureStream !== 'function') {
                    URL.revokeObjectURL(src);
                    reject(new Error('captureStream not supported.'));
                    return;
                }

                const fps = options.fps || 24;
                const stream = outputCanvas.captureStream(fps);
                let recorder;
                try {
                    recorder = this.createMediaRecorder(stream);
                } catch (err) {
                    URL.revokeObjectURL(src);
                    reject(err);
                    return;
                }

                const chunks = [];
                recorder.addEventListener('dataavailable', (e) => {
                    if (e.data && e.data.size > 0) chunks.push(e.data);
                });
                recorder.addEventListener('error', (e) => {
                    URL.revokeObjectURL(src);
                    reject(e.error || new Error('Recording failed.'));
                });
                recorder.addEventListener('stop', () => {
                    URL.revokeObjectURL(src);
                    resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
                });

                const renderLoop = () => {
                    if (video.paused || video.ended) {
                        if (video.ended && recorder.state !== 'inactive') {
                            recorder.stop();
                        }
                        return;
                    }
                    outputCtx.fillStyle = '#000000';
                    outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
                    this.drawVideoFrame(video, outputCtx, faceSize, gap);
                    requestAnimationFrame(renderLoop);
                };

                recorder.start(250);
                video.currentTime = 0;
                video.play().then(() => {
                    renderLoop();
                }).catch((err) => {
                    URL.revokeObjectURL(src);
                    reject(err);
                });
            }, { once: true });

            video.addEventListener('error', () => {
                URL.revokeObjectURL(src);
                reject(new Error('Could not load video for processing.'));
            }, { once: true });
        });
    }

    /**
     * Live autoplay preview: continuously renders a hologram-formatted video onto preview canvas.
     * Returns a cleanup function to stop RAF + pause video.
     */
    static startHologramPreview(videoElement, previewCanvas, options = {}) {
        const maxWidth = options.maxWidth || 800;
        const shouldLoop = options.loop !== false;
        const onAfterDraw = typeof options.onAfterDraw === 'function' ? options.onAfterDraw : null;
        const onFrame = typeof options.onFrame === 'function' ? options.onFrame : null;

        const videoWidth = videoElement.videoWidth || 640;
        const videoHeight = videoElement.videoHeight || 480;
        const faceSize = Math.max(videoWidth, videoHeight);
        const gap = Math.round(faceSize * VideoProcessor.CENTER_GAP_RATIO);
        const renderWidth = 2 * gap + faceSize;
        const renderHeight = 2 * gap + faceSize;

        const scale = Math.min(maxWidth / renderWidth, maxWidth / renderHeight, 1);
        previewCanvas.width = Math.round(renderWidth * scale);
        previewCanvas.height = Math.round(renderHeight * scale);

        const renderCanvas = document.createElement('canvas');
        renderCanvas.width = renderWidth;
        renderCanvas.height = renderHeight;
        const renderCtx = renderCanvas.getContext('2d');
        const previewCtx = previewCanvas.getContext('2d');

        let rafId = null;
        let stopped = false;

        const draw = () => {
            if (stopped) return;
            if (videoElement.ended) {
                if (shouldLoop) {
                    videoElement.currentTime = 0;
                    videoElement.play().catch(() => {});
                } else {
                    return;
                }
            }

            renderCtx.fillStyle = '#000000';
            renderCtx.fillRect(0, 0, renderWidth, renderHeight);
            this.drawVideoFrame(videoElement, renderCtx, faceSize, gap);
            if (onFrame) {
                onFrame(renderCanvas);
            }

            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            previewCtx.drawImage(renderCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
            if (onAfterDraw) {
                onAfterDraw(previewCtx, previewCanvas.width, previewCanvas.height);
            }
            rafId = requestAnimationFrame(draw);
        };

        videoElement.loop = shouldLoop;
        videoElement.play().catch(() => {});
        rafId = requestAnimationFrame(draw);

        return () => {
            stopped = true;
            if (rafId) cancelAnimationFrame(rafId);
            videoElement.pause();
        };
    }
}
