// Configuration des cibles : contenu HTML affiche en overlay plein ecran
// quand MindAR detecte l'image cible.
// Types supportes: 'photo', 'video', 'info'
const CONTENT = {
  'target-0': {
    type: 'photo',
    src: 'https://picsum.photos/seed/poster-ar/1200/900',
    caption: 'Cible 1 detectee. Remplace par ta photo dans js/ar-content.js'
  },
  'target-1': {
    type: 'video',
    src: 'assets/videos/clip1.mp4', // a fournir
    caption: 'Cible 2 detectee'
  },
  'target-2': {
    type: 'info',
    html: `
      <h2>Cible 3</h2>
      <p>Contenu HTML libre : texte, listes, liens.</p>
    `
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');
  const startOverlay = document.getElementById('start-overlay');
  const startBtn = document.getElementById('start-btn');
  const uiOverlay = document.getElementById('ui-overlay');
  const hint = document.getElementById('hint');
  const overlay = document.getElementById('content-overlay');
  const overlayBody = document.getElementById('overlay-body');
  const overlayClose = document.getElementById('overlay-close');

  // Helpers debug
  const dbgMindar = document.getElementById('dbg-mindar');
  const dbgTargets = document.getElementById('dbg-targets');
  const dbgDetect = document.getElementById('dbg-detect');
  const setDbg = (el, txt, cls) => {
    if (!el) return;
    el.textContent = txt;
    el.className = cls || '';
  };

  // Demarrage camera : interaction utilisateur requise (iOS / Chrome)
  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    startBtn.textContent = 'Chargement...';
    try {
      await waitForSystem(sceneEl);
      const arSystem = sceneEl.systems['mindar-image-system'];
      setDbg(dbgMindar, 'init', 'ok');
      await arSystem.start();
      setDbg(dbgMindar, 'demarre', 'ok');
      const n = arSystem.controller?.imageTargets?.length
             ?? sceneEl.querySelectorAll('[mindar-image-target]').length;
      setDbg(dbgTargets, String(n), 'ok');
      startOverlay.classList.add('hidden');
      uiOverlay.classList.remove('hidden');
    } catch (err) {
      console.error('AR start failed', err);
      setDbg(dbgMindar, 'erreur: ' + (err.message || err), 'err');
      startBtn.disabled = false;
      startBtn.textContent = 'Reessayer';
      alert('Impossible d\'activer la camera.');
    }
  });

  // Affichage du contenu dans l'overlay HTML
  function showContent(targetId) {
    const c = CONTENT[targetId];
    if (!c) return;
    overlayBody.innerHTML = '';
    if (c.type === 'photo') {
      const img = document.createElement('img');
      img.src = c.src;
      img.alt = c.caption || '';
      img.className = 'overlay-photo';
      overlayBody.appendChild(img);
      if (c.caption) {
        const cap = document.createElement('p');
        cap.className = 'overlay-caption';
        cap.textContent = c.caption;
        overlayBody.appendChild(cap);
      }
    } else if (c.type === 'video') {
      const video = document.createElement('video');
      video.src = c.src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.className = 'overlay-video';
      overlayBody.appendChild(video);
    } else if (c.type === 'info') {
      const div = document.createElement('div');
      div.className = 'overlay-info';
      div.innerHTML = c.html;
      overlayBody.appendChild(div);
    }
    overlay.classList.remove('hidden');
  }

  function hideContent() {
    overlay.classList.add('hidden');
    overlayBody.innerHTML = ''; // stoppe les videos
  }

  // Brancher detection MindAR sur chaque cible
  Object.keys(CONTENT).forEach((targetId) => {
    const el = document.getElementById(targetId);
    if (!el) return;

    el.addEventListener('targetFound', () => {
      hint.classList.add('hidden');
      setDbg(dbgDetect, targetId, 'ok');
      showContent(targetId);
    });

    el.addEventListener('targetLost', () => {
      hint.classList.remove('hidden');
      setDbg(dbgDetect, 'perdue', 'warn');
      // L'overlay reste ouvert : l'utilisateur ferme manuellement.
      // Decommenter pour fermer automatiquement :
      // hideContent();
    });
  });

  overlayClose.addEventListener('click', hideContent);
});

function waitForSystem(sceneEl) {
  return new Promise((resolve) => {
    if (sceneEl.hasLoaded && sceneEl.systems['mindar-image-system']) {
      resolve();
      return;
    }
    sceneEl.addEventListener('loaded', () => resolve(), { once: true });
  });
}
