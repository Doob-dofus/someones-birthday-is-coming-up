# 💜 Pour Elé — 7 & 8 novembre 2026

Site-surprise statique (HTML/CSS/JS, aucune dépendance) : un voyage au scroll à travers le week-end.

## Déploiement GitHub Pages

1. `Settings` → `Pages` → **Build and deployment** : Source = *Deploy from a branch*
2. Branch = `main`, dossier = `/ (root)` → **Save**
3. Le site est en ligne sous ~1 min à l'adresse `https://<user>.github.io/<repo>/`

## Modifier les textes

- Tous les textes sont dans `index.html`, dans les blocs `<div class="panel">` (heure, titre, phrase, adresse).
- Les mots doux à rédiger sont marqués par des commentaires `✏️ THÉO` (intro, cartes, mot de fin).
- Décompte : cible modifiable dans `script.js` (`TARGET`).

## Comment marchent les animations

- Chaque scène (`.scene`) vit dans une section collante (`.journey`). En défilant, on avance dans une « timeline » exprimée en % d'écran.
- Les éléments animés portent un attribut `data-k`, par ex. `data-k="380 s.32|560 s1|700 s16"` :
  à 380 l'échelle vaut 0,32, à 560 elle vaut 1, à 700 elle vaut 16 (on « traverse » l'élément).
  Propriétés : `s` échelle · `x`/`y` translation (%) · `ry` rotation 3D · `o` opacité · `c` ouverture circulaire · `d` tracé.
- La carte 3D (section `.mapsec`) est construite en CSS 3D (`preserve-3d`).
- Si le téléphone est réglé sur « réduire les animations », les scènes s'affichent figées, l'une sous l'autre.

## Carton physique

`card.html` / `card.pdf` = carton A6 paysage avec QR code vers le site.
