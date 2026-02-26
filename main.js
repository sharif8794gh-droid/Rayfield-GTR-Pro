import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ১. মেনু এবং টেক্সট সিলেকশন বন্ধ করা (আপনার অরিজিনাল লজিক)
document.addEventListener('contextmenu', event => event.preventDefault()); 

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205); 

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1500000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ==========================================
// [নতুন আপডেট: বড় ঘড়ি UI তৈরি]
// ==========================================
const clockUI = document.createElement('div');
clockUI.style.position = 'absolute';
clockUI.style.top = '20px';
clockUI.style.right = '30px';
clockUI.style.fontSize = '50px'; // ঘড়িটি অনেক বড় করা হয়েছে
clockUI.style.color = '#00ffff';
clockUI.style.fontWeight = 'bold';
clockUI.style.fontFamily = 'monospace';
clockUI.style.textShadow = '0 0 20px #00ffff'; // সুন্দর গ্লো ইফেক্ট
clockUI.style.userSelect = 'none';
document.body.appendChild(clockUI);

// ==========================================
// [নতুন আপডেট: বিশাল সূর্য, চাঁদ এবং সুন্দর তারা]
// ==========================================
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
scene.add(sunLight);

// বিশাল সূর্য
const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(15000000, 64, 64), // আকার আগের চেয়ে অনেক বড়
    new THREE.MeshBasicMaterial({ color: 0xffaa00 })
);
scene.add(sunMesh);

// বিশাল চাঁদ
const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(10000, 64, 64), 
    new THREE.MeshBasicMaterial({ color: 0xe0e0e0 })
);
scene.add(moonMesh);

// সুন্দর তারা (Canvas Texture দিয়ে গ্লোয়িং ইফেক্ট তৈরি)
function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}
const starGeo = new THREE.BufferGeometry();
const starPos = [];
for (let i = 0; i < 8000; i++) { // ৮০০০ তারা
    starPos.push(THREE.MathUtils.randFloatSpread(2000000), THREE.MathUtils.randFloat(80000, 800000), THREE.MathUtils.randFloatSpread(2000000));
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ 
    color: 0xffffff, size: 3000, map: createStarTexture(), 
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false 
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

let time = 0;
const totalCycle = 24 * 60; // ১২ দিন, ১২ রাত
// ==========================================

// নদী এবং গ্রাউন্ড (আপনার অরিজিনাল লজিক)
const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(3000000, 3000000), 
    new THREE.MeshStandardMaterial({ color: 0x001133 })
);
sea.rotation.x = -Math.PI / 2;
sea.position.y = 800; 
scene.add(sea);

const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);
let groundObjects = []; 
const tileSize = 200000; 

// কার্ভড ব্রিজ (আপনার অরিজিনাল লজিক)
function createCurvedBridge(startX, startZ, endX, endZ) {
    const segments = 60; 
    const bridgeGroup = new THREE.Group();
    for (let i = 0; i <= segments; i++) {
        const percent = i / segments;
        const xPos = startX + (endX - startX) * percent;
        const zPos = startZ + (endZ - startZ) * percent;
        const heightBoost = Math.sin(percent * Math.PI) * 250; 
        const part = new THREE.Mesh(new THREE.BoxGeometry(2500, 60, tileSize/segments + 100), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        part.position.set(xPos, 1530 + heightBoost, zPos);
        if(i < segments) part.lookAt(startX + (endX-startX)*((i+1)/segments), 1530 + Math.sin(((i+1)/segments)*Math.PI)*250, startZ + (endZ-startZ)*((i+1)/segments));
        bridgeGroup.add(part);
        groundObjects.push(part);
    }
    scene.add(bridgeGroup);
}

for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
        if (z < 1) createCurvedBridge(x * tileSize, z * tileSize, x * tileSize, (z + 1) * tileSize);
        if (x < 1) createCurvedBridge(x * tileSize, z * tileSize, (x + 1) * tileSize, z * tileSize);
    }
}

// ==========================================
// [নতুন আপডেট: ইঞ্জিনের বাস্তব শব্দ (Audio)]
// ==========================================
const listener = new THREE.AudioListener();
camera.add(listener);
const engineSound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

// দ্রষ্টব্য: আপনার প্রজেক্ট ফোল্ডারে 'engine.mp3' নামে একটি সাউন্ড ফাইল রাখতে হবে
audioLoader.load('engine.mp3', function(buffer) {
    engineSound.setBuffer(buffer);
    engineSound.setLoop(true);
    engineSound.setVolume(0.2); // আইডল অবস্থায় ভলিউম কম
    engineSound.play();
}, undefined, function(err) {
    console.log("ইঞ্জিনের সাউন্ড ফাইল (engine.mp3) পাওয়া যায়নি।");
});
// ==========================================

