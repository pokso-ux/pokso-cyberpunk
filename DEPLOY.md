# POKSO Cyberpunk - Déploiement

## Option 1: Surge.sh (Plus rapide - 2 minutes)

```bash
cd pokso-mint-site
npm install -g surge
surge . pokso-cyberpunk.surge.sh
```

## Option 2: GitHub Pages (Gratuit permanent)

1. Créer un repo sur GitHub : `pokso-cyberpunk`
2. Push le code :
```bash
cd pokso-mint-site
git branch -m main
git remote add origin https://github.com/TON_USERNAME/pokso-cyberpunk.git
git push -u origin main
```
3. Sur GitHub → Settings → Pages → Source: Deploy from branch → main
4. Le site sera live sur: `https://tonusername.github.io/pokso-cyberpunk`

## Option 3: Netlify Drop (Glisser-déposer)

1. Zip le dossier `pokso-mint-site`
2. Aller sur https://app.netlify.com/drop
3. Déposer le zip
4. Site live instantanément !

## Fichiers

- `index.html` - Page principale
- `nfts/` - 200 images PNG (0.png à 199.png)
- `app.js` - JavaScript
- `preview.html` - Page preview

## Collection Info

- 200 NFTs uniques
- Style: Cyberpunk
- Prix: 5 LYX
- Max: 10 par wallet
