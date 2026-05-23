# Poster AR

Interface web de réalité augmentée déclenchée par des images imprimées sur un poster.
Accessible via QR code, hébergée en statique sur GitHub Pages.

## Stack

- **MindAR.js** (1.2.5) — tracking d'images en temps réel via la caméra
- **A-Frame** (1.5.0) — scène 3D
- **QRCode.js** — génération du QR code à imprimer
- 100% statique, aucune dépendance serveur

## Structure

```
poster-ar/
├── index.html          Landing : bouton "Démarrer l'expérience"
├── ar.html             Scène AR (MindAR + A-Frame, 3 cibles)
├── qr.html             Générateur de QR code à imprimer
├── assets/
│   ├── targets.mind    (À ajouter) cibles compilées
│   ├── images/         Photos overlay
│   ├── videos/         MP4 H.264 + AAC
│   ├── models/         GLB
│   └── icons/
├── js/ar-content.js    Mapping cible → contenu, gestion événements
├── css/ui.css
└── README.md
```

## Démarrage local

Servir le dossier avec n'importe quel serveur HTTP **HTTPS ou localhost** (la caméra
ne fonctionne pas en `file://`).

```powershell
# Option 1 : python
python -m http.server 8000
# puis ouvrir http://localhost:8000

# Option 2 : npx
npx serve .
```

Sur mobile pour tester avant déploiement&nbsp;: utiliser `ngrok http 8000` ou similaire
(HTTPS nécessaire pour la caméra sur device distant).

## Compiler ses propres images cibles

Le fichier `.mind` chargé par défaut dans `ar.html` est l'exemple MindAR (CDN, 1 cible).
Pour utiliser vos propres images du poster&nbsp;:

1. Ouvrir l'outil de compilation officiel&nbsp;:
   <https://hiukim.github.io/mind-ar-js-doc/tools/compile/>
2. Glisser-déposer **1 à 3 images** (JPG/PNG, 500–1000 px de large, contraste fort, beaucoup de détails)
3. Cliquer **Start** puis **Download** → fichier `targets.mind`
4. Le placer dans `assets/targets.mind`
5. Dans `ar.html`, remplacer la ligne&nbsp;:
   ```html
   mindar-image="imageTargetSrc: https://cdn.jsdelivr.net/.../card.mind; ..."
   ```
   par&nbsp;:
   ```html
   mindar-image="imageTargetSrc: ./assets/targets.mind; ..."
   ```
6. L'ordre des images uploadées = `targetIndex` (0, 1, 2) dans la scène.

### Bonnes images cibles

- Riches en détails et asymétriques (texte, motifs complexes, photos)
- **À éviter** : gradients lisses, surfaces réfléchissantes, symétries fortes, peu de contraste
- Taille originale 500–1500 px de large suffit

## Personnaliser le contenu de chaque cible

### Contenu 3D (dans la scène, plaqué sur l'image)
Modifier `ar.html`, sections `CIBLE 0/1/2`&nbsp;:

- **Photo** : `<a-image src="#photo1" position="0 0 0" height="0.6" width="1"></a-image>`
  (déclarer `<img id="photo1" src="assets/images/...">` dans `<a-assets>`)
- **Vidéo** : `<a-video src="#video1" height="0.56" width="1"></a-video>`
  (déclarer `<video id="video1" src="..." preload="auto" loop playsinline webkit-playsinline>`)
- **Modèle 3D** : `<a-gltf-model src="#model1" scale="0.2 0.2 0.2"></a-gltf-model>`
  (déclarer `<a-asset-item id="model1" src="assets/models/object.glb">`)

### Contenu HTML overlay (panneau qui s'ouvre en bas)
Modifier `js/ar-content.js`, objet `CONTENT`. Le champ `html` accepte du HTML complet :
titres, paragraphes, listes, liens, images.

## Déployer sur GitHub Pages

1. Créer un repo GitHub `poster-ar` (public)
2. Initialiser le dépôt local et pousser&nbsp;:
   ```powershell
   git init
   git add .
   git commit -m "Initial: AR poster experience"
   git branch -M main
   git remote add origin https://github.com/<TON_USER>/poster-ar.git
   git push -u origin main
   ```
3. Sur GitHub&nbsp;: **Settings → Pages → Source = `main` branch, root** → Save
4. Après ~1 min, l'URL est&nbsp;: `https://<TON_USER>.github.io/poster-ar/`
5. Ouvrir `qr.html` sur cette URL → le QR pointe automatiquement vers `ar.html`
6. Télécharger le PNG, l'imprimer sur le poster

## Compatibilité

| Plateforme | Navigateur | Fonctionne ? |
|------------|------------|--------------|
| iOS 14+    | Safari     | ✅           |
| iOS        | Chrome     | ❌ (utilise WebKit limité, pas d'accès caméra WebGL fiable) |
| Android    | Chrome     | ✅           |
| Android    | Firefox    | ✅           |
| Desktop    | Chrome/Firefox/Edge | ✅ (avec webcam) |

**HTTPS obligatoire** (GitHub Pages le fournit automatiquement).

## Limitations connues

- iOS Chrome non supporté (limitation Apple sur WebKit)
- Tracking instable si&nbsp;: image trop petite (<10cm), faible éclairage, image gondolée
- Une seule cible détectée à la fois recommandé (perfs)
- Modèles GLB > 5 Mo : ajouter compression Draco
