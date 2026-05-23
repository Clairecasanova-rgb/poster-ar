// Configuration des cibles : contenu HTML affiche en overlay (hors WebGL)
// Pratique pour textes longs, liens, listes, qu'on ne veut pas dans la scene 3D.
const CONTENT = {
  'target-0': {
    type: 'info',
    html: `
      <h2>Cible 1 — Fiche d'information</h2>
      <p>Remplacez ce contenu dans <code>js/ar-content.js</code>.</p>
      <p>Vous pouvez afficher du texte riche, des liens, des listes&nbsp;:</p>
      <ul>
        <li>Photo&nbsp;: <em>assets/images/photo1.jpg</em></li>
        <li>Localisation, dates, auteurs</li>
        <li>Liens externes</li>
      </ul>
    `
  },
  'target-1': {
    type: 'video' // video plaquee dans la scene 3D, rien a afficher en overlay
  },
  'target-2': {
    type: 'model'
  }
};

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
