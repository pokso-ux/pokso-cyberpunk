# POKSO Hunter — Plan d'Action Technique

## 🚨 PRIORITÉ 1 : Fix Barre de Progression

### Problème Actuel
La barre reste bloquée à 0% car la génération des tuiles bloque le thread principal.

### Solution
```javascript
// Dans generateWorld() de game-v1.js

async generateWorld() {
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    const loadingPercent = document.getElementById('loading-percent');
    
    const totalTiles = 64 * 64; // 4096 tuiles
    let loadedTiles = 0;
    
    // Générer ligne par ligne avec vraie mise à jour UI
    for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
            const worldX = x * this.tileSize;
            const worldY = y * this.tileSize;
            const zoneX = Math.floor(x / 22);
            const zoneY = Math.floor(y / 22);
            const zoneIdx = Math.min(8, zoneY * 3 + zoneX);
            
            this.add.image(worldX + 32, worldY + 32, `tile-${zoneIdx}`);
            loadedTiles++;
        }
        
        // Update UI après chaque ligne
        const progress = Math.floor((loadedTiles / totalTiles) * 100);
        loadingBar.style.width = `${progress}%`;
        loadingPercent.textContent = `${progress}%`;
        loadingText.textContent = `Generating tiles... ${loadedTiles}/${totalTiles}`;
        
        // Laisser respirer tous les 8 lignes
        if (y % 8 === 0) {
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
    }
    
    loadingText.textContent = 'Creating borders...';
    // ... reste du code
}
```

---

## 🎯 PRIORITÉ 2 : Système de Sauvegarde (localStorage)

### Données à Sauvegarder
```javascript
const saveData = {
    player: {
        x: 2048,
        y: 2048,
        abilities: ['dash'], // abilities débloquées
        currentZone: 4
    },
    nfts: {
        found: [1, 5, 8], // IDs des NFTs trouvés
        claimed: [1, 5]   // IDs déjà claimés sur blockchain
    },
    puzzles: {
        solved: ['puzzle-1', 'puzzle-3'],
        switches: { 'switch-a': true, 'switch-b': false }
    },
    stats: {
        playTime: 3600, // secondes
        distanceTraveled: 50000,
        nftsFound: 3
    },
    lastSave: '2026-02-07T17:52:00Z'
};
```

### Fonctions à Ajouter
```javascript
// Dans MainScene

saveGame() {
    const saveData = {
        player: {
            x: this.player.x,
            y: this.player.y,
            abilities: this.unlockedAbilities,
            currentZone: this.currentZone
        },
        nfts: {
            found: Object.keys(this.nftData).filter(id => this.nftData[id].found),
            claimed: this.claimedNFTs
        },
        stats: {
            playTime: this.playTime,
            nftsFound: this.foundCount
        },
        lastSave: new Date().toISOString()
    };
    
    localStorage.setItem('pokso-hunter-v1', JSON.stringify(saveData));
}

loadGame() {
    const saved = localStorage.getItem('pokso-hunter-v1');
    if (saved) {
        const data = JSON.parse(saved);
        // Restore position
        this.player.x = data.player.x;
        this.player.y = data.player.y;
        // Restore NFTs found
        data.nfts.found.forEach(id => {
            if (this.nftData[id]) {
                this.nftData[id].found = true;
                // Remove from world
                const nft = this.nfts.getChildren().find(n => n.getData('id') === id);
                if (nft) nft.destroy();
            }
        });
        this.foundCount = data.nfts.found.length;
        this.nftText.setText(`NFTs: ${this.foundCount}/15`);
        // Restore abilities
        this.unlockedAbilities = data.player.abilities || [];
    }
}
```

---

## 🎯 PRIORITÉ 3 : Système d'Abilities

### Classe Ability
```javascript
class Ability {
    constructor(name, key, cooldown, duration) {
        this.name = name;
        this.key = key; // '1', '2', '3', '4'
        this.cooldown = cooldown;
        this.duration = duration;
        this.lastUsed = 0;
        this.isUnlocked = false;
    }
    
    canUse() {
        return this.isUnlocked && Date.now() - this.lastUsed > this.cooldown;
    }
    
    use(scene) {
        if (!this.canUse()) return false;
        this.lastUsed = Date.now();
        this.effect(scene);
        return true;
    }
    
    effect(scene) {
        // Override in subclasses
    }
}

// Abilities concrètes
class DashAbility extends Ability {
    constructor() {
        super('Dash', 'SPACE', 3000, 200);
        this.isUnlocked = true; // Débloqué par défaut
    }
    
    effect(scene) {
        const velX = scene.player.body.velocity.x;
        const velY = scene.player.body.velocity.y;
        if (velX !== 0 || velY !== 0) {
            scene.player.setVelocity(velX * 3, velY * 3);
            // Particules
            for (let i = 0; i < 10; i++) {
                const p = scene.add.circle(
                    scene.player.x + (Math.random() - 0.5) * 20,
                    scene.player.y + (Math.random() - 0.5) * 20,
                    Math.random() * 5,
                    0x00ffff
                );
                scene.tweens.add({
                    targets: p,
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    onComplete: () => p.destroy()
                });
            }
        }
    }
}

class ScanAbility extends Ability {
    constructor() {
        super('Scan', '1', 10000, 3000);
        this.isUnlocked = false;
    }
    
    effect(scene) {
        // Détecter NFTs proches
        const range = 300;
        scene.nfts.getChildren().forEach(nft => {
            const dist = Phaser.Math.Distance.Between(
                scene.player.x, scene.player.y,
                nft.x, nft.y
            );
            if (dist < range && !nft.getData('found')) {
                // Ping visuel
                const ping = scene.add.circle(nft.x, nft.y, 10, 0xff00ff, 0.8);
                scene.tweens.add({
                    targets: ping,
                    scale: 3,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => ping.destroy()
                });
            }
        });
    }
}
```

