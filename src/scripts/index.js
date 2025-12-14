import App from './pages/app';
import pushManager from './utils/push-manager.js';

// Register service worker
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.error('Service worker registration failed:', err);
  }
}

// Setup push notification
async function setupPush() {
  try {
    if (!pushManager.isSupported()) return;

    const enabled = pushManager.isEnabled();
    const subscribed = await pushManager.isSubscribed();

    if (enabled && !subscribed) {
      const permission = await pushManager.requestPermission();
      if (permission === 'granted') {
        await pushManager.subscribe();
      }
    }
  } catch (err) {
    console.error('Push setup error:', err);
  }
}

// Handle install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  let btn = document.getElementById('install-btn');

  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'install-btn';
    btn.textContent = 'Install App';
    btn.style.cssText =
      'position:fixed;bottom:80px;right:20px;padding:12px 20px;background:#4CAF50;color:white;border:none;border-radius:8px;cursor:pointer;z-index:1000;';
    document.body.appendChild(btn);
  }

  btn.style.display = 'block';

  btn.onclick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      btn.style.display = 'none';
    }

    deferredPrompt = null;
  };
}

window.addEventListener('appinstalled', () => {
  const btn = document.getElementById('install-btn');
  if (btn) btn.style.display = 'none';
});

// Init app
document.addEventListener('DOMContentLoaded', async () => {
  await registerServiceWorker();
  await setupPush();

  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  await app.renderPage();
  window.addEventListener('hashchange', () => app.renderPage());
});
