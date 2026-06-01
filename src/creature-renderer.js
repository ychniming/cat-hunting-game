function renderCreature(ctx, props) {
    const {
        x, y, radius,
        tailSegments, wigglePhase,
        vx, vy,
        blinking, eyeOffset,
        eyeSizeRatio, eyeSpacingRatio, pupilSizeRatio,
        eyeVerticalOffset,
        caught, caughtTime,
        tailWiggleScale, tailWiggleFreq
    } = props;

    if (radius < 1) return;

    ctx.save();

    ctx.strokeStyle = '#1a1a1a';
    ctx.fillStyle = '#1a1a1a';
    ctx.lineWidth = Math.max(2, radius / 8);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tailSegments.length > 2) {
        ctx.beginPath();
        const tailStart = tailSegments[0];
        ctx.moveTo(tailStart.x, tailStart.y);

        for (let i = 1; i < tailSegments.length; i++) {
            const t = i / tailSegments.length;
            const wiggle = Math.sin(wigglePhase + i * tailWiggleFreq) * tailWiggleScale * t;
            const perpX = -vy;
            const perpY = vx;
            const len = Math.sqrt(perpX * perpX + perpY * perpY);
            if (len > 0.1) {
                const wx = (perpX / len) * wiggle;
                const wy = (perpY / len) * wiggle;
                ctx.lineTo(tailSegments[i].x + wx, tailSegments[i].y + wy);
            } else {
                const fallbackAngle = wigglePhase + i * 0.5;
                const wx = Math.cos(fallbackAngle) * wiggle * 0.5;
                const wy = Math.sin(fallbackAngle) * wiggle * 0.5;
                ctx.lineTo(tailSegments[i].x + wx, tailSegments[i].y + wy);
            }
        }

        ctx.lineWidth = Math.max(3, radius / 4);
        ctx.stroke();
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
        ctx.fillStyle = `rgba(255, 200, 50, ${caughtTime / 20})`;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

export { renderCreature };
