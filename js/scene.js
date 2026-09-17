const canvas = document.getElementById("scene-canvas");

async function startScene() {
  if (!canvas) return;
  try {
    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x76cbd0);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 8);

    const sun = new THREE.DirectionalLight(0xfff8e7, 1.4);
    sun.position.set(5, 10, 5);
    scene.add(sun, new THREE.AmbientLight(0x9fd8a0, 0.6));

    const hillGeometry = new THREE.SphereGeometry(12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hillOne = new THREE.Mesh(hillGeometry, new THREE.MeshLambertMaterial({ color: 0x4e9a43 }));
    hillOne.position.set(0, -3, 0);
    const hillTwo = new THREE.Mesh(hillGeometry, new THREE.MeshLambertMaterial({ color: 0x347a34 }));
    hillTwo.position.set(-4, -3.5, -2);
    scene.add(hillOne, hillTwo);

    const clouds = new THREE.Group();
    const cloudMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    [[0, 0, 0, 1.2], [1.1, 0.4, 0, 0.9], [-1, 0.3, 0, 0.8]].forEach(([x, y, z, radius]) => {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), cloudMaterial);
      sphere.position.set(x, y, z);
      clouds.add(sphere);
    });
    clouds.position.set(3, 2, -3);
    scene.add(clouds);

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let time = 0;
    function animate() {
      time += 0.005;
      clouds.position.y = 2 + Math.sin(time) * 0.15;
      renderer.render(scene, camera);
      if (!reduceMotion) requestAnimationFrame(animate);
    }
    animate();
  } catch (error) {
    console.info("3D hero unavailable; using the static hero fallback.", error);
  }
}

startScene();
