
window.addEventListener('DOMContentLoaded', () => {

  // 1. Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a24);



  // 2. Camera setup
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.set(5, 7, 10);
  camera.lookAt(0, 1, 0);



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



  // 5. Create Deck
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

  deck.forEach((card, index) => {

    // Lay each card face down
    card.mesh.rotation.x = Math.PI / 2;

    // Stack cards vertically
    card.setPosition(deckX, index * cardSpacing, 0);

    card.addToScene(scene);

  });



  // 6. Card Animation
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

    const startY = cardIndex * cardSpacing;
    const endY = dealtIndex * cardSpacing;

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



  // 7. Animation Loop
  function animate() {

    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    updateCards(deltaTime);

    renderer.render(
      scene,
      camera
    );
  }

  animate();



  // 8. Window Resize
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
