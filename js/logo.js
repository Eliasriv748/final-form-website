const logo = document.getElementById("logo");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (logo && !reduceMotion) {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let time = 0;

  window.addEventListener("pointermove", (event) => {
    targetY = ((event.clientX - window.innerWidth / 2) / (window.innerWidth / 2)) * 9;
    targetX = -((event.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) * 6;
  });

  function tick() {
    time += 0.015;
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    logo.style.transform = `translateY(${Math.sin(time) * 5}px) rotateZ(${Math.sin(time * 0.7)}deg) rotateX(${currentX}deg) rotateY(${currentY}deg)`;
    requestAnimationFrame(tick);
  }
  tick();
}