const loader = new GLTFLoader();
let car, previousCarPosition = new THREE.Vector3(), wheelParts = []; 
const rotSpeed = 2; // আপনার সফল মান

loader.load('futuristic_city.glb', (gltf) => {
    const city = gltf.scene;
    for(let x = -1; x <= 1; x++) {
        for(let z = -1; z <= 1; z++) {
            const clone = city.clone();
            clone.position.set(x * tileSize, 0, z * tileSize); 
            scene.add(clone);
            groundObjects.push(clone);
        }
    }

    loader.load('rayfield-caliburn_3d_model.glb', (gltfCar) => {
        car = gltfCar.scene;
        car.scale.set(80, 80, 80);
        car.position.set(3650, 1537, 4200); 
        previousCarPosition.copy(car.position);

        car.traverse((object) => {
            const name = object.name.toLowerCase();
            if (name.includes('wheel') || name.includes('tire') || 
                name.includes('rim') || name.includes('hub') || 
                name.includes('rubber')) {
                wheelParts.push(object);
            }
        });

        scene.add(car);
        camera.position.set(3650, 1650, 4800); 
        controls.target.copy(car.position);
        document.getElementById('loader').style.display = 'none';
    });
});

const keys = { forward: false, backward: false, left: false, right: false };
const setupButton = (id, key) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; }, { passive: false });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; }, { passive: false });
};
setupButton('btn-up', 'forward'); setupButton('btn-down', 'backward');
setupButton('btn-left', 'left'); setupButton('btn-right', 'right');

function animate() {
    requestAnimationFrame(animate);

    // --- দিন-রাত, সূর্য/চাঁদের পূর্ব-পশ্চিম ঘূর্ণন এবং ঘড়ির সময় ---
    time += 1/60; 
    const progress = (time % totalCycle) / totalCycle;
    const angle = progress * Math.PI * 2;

    const orbitRadius = 600000;
    // Math.sin(angle) X-অক্ষে (পূর্ব-পশ্চিম) এবং Math.cos(angle) Y-অক্ষে (উদয়-অস্ত)
    sunMesh.position.set(Math.sin(angle) * orbitRadius, Math.cos(angle) * orbitRadius, -150000);
    sunLight.position.copy(sunMesh.position);
    
    // চাঁদ ঠিক সূর্যের উল্টো দিকে
    moonMesh.position.set(-sunMesh.position.x, -sunMesh.position.y, -150000);

    // বড় ঘড়ির সময় আপডেট
    let hours = Math.floor(progress * 24);
    let mins = Math.floor((progress * 24 % 1) * 60);
    clockUI.innerText = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    // দিন ও রাতের আকাশ পরিবর্তন
    if (sunMesh.position.y > 0) {
        scene.background = new THREE.Color(0x55aaff).multiplyScalar(Math.max(0.2, sunMesh.position.y / orbitRadius));
        stars.visible = false;
        sunLight.intensity = 2.5;
    } else {
        scene.background = new THREE.Color(0x010103);
        stars.visible = true;
        sunLight.intensity = 0;
    }
    // -------------------------------------------------------------

    if (car) {
        const moveSpeed = 100;
        
        // ইঞ্জিনের শব্দ নিয়ন্ত্রণ (গাড়ি চললে শব্দ বাড়বে)
        if (engineSound.isPlaying) {
            if (keys.forward || keys.backward) {
                engineSound.setVolume(1.0); // ফুল ভলিউম
                engineSound.setPlaybackRate(1.2); // ইঞ্জিনের স্পিড বেশি
            } else {
                engineSound.setVolume(0.2); // আইডল ভলিউম
                engineSound.setPlaybackRate(0.8); // আইডল স্পিড
            }
        }

        if (keys.forward) {
            car.translateZ(moveSpeed);
            wheelParts.forEach(part => part.rotateY(-rotSpeed)); 
        }
        if (keys.backward) {
            car.translateZ(-moveSpeed);
            wheelParts.forEach(part => part.rotateY(rotSpeed));
        }

        if (keys.left) car.rotation.y += 0.04;
        if (keys.right) car.rotation.y -= 0.04;

        document.getElementById('speed-val').innerText = keys.forward || keys.backward ? "330" : "0";

        raycaster.set(car.position.clone().add(new THREE.Vector3(0, 500, 0)), downVector);
        const intersects = raycaster.intersectObjects(groundObjects, true);
        if (intersects.length > 0) {
            car.position.y = intersects[0].point.y + 3;
        }

        const delta = new THREE.Vector3().subVectors(car.position, previousCarPosition);
        camera.position.add(delta);
        controls.target.copy(car.position);
        previousCarPosition.copy(car.position);
    }
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
