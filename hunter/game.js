// POKSO Hunter - Version optimisée
// Map 2048x2048, 10 NFTs, 2 abilities (dash + vision)

const GAME_CONFIG = {
    width: 1024,
    height: 768,
    mapWidth: 2048,
    mapHeight: 2048,
    tileSize: 64
};

const ZONES = [
    { name: 'Neon City', color: 0xff00ff, x: 0, y: 0 },
    { name: 'Data Plains', color: 0x00ffff, x: 683, y: 0 },
    { name: 'Circuit Forest', color: 0x00ff41, x: 1366, y: 0 },
    { name: 'Rust Wastes', color: 0xff8800, x: 0, y: 683 },
    { name: 'Central Hub', color: 0xffff00, x: 683, y: 683 },
    { name: 'Crystal Caves', color: 0x8800ff, x: 1366, y: 683 },
    { name: 'Toxic Swamp', color: 0x44ff00, x: 0, y: 1366 },
    { name: 'Void Sector', color: 0x4444ff, x: 683, y: 1366 },
    { name: 'Sky Peaks', color: 0xffffff, x: 1366, y: 1366 }
];

const NFTS = [
    { id: 0, name: 'Neon Shard', x: 300, y: 300, zone: 0 },
    { id: 1, name: 'Data Fragment', x: 1000, y: 200, zone: 1 },
    { id: 2, name: 'Circuit Heart', x: 1700, y: 400, zone: 2 },
    { id: 3, name: 'Rust Relic', x: 200, y: 900, zone: 3 },
    { id: 4, name: 'Core Token', x: 1024, y: 1024, zone: 4 },
    { id: 5, name: 'Crystal Gem', x: 1800, y: 800, zone: 5 },
    { id: 6, name: 'Swamp Essence', x: 400, y: 1500, zone: 6 },
    { id: 7, name: 'Void Essence', x: 900, y: 1700, zone: 7 },
    { id: 8, name: 'Sky Fragment', x: 1600, y: 1600, zone: 8 },
    { id: 9, name: 'Master Key', x: 1024, y: 300, zone: 1 }
];

let player, cursors, foundNfts = [], visionActive = false, canDash = true;

function preload() {
    // Progress tracking
    const loadingBar = document.getElementById('loading-bar');
    const loadingPercent = document.getElementById('loading-percent');
    const loadingText = document.getElementById('loading-text');
    
    let progress = 0;
    const updateProgress = (p) => {
        progress = p;
        if (loadingBar) loadingBar.style.width = progress + '%';
        if (loadingPercent) loadingPercent.textContent = progress + '%';
        if (loadingText) loadingText.textContent = progress < 100 ? 'Loading...' : 'Ready!';
    };
    
    // Create textures
    updateProgress(10);
    
    // Player
    const playerGfx = this.make.graphics({ x: 0, y: 0, add: false });
    playerGfx.fillStyle(0x00ff41);
    playerGfx.fillCircle(16, 16, 14);
    playerGfx.fillStyle(0xffffff);
    playerGfx.fillCircle(12, 12, 5);
    playerGfx.generateTexture('player', 32, 32);
    
    updateProgress(30);
    
    // NFTs (different colors per zone)
    ZONES.forEach((zone, i) => {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        gfx.fillStyle(zone.color, 0.3);
        gfx.fillCircle(20, 20, 18);
        gfx.fillStyle(zone.color);
        gfx.fillCircle(20, 20, 12);
        gfx.fillStyle(0xffffff);
        gfx.fillCircle(16, 16, 5);
        gfx.generateTexture(`nft-${i}`, 40, 40);
    });
    
    updateProgress(60);
    
    // Tiles
    ZONES.forEach((zone, i) => {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        // Darker version of zone color
        const r = (zone.color >> 16) & 0xff;
        const g = (zone.color >> 8) & 0xff;
        const b = zone.color & 0xff;
        const darkColor = ((r * 0.3) << 16) | ((g * 0.3) << 8) | (b * 0.3);
        gfx.fillStyle(darkColor);
        gfx.fillRect(0, 0, 64, 64);
        gfx.lineStyle(2, zone.color, 0.3);
        gfx.strokeRect(0, 0, 64, 64);
        gfx.generateTexture(`tile-${i}`, 64, 64);
    });
    
    updateProgress(90);
    
    // Hidden NFT (faint glow)
    const hiddenGfx = this.make.graphics({ x: 0, y: 0, add: false });
    hiddenGfx.fillStyle(0xffffff, 0.1);
    hiddenGfx.fillCircle(20, 20, 18);
    hiddenGfx.generateTexture('nft-hidden', 40, 40);
    
    updateProgress(100);
}

