// POKSO HUNTER - Game Engine
// Built with Phaser.js

// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#0a0a0f',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Initialize game
const game = new Phaser.Game(config);

// Game State
let player;
let cursors;
let map;
let obstacles;
let nftSpots = [];
let clues = [];
let foundNFTs = [];
let gameTime = 0;
let timeEvent;
let isPaused = false;

// NFT Data (hidden locations)
const HIDDEN_NFTS = [
    {
        id: 0,
        x: 500,
        y: 400,
        clue: "I stand where neon meets the void. Look for the purple light near the center.",
        answer: "statue",
        name: "POKSO Cyberpunk #0",
        found: false,
        tokenId: "0"
    },
    {
        id: 1,
        x: 200,
        y: 150,
        clue: "In the shadows of the northern ruins, where circuits fail.",
        answer: "ruins",
        name: "POKSO Cyberpunk #1",
        found: false,
        tokenId: "1"
    },
    {
        id: 2,
        x: 800,
        y: 600,
        clue: "Deep in the digital swamp, where the green mist rises.",
        answer: "swamp",
        name: "POKSO Cyberpunk #2",
        found: false,
        tokenId: "2"
    },
    {
        id: 3,
        x: 900,
        y: 200,
        clue: "High above in the eastern towers, past the security grid.",
        answer: "tower",
        name: "POKSO Cyberpunk #3",
        found: false,
        tokenId: "3"
    },
    {
        id: 4,
        x: 150,
        y: 650,
        clue: "Where the old world meets the new, in the southwest corner.",
        answer: "gate",
        name: "POKSO Cyberpunk #4",
        found: false,
        tokenId: "4"
    }
];

// Preload assets
function preload() {
    // Create procedural textures (since we don't have external assets yet)
    
    // Player texture (cyberpunk character)
    const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    playerGraphics.fillStyle(0x00ff41);
    playerGraphics.fillRect(0, 0, 32, 32);
    playerGraphics.lineStyle(2, 0xffffff);
    playerGraphics.strokeRect(0, 0, 32, 32);
    playerGraphics.generateTexture('player', 32, 32);
    
    // Ground texture
    const groundGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    groundGraphics.fillStyle(0x1a1a2e);
    groundGraphics.fillRect(0, 0, 64, 64);
    groundGraphics.lineStyle(1, 0x2a2a3e);
    groundGraphics.strokeRect(0, 0, 64, 64);
    groundGraphics.generateTexture('ground', 64, 64);
    
    // Wall/obstacle texture
    const wallGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    wallGraphics.fillStyle(0x0d0221);
    wallGraphics.fillRect(0, 0, 64, 64);
    wallGraphics.lineStyle(2, 0x00ff41);
    wallGraphics.strokeRect(0, 0, 64, 64);
    wallGraphics.generateTexture('wall', 64, 64);
    
    // Hidden spot texture (invisible but detectable)
    const spotGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    spotGraphics.fillStyle(0xff00ff, 0.3);
    spotGraphics.fillCircle(16, 16, 16);
    spotGraphics.generateTexture('hidden-spot', 32, 32);
    
    // Clue item texture
    const clueGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    clueGraphics.fillStyle(0xffff00);
    clueGraphics.fillCircle(8, 8, 8);
    clueGraphics.generateTexture('clue', 16, 16);
}

// Create game world
function create() {
    // Hide loading screen
    document.getElementById('loading-screen').style.display = 'none';
    
    // Create tilemap (procedural)
    createWorld(this);
    
    // Create player
    player = this.physics.add.sprite(512, 384, 'player');
    player.setCollideWorldBounds(true);
    player.setBounce(0);
    
    // Camera follows player
    this.cameras.main.setBounds(0, 0, 2048, 1536);
    this.physics.world.setBounds(0, 0, 2048, 1536);
    this.cameras.main.startFollow(player);
    
    // Controls
    cursors = this.input.keyboard.createCursorKeys();
    
    // Create obstacles collision
    this.physics.add.collider(player, obstacles);
    
    // Create hidden NFT spots
    createHiddenSpots(this);
    
    // Create clue items
    createClues(this);
    
    // Start timer
    timeEvent = this.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: this,
        loop: true
    });
    
    // Setup wallet connection
    setupWallet();
}

