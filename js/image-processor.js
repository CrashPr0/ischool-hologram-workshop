// Image processing for hologram formatting
// Standard 4-view pyramid hologram: cross layout (TOP, RIGHT, BOTTOM, LEFT) around center
class ImageProcessor {
    /** Distance from canvas center to each panel center (smaller = tighter center gap) */
    static CENTER_GAP_RATIO = 0.25;
    /** Narrow (center) edge as fraction of wide edge (smaller = more taper). Panels: small base inward, wide base outward. */
    static TRAPEZOID_TOP_RATIO = 0.45;

    /**
     * Clip path: trapezoid with smaller base facing into the center gap, wide base outward.
     * In local coords (after translate/rotate): narrow edge on the center-facing side, wide on the outer.
     * TOP: narrow at bottom (+y), wide at top (-y). RIGHT/LEFT: same shape, rotation makes narrow face center.
     */
    static clipPanelTrapezoid(ctx, side, half) {
        const narrow = half * ImageProcessor.TRAPEZOID_TOP_RATIO; // half-width of center-facing (smaller) edge
        ctx.beginPath();
        if (side === 'TOP') {
            // Narrow at bottom (y=+half, toward center), wide at top (y=-half, outer)
            ctx.moveTo(-narrow, half);
            ctx.lineTo(narrow, half);
            ctx.lineTo(half, -half);
            ctx.lineTo(-half, -half);
        } else if (side === 'RIGHT') {
            // After +90° rotate: local +y = screen left = center. So narrow at local y=+half, wide at y=-half.
            ctx.moveTo(-narrow, half);
            ctx.lineTo(narrow, half);
            ctx.lineTo(half, -half);
            ctx.lineTo(-half, -half);
        } else if (side === 'BOTTOM') {
            // After 180° rotate: local +y = toward center. So narrow at y=+half, wide at y=-half (same path as TOP).
            ctx.moveTo(-narrow, half);
            ctx.lineTo(narrow, half);
            ctx.lineTo(half, -half);
            ctx.lineTo(-half, -half);
        } else {
            // LEFT: after -90° rotate, local +y = screen right = center. So narrow at local y=+half, wide at y=-half.
            ctx.moveTo(-narrow, half);
            ctx.lineTo(narrow, half);
            ctx.lineTo(half, -half);
            ctx.lineTo(-half, -half);
        }
        ctx.closePath();
        ctx.clip();
    }

    /**
     * Format an image for 4-face hologram display.
     * Small center gap; panels as large as possible without overlapping (gap * √2).
     */
    static formatForHologram(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const faceSize = Math.max(image.width, image.height);
        const gap = Math.round(faceSize * ImageProcessor.CENTER_GAP_RATIO);
        // Panel size: 5% larger than non-overlapping (gap * √2 * 1.05)
        const drawSize = Math.min(faceSize, Math.floor(gap * Math.SQRT2 * 1.05));
        const half = drawSize / 2;

        canvas.width = 2 * gap + faceSize;
        canvas.height = 2 * gap + faceSize;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // No 3:4 crop — use full image, scale to cover panel so only trapezoid clips
        const sx = 0;
        const sy = 0;
        const cropW = image.width;
        const cropH = image.height;
        const scale = Math.max(drawSize / cropW, drawSize / cropH);
        const dw = cropW * scale;
        const dh = cropH * scale;
        const dHalfW = dw / 2;
        const dHalfH = dh / 2;

        // TOP at (cx, cy - gap), rotation 0°, trapezoid: base toward center (bottom)
        ctx.save();
        ctx.translate(cx, cy - gap);
        ImageProcessor.clipPanelTrapezoid(ctx, 'TOP', half);
        ctx.drawImage(image, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // RIGHT at (cx + gap, cy), rotation +90°
        ctx.save();
        ctx.translate(cx + gap, cy);
        ctx.rotate(Math.PI / 2);
        ImageProcessor.clipPanelTrapezoid(ctx, 'RIGHT', half);
        ctx.drawImage(image, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // BOTTOM at (cx, cy + gap), rotation 180°
        ctx.save();
        ctx.translate(cx, cy + gap);
        ctx.rotate(Math.PI);
        ImageProcessor.clipPanelTrapezoid(ctx, 'BOTTOM', half);
        ctx.drawImage(image, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        // LEFT at (cx - gap, cy), rotation -90°
        ctx.save();
        ctx.translate(cx - gap, cy);
        ctx.rotate(-Math.PI / 2);
        ImageProcessor.clipPanelTrapezoid(ctx, 'LEFT', half);
        ctx.drawImage(image, sx, sy, cropW, cropH, -dHalfW, -dHalfH, dw, dh);
        ctx.restore();

        return canvas;
    }

    /**
     * Get individual face canvases for viewer mode (TOP, RIGHT, BOTTOM, LEFT order).
     */
    static getFaceCanvases(image) {
        const faceSize = Math.max(image.width, image.height);
        const sx = 0;
        const sy = 0;
        const cropW = image.width;
        const cropH = image.height;
        const scale = Math.max(faceSize / cropW, faceSize / cropH);
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
