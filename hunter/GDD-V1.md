# 🎮 POKSO Hunter V1 - Game Design Document

## Vision
Jeu d'exploration 2D cyberpunk où les NFTs ont une utilité gameplay réelle (abilities, accès, progression).

---

## 🗺️ LA MAP V1 (4096x4096 pixels)

### Zones (9 secteurs)

```
┌─────────────────┬─────────────────┬─────────────────┐
│                 │                 │                 │
│  VOID SECTOR    │ FROZEN WASTES   │ CYBER CITADEL   │
│  (purple/black) │  (cyan/white)   │  (pink/gold)    │
│                 │                 │                 │
│  Ability: Scan  │  Ability: Dash  │  Ability: Hack  │
│  NFT #5         │  NFT #1         │  NFT #4         │
├─────────────────┼─────────────────┼─────────────────┤
│                 │                 │                 │
│  RUST LANDS     │  NEON CITY      │ DIGITAL TOWERS  │
│  (orange/brown) │   (green/pink)  │  (purple/cyan)  │
│                 │    CENTER       │                 │
│  Ability: None  │  Spawn Point    │  Ability: Grappl│
│  (start zone)   │  Puzzle #1      │  NFT #2         │
├─────────────────┼─────────────────┼─────────────────┤
│                 │                 │                 │
│  SCRAP YARD     │  TOXIC SWAMPS   │  BIO DOMES      │
│  (yellow/rust)  │  (green/yellow) │  (green/blue)   │
│                 │                 │                 │
│  Ability: Jump  │  Ability:       │  Ability: Vision│
│  NFT #6         │    Toxic Resist │  NFT #3         │
│                 │    NFT #7       │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

### Accessibilité des zones

| Zone | Requirement | Difficulté |
|------|-------------|------------|
| Rust Lands (West) | None (zone de départ) | ⭐ Easy |
| Neon City (Center) | Walk from West | ⭐ Easy |
| Digital Towers (East) | Grapple Ability | ⭐⭐ Medium |
| Frozen Wastes (North) | Dash Ability | ⭐⭐ Medium |
| Toxic Swamps (South) | Toxic Resist Ability | ⭐⭐⭐ Hard |
| Void Sector (NW) | Scan + Dash | ⭐⭐⭐ Hard |
| Cyber Citadel (NE) | Hack + Grapple | ⭐⭐⭐⭐ Expert |
| Scrap Yard (SW) | Jump Ability | ⭐⭐ Medium |
| Bio Domes (SE) | Vision + Toxic Resist | ⭐⭐⭐⭐⭐ Master |

---

## 🎴 LES 7 ABILITIES NFT

### 1. **Cyber Dash** (Frozen Wastes)
- **Rarity**: Common
- **Effect**: Appuyez sur ESPACE pour dasher sur 3 cases
- **Cooldown**: 3 secondes
- **Use**: Franchir les gaps, éviter les pièges
- **Visual**: Trainée cyan derrière le joueur

### 2. **Grapple Hook** (Digital Towers)
- **Rarity**: Common
- **Effect**: Clic pour lancer un grappin (portée 10 cases)
- **Cooldown**: 5 secondes
- **Use**: Monter aux tours, traverser les ravins
- **Visual**: Ligne laser rose

### 3. **Neural Vision** (Bio Domes)
- **Rarity**: Uncommon
- **Effect**: Appuyez sur V pour voir les secrets cachés (30s)
- **Cooldown**: 60 secondes
- **Use**: Trouver les passages secrets, voir les NFTs cachés
- **Visual**: Filtre vert scanline sur l'écran

### 4. **System Hack** (Cyber Citadel)
- **Rarity**: Rare
- **Effect**: Hack les portes verrouillées et terminaux
- **Cooldown**: None (mini-jeu)
- **Use**: Ouvrir les zones sécurisées, résoudre puzzles
- **Visual**: Interface hacking matrix-style

### 5. **Data Scan** (Void Sector)
- **Rarity**: Uncommon
- **Effect**: Scan les alentours pour trouver les indices (radar 20 cases)
- **Cooldown**: 30 secondes
- **Use**: Localiser les NFTs proches
- **Visual**: Onde circulaire qui s'étend

### 6. **Boost Jump** (Scrap Yard)
- **Rarity**: Common
- **Effect**: Sauter par-dessus les obstacles (2 cases haut)
- **Cooldown**: 2 secondes
- **Use**: Accéder aux plateformes, éviter les pièges au sol
- **Visual**: Effet de poussière orange

### 7. **Toxic Shield** (Toxic Swamps)
- **Rarity**: Rare
- **Effect**: Immunité aux zones toxiques (consomme de l'énergie)
- **Cooldown**: Passive (drain lent)
- **Use**: Explorer les swamps sans prendre de dégâts
- **Visual**: Bulle verte autour du joueur

---

## 🧩 LES 5 PUZZLES MAJEURS

### Puzzle #1: **The Neon Gate** (Center)
- **Location**: Entrée vers Cyber Citadel
- **Requirement**: Aucun (introduit le système de puzzle)
- **Type**: Sequence memory
- **Solution**: Mémoriser et reproduire la séquence de lumières (Simon Says)
- **Reward**: Indice vers Grapple Hook + 1st part of Master Key

### Puzzle #2: **The Frozen Code** (North)
- **Location**: Temple gelé
- **Requirement**: Dash Ability
- **Type**: Sliding ice puzzle
- **Solution**: Pousser les blocs sur les plaques tout en glissant sur la glace
- **Reward**: Accès à la tour secrète + 2nd part of Master Key

### Puzzle #3: **The Toxic Maze** (South)
- **Location**: Labo abandonné
- **Requirement**: Toxic Shield
- **Type**: Labyrinth avec mémoire
- **Solution**: Trouver le chemin sans toucher les murs toxiques (s'épaississent avec le temps)
- **Reward**: Toxic Shield Ability + 3rd part of Master Key

### Puzzle #4: **The Digital Lock** (East)
- **Location**: Tour de contrôle
- **Requirement**: Hack Ability
- **Type**: Mini-jeu hacking (timing)
- **Solution**: Arrêter les 3 curseurs dans les zones vertes
- **Reward**: Vision Ability + 4th part of Master Key

### Puzzle #5: **The Master Enigma** (Center - Unlockable)
- **Location**: Bunker secret (nécessite les 4 parties de clé)
- **Requirement**: Toutes les abilities + 4 key parts
- **Type**: Énigme globale de la map
- **Solution**: Décoder le message caché dans les 4 premiers puzzles
- **Reward**: NFT Légendaire "POKSO Master Hunter" + Accès anticipé V2

---

## 🎯 LES 15 SECRETS/CACHES NFT

### Répartition
- **Common (8)**: Faciles à trouver, pas d'ability requise
- **Uncommon (4)**: Besoin d'1-2 abilities
- **Rare (2)**: Besoin de 3+ abilities + puzzle
- **Legendary (1)**: Master Enigma uniquement

### Liste des NFTs à trouver

#### Common (Facile)
1. **Rusty Coin** - Scrap Yard, derrière la première caisse
2. **Neon Shard** - Center, sous le panneau publicitaire
3. **Frozen Byte** - North, dans la première grotte
4. **Data Fragment** - East, sur la plateforme basse
5. **Swamp Moss** - South, près de l'entrée
6. **Void Dust** - NW, coin de la map
7. **Citadel Chip** - NE, dans la poubelle
8. **Bio Sample** - SE, sous le pont

#### Uncommon (Moyen)
9. **Cyber Keycard** - Tower, nécessite Grapple
10. **Ice Crystal** - Wastes, nécessite Dash + platforming
11. **Toxic Vial** - Swamps, nécessite Toxic Shield
12. **Void Lens** - Void Sector, nécessite Scan

#### Rare (Difficile)
13. **Hacker's Deck** - Citadel, nécessite Hack + Dash
14. **Master Chip** - Bio Domes, nécessite Vision + Toxic Shield

#### Legendary (Expert)
15. **POKSO Hunter Crown** - Master Bunker, nécessite TOUT

---

## 🔄 SYSTÈME DE PROGRESSION

### Flow typique d'une session

```
1. Spawn → Rust Lands
   ↓
