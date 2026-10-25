window.addEventListener('DOMContentLoaded', () => {

  // 1. Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a24);



  // 2. Camera setup
  const camera = createPerspectiveCamera();



  // 3. Renderer setup
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  document.body.appendChild(renderer.domElement);



  // 4. Studio Lighting
  const ambientLight = new THREE.AmbientLight(
    0xffffff,
    0.8
  );
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(
    0xffffff,
    1.2
  );

  mainLight.position.set(5, 10, 7);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(
    0x446688,
    0.6
  );

  fillLight.position.set(-5, -5, -5);
  scene.add(fillLight);



  // 5. Animation Loop
  function animate() {

    requestAnimationFrame(animate);

    renderer.render(
      scene,
      camera
    );
  }

  animate();



  // 6. Window Resize
  window.addEventListener('resize', () => {

    const aspect = window.innerWidth / window.innerHeight;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

  });

});