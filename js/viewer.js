// Viewer mode: fullscreen hologram image for prism placement
class Viewer {
    static initialize(canvas, isVideo = false) {
        const img = document.getElementById('viewer-hologram-img');
        if (!img) return;

        img.src = canvas.toDataURL();
        img.alt = 'Hologram — place prism on screen';

        this.setupControls();
    }

    static setupControls() {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const exitViewerBtn = document.getElementById('exit-viewer-btn');
        const viewerContainer = document.getElementById('viewer-container');

        if (fullscreenBtn && viewerContainer) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    viewerContainer.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
                        alert('Fullscreen not supported or blocked');
                    });
                } else {
                    document.exitFullscreen();
                }
            });
        }

        if (exitViewerBtn) {
            exitViewerBtn.addEventListener('click', () => {
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