2. Explore → Find Neon Shard (Common)
   ↓
3. Reach Center → Solve Puzzle #1
   ↓
4. Get hint → Go East → Find Grapple
   ↓
5. Use Grapple → Access Tower → Get Cyber Keycard
   ↓
6. North → Find Dash → Solve Puzzle #2
   ↓
7. Return to previous areas with Dash → Find missed secrets
   ↓
8. South → Need Toxic Shield → Find Toxic Vial first
   ↓
9. Solve Puzzle #3 → Get Toxic Shield
   ↓
10. Explore Swamps → Find Master Chip
    ↓
11. Citadel → Need Hack → Solve Puzzle #4
    ↓
12. Get all 4 key parts → Unlock Master Bunker
    ↓
13. Solve Master Enigma → Claim Legendary NFT
```

### Backtracking intentionnel

Le joueur DOIT revenir aux zones précédentes avec de nouvelles abilities :
- **Rust Lands** avec Jump → Accès aux plateformes hautes
- **Center** avec Vision → Voir les passages secrets
- **North** avec Grapple → Atteindre les sommets
- **East** avec Scan → Trouver les caches cachées

---

## 💰 MONÉTISATION

### Free-to-Play
- Explorer la map
- Résoudre les puzzles (sauf Master)
- Trouver les Common NFTs (gratuit)

### Claim Payant
- **Uncommon**: 0.5 LYX
- **Rare**: 1 LYX
- **Legendary**: 5 LYX

### Revenue Streams
1. **Claim fees** (principale)
2. **Season Pass** (accès anticipé à la prochaine map)
3. **Cosmetic NFTs** (skins personnage)

---

## 📅 SAISON 1 (Mois 1)

### Calendrier
- **Week 1**: Lancement, découverte
- **Week 2**: Premier joueur résout Master Enigma
- **Week 3**: Guide/Walkthrough communautaire
- **Week 4**: Last chance + teasing Saison 2

### Métriques de succès
- Nombre de joueurs actifs
- Taux de completion (combien trouvent le Legendary)
- Revenue généré
- Feedback communautaire

### Saison 2 Preview
- Nouvelle map (desert cyberpunk)
- Nouvelles abilities (Teleport, Time Slow)
- Cross-season abilities (Dash S2 amélioré si vous avez Dash S1)

---

## 🛠️ TECHNICAL TODO

### MVP V1
- [ ] Génération procédurale de la map
- [ ] Système de collision optimisé
- [ ] Système d'inventaire (abilities)
- [ ] 5 puzzles implémentés
- [ ] Système de claim avec fee
- [ ] Anti double-claim
- [ ] Save progress (local + blockchain)

### Post-launch
- [ ] Multiplayer (voir les autres joueurs)
- [ ] Classements
- [ ] Events hebdomadaires
- [ ] Marketplace intégrée
