import GUI from 'lil-gui';
import { quickhull3 } from 'mathcat';
import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import * as THREE from 'three/webgpu';

const bunny = await new GLTFLoader().loadAsync('/models/bunny.glb');

const examples = {
    bunny: () => {
        const points: number[] = [];
        const positions = (bunny.scene.children[0].children[0] as THREE.Mesh).geometry.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            points.push(positions.getX(i), positions.getY(i), positions.getZ(i));
        }
        return points;
    },
    cube: () => {
        const points: number[] = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    points.push(x, y, z);
                }
            }
        }
        return points;
    },
    sphere: () => {
        const points: number[] = [];
        const count = 50;
        for (let i = 0; i < count; i++) {
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const r = 0.5 + Math.random() * 0.5;
            points.push(r * Math.sin(theta) * Math.cos(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(theta));
        }
        return points;
    },
    pyramid: () => {
        return [
            // base
            -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1,
            // apex
            0, 1.5, 0,
            // some internal points
            0, 0.5, 0, 0.5, 0.3, 0.5,
        ];
    },
    random50: () => {
        const points: number[] = [];
        const count = 50;
        for (let i = 0; i < count; i++) {
            points.push((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
        }
        return points;
    },
    random500: () => {
        const points: number[] = [];
        const count = 500;
        for (let i = 0; i < count; i++) {
            points.push((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
        }
        return points;
    },
};

const settings = {
    example: 'bunny',
};

// example scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-1, 2, 3);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#333';

// create stats display
const statsDiv = document.createElement('div');
statsDiv.style.position = 'absolute';
statsDiv.style.top = '10px';
statsDiv.style.left = '10px';
statsDiv.style.color = '#fff';
statsDiv.style.fontFamily = 'monospace';
statsDiv.style.fontSize = '14px';
statsDiv.style.lineHeight = '1.5';
statsDiv.style.pointerEvents = 'none';
document.body.appendChild(statsDiv);

function updateStats(points: number, hullVertices: number, computeTime: number) {
    statsDiv.innerHTML = `Points: ${points}<br>Hull Vertices: ${hullVertices}<br>Compute Time: ${computeTime.toFixed(3)}ms`;
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.1;

// example selection
let pointsMesh: THREE.InstancedMesh;
let hullMesh: THREE.Mesh;

const hullMaterial = new THREE.MeshNormalMaterial({
    wireframe: false,
    transparent: true,
    opacity: 0.1,
    side: THREE.FrontSide,
});

const sphereGeometry = new THREE.SphereGeometry(0.01, 16, 16);
const sphereMaterial = new THREE.MeshBasicMaterial();

const onHullColor = new THREE.Color(0x5555ff);
const inHullColor = new THREE.Color(0x888888);

const _matrix = new THREE.Matrix4();
const _color = new THREE.Color();

function selectExample(name: keyof typeof examples) {
    // dispose and remove previous objects
    if (pointsMesh) {
        scene.remove(pointsMesh);
        pointsMesh.geometry.dispose();
    }
    if (hullMesh) {
        scene.remove(hullMesh);
        hullMesh.geometry.dispose();
    }

    // generate points
    const points = examples[name]();
    const numPoints = points.length / 3;

    // compute hull
    const startTime = performance.now();
    const hullIndices = quickhull3(points);
    const computeTime = performance.now() - startTime;

    // find unique hull vertices
    const hullVertices = new Set<number>();
    for (const index of hullIndices) {
        hullVertices.add(index);
    }

    // update stats display
    updateStats(numPoints, hullVertices.size, computeTime);

    // create instanced mesh for points
    pointsMesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, numPoints);

    for (let i = 0; i < numPoints; i++) {
        const x = points[i * 3];
        const y = points[i * 3 + 1];
        const z = points[i * 3 + 2];

        _matrix.setPosition(x, y, z);
        pointsMesh.setMatrixAt(i, _matrix);

        _color.copy(hullVertices.has(i) ? onHullColor : inHullColor);
        pointsMesh.setColorAt(i, _color);
    }

    pointsMesh.instanceMatrix.needsUpdate = true;
    pointsMesh.instanceColor!.needsUpdate = true;

    scene.add(pointsMesh);

    // create hull mesh
    const hullGeometry = new THREE.BufferGeometry();
    hullGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    hullGeometry.setIndex(hullIndices);
    hullGeometry.computeVertexNormals();

    hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    scene.add(hullMesh);
}

// gui
const gui = new GUI();
gui.add(settings, 'example', Object.keys(examples))
    .name('Geometry')
    .onChange(() => selectExample(settings.example as keyof typeof examples));

const actions = {
    regenerate: () => selectExample(settings.example as keyof typeof examples),
};
gui.add(actions, 'regenerate').name('🔄 Regenerate');

// update loop
function update() {
    requestAnimationFrame(update);

    orbitControls.update();
    renderer.render(scene, camera);
}

// init
selectExample(settings.example as keyof typeof examples);

update();
