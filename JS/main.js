window.addEventListener('DOMContentLoaded', () => {

  // 1. Scene setup
  const scene = new THREE.Scene();

  // 2. Camera setup (Elevated higher up looking down at the table)
  const camera = typeof createPerspectiveCamera === 'function' 
    ? createPerspectiveCamera() 
    : new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // Positioned higher up (Y = 18, Z = 20)
  camera.position.set(0, 18, 20);

  // Initial camera tilt facing downwards towards the table
  let pitch = -0.6;
  let yaw = 0;
  camera.rotation.set(pitch, yaw, 0, 'YXZ');

  // 3. Mouse Look & Pan Controls
  // Left Click + Drag = Look around (Rotate)
  // Right Click + Drag (or Shift + Left Drag) = Pan camera
  let isMouseDown = false;
  let mouseButton = 0;
  let prevMousePos = { x: 0, y: 0 };

  // Prevent right-click context menu from opening during pan
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseButton = e.button;
    prevMousePos = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;

    const deltaX = e.clientX - prevMousePos.x;
    const deltaY = e.clientY - prevMousePos.y;

    // Right-Click Drag OR Shift + Left-Click Drag: PAN
    if (mouseButton === 2 || (mouseButton === 0 && e.shiftKey)) {
      const panSpeed = 0.03;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();

      camera.matrix.extractBasis(right, up, new THREE.Vector3());

      camera.position.addScaledVector(right, -deltaX * panSpeed);
      camera.position.addScaledVector(up, deltaY * panSpeed);
    } 
    // Left-Click Drag: LOOK AROUND
    else if (mouseButton === 0) {
      const sensitivity = 0.003;
      yaw -= deltaX * sensitivity;
      pitch -= deltaY * sensitivity;

      const maxPitch = Math.PI / 2 - 0.05;
      pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

      camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }

    prevMousePos = { x: e.clientX, y: e.clientY };
  });

  // 4. Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Enable shadows required for GameTable
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);

  // 5. Instantiate Scenery
  const gameTable = new GameTable(scene, renderer);

  if (typeof SkyBox !== 'undefined') {
    const skyBox = new SkyBox(scene);
  }

  // 6. Detect Table Height
  let tableHeight = 3;
  const raycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3(0, 100, 0);
  const rayDirection = new THREE.Vector3(0, -1, 0);

  raycaster.set(rayOrigin, rayDirection);

  const tableMeshes = [];
  scene.traverse((object) => {
    if (object.isMesh) {
      const box = new THREE.Box3().setFromObject(object);
      if (box.max.y < 20 && box.min.y > -20) {
        tableMeshes.push(object);
      }
    }
  });

  const intersections = raycaster.intersectObjects(tableMeshes, true);
  if (intersections.length > 0) {
    tableHeight = intersections[0].point.y;
  }
  tableHeight += 0.03;

  // 7. Create Deck
  const deck = [];
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  for (const suit of suits) {
    for (const value of values) {
      const card = new Card(value, suit);
      deck.push(card);
    }
  }

  function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  shuffleDeck();

  const cardSpacing = 0.045;
  const deckX = -2;
  const pileX = 2;
  const cardBaseHeight = tableHeight + 0.02;

  deck.forEach((card, index) => {
    card.mesh.rotation.x = Math.PI / 2;
    card.setPosition(deckX, cardBaseHeight + index * cardSpacing, 0);
    card.addToScene(scene);

    card.mesh.castShadow = true;
    card.mesh.receiveShadow = true;
  });

  // 8. Card Animation & Controls
  let dealtCount = 0;
  const clock = new THREE.Clock();

  let isAnimating = false;
  let animationTime = 0;
  const animationDuration = 0.6;
  let movingCard = null;

  // ArrowRight deals a card
  window.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowRight' && !isAnimating) {
      if (dealtCount < deck.length) {
        movingCard = deck[deck.length - 1 - dealtCount];
        isAnimating = true;
        animationTime = 0;
      }
    }
  });

  function updateCards(deltaTime) {
    if (!isAnimating || movingCard === null) return;

    animationTime += deltaTime;
    const progress = Math.min(animationTime / animationDuration, 1);
    const smoothProgress = progress * progress * (3 - 2 * progress);

    const mesh = movingCard.mesh;
    const cardIndex = deck.indexOf(movingCard);
    const dealtIndex = deck.length - 1 - cardIndex;

    const startX = deckX;
    const endX = pileX;
    const startY = cardBaseHeight + cardIndex * cardSpacing;
    const endY = cardBaseHeight + dealtIndex * cardSpacing;

    mesh.position.x = startX + (endX - startX) * smoothProgress;
    mesh.position.y = startY + (endY - startY) * smoothProgress + Math.sin(progress * Math.PI) * 1.5;
    mesh.rotation.x = Math.PI / 2 - Math.PI * smoothProgress;

    if (progress >= 1) {
      mesh.position.set(endX, endY, 0);
      mesh.rotation.x = -Math.PI / 2;
      dealtCount++;
      isAnimating = false;
      movingCard = null;
    }
  }

  // 9. Main Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    // Update WASD bee/point light movement
    gameTable.update();

    // Update card flipping animation
    updateCards(deltaTime);

    renderer.render(scene, camera);
  }

  animate();

  // 10. Window Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

});