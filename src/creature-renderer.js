import { CONFIG } from './config.js';

function renderTail(ctx, segments, width) {
    if (segments.length < 2) return;

    const n = segments.length;

    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(segments[0].x, segments[0].y);

    for (let i = 1; i < n - 1; i++) {
        const nextMx = (segments[i].x + segments[i + 1].x) / 2;
        const nextMy = (segments[i].y + segments[i + 1].y) / 2;
        ctx.quadraticCurveTo(segments[i].x, segments[i].y, nextMx, nextMy);
    }

    ctx.lineTo(segments[n - 1].x, segments[n - 1].y);
    ctx.stroke();
}

function renderCreature(ctx, props) {
    const {
        x, y, radius,
        tailSegments,
        blinking, eyeOffset,
        eyeSizeRatio, eyeSpacingRatio, pupilSizeRatio,
        eyeVerticalOffset,
        caught, caughtTime
    } = props;

    if (radius < 1) return;

    ctx.save();

    ctx.strokeStyle = '#1a1a1a';
    ctx.fillStyle = '#1a1a1a';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tailSegments.length >= 2) {
        const tailWidth = Math.max(2, radius * CONFIG.tail.baseWidthRatio);
        renderTail(ctx, tailSegments, tailWidth);
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    const eyeSize = radius * eyeSizeRatio;
    const eyeSpacing = radius * eyeSpacingRatio;
    const eyeY = y + eyeVerticalOffset;

    ctx.fillStyle = '#f5f0e8';

    if (!blinking) {
        ctx.beginPath();
        ctx.ellipse(x - eyeSpacing, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(x + eyeSpacing, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a1a';
        const pupilSize = eyeSize * pupilSizeRatio;
        ctx.beginPath();
        ctx.arc(x - eyeSpacing + eyeOffset, eyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + eyeSpacing + eyeOffset, eyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.strokeStyle = '#f5f0e8';
        ctx.lineWidth = Math.max(1.5, radius / 12);
        ctx.beginPath();
        ctx.moveTo(x - eyeSpacing - eyeSize, eyeY);
        ctx.lineTo(x - eyeSpacing + eyeSize, eyeY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + eyeSpacing - eyeSize, eyeY);
        ctx.lineTo(x + eyeSpacing + eyeSize, eyeY);
        ctx.stroke();
    }

    if (caught) {
        const alpha = Math.min(1, caughtTime / 20);
        ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

export { renderCreature, renderTail };