// Create the world map
function createWorld(scene) {
    // Create ground
    for (let x = 0; x < 2048; x += 64) {
        for (let y = 0; y < 1536; y += 64) {
            scene.add.image(x + 32, y + 32, 'ground');
        }
    }
    
    // Create obstacles group
    obstacles = scene.physics.add.staticGroup();
    
    // Add some walls/buildings
    const wallPositions = [
        // Northern ruins
        { x: 150, y: 100 }, { x: 214, y: 100 }, { x: 278, y: 100 },
        { x: 150, y: 164 }, { x: 278, y: 164 },
        
        // Eastern tower
        { x: 850, y: 150 }, { x: 914, y: 150 }, { x: 978, y: 150 },
        { x: 850, y: 214 }, { x: 978, y: 214 },
        
        // Center statue area
        { x: 450, y: 350 }, { x: 514, y: 350 }, { x: 578, y: 350 },
        { x: 450, y: 450 }, { x: 578, y: 450 },
        
        // Swamp area
        { x: 750, y: 550 }, { x: 814, y: 550 }, { x: 878, y: 550 },
        { x: 750, y: 614 }, { x: 878, y: 614 },
        
        // Southwest gate
        { x: 100, y: 600 }, { x: 164, y: 600 },
        { x: 100, y: 700 }, { x: 164, y: 700 }
    ];
    
    wallPositions.forEach(pos => {
        obstacles.create(pos.x, pos.y, 'wall');
    });
    
    // Add decorative elements (just colored rectangles for now)
    const graphics = scene.add.graphics();
    
    // Neon lights
    graphics.fillStyle(0xff00ff, 0.3);
    graphics.fillCircle(500, 400, 50); // Center statue glow
    
    graphics.fillStyle(0x00ff41, 0.2);
    graphics.fillCircle(200, 150, 30); // North glow
    
    graphics.fillStyle(0x00f5ff, 0.2);
    graphics.fillCircle(800, 600, 40); // Swamp glow
}

// Create hidden NFT spots
function createHiddenSpots(scene) {
    HIDDEN_NFTS.forEach(nft => {
        if (!nft.found) {
            const spot = scene.physics.add.staticSprite(nft.x, nft.y, 'hidden-spot');
            spot.setInteractive();
            spot.nftData = nft;
            
            scene.physics.add.overlap(player, spot, (player, spot) => {
                if (!spot.nftData.found && !isPaused) {
                    showNFTDiscovery(spot.nftData);
                }
            });
            
            nftSpots.push(spot);
        }
    });
}

// Create clue items scattered around
function createClues(scene) {
    const cluePositions = [
        { x: 300, y: 300, clue: "The center holds the key to the first treasure." },
        { x: 700, y: 200, clue: "North is cold, but the treasure is hot." },
        { x: 400, y: 700, clue: "Deep south lies a gate to fortune." },
        { x: 900, y: 400, clue: "East rises the tower of digital gold." },
        { x: 200, y: 500, clue: "Swampy grounds hide shiny pixels." }
    ];
    
    cluePositions.forEach((clueData, index) => {
        const clue = scene.physics.add.staticSprite(clueData.x, clueData.y, 'clue');
        clue.setInteractive();
        clue.clueText = clueData.clue;
        
        scene.physics.add.overlap(player, clue, (player, clue) => {
            if (!isPaused) {
                showClue(clue.clueText);
                clue.destroy(); // Remove clue after collection
            }
        });
        
        clues.push(clue);
    });
}

// Game update loop
function update() {
    if (isPaused) return;
    
    // Player movement
    const speed = 200;
    player.setVelocity(0);
    
    if (cursors.left.isDown) {
        player.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
        player.setVelocityX(speed);
    }
    
    if (cursors.up.isDown) {
        player.setVelocityY(-speed);
    } else if (cursors.down.isDown) {
        player.setVelocityY(speed);
    }
}

