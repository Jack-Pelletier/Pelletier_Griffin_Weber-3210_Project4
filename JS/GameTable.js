class GameTable {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    // movement state for WASD
    this.keys = { w: false, a: false, s: false, d: false };

    // toggle states
    this.ambientOn = true;
    this.pointLightOn = true;
    this.shadowsOn = true;

    // object references
    this.beeGroup = new THREE.Group();
    this.wings = []; // array to store the wing references
    this.pointLight = null;
    this.ambientLight = null;
    this.sunLight = null;
    this.allMeshes = [];

    this.init();
    this.setupControls();
  }

  init() {
    this.createGrass();
    this.createTable();
    this.createSun();
    this.createBee();
    this.setupLighting();
  }

  // creates the glass plane
  createGrass() {
    const grassGeo = new THREE.PlaneGeometry(100, 100);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x3a7d34,
      roughness: 0.9,
      metalness: 0.1
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = 0;
    grass.receiveShadow = true;
    this.scene.add(grass);
    this.allMeshes.push(grass);
  }

  // create the table the card game is on
  createTable() {
    const tableGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.5 });

    // table top
    const topGeo = new THREE.CylinderGeometry(8, 8, 0.4, 64);
    const top = new THREE.Mesh(topGeo, woodMat);
    top.position.y = 4;
    top.castShadow = true;
    top.receiveShadow = true;
    tableGroup.add(top);

    // table rim
    const rimGeo = new THREE.TorusGeometry(8, 0.25, 16, 64);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 4.2;
    rim.castShadow = true;
    rim.receiveShadow = true;
    tableGroup.add(rim);

    // table leg
    const legGeo = new THREE.CylinderGeometry(0.5, 0.6, 3.8, 32);
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.y = 1.9;
    leg.castShadow = true;
    leg.receiveShadow = true;
    tableGroup.add(leg);

    // circular base
    const baseGeo = new THREE.CylinderGeometry(3, 3.2, 0.3, 32);
    const base = new THREE.Mesh(baseGeo, woodMat);
    base.position.y = 0.15;
    base.castShadow = true;
    base.receiveShadow = true;
    tableGroup.add(base);
        tableGroup.scale.set(1.25, 1, 1.25);
        this.scene.add(tableGroup);
    tableGroup.traverse((child) => {
      if (child.isMesh) this.allMeshes.push(child);
    });
  }

  // creates the sun
  createSun() {
    const sunGeo = new THREE.SphereGeometry(2.5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(20, 25, -20);
    this.scene.add(sunMesh);

    // the sun directional light
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.sunLight.position.copy(sunMesh.position);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;

    const d = 15;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
  }

  // create the bee
  createBee() {
    const beeGroup = new THREE.Group();
    beeGroup.position.set(0, 12, 0);

    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xddffff, transparent: true, opacity: 0.65, roughness: 0.1 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xd91414, roughness: 0.3 });

    // bee body
    const bodyGeo = new THREE.SphereGeometry(1, 32, 32);
    const body = new THREE.Mesh(bodyGeo, yellowMat);
    body.scale.set(1.3, 1, 1);
    body.castShadow = true;
    beeGroup.add(body);

    // bee stripes
    for (let offset of [-0.3, 0.3]) {
      const stripeGeo = new THREE.CylinderGeometry(1, 1, 0.225, 32);
      const stripe = new THREE.Mesh(stripeGeo, blackMat);
      stripe.rotation.z = Math.PI / 2;
      stripe.rotation.y = offset * 0.2;
      stripe.position.x = offset;
      stripe.castShadow = true;
      beeGroup.add(stripe);
    }

    // bee stinger
    const stingerGeo = new THREE.ConeGeometry(0.35, 0.75, 16);
    const stinger = new THREE.Mesh(stingerGeo, blackMat);
    stinger.rotation.y = Math.PI;
    stinger.rotation.z = -Math.PI / 2;
    stinger.position.set(-1.5, 0, 0);
    stinger.castShadow = true;
    beeGroup.add(stinger);

    // bee eyeballs and pupils
    for (let zSide of [-1, 1]) {
      const eyeGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const eye = new THREE.Mesh(eyeGeo, whiteMat);
      eye.position.set(1, 0.3, zSide * 0.45);
      beeGroup.add(eye);

      const pupilGeo = new THREE.SphereGeometry(0.15, 18, 18);
      const pupil = new THREE.Mesh(pupilGeo, blackMat);
      pupil.position.set(1.15, 0.35, zSide * 0.55);
      beeGroup.add(pupil);
    }

    // bee antennae
    for (let zSide of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.8, 0.6, zSide * 0.2),
        new THREE.Vector3(1.1, 1.1, zSide * 0.4),
        new THREE.Vector3(1.3, 1.4, zSide * 0.5)
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.04, 8, false);
      const tube = new THREE.Mesh(tubeGeo, blackMat);
      beeGroup.add(tube);

      const tipGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const tip = new THREE.Mesh(tipGeo, blackMat);
      tip.position.set(1.3, 1.4, zSide * 0.5);
      beeGroup.add(tip);
    }

    // bee wings
    this.wings = [];
    const wingPositions = [
      { x: 0.1, z: 0.6, ry: Math.PI / 4, rz: Math.PI / 6 },
      { x: -0.3, z: 0.6, ry: Math.PI / 6, rz: Math.PI / 6 },
      { x: 0.1, z: -0.6, ry: -Math.PI / 4, rz: Math.PI / 6 },
      { x: -0.3, z: -0.6, ry: -Math.PI / 6, rz: Math.PI / 6 }
    ];

    wingPositions.forEach((pos) => {
      const wingGeo = new THREE.CylinderGeometry(0.05, 0.45, 1.4, 16);
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.scale.set(1, 0.05, 1);
      wing.position.set(pos.x, 0.8, pos.z);
      wing.rotation.y = pos.ry;
      wing.rotation.z = pos.rz;

      // animation calculation helpers
      wing.userData = {
        baseRx: 0,
        baseRz: pos.rz,
        side: pos.z > 0 ? 1 : -1
      };

      beeGroup.add(wing);
      this.wings.push(wing);
    });

    // ribbon and bow
    const ribbonGeo = new THREE.TorusGeometry(1.02, 0.05, 16, 32);
    const ribbon = new THREE.Mesh(ribbonGeo, redMat);
    ribbon.rotation.y = Math.PI / 2;
    beeGroup.add(ribbon);

    // loop
    for (let zSide of [-1, 1]) {
      const bowLoopGeo = new THREE.TorusGeometry(0.25, 0.04, 16, 32);
      const bowLoop = new THREE.Mesh(bowLoopGeo, redMat);
      bowLoop.position.set(0, 1.25, zSide * 0.2);
      bowLoop.rotation.x = zSide * (Math.PI / 4); // loop facing wrong way fix(?)
      beeGroup.add(bowLoop);
    }

    // knot
    const knotGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const knot = new THREE.Mesh(knotGeo, redMat);
    knot.position.set(0, 1.1, 0);
    beeGroup.add(knot);

    // suspended light
    const stringGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.2, 8);
    const stringMesh = new THREE.Mesh(stringGeo, redMat);
    stringMesh.position.set(0, -1.1, 0);
    beeGroup.add(stringMesh);

    // light shade
    const shadeGeo = new THREE.ConeGeometry(0.4, 0.4, 16, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.DoubleSide });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(0, -2.2, 0);
    beeGroup.add(shade);

    // lightbulb
    const bulbGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff5cc });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(0, -2.25, 0);
    beeGroup.add(bulb);

    // the point light
    this.pointLight = new THREE.PointLight(0xfff5cc, 3.5, 20);
    this.pointLight.position.set(0, -2.3, 0);
    this.pointLight.castShadow = true;
    this.pointLight.shadow.mapSize.width = 1024;
    this.pointLight.shadow.mapSize.height = 1024;
    this.pointLight.shadow.bias = -0.002;
    beeGroup.add(this.pointLight);

    this.scene.add(beeGroup);
    this.beeGroup = beeGroup;

    beeGroup.traverse((child) => {
      if (child.isMesh) this.allMeshes.push(child);
    });
  }

  setupLighting() {
    // moody blue
    this.ambientLight = new THREE.AmbientLight(0x2b3e66, 0.8);
    this.scene.add(this.ambientLight);
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k in this.keys) this.keys[k] = true;

      // toggle point light (with P)
      if (k === 'p') {
        this.pointLightOn = !this.pointLightOn;
        this.pointLight.visible = this.pointLightOn;
      }

      // toggle ambient light (with L)
      if (k === 'l') {
        this.ambientOn = !this.ambientOn;
        this.ambientLight.visible = this.ambientOn;
      }

      // toggle shadows (with M)
      if (k === 'm') {
        this.shadowsOn = !this.shadowsOn;
        this.renderer.shadowMap.enabled = this.shadowsOn;
        this.allMeshes.forEach((mesh) => {
          mesh.castShadow = this.shadowsOn;
          mesh.receiveShadow = this.shadowsOn;
        });
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k in this.keys) this.keys[k] = false;
    });
  }

  update() {
    const speed = 0.12;

    // determine direction vector from WASD
    let moveX = 0;
    let moveZ = 0;
    if (this.keys.w) moveZ -= 1;
    if (this.keys.s) moveZ += 1;
    if (this.keys.a) moveX -= 1;
    if (this.keys.d) moveX += 1;

    // move & rotate bee toward movement direction
    if (moveX !== 0 || moveZ !== 0) {
      // normalize diagonal speed
      const len = Math.hypot(moveX, moveZ);
      const dx = (moveX / len) * speed;
      const dz = (moveZ / len) * speed;

      this.beeGroup.position.x += dx;
      this.beeGroup.position.z += dz;

      // smooth turn bee toward movement direction
      const targetAngle = Math.atan2(-dz, dx);
      let diff = targetAngle - this.beeGroup.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // shortest rotation angle
      this.beeGroup.rotation.y += diff * 0.18;
    }

    // wing flying animation
    const time = performance.now() * 0.025; // flap of the wings
    this.wings.forEach((wing) => {
      const flap = Math.sin(time) * 0.3; // flap amplitude
      wing.rotation.z = wing.userData.baseRz + flap;
      wing.rotation.x = flap * wing.userData.side * 0.4;
    });
  }
}