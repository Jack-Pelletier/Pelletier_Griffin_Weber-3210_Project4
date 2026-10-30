
class Card {

    //Shared texture for the back of every card
    static backTexture = null;

    constructor(value, suit) {

        this.value = value;
        this.suit = suit;

        // Card dimensions
        this.width = 2;
        this.height = 3;
        this.depth = 0.04;

        // Create card textures
        this.frontTexture = this.createFrontTexture();

        if (Card.backTexture === null) {
            Card.backTexture = this.createBackTexture();
        }

        // Create rectangular card geometry
        const geometry = new THREE.BoxGeometry(
            this.width,
            this.height,
            this.depth
        );

        // Dark material for card edges
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8
        });

        const frontMaterial = new THREE.MeshStandardMaterial({
            map: this.frontTexture,
            roughness: 0.7
        });

        const backMaterial = new THREE.MeshStandardMaterial({
            map: Card.backTexture,
            roughness: 0.7
        });

        // BoxGeometry material order:
        // Right, Left, Top, Bottom, Front, Back
        const materials = [
            edgeMaterial,
            edgeMaterial,
            edgeMaterial,
            edgeMaterial,
            frontMaterial,
            backMaterial
        ];

        this.mesh = new THREE.Mesh(geometry, materials);

        // Add dark outline around the card
        const edges = new THREE.EdgesGeometry(geometry);

        const outlineMaterial = new THREE.LineBasicMaterial({
            color: 0x111111
        });

        const outline = new THREE.LineSegments(
            edges,
            outlineMaterial
        );

        this.mesh.add(outline);

        if (['J', 'Q', 'K'].includes(this.value)) {

            const faceCardNames = {
                J: 'Jack',
                Q: 'Queen',
                K: 'King'
            };

            const cardName = `${faceCardNames[this.value]} of ${this.suit}`;

            const imageData = typeof faceCardImages !== 'undefined'
                ? faceCardImages[cardName]
                : null;

            if (imageData) {

                const textureLoader = new THREE.TextureLoader();

                textureLoader.load(
                    imageData,
                    (texture) => {

                        texture.colorSpace = THREE.SRGBColorSpace;

                        frontMaterial.map = texture;
                        frontMaterial.needsUpdate = true;

                        this.frontTexture = texture;

                    },
                    undefined,
                    (error) => {

                        console.error('Failed to load:', cardName, error);

                    }
                );

            } else {

                console.error('Missing face card:', cardName);

            }
        }
    }

    // Create front texture based on card value and suit
    createFrontTexture() {

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 384;

        const card = canvas.getContext('2d');

        // White card background
        card.fillStyle = '#f8f8f4';
        card.fillRect(0, 0, 256, 384);

        // Dark border
        card.strokeStyle = '#222222';
        card.lineWidth = 5;
        card.strokeRect(8, 8, 240, 368);

        const symbols = {
            Hearts: '♥',
            Diamonds: '♦',
            Clubs: '♣',
            Spades: '♠'
        };

        const symbol = symbols[this.suit];

        card.fillStyle =
            (this.suit === 'Hearts' || this.suit === 'Diamonds')
            ? '#cc0000' : '#111111';

        // Top-left value and suit
        card.font = 'bold 48px Arial';
        card.textAlign = 'left';
        card.fillText(this.value, 20, 55);

        card.font = '42px Arial';
        card.fillText(symbol, 20, 100);

        // Center suit symbol
        const cardNumber = parseInt(this.value);

        if (this.value === 'A' || isNaN(cardNumber)) {

            card.font = '130px Arial';
            card.textAlign = 'center';
            card.fillText(symbol, 128, 240);

        } else {

            card.font = '55px Arial';
            card.textAlign = 'center';
            card.textBaseline = 'middle';

            const columns = cardNumber <= 3 ? 1 : 2;
            const rows = Math.ceil(cardNumber / columns);

            const centerX = 128;
            const centerY = 192;

            const spacingX = 75;
            const spacingY = Math.min(65, 250 / Math.max(rows - 1, 1));

            for (let i = 0; i < cardNumber; i++) {

                const column = i % columns;
                const row = Math.floor(i / columns);

                let x = centerX;
                let y = centerY + (row - (rows - 1) / 2) * spacingY;

                if (columns === 2) {
                    x = centerX + (column === 0 ? -spacingX / 2 : spacingX / 2);
                }

                if (cardNumber % 2 !== 0 && i === cardNumber - 1 && columns === 2) {
                    x = centerX;
                }

                card.fillText(symbol, x, y);
            }

            card.textBaseline = 'alphabetic';
        }

        // Bottom-right value and suit
        card.save();

        card.translate(256, 384);
        card.rotate(Math.PI);

        card.textAlign = 'left';
        card.font = 'bold 48px Arial';
        card.fillText(this.value, 20, 55);

        card.font = '42px Arial';
        card.fillText(symbol, 20, 100);

        card.restore();

        return new THREE.CanvasTexture(canvas);
    }

    // Create shared back texture
    createBackTexture() {

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 384;

        const card = canvas.getContext('2d');

        // Blue card background
        card.fillStyle = '#183b80';
        card.fillRect(0, 0, 256, 384);

        // Outer border
        card.strokeStyle = '#111111';
        card.lineWidth = 6;
        card.strokeRect(5, 5, 246, 374);

        // Inner white border
        card.strokeStyle = '#ffffff';
        card.lineWidth = 5;
        card.strokeRect(15, 15, 226, 354);

        // Decorative diagonal pattern
        card.strokeStyle = '#8cb4ff';
        card.lineWidth = 2;

        for (let i = -384; i < 384; i += 20) {

            card.beginPath();
            card.moveTo(i, 0);
            card.lineTo(i + 384, 384);
            card.stroke();

        }

        // Center diamond
        card.strokeStyle = '#ffffff';
        card.lineWidth = 5;

        card.beginPath();
        card.moveTo(128, 100);
        card.lineTo(200, 192);
        card.lineTo(128, 284);
        card.lineTo(56, 192);
        card.closePath();
        card.stroke();

        return new THREE.CanvasTexture(canvas);
    }

    // Add card to scene
    addToScene(scene) {
        scene.add(this.mesh);
    }

    // Set card position
    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    // Flip card over
    flip() {
        this.mesh.rotation.y += Math.PI;
    }
}
