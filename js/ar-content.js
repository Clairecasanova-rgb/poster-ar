// Configuration des cibles : contenu HTML affiche en overlay (hors WebGL)
// Pratique pour textes longs, liens, listes, qu'on ne veut pas dans la scene 3D.
const CONTENT = {
  'target-0': {
    type: 'photo' // photo plaquee dans la scene 3D, pas de panneau HTML overlay
  },
  'target-1': {
    type: 'video'
  },
  'target-2': {
    type: 'model'
  }
};

// Adapte le ratio largeur/hauteur de la photo plaquee a son ratio naturel
function fitImageOverlay(imgId, overlayId) {
  const img = document.getElementById(imgId);
  const overlay = document.getElementById(overlayId);
  if (!img || !overlay) return;
  const apply = () => {
    if (!img.naturalWidth) return;
    const ratio = img.naturalHeight / img.naturalWidth;
    overlay.setAttribute('width', 1);
    overlay.setAttribute('height', ratio);
  };
  if (img.complete) apply();
  else img.addEventListener('load', apply, { once: true });
}

document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');
  const startOverlay = document.getElementById('start-overlay');
  const startBtn = document.getElementById('start-btn');
  const uiOverlay = document.getElementById('ui-overlay');
  const hint = document.getElementById('hint');
  const infoPanel = document.getElementById('info-panel');
  const infoContent = document.getElementById('info-content');
  const infoClose = document.getElementById('info-close');

  // Demarrage caméra : declenche par interaction utilisateur (iOS Safari)
  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    startBtn.textContent = 'Chargement...';
    try {
      // Attendre que A-Frame ait initialise le systeme MindAR
      await waitForSystem(sceneEl);
      const arSystem = sceneEl.systems['mindar-image-system'];
      await arSystem.start();
      startOverlay.classList.add('hidden');
      uiOverlay.classList.remove('hidden');
    } catch (err) {
      console.error('AR start failed', err);
      startBtn.disabled = false;
      startBtn.textContent = 'Reessayer';
      alert('Impossible d\'activer la camera. Verifiez l\'autorisation dans les reglages du navigateur.');
    }
  });

  // Adapter ratio photo cible 0 a sa taille reelle (auto)
  fitImageOverlay('photo-0', 'overlay-photo-0');

  // Brancher les evenements de detection sur chaque cible
  Object.keys(CONTENT).forEach((targetId) => {
    const el = document.getElementById(targetId);
    if (!el) return;

    el.addEventListener('targetFound', () => {
      hint.classList.add('hidden');
      const c = CONTENT[targetId];
      if (c.type === 'info' && c.html) {
        infoContent.innerHTML = c.html;
        infoPanel.classList.remove('hidden');
      }
    });

    el.addEventListener('targetLost', () => {
      hint.classList.remove('hidden');
      // Ne pas fermer automatiquement le panneau infos : laisse l'utilisateur lire.
      // Decommenter la ligne suivante pour fermer a la perte de cible :
      // infoPanel.classList.add('hidden');
    });
  });

  infoClose.addEventListener('click', () => {
    infoPanel.classList.add('hidden');
  });
});

// Helper : attend que MindAR soit charge
function waitForSystem(sceneEl) {
  return new Promise((resolve) => {
    if (sceneEl.hasLoaded && sceneEl.systems['mindar-image-system']) {
      resolve();
      return;
    }
    sceneEl.addEventListener('loaded', () => resolve(), { once: true });
  });
}
