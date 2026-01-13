// Minecraft 3D Clone - Basic Implementation

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87CEEB); // Sky blue

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// World
const worldSize = 16;
const blockSize = 1;
const blocks = [];
const animals = [];
const blockTypes = {
    grass: 0x00ff00,
    dirt: 0x8B4513,
    stone: 0x808080,
    wood: 0x8B4513,
    leaves: 0x228B22
};

const animalTypes = {
    cow: { color: 0xffffff, size: 0.8 },
    pig: { color: 0xff69b4, size: 0.6 }
};

function createAnimal(type, x, z) {
    const animal = animalTypes[type];
    const geometry = new THREE.BoxGeometry(animal.size, animal.size, animal.size);
    const material = new THREE.MeshLambertMaterial({ color: animal.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, animal.size / 2 + 0.1, z); // On ground
    mesh.userData = { type, vx: 0, vz: 0 };
    scene.add(mesh);
    animals.push(mesh);
    return mesh;
}

function createTree(x, z) {
    // Trunk
    createBlock(x, 1, z, 'wood');
    createBlock(x, 2, z, 'wood');
    // Leaves
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            if (dx === 0 && dz === 0) continue; // Skip center
            createBlock(x + dx, 3, z + dz, 'leaves');
        }
    }
    // Top leaves
    createBlock(x, 3, z, 'leaves');
}

// Create ground
for (let x = -worldSize/2; x < worldSize/2; x++) {
    for (let z = -worldSize/2; z < worldSize/2; z++) {
        let height = 0;
        // Simple height variation for hills
        if (Math.abs(x) < 3 && Math.abs(z) < 3) height = 1;
        if (Math.abs(x) < 2 && Math.abs(z) < 2) height = 2;
        for (let y = 0; y <= height; y++) {
            createBlock(x, y, z, y === height ? 'grass' : 'dirt');
        }
    }
}

// Add trees
createTree(4, 4);
createTree(-5, 3);
createTree(1, -6);

// Add animals
createAnimal('cow', 2, 2);
createAnimal('pig', -3, 4);
createAnimal('cow', 5, -1);

// Player
camera.position.set(0, 2, 5);

// Controls
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isOnGround = true;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
    }
});

// Mouse look
let mouseX = 0;
let mouseY = 0;
let pitch = 0;
let yaw = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = event.movementX || 0;
    mouseY = event.movementY || 0;
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
        // Locked
    } else {
        // Unlocked
    }
});

renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

// Current block type
let currentBlockType = 'grass';

document.getElementById('grass-btn').addEventListener('click', () => setCurrentBlock('grass'));
document.getElementById('dirt-btn').addEventListener('click', () => setCurrentBlock('dirt'));
document.getElementById('stone-btn').addEventListener('click', () => setCurrentBlock('stone'));
document.getElementById('wood-btn').addEventListener('click', () => setCurrentBlock('wood'));

document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
});

document.getElementById('settings-btn').addEventListener('click', () => {
    alert('Settings not implemented yet.');
});

function setCurrentBlock(type) {
    currentBlockType = type;
    document.querySelectorAll('.block-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(type + '-btn').classList.add('selected');
}

// Raycaster for block interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('mousedown', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    if (event.button === 0) { // Left click - break
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(blocks);
        if (intersects.length > 0) {
            const block = intersects[0].object;
            scene.remove(block);
            blocks.splice(blocks.indexOf(block), 1);
        }
    } else if (event.button === 2) { // Right click - place
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(blocks);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            const face = intersect.face;
            const position = intersect.object.position.clone();
            if (face.normal.x > 0) position.x += 1;
            else if (face.normal.x < 0) position.x -= 1;
            else if (face.normal.y > 0) position.y += 1;
            else if (face.normal.y < 0) position.y -= 1;
            else if (face.normal.z > 0) position.z += 1;
            else if (face.normal.z < 0) position.z -= 1;
            createBlock(position.x, position.y, position.z, currentBlockType);
        }
    }
});

document.addEventListener('contextmenu', (event) => event.preventDefault());

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Mouse look
    yaw -= mouseX * 0.002;
    pitch -= mouseY * 0.002;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    mouseX = 0;
    mouseY = 0;

    // Movement
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (isOnGround) {
        if (moveForward || moveBackward) velocity.z -= direction.z * 0.1;
        if (moveLeft || moveRight) velocity.x -= direction.x * 0.1;
    }

    camera.position.add(velocity);
    velocity.multiplyScalar(0.9);

    // Simple gravity
    velocity.y -= 0.01;
    if (camera.position.y <= 2) {
        camera.position.y = 2;
        velocity.y = 0;
        isOnGround = true;
    } else {
        isOnGround = false;
    }

    // Update player
    // player.position.set(camera.position.x, camera.position.y - 1, camera.position.z);
    // player.rotation.y = yaw;

    // Update animals
    animals.forEach(animal => {
        // Random movement
        if (Math.random() < 0.02) { // 2% chance per frame to change direction
            animal.userData.vx = (Math.random() - 0.5) * 0.1;
            animal.userData.vz = (Math.random() - 0.5) * 0.1;
        }
        animal.position.x += animal.userData.vx;
        animal.position.z += animal.userData.vz;
        // Keep on ground
        animal.position.y = animalTypes[animal.userData.type].size / 2 + 0.1;
        // Boundary check
        if (animal.position.x < -worldSize/2) animal.position.x = -worldSize/2;
        if (animal.position.x > worldSize/2) animal.position.x = worldSize/2;
        if (animal.position.z < -worldSize/2) animal.position.z = -worldSize/2;
        if (animal.position.z > worldSize/2) animal.position.z = worldSize/2;
    });

    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});