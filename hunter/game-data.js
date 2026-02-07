// POKSO Hunter V2 - Game Engine with Large Map
// Tile-based system for a true Zelda-like experience

const GAME_CONFIG = {
    width: 1024,
    height: 768,
    mapWidth: 4096,  // 4x larger than before
    mapHeight: 4096,
    tileSize: 64,
    zoom: 1
};

// Tile types
const TILES = {
    GRASS: 0,
    WATER: 1,
    WALL: 2,
    ROAD: 3,
    NEON: 4,      // Special cyberpunk tiles
    RUINS: 5,
    SWAMP: 6,
    TOWER: 7,
    SECRET: 8     // Hidden spots
};

// Game state
let gameState = {
    player: null,
    map: null,
    camera: null,
    cursors: null,
    discovered: [],
    inventory: [],
    skills: {
        speed: 0,
        vision: 0,
        luck: 0
    },
    currentZone: 'center'
};

// Zone definitions (for generation)
const ZONES = {
    center: { x: 2048, y: 2048, color: 0x00ff41, name: 'Neon City Center' },
    north: { x: 2048, y: 512, color: 0x00f5ff, name: 'Frozen Wastes' },
    south: { x: 2048, y: 3584, color: 0x7fff00, name: 'Toxic Swamps' },
    east: { x: 3584, y: 2048, color: 0xff00ff, name: 'Digital Towers' },
    west: { x: 512, y: 2048, color: 0xff4400, name: 'Rust Lands' },
    northeast: { x: 3584, y: 512, color: 0xff0088, name: 'Cyber Citadel' },
    northwest: { x: 512, y: 512, color: 0x8800ff, name: 'Void Sector' },
    southeast: { x: 3584, y: 3584, color: 0x88ff00, name: 'Bio Domes' },
    southwest: { x: 512, y: 3584, color: 0xff8800, name: 'Scrap Yard' }
};

// NFT Rarity distribution (50 total)
const NFT_DISTRIBUTION = {
    COMMON: 30,      // 60% - Easy
    UNCOMMON: 12,    // 24% - Medium
    RARE: 6,         // 12% - Hard
    LEGENDARY: 2     // 4% - Very hard
};

// Generate NFT positions (pseudo-random but deterministic)
function generateNFTPositions() {
    const positions = [];
    const seed = 12345; // Fixed seed for reproducibility
    
    // Generate positions for each rarity
    let id = 0;
    
    // Common NFTs - scattered everywhere
    for (let i = 0; i < NFT_DISTRIBUTION.COMMON; i++) {
        positions.push({
            id: id++,
            rarity: 'COMMON',
            x: randomPosition(200, GAME_CONFIG.mapWidth - 200, seed + i),
            y: randomPosition(200, GAME_CONFIG.mapHeight - 200, seed + i + 1000),
            hint: getCommonHint(i),
            skillBoost: 0
        });
    }
    
    // Uncommon NFTs - in specific zones
    for (let i = 0; i < NFT_DISTRIBUTION.UNCOMMON; i++) {
        const zoneKeys = Object.keys(ZONES);
        const zone = ZONES[zoneKeys[i % zoneKeys.length]];
        positions.push({
            id: id++,
            rarity: 'UNCOMMON',
            x: zone.x + randomPosition(-400, 400, seed + i + 2000),
            y: zone.y + randomPosition(-400, 400, seed + i + 3000),
            hint: getUncommonHint(i, zone.name),
            skillBoost: Math.random() > 0.5 ? 1 : 0, // 50% chance of speed boost
            boostValue: 10 // +10% speed
        });
    }
    
    // Rare NFTs - hidden well
    for (let i = 0; i < NFT_DISTRIBUTION.RARE; i++) {
        positions.push({
            id: id++,
            rarity: 'RARE',
            x: randomPosition(500, GAME_CONFIG.mapWidth - 500, seed + i + 4000),
            y: randomPosition(500, GAME_CONFIG.mapHeight - 500, seed + i + 5000),
            hint: getRareHint(i),
            skillBoost: Math.random() > 0.3 ? 2 : 1, // Vision or speed boost
            boostValue: 20 // +20% boost
        });
    }
    
    // Legendary NFTs - extremely hidden
    for (let i = 0; i < NFT_DISTRIBUTION.LEGENDARY; i++) {
        positions.push({
            id: id++,
            rarity: 'LEGENDARY',
            x: randomPosition(800, GAME_CONFIG.mapWidth - 800, seed + i + 6000),
            y: randomPosition(800, GAME_CONFIG.mapHeight - 800, seed + i + 7000),
            hint: getLegendaryHint(i),
            skillBoost: 3, // All boosts
            boostValue: 30 // +30% to everything
        });
    }
    
    return positions;
}

function randomPosition(min, max, seed) {
    const random = Math.abs(Math.sin(seed) * 10000) % 1;
    return Math.floor(min + random * (max - min));
}

function getCommonHint(index) {
    const hints = [
        "Look near the roads",
        "Check around buildings",
        "Sometimes the obvious places...",
        "Near a neon sign",
        "Close to the entrance"
    ];
    return hints[index % hints.length];
}

function getUncommonHint(index, zoneName) {
    return `Hidden in ${zoneName}`;
}

function getRareHint(index) {
    const hints = [
        "Deep in the shadows",
        "Where light doesn't reach",
        "Behind the forgotten wall",
        "Under the ancient circuit"
    ];
    return hints[index % hints.length];
}

function getLegendaryHint(index) {
    return "The legends speak of this place...";
}

// Generate tilemap data
function generateTileMap() {
    const width = GAME_CONFIG.mapWidth / GAME_CONFIG.tileSize;
    const height = GAME_CONFIG.mapHeight / GAME_CONFIG.tileSize;
    const map = [];
    
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            // Base noise for terrain
            const noise = Math.random();
            
            // Check distance from center for zones
            const worldX = x * GAME_CONFIG.tileSize;
            const worldY = y * GAME_CONFIG.tileSize;
            
            // Determine zone
            let zone = 'center';
            let minDist = Infinity;
            
            for (const [key, z] of Object.entries(ZONES)) {
                const dist = Math.abs(worldX - z.x) + Math.abs(worldY - z.y);
                if (dist < minDist) {
                    minDist = dist;
                    zone = key;
                }
            }
            
            // Generate tile based on zone and noise
            let tile = TILES.GRASS;
            
            if (noise < 0.1) {
                tile = TILES.WATER;
            } else if (noise < 0.15) {
                tile = TILES.WALL;
            } else if (noise < 0.25) {
                tile = TILES.ROAD;
            } else if (noise > 0.95) {
                tile = TILES.NEON;
            }
            
            // Zone-specific modifications
            if (zone === 'south' && noise < 0.3) tile = TILES.SWAMP;
            if (zone === 'north' && noise > 0.7) tile = TILES.RUINS;
            if (zone === 'east' && noise > 0.8) tile = TILES.TOWER;
            
            row.push(tile);
        }
        map.push(row);
    }
    
    return map;
}

// Export for use in game
window.POKSO_HUNTER_DATA = {
    config: GAME_CONFIG,
    zones: ZONES,
    tiles: TILES,
    nftPositions: generateNFTPositions(),
    tileMap: generateTileMap()
};

console.log('POKSO Hunter V2 Data Generated:');
console.log('- Map size:', GAME_CONFIG.mapWidth, 'x', GAME_CONFIG.mapHeight);
console.log('- Total NFTs:', window.POKSO_HUNTER_DATA.nftPositions.length);
console.log('- Zones:', Object.keys(ZONES).length);
