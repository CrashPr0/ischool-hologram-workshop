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
        const cropW = Math.min(videoWidth, (videoHeight * 3) / 4);
        const cropH = (cropW * 4) / 3;
        const sx = (videoWidth - cropW) / 2;
        const sy = (videoHeight - cropH) / 2;
        const drawSize = Math.min(faceSize, Math.floor(gap * Math.SQRT2));
        const scale = Math.min(drawSize / cropW, drawSize / cropH);
        const dw = cropW * scale;
        const dh = cropH * scale;
        const dHalfW = dw / 2;
        const dHalfH = dh / 2;

        const canvasWidth = 2 * gap + faceSize;
        const canvasHeight = 2 * gap + faceSize;
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;

        // TOP at (cx, cy - gap), 0°
        ctx.save();
        ctx.translate(cx, cy - gap);
        ctx.drawImage(video, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // RIGHT at (cx + gap, cy), +90°
        ctx.save();
        ctx.translate(cx + gap, cy);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(video, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // BOTTOM at (cx, cy + gap), 180°
        ctx.save();
        ctx.translate(cx, cy + gap);
        ctx.rotate(Math.PI);
        ctx.drawImage(video, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // LEFT at (cx - gap, cy), -90°
        ctx.save();
        ctx.translate(cx - gap, cy);
        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(video, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();
    }
    
    /**
     * Download formatted video
     * Note: Full video processing requires MediaRecorder API
     */
    static downloadVideo(canvas, fileName) {
        // For now, download as image sequence or use canvas to video conversion
        // In a production app, you'd use MediaRecorder to encode the full video
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}_hologram.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
        
        alert('Note: Full video processing is in development. For now, a frame has been exported. For full videos, consider using video editing software to create the 4-face format.');
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
}
