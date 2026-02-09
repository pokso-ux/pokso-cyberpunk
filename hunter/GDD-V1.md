# POKSO Hunter — Game Design Document V1

## Vision
Jeu 2D navigateur **Zelda-like cyberpunk** basé sur l'exploration, les énigmes et la chasse aux NFTs. Nouvelle map chaque mois (système saisonnier).

## Boucle de Jeu Principale

```
EXPLORATION → DÉCOUVERTE INDICES → RÉSOLUTION ÉNIGMES → TROUVER NFTs
       ↑                                                          ↓
       ←←←←←←←←←←←←←← BACKTRACKING ←←←←←←←←←←←←←←←←← ABILITIES DÉBLOQUÉES
```

1. Le joueur explore une grande map 2D
2. Il découvre des indices et résout des énigmes
3. Il trouve des NFTs cachés (loot)
4. Certains NFTs donnent des **abilities/compétences**
5. Ces abilities permettent d'accéder à de nouvelles zones/secrets
6. Les joueurs peuvent échanger les NFTs sur marketplace
7. **Chaque mois** : nouvelle map + nouvelle énigme globale + nouveaux NFTs

## Philosophie

- **Exploration et découverte** au centre du gameplay
- **NFTs = Utilité réelle** (débloquer, améliorer, accéder)
- **Pas de pay-to-win** : skill + réflexion nécessaires
- **Saisonnalité** : évolution constante via feedback joueurs
- **Backtracking intelligent** : revenir avec de nouvelles abilities

## Modèle Économique

### Free-to-Play
- ✅ Explorer la map
- ✅ Résoudre les puzzles
- ✅ Découvrir les secrets

### NFTs Requis Pour
- Claim certains loots
- Accéder à certaines zones
- Améliorer la progression (abilities)
- Débloquer des raccourcis

## Contenu V1 (Scope Actuel)

### Map
- **1 grande map 2D** (top-down)
- Taille : 4096×4096 pixels
- 9 zones distinctes (couleurs/ambiances différentes)

### Abilities (5-7 NFTs)
| Ability | Effet | Zone Débloquée |
|---------|-------|----------------|
| 🏃 **Dash** | Boost vitesse + traverser fossés | Zones lointaines |
| ⚡ **Speed Boost** | Vitesse permanente +30% | Accès rapide |
| 🔍 **Scan** | Détecter NFTs cachés dans rayon X | Secrets invisibles |
| 💻 **Hack** | Ouvrir portes verrouillées | Zones sécurisées |
| 🪝 **Grapple** | Se balancer sur points d'ancrage | Hauteurs/îlots |
| 👁️ **Vision** | Voir through walls brièvement | Zones maze |
| 🔑 **Master Key** | Ouvrir toutes les portes | Zone finale |

### Secrets & Collectibles
- **15 NFTs** à trouver (positions fixes)
- **10-20 caches** (coffres, données, logs)
- **3-5 puzzles majeurs** (switches, codes, sequences)
- **1 énigme globale** liée à l'histoire de la map

### Systèmes
- ✅ Génération procédurale map
- ✅ Détection automatique zones
- ✅ Particules trail/dash
- ⏳ **Système de claim NFT** (anti double-claim)
- ⏳ **Sauvegarde progression** (localStorage/UP)
- ⏳ **Backtracking** (zones bloquées → débloquées)

## Architecture Technique

### Frontend
- Phaser 3.60 (moteur jeu)
- HTML5 Canvas
- LocalStorage (sauvegarde)

### Blockchain (LUKSO)
- LSP8 NFTs pour abilities
- LSP8 NFTs pour loots collectés
- Contrat Minter pour claims
- Universal Profile (optionnel)

### Backend (si besoin)
- Vérification claims (API simple)
- Anti-double-claim (merkle tree ou DB)

## Roadmap

### V1.0 (Actuel)
- ✅ Map 4096×4096 fonctionnelle
- ✅ Déplacement + dash
- ✅ 15 NFTs à collecter
- ✅ 9 zones distinctes
- ✅ Barre de progression fix
- ⏳ Système de claim
- ⏳ Sauvegarde progression

### V1.1 (Prochain)
- Ajouter abilities restantes (5/7 manquantes)
- Système de zones bloquées
- Puzzles interactifs (switches, portes)

### V1.2
- Énigme globale de la map
- Histoire/lore via logs trouvés
- Système de score/classement

### V2.0 (Saison 2)
- Nouvelle map (thème différent)
- Nouvelles abilities
- Nouvelle énigme globale
- Portabilité NFTs saison 1 → 2 (bonus)

## Idées Futures

- **Multiplayer** : coopération pour certains puzzles
- **Events** : chasses au trésor temporaires
- **Crafting** : combiner abilities
- **Boss** : ennemis à vaincre avec abilities
- **Speedrun** : mode contre-la-montre

## Notes Développement

### Priorités Actuelles
1. Fix barre de progression (URGENT)
2. Système de sauvegarde localStorage
3. Système anti-double-claim
4. Ajouter les 6 abilities manquantes
5. Créer zones bloquées/débloquables

### Design Patterns
- **Component pattern** pour abilities
- **State machine** pour puzzles
- **Observer pattern** pour découvertes

---

*Dernière mise à jour : 2026-02-07*
*Prochaine review : V1.1 release*
