// Preview functionality
class Preview {
    static showPreview(canvas) {
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
