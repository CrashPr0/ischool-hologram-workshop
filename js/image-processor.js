// Image processing for hologram formatting
// Standard 4-view pyramid hologram: cross layout (TOP, RIGHT, BOTTOM, LEFT) around center
class ImageProcessor {
    /** Distance from canvas center to each panel center (smaller = tighter center gap) */
    static CENTER_GAP_RATIO = 0.25;

    /**
     * Format an image for 4-face hologram display.
     * Small center gap; panels as large as possible without overlapping (gap * √2).
     */
    static formatForHologram(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const faceSize = Math.max(image.width, image.height);
        const gap = Math.round(faceSize * ImageProcessor.CENTER_GAP_RATIO);
        const drawSize = Math.min(faceSize, Math.floor(gap * Math.SQRT2));

        canvas.width = 2 * gap + faceSize;
        canvas.height = 2 * gap + faceSize;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        const cropW = Math.min(image.width, (image.height * 3) / 4);
        const cropH = (cropW * 4) / 3;
        const sx = (image.width - cropW) / 2;
        const sy = (image.height - cropH) / 2;
        const scale = Math.min(drawSize / cropW, drawSize / cropH);
        const dw = cropW * scale;
        const dh = cropH * scale;
        const dHalfW = dw / 2;
        const dHalfH = dh / 2;

        // TOP at (cx, cy - gap), rotation 0°
        ctx.save();
        ctx.translate(cx, cy - gap);
        ctx.drawImage(image, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // RIGHT at (cx + gap, cy), rotation +90°
        ctx.save();
        ctx.translate(cx + gap, cy);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(image, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // BOTTOM at (cx, cy + gap), rotation 180°
        ctx.save();
        ctx.translate(cx, cy + gap);
        ctx.rotate(Math.PI);
        ctx.drawImage(image, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // LEFT at (cx - gap, cy), rotation -90°
        ctx.save();
        ctx.translate(cx - gap, cy);
        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(image, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        return canvas;
    }

    /**
     * Get individual face canvases for viewer mode (TOP, RIGHT, BOTTOM, LEFT order).
     */
    static getFaceCanvases(image) {
        const faceSize = Math.max(image.width, image.height);
        const cropW = Math.min(image.width, (image.height * 3) / 4);
        const cropH = (cropW * 4) / 3;
        const sx = (image.width - cropW) / 2;
        const sy = (image.height - cropH) / 2;
        const scale = Math.min(faceSize / cropW, faceSize / cropH);
        const dw = cropW * scale;
        const dh = cropH * scale;
        const halfW = dw / 2;
        const halfH = dh / 2;
        const faces = [];
        const rotations = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        for (let i = 0; i < 4; i++) {
            const c = document.createElement('canvas');
            const ctx = c.getContext('2d');
            c.width = faceSize;
            c.height = faceSize;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, faceSize, faceSize);
            ctx.save();
            ctx.translate(faceSize / 2, faceSize / 2);
            ctx.rotate(rotations[i]);
            ctx.drawImage(image, sx, sy, cropW, cropH, -halfW, -halfH, dw, dh);
            ctx.restore();
            faces.push(c);
        }
        return faces;
    }
}
