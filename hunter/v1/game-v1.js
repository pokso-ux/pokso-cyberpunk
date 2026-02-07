// POKSO Hunter V1.3 - Version minimaliste fonctionnelle
// Test rapide pour voir si la map s'affiche

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Rien - tout est créé dynamiquement
    }

    create() {
        // Fond bleu foncé
        this.cameras.main.setBackgroundColor('#1a1a3e');
        
        // Taille map
        this.mapSize = 4096;
        this.tileSize = 64;
        
        // Créer les tuiles avec des rectangles colorés (plus simple que des textures)
        this.createSimpleTiles();
        
        // Player (cercle vert simple)
        this.player = this.add.circle(2048, 2048, 15, 0x00ff41);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        
        // Camera
        this.cameras.main.setBounds(0, 0, this.mapSize, this.mapSize);
        this.cameras.main.startFollow(this.player);
        
        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Cacher le loading
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
        
        console.log('Game created successfully!');
    }
    
    createSimpleTiles() {
        // Couleurs des 9 zones
        const colors = [
            0x1a4a1a, // Zone 0: Vert foncé
            0x1a4a4a, // Zone 1: Cyan foncé
            0x4a1a1a, // Zone 2: Rouge foncé
            0x4a1a4a, // Zone 3: Magenta foncé
            0x4a4a1a, // Zone 4: Jaune foncé
            0x1a4a2a, // Zone 5: Vert-bleu
            0x4a3a1a, // Zone 6: Orange foncé
            0x2a1a4a, // Zone 7: Violet foncé
            0x2a2a4a  // Zone 8: Bleu-gris
        ];
        
        // Créer seulement quelques tuiles visibles pour tester
        // Au lieu de 4096 tuiles, on en crée 64x64 mais simplifiées
        const graphics = this.add.graphics();
        
        for (let y = 0; y < 64; y++) {
            for (let x = 0; x < 64; x++) {
                const worldX = x * this.tileSize;
                const worldY = y * this.tileSize;
                
                // Déterminer zone (3x3 grid)
                const zoneX = Math.floor(x / 22);
                const zoneY = Math.floor(y / 22);
                const zoneIdx = Math.min(8, zoneY * 3 + zoneX);
                
                // Dessiner rectangle
                graphics.fillStyle(colors[zoneIdx], 1);
                graphics.fillRect(worldX, worldY, this.tileSize, this.tileSize);
                
                // Bordure légère
                graphics.lineStyle(1, 0x000000, 0.3);
                graphics.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
            }
        }
        
        // Lignes de séparation des zones
        graphics.lineStyle(4, 0xffffff, 0.5);
        graphics.beginPath();
        [1365, 2730].forEach(pos => {
            graphics.moveTo(pos, 0);
            graphics.lineTo(pos, this.mapSize);
            graphics.moveTo(0, pos);
            graphics.lineTo(this.mapSize, pos);
        });
        graphics.strokePath();
    }

    update() {
        const speed = 250;
        
        this.player.body.setVelocity(0);
        
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
        }
        
        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(speed);
        }
    }
}

// Config
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
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
