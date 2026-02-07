// POKSO Hunter V1 - Jeu complet
// Map 4096x4096, 9 zones, 15 NFTs, 7 abilities

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Créer textures procéduralement
        this.createProceduralTextures();
    }

    createProceduralTextures() {
        // Player
        const playerGfx = this.make.graphics({ x: 0, y: 0, add: false });
        playerGfx.fillStyle(0x00ff41);
        playerGfx.fillCircle(16, 16, 14);
        playerGfx.fillStyle(0xffffff);
        playerGfx.fillCircle(12, 12, 5);
        playerGfx.generateTexture('player', 32, 32);

        // NFTs par zone
        const zoneColors = [
            0x00ff00, 0x00ffff, 0xff0000, 0xff00ff, 0xffff00,
            0x00ff88, 0xff8800, 0x8800ff, 0xffffff
        ];
        
        zoneColors.forEach((color, i) => {
            const gfx = this.make.graphics({ x: 0, y: 0, add: false });
            gfx.fillStyle(color, 0.3);
            gfx.fillCircle(20, 20, 18);
            gfx.fillStyle(color);
            gfx.fillCircle(20, 20, 12);
            gfx.fillStyle(0xffffff);
            gfx.fillCircle(16, 16, 5);
            gfx.generateTexture(`nft-zone-${i}`, 40, 40);
        });

        // Tiles zones
        const zoneBgColors = [
            0x1a3d1a, 0x1a3d3d, 0x3d1a1a, 0x3d1a3d, 0x3d3d1a,
            0x1a3d2d, 0x3d2d1a, 0x2d1a3d, 0x2d2d3d
        ];
        
        zoneBgColors.forEach((color, i) => {
            const gfx = this.make.graphics({ x: 0, y: 0, add: false });
            gfx.fillStyle(color);
            gfx.fillRect(0, 0, 64, 64);
            gfx.lineStyle(2, 0xffffff, 0.1);
            gfx.strokeRect(0, 0, 64, 64);
            gfx.generateTexture(`tile-${i}`, 64, 64);
        });
    }

    async create() {
        // Setup
        this.mapSize = 4096;
        this.tileSize = 64;
        this.zones = [
            { name: 'Emerald Forest', x: 0, y: 0 },
            { name: 'Sapphire Ocean', x: 1365, y: 0 },
            { name: 'Ruby Desert', x: 2730, y: 0 },
            { name: 'Amethyst Valley', x: 0, y: 1365 },
            { name: 'Golden Canyon', x: 1365, y: 1365 },
            { name: 'Jade Swamp', x: 2730, y: 1365 },
            { name: 'Bronze Wastes', x: 0, y: 2730 },
            { name: 'Void Sector', x: 1365, y: 2730 },
            { name: 'Slate Peaks', x: 2730, y: 2730 }
        ];

        // Générer monde (async pour montrer la barre de progression)
        await this.generateWorld();
        
        // Player
        this.player = this.physics.add.sprite(2048, 2048, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.speed = 250;
        
        // Camera
        this.cameras.main.setBounds(0, 0, this.mapSize, this.mapSize);
        this.cameras.main.startFollow(this.player);
        
        // NFTs (15)
        this.nfts = this.physics.add.group();
        this.createNFTs();
        
        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // UI
        this.createUI();
        
        // Particules
        this.createParticles();
    }

    async generateWorld() {
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');
        const loadingPercent = document.getElementById('loading-percent');
        
        const totalTiles = 64 * 64;
        let loadedTiles = 0;
        
        // Generate tiles in batches to allow UI updates
        const generateBatch = (startY, batchSize) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    const endY = Math.min(startY + batchSize, 64);
                    
                    for (let y = startY; y < endY; y++) {
                        for (let x = 0; x < 64; x++) {
                            const worldX = x * this.tileSize;
                            const worldY = y * this.tileSize;
                            
                            // Déterminer zone
                            const zoneX = Math.floor(x / 22);
                            const zoneY = Math.floor(y / 22);
                            const zoneIdx = Math.min(8, zoneY * 3 + zoneX);
                            
                            this.add.image(worldX + 32, worldY + 32, `tile-${zoneIdx}`);
                            loadedTiles++;
                        }
                    }
                    
                    // Update progress
                    const progress = Math.floor((loadedTiles / totalTiles) * 100);
                    if (loadingBar) loadingBar.style.width = `${progress}%`;
                    if (loadingPercent) loadingPercent.textContent = `${progress}%`;
                    if (loadingText) loadingText.textContent = `Generating world... ${progress}%`;
                    
                    resolve();
                }, 10);
            });
        };
        
        // Generate in 8 batches of 8 rows each
        for (let batch = 0; batch < 8; batch++) {
            await generateBatch(batch * 8, 8);
        }
        
        if (loadingText) loadingText.textContent = 'Creating borders...';
        
        // Bordures zones
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff, 0.3);
        [1365, 2730].forEach(pos => {
            graphics.moveTo(pos, 0);
            graphics.lineTo(pos, this.mapSize);
            graphics.moveTo(0, pos);
            graphics.lineTo(this.mapSize, pos);
        });
        graphics.strokePath();
        
        if (loadingText) loadingText.textContent = 'Spawning NFTs...';
        
        // Hide loading screen after a brief delay
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading');
            if (loadingScreen) {
                loadingScreen.style.transition = 'opacity 0.5s';
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 300);
    }

    createNFTs() {
        const nftPositions = [
            { id: 1, x: 500, y: 500, zone: 0 },
            { id: 2, x: 2000, y: 400, zone: 1 },
            { id: 3, x: 3500, y: 600, zone: 2 },
            { id: 4, x: 400, y: 1800, zone: 3 },
            { id: 5, x: 2048, y: 2048, zone: 4 },
            { id: 6, x: 3600, y: 1700, zone: 5 },
            { id: 7, x: 600, y: 3500, zone: 6 },
            { id: 8, x: 1900, y: 3700, zone: 7 },
            { id: 9, x: 3800, y: 3800, zone: 8 },
            { id: 10, x: 1000, y: 1000, zone: 0 },
            { id: 11, x: 2800, y: 1200, zone: 2 },
            { id: 12, x: 800, y: 2500, zone: 3 },
            { id: 13, x: 3200, y: 3000, zone: 5 },
            { id: 14, x: 1500, y: 3200, zone: 7 },
            { id: 15, x: 2400, y: 1500, zone: 4 }
        ];
        
        this.nftData = {};
        
        nftPositions.forEach(nft => {
            const sprite = this.nfts.create(nft.x, nft.y, `nft-zone-${nft.zone}`);
            sprite.setData('id', nft.id);
            sprite.setData('zone', nft.zone);
            sprite.setCircle(18);
            
            // Animation flottante
            this.tweens.add({
                targets: sprite,
                y: nft.y - 15,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            this.nftData[nft.id] = { ...nft, found: false };
        });
        
        // Collision
        this.physics.add.overlap(this.player, this.nfts, (player, nft) => {
            const id = nft.getData('id');
            if (!this.nftData[id].found) {
                this.collectNFT(id);
            }
        });
    }

    createUI() {
        // Zone actuelle
        this.zoneText = this.add.text(20, 20, 'Zone: Central', {
            fontSize: '20px',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
        
        // Compteur NFTs
        this.nftText = this.add.text(20, 60, 'NFTs: 0/15', {
            fontSize: '18px',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
        
        // Contrôles
        this.add.text(20, 720, 'ARROW KEYS: Move | SPACE: Dash', {
            fontSize: '14px',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
        
        this.foundCount = 0;
    }

    createParticles() {
        // Trail joueur
        this.time.addEvent({
            delay: 50,
            callback: () => {
                if (this.player.body.speed > 10) {
                    const trail = this.add.circle(
                        this.player.x,
                        this.player.y,
                        3,
                        0x00ff41,
                        0.5
                    );
                    trail.setDepth(5);
                    this.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 0,
                        duration: 500,
                        onComplete: () => trail.destroy()
                    });
                }
            },
            loop: true
        });
    }

    collectNFT(id) {
        this.nftData[id].found = true;
        this.foundCount++;
        this.nftText.setText(`NFTs: ${this.foundCount}/15`);
        
        // Effet
        const nft = this.nfts.getChildren().find(n => n.getData('id') === id);
        if (nft) {
            this.tweens.add({
                targets: nft,
                scale: 2,
                alpha: 0,
                duration: 500,
                onComplete: () => nft.destroy()
            });
        }
        
        // Message
        this.showNotification(`NFT #${id} Found!`, `Found ${this.foundCount}/15 NFTs`);
    }

    showNotification(title, message) {
        const bg = this.add.rectangle(512, 300, 400, 120, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(200);
        
        const titleText = this.add.text(512, 270, title, {
            fontSize: '28px',
            color: '#00ff41'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        
        const msgText = this.add.text(512, 320, message, {
            fontSize: '18px',
            color: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        
        this.time.delayedCall(2000, () => {
            bg.destroy();
            titleText.destroy();
            msgText.destroy();
        });
    }

    update() {
        // Détection zone
        this.updateZone();
        
        // Mouvement
        this.handleMovement();
        
        // Dash
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.dash();
        }
    }

    updateZone() {
        const px = this.player.x;
        const py = this.player.y;
        
        const zoneX = Math.floor(px / 1365);
        const zoneY = Math.floor(py / 1365);
        const zoneIdx = Math.min(8, zoneY * 3 + zoneX);
        
        if (this.currentZone !== zoneIdx) {
            this.currentZone = zoneIdx;
            this.zoneText.setText(`Zone: ${this.zones[zoneIdx].name}`);
            this.zoneText.setColor(['#0f0', '#0ff', '#f00', '#f0f', '#ff0', '#0f8', '#f80', '#80f', '#fff'][zoneIdx]);
        }
    }

    handleMovement() {
        const speed = this.player.speed;
        
        this.player.setVelocity(0);
        
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        }
        
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
        }
    }

    dash() {
        const velX = this.player.body.velocity.x;
        const velY = this.player.body.velocity.y;
        
        if (velX !== 0 || velY !== 0) {
            // Boost vitesse
            this.player.setVelocity(velX * 3, velY * 3);
            
            // Particules dash
            for (let i = 0; i < 10; i++) {
                const p = this.add.circle(
                    this.player.x + (Math.random() - 0.5) * 20,
                    this.player.y + (Math.random() - 0.5) * 20,
                    Math.random() * 5,
                    0x00ffff
                );
                p.setDepth(4);
                this.tweens.add({
                    targets: p,
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    onComplete: () => p.destroy()
                });
            }
            
            // Reset vitesse après dash
            this.time.delayedCall(200, () => {
                this.player.setVelocity(velX, velY);
            });
        }
    }
}

// Config Phaser
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#050508',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: MainScene
};

const game = new Phaser.Game(config);
