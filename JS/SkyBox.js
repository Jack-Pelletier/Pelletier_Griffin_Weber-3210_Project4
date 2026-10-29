class SkyBox {
  constructor(scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    // create the cube
    const boxSize = 400;
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);

    // generate material for each face
    const materials = [
      this.createSkyMaterial('side', 0),   // Right (+X)
      this.createSkyMaterial('side', 1),   // Left (-X)
      this.createSkyMaterial('top'),       // Top (+Y)
      this.createSkyMaterial('bottom'),    // Bottom (-Y)
      this.createSkyMaterial('side', 2),   // Front (+Z)
      this.createSkyMaterial('side', 3)    // Back (-Z)
    ];

    // make mesh
    this.skyMesh = new THREE.Mesh(geometry, materials);
    this.scene.add(this.skyMesh);
  }

  createSkyMaterial(type, sideIndex = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);

    if (type === 'top') {
      // blue sky
      gradient.addColorStop(0, '#1a4988');
      gradient.addColorStop(1, '#3a83e6');
    } else if (type === 'bottom') {
      // ground plane
      gradient.addColorStop(0, '#759e66');
      gradient.addColorStop(1, '#3a7d34');
    } else {
      // get the sky gradient
      gradient.addColorStop(0, '#1a4988');
      gradient.addColorStop(0.55, '#569af2');
      gradient.addColorStop(0.85, '#bce3ff');
      gradient.addColorStop(0.92, '#8cb87c');
      gradient.addColorStop(1, '#3a7d34');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // adds clouds on the sides
    if (type === 'side') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      
      const offsetX = (sideIndex * 120) % 200;
      
      // first cluster
      ctx.beginPath();
      ctx.arc(100 + offsetX, 390, 60, 0, Math.PI * 2);
      ctx.arc(170 + offsetX, 375, 85, 0, Math.PI * 2);
      ctx.arc(250 + offsetX, 395, 55, 0, Math.PI * 2);
      ctx.fill();

      // second cluster
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.arc(340 + offsetX, 410, 45, 0, Math.PI * 2);
      ctx.arc(400 + offsetX, 398, 70, 0, Math.PI * 2);
      ctx.arc(460 + offsetX, 415, 50, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);

    // backside renders interior faces of the cube
    return new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide
    });
  }
}