---

## 🎯 PRIORITÉ 4 : Zones Bloquées / Débloquables

### Type de Blocages
```javascript
const BLOCK_TYPES = {
    GAP: 'gap',           // Besoin de Dash ou Grapple
    DOOR: 'door',         // Besoin de Hack ou Key
    WALL: 'wall',         // Besoin de Vision ou explosion
    HEIGHT: 'height',     // Besoin de Grapple
    SCAN: 'scan-zone',    // Besoin de Scan pour voir
    SPEED: 'speed-zone'   // Besoin de Speed Boost
};

// Exemple dans la map
this.blockedZones = [
    { x: 500, y: 500, type: 'gap', requiredAbility: 'dash', unlocked: false },
    { x: 2000, y: 2000, type: 'door', requiredAbility: 'hack', unlocked: false },
    { x: 3500, y: 3500, type: 'scan-zone', requiredAbility: 'scan', unlocked: false }
];
```

### Détection Collision
```javascript
checkBlockedZones() {
    this.blockedZones.forEach(zone => {
        if (zone.unlocked) return;
        
        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            zone.x, zone.y
        );
        
        if (dist < 50) {
            if (this.hasAbility(zone.requiredAbility)) {
                zone.unlocked = true;
                this.showNotification(
                    `Zone unlocked!`,
                    `Used ${zone.requiredAbility} to access`
                );
            } else {
                this.showNotification(
                    `Blocked!`,
                    `Need ${zone.requiredAbility} ability`
                );
                // Repousser le joueur
                const angle = Phaser.Math.Angle.Between(
                    zone.x, zone.y,
                    this.player.x, this.player.y
                );
                this.player.x += Math.cos(angle) * 20;
                this.player.y += Math.sin(angle) * 20;
            }
        }
    });
}
```

---

## 🎯 PRIORITÉ 5 : Puzzles Interactifs

### Types de Puzzles
```javascript
// 1. Switches (interrupteurs)
this.switches = [
    { id: 'A', x: 500, y: 500, active: false },
    { id: 'B', x: 600, y: 500, active: false },
    { id: 'C', x: 700, y: 500, active: false }
];

// Objectif : activer dans ordre A → B → C
// Si mauvais ordre → reset

// 2. Code à trouver
this.codePuzzle = {
    hint: "First prime numbers",
    answer: "2357",
    solved: false
};

// 3. Sequence memory
this.sequencePuzzle = {
    sequence: ['up', 'up', 'down', 'left', 'right'],
    playerInput: [],
    active: false
};
```

---

## 🎯 PRIORITÉ 6 : Système Anti Double-Claim

### Approche 1 : localStorage (simple)
```javascript
// Marquer comme "claim pending" avant transaction
markAsClaimed(nftId) {
    const claimed = JSON.parse(localStorage.getItem('pokso-claims') || '[]');
    if (!claimed.includes(nftId)) {
        claimed.push(nftId);
        localStorage.setItem('pokso-claims', JSON.stringify(claimed));
        return true;
    }
    return false; // Déjà claimé
}
```

### Approche 2 : Backend + Merkle Tree (sécurisé)
- Générer merkle tree des NFTs valides
- Backend vérifie signature avant claim
- Empêche les claims frauduleux

---

## 📋 TODO List

### Semaine 1
- [x] Fix barre de progression
- [ ] Système de sauvegarde localStorage
- [ ] UI abilities (barre 1-4)
- [ ] Implémenter les 7 abilities

### Semaine 2
- [ ] Système zones bloquées
- [ ] Puzzles interactifs (3-5)
- [ ] Énigme globale de la map
- [ ] Système anti-double-claim

### Semaine 3
- [ ] Polish visuel
- [ ] Sons/Musique
- [ ] Testing
- [ ] Release V1.0

---

## 🔧 Commandes Git

```bash
# Cloner le repo
cd /root/.openclaw/workspace/pokso-cyberpunk
git pull origin main

# Modifier game-v1.js
# ...

# Commit et push
git add hunter/v1/game-v1.js
git commit -m "Fix: barre de progression + ajout système abilities"
git push origin main
```