// Timer update
function updateTimer() {
    if (!isPaused) {
        gameTime++;
        const minutes = Math.floor(gameTime / 60).toString().padStart(2, '0');
        const seconds = (gameTime % 60).toString().padStart(2, '0');
        document.getElementById('game-time').textContent = `${minutes}:${seconds}`;
    }
}

// Show clue modal
function showClue(clueText) {
    isPaused = true;
    document.getElementById('clue-text').textContent = clueText;
    document.getElementById('clue-modal').style.display = 'block';
    
    // Add to inventory
    const clueList = document.getElementById('clue-list');
    if (clueList.children[0].textContent === 'No clues yet...') {
        clueList.innerHTML = '';
    }
    const li = document.createElement('li');
    li.textContent = clueText.substring(0, 40) + '...';
    clueList.appendChild(li);
}

// Close clue modal
function closeClue() {
    document.getElementById('clue-modal').style.display = 'none';
    document.getElementById('clue-answer').value = '';
    isPaused = false;
}

// Check answer
function checkAnswer() {
    const answer = document.getElementById('clue-answer').value.toLowerCase().trim();
    const currentClue = document.getElementById('clue-text').textContent;
    
    // Simple validation (just for demo)
    alert('Clue recorded! Keep exploring to find the NFT location.');
    closeClue();
}

// Show NFT discovery
function showNFTDiscovery(nftData) {
    isPaused = true;
    document.getElementById('found-nft-name').textContent = nftData.name;
    document.getElementById('found-nft-image').src = `https://pokso-ux.github.io/pokso-cyberpunk/nfts/${nftData.tokenId}.png`;
    document.getElementById('nft-modal').style.display = 'block';
    
    // Store current NFT for minting
    window.currentNFT = nftData;
}

// Close NFT modal
function closeNFT() {
    document.getElementById('nft-modal').style.display = 'none';
    isPaused = false;
}

// Claim NFT - Shows success message (no actual mint for now)
async function mintNFT() {
    const nft = window.currentNFT;
    
    // Mark as found
    nft.found = true;
    foundNFTs.push(nft);
    
    // Update UI
    document.getElementById('nft-count').textContent = foundNFTs.length;
    
    // Show success message
    const successMsg = `
🎉 CONGRATULATIONS! 🎉

You found: ${nft.name}

In the full version, this NFT would be minted to your Universal Profile.

Keep hunting to find all 5 hidden NFTs!

[${foundNFTs.length}/5 found]
    `;
    
    alert(successMsg);
    
    closeNFT();
    
    // Remove the spot from game
    const spot = nftSpots.find(s => s.nftData.id === nft.id);
    if (spot) {
        spot.destroy();
    }
    
    // Check if all NFTs found
    if (foundNFTs.length === 5) {
        setTimeout(() => {
            alert(`🏆 AMAZING! 🏆\n\nYou found all 5 hidden NFTs!\nTime: ${document.getElementById('game-time').textContent}\n\nYou're a true POKSO Hunter!`);
        }, 500);
    }
}

// Wallet setup
function setupWallet() {
    document.getElementById('connect-wallet').addEventListener('click', async () => {
        if (window.ethereum || window.lukso) {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum || window.lukso);
                await provider.send('eth_requestAccounts', []);
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                document.getElementById('connect-wallet').textContent = 
                    address.slice(0, 6) + '...' + address.slice(-4);
                window.walletConnected = true;
                window.walletAddress = address;
            } catch (error) {
                console.error('Wallet connection failed:', error);
                alert('Failed to connect wallet');
            }
        } else {
            alert('Please install Universal Profile browser extension');
        }
    });
}

// Make functions global for HTML onclick handlers
window.checkAnswer = checkAnswer;
window.closeClue = closeClue;
window.mintNFT = mintNFT;
window.closeNFT = closeNFT;
