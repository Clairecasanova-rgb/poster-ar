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

  // Helpers debug
  const dbgMindar = document.getElementById('dbg-mindar');
  const dbgTargets = document.getElementById('dbg-targets');
  const dbgDetect = document.getElementById('dbg-detect');
  const setDbg = (el, txt, cls) => {
    if (!el) return;
    el.textContent = txt;
    el.className = cls || '';
  };

  // Demarrage caméra : declenche par interaction utilisateur (iOS Safari)
  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    startBtn.textContent = 'Chargement...';
    try {
      // Attendre que A-Frame ait initialise le systeme MindAR
      await waitForSystem(sceneEl);
      const arSystem = sceneEl.systems['mindar-image-system'];
      setDbg(dbgMindar, 'initialise', 'ok');
      await arSystem.start();
      setDbg(dbgMindar, 'demarre', 'ok');

      // Compter cibles chargees (best-effort, API interne MindAR)
      try {
        const n = arSystem.controller?.imageTargets?.length
               ?? arSystem.controller?.inputWidth ? '?' : '?';
        const real = arSystem.controller?.imageTargets?.length
                   ?? arSystem.el?.querySelectorAll('[mindar-image-target]').length;
        setDbg(dbgTargets, String(real ?? '?'), 'ok');
      } catch (e) {
        setDbg(dbgTargets, 'inconnu', 'warn');
      }

      startOverlay.classList.add('hidden');
      uiOverlay.classList.remove('hidden');
    } catch (err) {
      console.error('AR start failed', err);
      setDbg(dbgMindar, 'erreur: ' + (err.message || err), 'err');
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

    let scaleFixApplied = false;

    el.addEventListener('targetFound', () => {
      hint.classList.add('hidden');
      // Workaround: si la matrix de MindAR a un facteur d'echelle enorme
      // (image source compilee trop grande), on compense en scalant les enfants.
      setTimeout(() => {
        if (!el.object3D) return;
        const m = el.object3D.matrix.elements;
        const sx = Math.sqrt(m[0]*m[0] + m[1]*m[1] + m[2]*m[2]);
        if (!scaleFixApplied && sx > 10) {
          const k = 1 / sx;
          el.object3D.children.forEach((c) => c.scale.setScalar(k));
          scaleFixApplied = true;
          setDbg(dbgDetect, `${targetId} (scale fix: ${k.toExponential(2)})`, 'ok');
        } else {
          setDbg(dbgDetect, `${targetId} (sx=${sx.toFixed(2)})`, 'ok');
        }
      }, 250);
      const c = CONTENT[targetId];
      if (c.type === 'info' && c.html) {
        infoContent.innerHTML = c.html;
        infoPanel.classList.remove('hidden');
      }
    });

    el.addEventListener('targetLost', () => {
      hint.classList.remove('hidden');
      setDbg(dbgDetect, 'perdue', 'warn');
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
