// js/scene.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

const canvas = document.getElementById('scene-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6ecfcf);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 8);

const sun = new THREE.DirectionalLight(0xfff8e7, 1.4);
sun.position.set(5, 10, 5);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x9fd8a0, 0.6));

const hillMat  = new THREE.MeshLambertMaterial({ color: 0x4a9c3f });
const hillMat2 = new THREE.MeshLambertMaterial({ color: 0x3a8c2f });
const hillGeo  = new THREE.SphereGeometry(12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);

const hill1 = new THREE.Mesh(hillGeo, hillMat);
hill1.position.set(0, -3, 0);
scene.add(hill1);

const hill2 = new THREE.Mesh(hillGeo, hillMat2);
hill2.position.set(-4, -3.5, -2);
scene.add(hill2);

const cloudMat   = new THREE.MeshLambertMaterial({ color: 0xffffff });
const cloudGroup = new THREE.Group();
[[0,0,0,1.2],[1.1,0.4,0,0.9],[-1,0.3,0,0.8]].forEach(([x,y,z,r]) => {
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), cloudMat);
  s.position.set(x, y, z);
  cloudGroup.add(s);
});
cloudGroup.position.set(3, 2, -3);
scene.add(cloudGroup);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let t = 0;
function animate() {
  requestAnimationFrame(animate);
  t += 0.005;
  cloudGroup.position.y = 2 + Math.sin(t) * 0.15;
  renderer.render(scene, camera);
}
animate();

export function setCameraPosition(progress) {
  camera.position.y = 2 - progress * 4;
  camera.position.z = 8 - progress * 4;
  camera.lookAt(0, -1, 0);
}
