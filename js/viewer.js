// Viewer mode: fullscreen hologram image for prism placement
class Viewer {
    static initialize(canvas, isVideo = false) {
        const img = document.getElementById('viewer-hologram-img');
        if (!img) return;

        img.src = canvas.toDataURL();
        img.alt = 'Hologram — place prism on screen';

        this.setupControls();
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
        const img = document.getElementById('viewer-hologram-img');
        if (img) {
            img.src = '';
        }
    }
}
