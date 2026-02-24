// Viewer mode: fullscreen hologram image for prism placement
class Viewer {
    static controlsBound = false;
    static liveCleanup = null;
    static liveVideoUrl = null;

    static initialize(canvas, isVideo = false, sourceFile = null) {
        const img = document.getElementById('viewer-hologram-img');
        const viewerContainer = document.getElementById('viewer-container');
        if (!img || !viewerContainer) return;

        this.cleanup();

        const isVideoFile = !!(isVideo && sourceFile && sourceFile.type && sourceFile.type.startsWith('video/'));
        if (isVideoFile) {
            img.style.display = 'none';
            this.renderLiveVideoToViewer(viewerContainer, sourceFile, canvas);
        } else {
            const viewerCanvas = document.getElementById('viewer-hologram-canvas');
            if (viewerCanvas) {
                viewerCanvas.style.display = 'none';
            }
            img.style.display = 'block';
            img.src = canvas.toDataURL();
            img.alt = 'Hologram — place prism on screen';
        }

        this.setupControls();
    }

    static renderLiveVideoToViewer(viewerContainer, sourceFile, fallbackCanvas) {
        let viewerCanvas = document.getElementById('viewer-hologram-canvas');
        if (!viewerCanvas) {
            viewerCanvas = document.createElement('canvas');
            viewerCanvas.id = 'viewer-hologram-canvas';
            viewerCanvas.className = 'ischool-viewer-img';
            viewerContainer.appendChild(viewerCanvas);
        }
        viewerCanvas.style.display = 'block';

        const video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.loop = true;
        this.liveVideoUrl = URL.createObjectURL(sourceFile);
        video.src = this.liveVideoUrl;

        video.addEventListener('loadeddata', () => {
            this.liveCleanup = VideoProcessor.startHologramPreview(video, viewerCanvas, {
                maxWidth: viewerContainer.clientWidth || 800,
                loop: true
            });
        }, { once: true });

        video.addEventListener('error', () => {
            // Fallback to static frame if live playback fails.
            const img = document.getElementById('viewer-hologram-img');
            if (img) {
                img.style.display = 'block';
                img.src = fallbackCanvas.toDataURL();
            }
            if (viewerCanvas) {
                viewerCanvas.style.display = 'none';
            }
        }, { once: true });
    }

    /** Whether we're in native fullscreen (standard or webkit). */
    static isNativeFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    /** Enter fullscreen: try native API (with webkit prefix for iOS), then fallback to full-viewport overlay. */
    static enterFullscreen(viewerContainer) {
        const requestFs = viewerContainer.requestFullscreen || viewerContainer.webkitRequestFullscreen;
        if (requestFs) {
            requestFs.call(viewerContainer, { navigationUI: 'hide' }).then(() => {}).catch(() => {
                this.enterFullscreenFallback(viewerContainer);
            });
        } else {
            this.enterFullscreenFallback(viewerContainer);
        }
    }

    /** Fallback when native fullscreen isn't supported (e.g. iPhone): full-viewport overlay. */
    static enterFullscreenFallback(viewerContainer) {
        viewerContainer.classList.add('viewer-fullscreen-fallback');
    }

    static exitFullscreen() {
        const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
        if (exitFs && this.isNativeFullscreen()) {
            exitFs.call(document);
        }
        const viewerContainer = document.getElementById('viewer-container');
        if (viewerContainer) {
            viewerContainer.classList.remove('viewer-fullscreen-fallback');
        }
    }

    static setupControls() {
        if (this.controlsBound) return;
        this.controlsBound = true;

        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const exitViewerBtn = document.getElementById('exit-viewer-btn');
        const viewerContainer = document.getElementById('viewer-container');

        const onFullscreenChange = () => {
            if (!this.isNativeFullscreen()) {
                viewerContainer?.classList.remove('viewer-fullscreen-fallback');
            }
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);

        if (fullscreenBtn && viewerContainer) {
            fullscreenBtn.addEventListener('click', () => {
                if (!this.isNativeFullscreen() && !viewerContainer.classList.contains('viewer-fullscreen-fallback')) {
                    this.enterFullscreen(viewerContainer);
                } else {
                    this.exitFullscreen();
                }
            });
        }

        if (exitViewerBtn) {
            exitViewerBtn.addEventListener('click', () => {
                this.exitFullscreen();
                this.cleanup();
                if (window.App) {
                    window.App.exitViewerMode();
                }
            });
        }
    }

    static cleanup() {
        if (this.liveCleanup) {
            this.liveCleanup();
            this.liveCleanup = null;
        }
        if (this.liveVideoUrl) {
            URL.revokeObjectURL(this.liveVideoUrl);
            this.liveVideoUrl = null;
        }

        const img = document.getElementById('viewer-hologram-img');
        if (img) {
            img.src = '';
            img.style.display = 'block';
        }
        const viewerCanvas = document.getElementById('viewer-hologram-canvas');
        if (viewerCanvas) {
            const ctx = viewerCanvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, viewerCanvas.width, viewerCanvas.height);
            }
            viewerCanvas.style.display = 'none';
        }
    }
}
