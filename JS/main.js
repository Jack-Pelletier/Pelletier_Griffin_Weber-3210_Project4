window.addEventListener('DOMContentLoaded', () => {

  // 1. Scene setup
  const scene = new THREE.Scene();

  // 2. Camera setup
  // Uses your custom createPerspectiveCamera() function if defined, otherwise falls back to a standard camera
  const camera = typeof createPerspectiveCamera === 'function' 
    ? createPerspectiveCamera() 
    : new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  if (typeof createPerspectiveCamera !== 'function') {
    camera.position.set(0, 12, 16);
    camera.lookAt(0, 3, 0);
  }

  // 3. Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Enable shadows required for GameTable
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);

  // 4. Instantiate Scenery (GameTable handles ambient, sun, and bee point lights)
  const gameTable = new GameTable(scene, renderer);

  // Instantiate SkyBox if SkyBox.js defines SkyBox globally
  if (typeof SkyBox !== 'undefined') {
    const skyBox = new SkyBox(scene);
  }

  // 5. Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    // Update WASD bee/point light movement
    gameTable.update();

    renderer.render(scene, camera);
  }

  animate();

  // 6. Window Resize
  window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  });

});