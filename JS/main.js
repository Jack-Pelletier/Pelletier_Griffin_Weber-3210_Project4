
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



  // 5. Detect Table Height
  let tableHeight = 3;

  // Find the highest horizontal surface near the center of the table
  const raycaster = new THREE.Raycaster();

  const rayOrigin = new THREE.Vector3(0, 100, 0);
  const rayDirection = new THREE.Vector3(0, -1, 0);

  raycaster.set(rayOrigin, rayDirection);

  // Only test meshes belonging to the table area
  const tableMeshes = [];

  scene.traverse((object) => {

    if (object.isMesh) {

      const box = new THREE.Box3().setFromObject(object);

      // Ignore objects far above the tabletop
      if (box.max.y < 20 && box.min.y > -20) {
        tableMeshes.push(object);
      }

    }

  });

  const intersections = raycaster.intersectObjects(tableMeshes, true);

  if (intersections.length > 0) {

    tableHeight = intersections[0].point.y;

  }

  // Small offset so cards sit above the surface
  tableHeight += 0.03;



  // 6. Create Deck
  const deck = [];

  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];

  const values = [
    'A', '2', '3', '4', '5', '6', '7',
    '8', '9', '10', 'J', 'Q', 'K'
  ];

  // Create all 52 cards
  for (const suit of suits) {

    for (const value of values) {

      const card = new Card(value, suit);

      deck.push(card);

    }
  }

  // Automatically shuffle the deck
  function shuffleDeck() {

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {

      const j = Math.floor(Math.random() * (i + 1));

      [deck[i], deck[j]] = [deck[j], deck[i]];

    }

  }

  shuffleDeck();

  // Position cards into a physical stack
  const cardSpacing = 0.045;
  const deckX = -2;
  const pileX = 2;

  // Card centers must be half a card thickness above the table
  const cardBaseHeight = tableHeight + 0.02;

  deck.forEach((card, index) => {

    // Lay each card face down
    card.mesh.rotation.x = Math.PI / 2;

    // Stack cards vertically above the table
    card.setPosition(deckX, cardBaseHeight + index * cardSpacing, 0);

    card.addToScene(scene);

    // Enable shadows on cards
    card.mesh.castShadow = true;
    card.mesh.receiveShadow = true;

  });



  // 7. Card Animation
  let dealtCount = 0;

  const clock = new THREE.Clock();

  // Prevent multiple card movements during animation
  let isAnimating = false;
  let animationTime = 0;
  const animationDuration = 0.6;

  let movingCard = null;

  // Move cards from face-down deck to face-up pile
  window.addEventListener('keydown', (event) => {

    if (event.code === 'ArrowRight' && !isAnimating) {

      if (dealtCount < deck.length) {

        movingCard = deck[deck.length - 1 - dealtCount];

        isAnimating = true;
        animationTime = 0;

      }

    }

  });

  // Animate card movement and flipping
  function updateCards(deltaTime) {

    if (!isAnimating || movingCard === null) {
      return;
    }

    animationTime += deltaTime;

    const progress = Math.min(
      animationTime / animationDuration,
      1
    );

    // Smooth animation
    const smoothProgress =
      progress * progress * (3 - 2 * progress);

    const mesh = movingCard.mesh;

    const cardIndex = deck.indexOf(movingCard);

    const dealtIndex = deck.length - 1 - cardIndex;

    const startX = deckX;
    const endX = pileX;

    const startY = cardBaseHeight + cardIndex * cardSpacing;
    const endY = cardBaseHeight + dealtIndex * cardSpacing;

    // Move horizontally between piles
    mesh.position.x =
      startX + (endX - startX) * smoothProgress;

    // Lift card during movement
    mesh.position.y =
      startY +
      (endY - startY) * smoothProgress +
      Math.sin(progress * Math.PI) * 1.5;

    // Flip card during movement
    mesh.rotation.x =
      Math.PI / 2 - Math.PI * smoothProgress;

    // Finish movement
    if (progress >= 1) {

      mesh.position.set(endX, endY, 0);
      mesh.rotation.x = -Math.PI / 2;

      dealtCount++;

      isAnimating = false;
      movingCard = null;

    }

  }



  // 8. Animation Loop
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



  // 9. Window Resize
  window.addEventListener('resize', () => {

    const aspect = window.innerWidth / window.innerHeight;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

  });

});
