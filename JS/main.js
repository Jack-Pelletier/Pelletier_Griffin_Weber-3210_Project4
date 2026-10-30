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
  const deckX = -4;
  const deckZ = 3;
  let activeMove = null;
  const playerHands=[
   [],
   [],
   []

  ];

  const playerCardCounts = [0, 0, 0];

  const players = [
    { x: -3, z: -2 },
    { x: 0, z: 3 },
    { x: 3, z: -2 }
];

  const playPostions = [
      { x: -1.5, z: 0 },
    { x: 0, z: 0 },
    { x: 1.5, z: 0 }
  ];

const cardBaseHeight = tableHeight + 0.02;

  deck.forEach((card, index) => {
    card.mesh.rotation.x = Math.PI / 2;
    card.setPosition(deckX, cardBaseHeight + index * cardSpacing, deckZ);
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
  

  let cardStartPosition = new THREE.Vector3();
  let cardEndPosition = new THREE.Vector3();

let cardPot = [];
let faceUpCards = [];

let moveQueue = [];
let queueCallBack = null;

let gameOver = false;

function getCardRank(card){

const rankValues = {
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 6,
        '7': 7,
        '8': 8,
        '9': 9,
        '10': 10,
        'J': 11,
        'Q': 12,
        'K': 13,
        'A': 14
};
return rankValues[card.value];

}


function getActivePlayerrs(){
  return playerHands.map((hand, index) => hand.length > 0 ? index : -1).filter(index => index !== -1);
}

function startQueue(actions, onComplete){
  moveQueue = actions;
  queueCallBack = onComplete;
  isAnimating = true;
  startNextMove();
}

function startNextMove(){
  if(moveQueue.length === 0){
    activeMove = null;
    movingCard = null;
    isAnimating = false;

    const callBack = queueCallBack;
    queueCallBack = null;

    if(callBack){
      callBack();
    }
    return;
  }

  activeMove = moveQueue.shift();
  movingCard = activeMove.card;

  cardStartPosition.copy(movingCard.mesh.position);
  cardEndPosition.copy(activeMove.target);

  animationTime = 0;
}

  function updateCards(deltaTime) {
    if (!isAnimating || activeMove === null) return;

    animationTime += deltaTime;
    const progress = Math.min(animationTime / animationDuration, 1);
    const smoothProgress = progress * progress * (3 - 2 * progress);

    const mesh = movingCard.mesh;
mesh.position.x =
  cardStartPosition.x +
  (cardEndPosition.x - cardStartPosition.x) * smoothProgress;

mesh.position.z =
  cardStartPosition.z +
  (cardEndPosition.z - cardStartPosition.z) * smoothProgress;

mesh.position.y =
  cardStartPosition.y +
  (cardEndPosition.y - cardStartPosition.y) * smoothProgress + Math.sin(progress * Math.PI) * 0.7;

    //keeps cards face down
    
    if (progress >= 1) {
      mesh.position.copy(cardEndPosition);
      mesh.rotation.x = activeMove.faceUp ? -Math.PI / 2 : Math.PI / 2;

    startNextMove();
    }
  }
//card dealing 

function dealCards(){

  if(dealtCount >= deck.length){
    return;
  }

  const actions = [];
  const cardsToDeal = [];
  
  const pendingCards = [0, 0, 0];

  for(let i = dealtCount; i < deck.length; i++){
    const playerIndex = i % playerHands.length;

   const card = deck[deck.length - 1 - i]; 

    
  const player = players[playerIndex];

  const stackHeight = cardBaseHeight + (playerHands[playerIndex].length + pendingCards[playerIndex])* cardSpacing;

  const target = new THREE.Vector3(player.x, stackHeight, player.z);

    actions.push({
      card: card,
      target: target,
      faceUp: false
    });

    cardsToDeal.push({
      playerIndex: playerIndex,
      card: card
    });
    pendingCards[playerIndex]++;
  }

  dealtCount = deck.length;

  startQueue(actions, () => {

    cardsToDeal.forEach(deal =>{

    playerHands[deal.playerIndex].push(deal.card);  
    });

 
  playerHands.forEach((hand, index) =>{

  playerCardCounts[index] = hand.length;   
  });
 
  
});

}

function roundStart(){
  if (gameOver) return;

  const activePlayers = getActivePlayerrs();

  if(activePlayers.length <= 1){
    endGame(activePlayers[0]);
    return;
  }


cardPot = [];
faceUpCards = [];

const actions = [];

activePlayers.forEach(playerIndex =>{
  const card = playerHands[playerIndex].pop();
  playerCardCounts[playerIndex]--;
  cardPot.push(card);

  faceUpCards.push({
    playerIndex: playerIndex,
    card: card
  });

  const position = playPostions[playerIndex];

  actions.push({
    card: card,

    target: new THREE.Vector3(
      position.x,
      cardBaseHeight + cardPot.length * 0.003,
      position.z
    ),
    faceUp : true
  });

});

startQueue(actions, resolveRound);
}

function resolveRound(){
  if(faceUpCards.length === 0)return;
  let highestRank = -1;

faceUpCards.forEach(play =>{
  const rank = getCardRank(play.card);

  if(rank > highestRank){
    highestRank = rank;
  }
});
    const tiedPlayers = faceUpCards.filter(play =>
      getCardRank(play.card) === highestRank
    );

if(tiedPlayers.length ===1){
  const winner = tiedPlayers[0].playerIndex;

  awardPot(winner);

  return;
}
beginWar();
}
//begins the war incase of a tie in the play 
function beginWar() { 
  const actions = [];
  faceUpCards = [];
  const eligiblePlayers = [];

  playerHands.forEach((hand, playerIndex) =>{

    if(hand.length === 0){
    return; 
    }
 eligiblePlayers.push(playerIndex);

const position = playPostions[playerIndex];

 if(hand.length >= 2){
      const faceDownCard = hand.pop();
      playerCardCounts[playerIndex]--;
      cardPot.push(faceDownCard);
 

      actions.push({
        card: faceDownCard,

        target: new THREE.Vector3(position.x, cardBaseHeight + cardPot.length * 0.003, position.z
        ),
        faceUp: false
      });
    }

    const faceUpCard = hand.pop();
    playerCardCounts[playerIndex]--;
    cardPot.push(faceUpCard);
    faceUpCards.push({
      playerIndex: playerIndex,
      card: faceUpCard
    });
  
    actions.push({
      card: faceUpCard,
      target: new THREE.Vector3(position.x, cardBaseHeight + cardPot.length * 0.003, position.z
      ),
      faceUp: true
    });
  });

  if(eligiblePlayers.length === 1){

    awardPot(eligiblePlayers[0]);
return;
  }

  if(eligiblePlayers.length === 0){
    return;
  }
  startQueue(actions, resolveRound);
}

function awardPot(winnerIndex){
  const winnerHand = playerHands[winnerIndex];
  const winnerPosition = players[winnerIndex];

  const wonCards = [... cardPot];
  winnerHand.forEach((card, index) => {
    card.mesh.position.set(winnerPosition.x, cardBaseHeight + (index + wonCards.length) * cardSpacing, winnerPosition.z);
  });

winnerHand.unshift(...wonCards);
playerCardCounts[winnerIndex] = winnerHand.length;
const actions = [];

wonCards.forEach((card, index) => {
  actions.push({
    card: card,
    target: new THREE.Vector3(winnerPosition.x, cardBaseHeight + index * cardSpacing, winnerPosition.z),
    faceUp: false
  });
});
cardPot = [];
faceUpCards = [];

startQueue(actions, () =>
{
  const remainingPlayers = getActivePlayerrs();

  if(remainingPlayers.length === 1){
    endGame(remainingPlayers[0]);
    
  }
});

}

function endGame(winnerIndex){
  gameOver = true;
  if(winnerIndex === undefined){
    return;

  }
  console.log("player " + (winnerIndex + 1) + " wins!!!");
}

window.addEventListener('keydown', (event) => {

    if (event.key.toLowerCase() !== 'n') return;

    if (isAnimating) return;

    if (gameOver) return;

    if (dealtCount < deck.length) {

        dealCards();

    } else {

  
        roundStart();
    }
});





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