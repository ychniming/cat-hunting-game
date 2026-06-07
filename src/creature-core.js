import { TailChain } from './tail-chain.js';

class CreatureCore {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.radius = 0;
        this.wigglePhase = 0;
        this.wiggleSpeed = 0;
        this.eyeOffset = 0;
        this.blinkTimer = 0;
        this.blinking = false;
        this.alive = true;
    }

    initSharedProperties({ minRadius, maxRadius, minWiggleSpeed = 0.08, maxWiggleSpeed = 0.2 }) {
        this.radius = minRadius + Math.random() * (maxRadius - minRadius);
        this.wigglePhase = Math.random() * Math.PI * 2;
        this.wiggleSpeed = minWiggleSpeed + Math.random() * (maxWiggleSpeed - minWiggleSpeed);
        this.eyeOffset = 0;
        this.blinkTimer = Math.random() * 200;
        this.blinking = false;
        this.alive = true;
    }

    spawnFromEdge(margin) {
        const side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0:
                return { x: Math.random() * this.canvasWidth, y: -margin };
            case 1:
                return { x: this.canvasWidth + margin, y: Math.random() * this.canvasHeight };
            case 2:
                return { x: Math.random() * this.canvasWidth, y: this.canvasHeight + margin };
            case 3:
                return { x: -margin, y: Math.random() * this.canvasHeight };
            default:
                return { x: Math.random() * this.canvasWidth, y: -margin };
        }
    }

    updateBlink(blinkDuration = 10, minReset = 80, maxReset = 300) {
        this.blinkTimer--;
        this.eyeOffset = Math.sin(this.wigglePhase) * 2;

        if (this.blinkTimer <= 0) {
            this.blinking = true;
            if (this.blinkTimer < -blinkDuration) {
                this.blinking = false;
                this.blinkTimer = minReset + Math.random() * (maxReset - minReset);
            }
        }
    }

    createTail(anchorX, anchorY, segmentCount, segmentLength, config) {
        return new TailChain(anchorX, anchorY, segmentCount, segmentLength, config);
    }

    getBaseVisualProps(x, y, tailSegments) {
        return {
            x,
            y,
            radius: this.radius,
            tailSegments,
            blinking: this.blinking,
            eyeOffset: this.eyeOffset
        };
    }
}

export { CreatureCore };