function create() {
    // Hide loading
    setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.style.display = 'none', 500);
        }
    }, 100);
    
    // World bounds
    this.physics.world.setBounds(0, 0, GAME_CONFIG.mapWidth, GAME_CONFIG.mapHeight);
    
    // Generate grid tiles (32x32)
    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
            const zoneX = Math.floor(x / 11);
            const zoneY = Math.floor(y / 11);
            const zoneIdx = Math.min(8, zoneY * 3 + zoneX);
            this.add.image(x * 64 + 32, y * 64 + 32, `tile-${zoneIdx}`);
        }
    }
    
    // Zone borders
    const gfx = this.add.graphics();
    gfx.lineStyle(3, 0xffffff, 0.4);
    [683, 1366].forEach(pos => {
        gfx.moveTo(pos, 0);
        gfx.lineTo(pos, 2048);
        gfx.moveTo(0, pos);
        gfx.lineTo(2048, pos);
    });
    gfx.strokePath();
    
    // Player (center spawn)
    player = this.physics.add.sprite(1024, 1024, 'player');
    player.setCollideWorldBounds(true);
    player.setDrag(500);
    
    // Camera
    this.cameras.main.setBounds(0, 0, 2048, 2048);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    
    // NFTs
    this.nfts = this.physics.add.group();
    NFTS.forEach(nft => {
        const sprite = this.nfts.create(nft.x, nft.y, visionActive ? `nft-${nft.zone}` : 'nft-hidden');
        sprite.setData('id', nft.id);
        sprite.setCircle(20);
        sprite.setAlpha(visionActive ? 1 : 0.3);
        
        // Float animation
        this.tweens.add({
            targets: sprite,
            y: nft.y - 10,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
    });
    
    // Overlap
    this.physics.add.overlap(player, this.nfts, (p, nft) => {
        const id = nft.getData('id');
        if (!foundNfts.includes(id)) {
            foundNfts.push(id);
            updateUI();
            
            // Collect effect
            this.tweens.add({
                targets: nft,
                scale: 2,
                alpha: 0,
                duration: 500,
                onComplete: () => nft.destroy()
            });
            
            // Notification
            showNotification(this, `Found ${NFTS[id].name}!`, `${foundNfts.length}/10 NFTs`);
        }
    });
    
    // Controls
    cursors = this.input.keyboard.createCursorKeys();
    
    // Abilities
    this.input.keyboard.on('keydown-SPACE', () => dash(this));
    this.input.keyboard.on('keydown-V', () => toggleVision(this));
    
    // UI
    createUI(this);
    
    // Trail particles
    createTrail(this);
}

function update() {
    // Movement
    player.setVelocity(0);
    const speed = 250;
    
    if (cursors.left.isDown) player.setVelocityX(-speed);
    else if (cursors.right.isDown) player.setVelocityX(speed);
    
    if (cursors.up.isDown) player.setVelocityY(-speed);
    else if (cursors.down.isDown) player.setVelocityY(speed);
    
    // Update zone
    updateZone();
}

function dash(scene) {
    if (!canDash) return;
    canDash = false;
    
    const vx = player.body.velocity.x;
    const vy = player.body.velocity.y;
    
    if (vx !== 0 || vy !== 0) {
        player.setVelocity(vx * 3, vy * 3);
        
        // Dash particles
        for (let i = 0; i < 8; i++) {
            const p = scene.add.circle(
                player.x + (Math.random() - 0.5) * 20,
                player.y + (Math.random() - 0.5) * 20,
                Math.random() * 4 + 2,
                0x00ffff,
                0.8
            ).setDepth(4);
            
            scene.tweens.add({
                targets: p,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => p.destroy()
            });
        }
        
        scene.time.delayedCall(200, () => {
            player.setVelocity(vx, vy);
        });
    }
    
    // Cooldown
    updateAbilityUI('dash', false);
    scene.time.delayedCall(2000, () => {
        canDash = true;
        updateAbilityUI('dash', true);
    });
}

function toggleVision(scene) {
    visionActive = !visionActive;
    
    scene.nfts.getChildren().forEach((nft, i) => {
        const id = nft.getData('id');
        const nftData = NFTS[id];
        nft.setTexture(visionActive ? `nft-${nftData.zone}` : 'nft-hidden');
        nft.setAlpha(visionActive ? 1 : 0.3);
    });
    
    updateAbilityUI('vision', visionActive);
}

function updateZone() {
    const px = player.x;
    const py = player.y;
    const zx = Math.floor(px / 683);
    const zy = Math.floor(py / 683);
    const idx = Math.min(8, zy * 3 + zx);
    
    const zoneText = document.getElementById('zone-name');
    if (zoneText && zoneText.dataset.zone != idx) {
        zoneText.dataset.zone = idx;
        zoneText.textContent = ZONES[idx].name;
        zoneText.style.color = '#' + ZONES[idx].color.toString(16).padStart(6, '0');
    }
}

function createUI(scene) {
    // HTML UI updates
    updateUI();
}

function updateUI() {
    const nftCount = document.getElementById('nft-count');
    if (nftCount) nftCount.textContent = foundNfts.length;
}

function updateAbilityUI(ability, active) {
    const el = document.getElementById(`ability-${ability}`);
    if (el) {
        el.style.opacity = active ? '1' : '0.3';
        el.classList.toggle('active', active);
    }
}

function createTrail(scene) {
    scene.time.addEvent({
        delay: 50,
        callback: () => {
            if (player.body.speed > 10) {
                const t = scene.add.circle(player.x, player.y, 3, 0x00ff41, 0.5).setDepth(5);
                scene.tweens.add({
                    targets: t,
                    alpha: 0,
                    scale: 0,
                    duration: 500,
                    onComplete: () => t.destroy()
                });
            }
        },
        loop: true
    });
}

function showNotification(scene, title, msg) {
    const bg = scene.add.rectangle(512, 300, 400, 100, 0x000000, 0.9)
        .setScrollFactor(0).setDepth(100);
    const txt = scene.add.text(512, 280, title, {
        fontSize: '24px', color: '#00ff41'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    const sub = scene.add.text(512, 320, msg, {
        fontSize: '16px', color: '#fff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    
    scene.time.delayedCall(2000, () => {
        bg.destroy();
        txt.destroy();
        sub.destroy();
    });
}

// Expose for HTML
window.claimDiscovery = function() {
    document.getElementById('discovery-modal').style.display = 'none';
};

window.closeDiscovery = function() {
    document.getElementById('discovery-modal').style.display = 'none';
};
