// js/logo.js
const logo = document.getElementById('logo');
if (!logo) throw new Error('logo element not found');

let targetRX = 0, targetRY = 0;
let currentRX = 0, currentRY = 0;

window.addEventListener('mousemove', (e) => {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  targetRY =  ((e.clientX - cx) / cx) * 12;
  targetRX = -((e.clientY - cy) / cy) * 8;
});

function lerp(a, b, t) { return a + (b - a) * t; }

function applyTransform(floatY, floatRot, rx, ry) {
  logo.style.transform = [
    `translateY(${floatY}px)`,
    `rotateZ(${floatRot}deg)`,
    `rotateX(${rx}deg)`,
    `rotateY(${ry}deg)`,
  ].join(' ');
}

let iT = 0;
function combinedTick() {
  iT += 0.015;
  currentRX = lerp(currentRX, targetRX, 0.06);
  currentRY = lerp(currentRY, targetRY, 0.06);
  const floatY   = Math.sin(iT) * 6;
  const floatRot = Math.sin(iT * 0.7) * 1.5;
  applyTransform(floatY, floatRot, currentRX, currentRY);
  requestAnimationFrame(combinedTick);
}
combinedTick();
