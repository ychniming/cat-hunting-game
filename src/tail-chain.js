const DEFAULT_CONFIG = {
    stiffness: 0.8,
    damping: 0.98,
    constraintIterations: 3,
    segmentLength: 8
};

class TailChain {
    constructor(anchorX, anchorY, segmentCount, segmentLength, config) {
        if (segmentCount < 1) throw new RangeError('segmentCount must be >= 1');
        if (segmentLength <= 0) throw new RangeError('segmentLength must be > 0');

        this._segmentLength = segmentLength;
        this._stiffness = config?.stiffness ?? DEFAULT_CONFIG.stiffness;
        this._damping = config?.damping ?? DEFAULT_CONFIG.damping;
        this._constraintIterations = config?.constraintIterations ?? DEFAULT_CONFIG.constraintIterations;

        this._points = [];
        this._prevPoints = [];

        for (let i = 0; i < segmentCount; i++) {
            const px = anchorX;
            const py = anchorY + i * segmentLength;
            this._points.push({ x: px, y: py });
            this._prevPoints.push({ x: px, y: py });
        }

        this._forceX = 0;
        this._forceY = 0;
        this._segmentsCache = null;
    }

    get stiffness() { return this._stiffness; }
    get damping() { return this._damping; }
    get segmentLength() { return this._segmentLength; }

    update(anchorX, anchorY) {
        // 计算锚点帧间位移（即锚点速度）
        const anchorDx = anchorX - this._points[0].x;
        const anchorDy = anchorY - this._points[0].y;

        this._points[0].x = anchorX;
        this._points[0].y = anchorY;
        this._prevPoints[0].x = anchorX;
        this._prevPoints[0].y = anchorY;

        for (let i = 1; i < this._points.length; i++) {
            const curr = this._points[i];
            const prev = this._prevPoints[i];

            // 段的实际速度（帧间位移）
            const segVx = curr.x - prev.x;
            const segVy = curr.y - prev.y;

            const vx = segVx * this._damping;
            const vy = segVy * this._damping;

            prev.x = curr.x;
            prev.y = curr.y;

            // 速度匹配拖拽：让尾巴段速度趋向锚点速度
            // 段慢于锚点时推向前，快于锚点时拉回后，自然防止过头
            // dragFactor 随段索引递减，近端跟随紧、远端跟随松
            const dragFactor = 0.2 / (1.0 + i * 0.5);
            const dragForceX = (anchorDx - segVx) * dragFactor;
            const dragForceY = (anchorDy - segVy) * dragFactor;

            curr.x += vx + this._forceX + dragForceX;
            curr.y += vy + this._forceY + dragForceY;
        }

        this._forceX = 0;
        this._forceY = 0;

        for (let iter = 0; iter < this._constraintIterations; iter++) {
            this._solveConstraints();
        }

        this._segmentsCache = null;
    }

    _solveConstraints() {
        for (let i = 0; i < this._points.length - 1; i++) {
            const a = this._points[i];
            const b = this._points[i + 1];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.0001) continue;

            const diff = (this._segmentLength - dist) / dist;
            const offsetX = dx * diff * 0.5 * this._stiffness;
            const offsetY = dy * diff * 0.5 * this._stiffness;

            if (i === 0) {
                b.x += offsetX * 2;
                b.y += offsetY * 2;
            } else {
                a.x -= offsetX;
                a.y -= offsetY;
                b.x += offsetX;
                b.y += offsetY;
            }
        }
    }

    getSegments() {
        if (!this._segmentsCache) {
            this._segmentsCache = this._points.map(p => ({ x: p.x, y: p.y }));
        }
        return this._segmentsCache.map(p => ({ x: p.x, y: p.y }));
    }

    applyForce(fx, fy) {
        this._forceX += fx;
        this._forceY += fy;
    }

    setStiffness(value) {
        this._stiffness = value;
    }
}

export { TailChain };
