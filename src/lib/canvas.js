// Canvas mouse-trail animation
// Adapted from canvas.tsx for vanilla JS/React

function Oscillator(config) {
    this.phase = config.phase || 0;
    this.offset = config.offset || 0;
    this.frequency = config.frequency || 0.001;
    this.amplitude = config.amplitude || 1;
    this._value = 0;
}

Oscillator.prototype.update = function () {
    this.phase += this.frequency;
    this._value = this.offset + Math.sin(this.phase) * this.amplitude;
    return this._value;
};

Oscillator.prototype.value = function () {
    return this._value;
};

const E = {
    friction: 0.5,
    trails: 80,
    size: 50,
    dampening: 0.025,
    tension: 0.99,
};

function Node() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
}

function TrailLine(config) {
    this.spring = config.spring + 0.1 * Math.random() - 0.05;
    this.friction = E.friction + 0.01 * Math.random() - 0.005;
    this.nodes = [];
    for (let i = 0; i < E.size; i++) {
        const node = new Node();
        node.x = pos.x;
        node.y = pos.y;
        this.nodes.push(node);
    }
}

TrailLine.prototype.update = function () {
    let spring = this.spring;
    let node = this.nodes[0];
    node.vx += (pos.x - node.x) * spring;
    node.vy += (pos.y - node.y) * spring;

    for (let i = 0; i < this.nodes.length; i++) {
        node = this.nodes[i];
        if (i > 0) {
            const prev = this.nodes[i - 1];
            node.vx += (prev.x - node.x) * spring;
            node.vy += (prev.y - node.y) * spring;
            node.vx += prev.vx * E.dampening;
            node.vy += prev.vy * E.dampening;
        }
        node.vx *= this.friction;
        node.vy *= this.friction;
        node.x += node.vx;
        node.y += node.vy;
        spring *= E.tension;
    }
};

TrailLine.prototype.draw = function () {
    let x = this.nodes[0].x;
    let y = this.nodes[0].y;
    ctx.beginPath();
    ctx.moveTo(x, y);

    let a;
    for (a = 1; a < this.nodes.length - 2; a++) {
        const curr = this.nodes[a];
        const next = this.nodes[a + 1];
        x = 0.5 * (curr.x + next.x);
        y = 0.5 * (curr.y + next.y);
        ctx.quadraticCurveTo(curr.x, curr.y, x, y);
    }

    const curr = this.nodes[a];
    const next = this.nodes[a + 1];
    ctx.quadraticCurveTo(curr.x, curr.y, next.x, next.y);
    ctx.stroke();
    ctx.closePath();
};

let ctx;
let oscillator;
let lines = [];
const pos = { x: 0, y: 0 };

function initLines() {
    lines = [];
    for (let i = 0; i < E.trails; i++) {
        lines.push(new TrailLine({ spring: 0.45 + (i / E.trails) * 0.025 }));
    }
}

function handleMove(e) {
    if (e.touches) {
        pos.x = e.touches[0].pageX;
        pos.y = e.touches[0].pageY;
    } else {
        pos.x = e.clientX;
        pos.y = e.clientY;
    }
    e.preventDefault();
}

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        pos.x = e.touches[0].pageX;
        pos.y = e.touches[0].pageY;
    }
}

function onFirstInteraction(e) {
    document.removeEventListener('mousemove', onFirstInteraction);
    document.removeEventListener('touchstart', onFirstInteraction);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchstart', handleTouchStart);
    handleMove(e);
    initLines();
    render();
}

function render() {
    if (!ctx || !ctx.running) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'hsla(' + Math.round(oscillator.update()) + ',90%,50%,0.025)';
    ctx.lineWidth = 10;
    for (let i = 0; i < E.trails; i++) {
        lines[i].update();
        lines[i].draw();
    }
    ctx.frame++;
    window.requestAnimationFrame(render);
}

function resizeCanvas() {
    if (!ctx) return;
    ctx.canvas.width = window.innerWidth - 20;
    ctx.canvas.height = window.innerHeight;
}

export function renderCanvas() {
    const canvas = document.getElementById('canvas-trail');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    ctx.running = true;
    ctx.frame = 1;
    oscillator = new Oscillator({
        phase: Math.random() * 2 * Math.PI,
        amplitude: 85,
        frequency: 0.0015,
        offset: 285,
    });
    document.addEventListener('mousemove', onFirstInteraction);
    document.addEventListener('touchstart', onFirstInteraction);
    document.body.addEventListener('orientationchange', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('focus', () => {
        if (!ctx.running) {
            ctx.running = true;
            render();
        }
    });
    window.addEventListener('blur', () => {
        ctx.running = true;
    });
    resizeCanvas();
}

export function stopCanvas() {
    if (ctx) ctx.running = false;
    document.removeEventListener('mousemove', onFirstInteraction);
    document.removeEventListener('touchstart', onFirstInteraction);
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchstart', handleTouchStart);
}
