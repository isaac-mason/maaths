import GUI from 'lil-gui';
import { quickhull2 } from 'mathcat';

function generateRandomPoints(count: number): number[] {
    const points: number[] = [];
    for (let i = 0; i < count; i++) {
        points.push((Math.random() - 0.5) * (Math.random() * 600), (Math.random() - 0.5) * (Math.random() * 400));
    }
    return points;
}

function generateCirclePoints(count: number): number[] {
    const points: number[] = [];
    const radius = 150;

    // points on circle perimeter with some noise
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        points.push(Math.cos(angle) * radius + Math.random() * 20 - 10, Math.sin(angle) * radius + Math.random() * 20 - 10);
    }

    // add some interior points
    for (let i = 0; i < 5; i++) {
        points.push(Math.random() * 100 - 50, Math.random() * 100 - 50);
    }
    return points;
}

const examples = {
    random10: () => generateRandomPoints(10),
    random20: () => generateRandomPoints(20),
    random50: () => generateRandomPoints(50),
    random1000: () => generateRandomPoints(1000),
    random10_000: () => generateRandomPoints(10_000),
    random100_000: () => generateRandomPoints(100_000),
    circle: () => generateCirclePoints(20),
    square: () => [
        -100, -100, 100, -100, 100, 100, -100, 100,
        // some interior points
        0, 0, -50, -50, 50, 50, -25, 25,
    ],
    star: () => [
        0, -100, 30, -30, 100, -20, 40, 20, 60, 100, 0, 50, -60, 100, -40, 20, -100, -20, -30, -30,
        // interior points
        0, 0, 10, 10,
    ],
};

let currentPoints: number[] = examples.random10();
let currentHull: number[] = [];
let computeTimeMs = 0;

// settings
const settings = {
    example: 'random10',
};

const pointSize = 5;

// pan and zoom state
let panX = 0;
let panY = 0;
let zoom = 1;

// canvas setup
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d')!;

// style
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.fontFamily = 'monospace';
document.body.style.background = '#333';
document.body.style.overflow = 'hidden';
canvas.style.display = 'block';
canvas.style.background = '#333';

// responsive
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// select example function
function selectExample(name: keyof typeof examples) {
    settings.example = name;
    currentPoints = examples[name]();
    
    const start = performance.now();
    currentHull = quickhull2(currentPoints);
    const end = performance.now();
    computeTimeMs = end - start;
    
    render();
}

// gui setup
const gui = new GUI();
gui.add(settings, 'example', Object.keys(examples))
    .name('Polygon Example')
    .onChange(() => selectExample(settings.example as keyof typeof examples));

const actions = {
    regenerate: () => selectExample(settings.example as keyof typeof examples),
};

gui.add(actions, 'regenerate').name('🔄 Regenerate');

// pan and zoom
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        panX += dx;
        panY += dy;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        render();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    zoom *= zoomFactor;
    render();
});

function toScreenSpace(x: number, y: number): [number, number] {
    return [x * zoom + canvas.width / 2 + panX, y * zoom + canvas.height / 2 + panY];
}

// simple canvas rendering
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const points = currentPoints;
    const hullIndices = currentHull;

    // draw hull
    if (hullIndices.length > 0) {
        ctx.beginPath();
        const [x0, y0] = toScreenSpace(points[hullIndices[0] * 2], points[hullIndices[0] * 2 + 1]);
        ctx.moveTo(x0, y0);

        for (let i = 1; i < hullIndices.length; i++) {
            const idx = hullIndices[i];
            const [x, y] = toScreenSpace(points[idx * 2], points[idx * 2 + 1]);
            ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
    }

    // draw points
    const n = points.length / 2;
    for (let i = 0; i < n; i++) {
        const x = points[i * 2];
        const y = points[i * 2 + 1];
        const [sx, sy] = toScreenSpace(x, y);

        const isOnHull = hullIndices.includes(i);

        ctx.beginPath();
        ctx.arc(sx, sy, pointSize, 0, Math.PI * 2);
        ctx.fillStyle = isOnHull ? '#fff' : '#888';
        ctx.fill();

        ctx.fillStyle = isOnHull ? '#fff' : '#aaa';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i.toString(), sx + pointSize + 10, sy);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Points: ${n}`, 10, 20);
    ctx.fillText(`Hull vertices: ${hullIndices.length}`, 10, 40);
    ctx.fillText(`Compute time: ${computeTimeMs.toFixed(20)}ms`, 10, 60);
}

selectExample('random10');
