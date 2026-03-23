/**
 * PWA Setup and Service Worker Registration
 * Enables "Add to Home Screen" functionality
 */

/**
 * Register service worker for PWA functionality
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service workers are not supported');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available, show update prompt
            showUpdatePrompt();
          }
        });
      });
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  });
}

/**
 * Show install prompt for PWA
 */
export function setupInstallPrompt() {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    showInstallButton(deferredPrompt);
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
  });
}

/**
 * Show install button UI
 */
function showInstallButton(deferredPrompt) {
  const installBtn = document.createElement('button');
  installBtn.textContent = '📱 Install App';
  installBtn.className = 'fixed bottom-4 right-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors font-medium text-sm';
  
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User ${outcome} the install prompt`);
    deferredPrompt = null;
    installBtn.remove();
  });

  // Only show if not already installed
  if (!window.matchMedia('(display-mode: standalone)').matches) {
    document.body.appendChild(installBtn);
  }
}

/**
 * Show update prompt when new service worker is available
 */
function showUpdatePrompt() {
  const updatePrompt = document.createElement('div');
  updatePrompt.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:w-96 z-50 p-4 bg-card border border-border rounded-lg shadow-xl';
  updatePrompt.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div>
        <h4 class="font-heading text-sm uppercase tracking-wide mb-1">Update Available</h4>
        <p class="text-xs text-muted-foreground">A new version of KROXIS is ready.</p>
      </div>
      <button id="updateBtn" class="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors">
        Update
      </button>
    </div>
  `;

  document.body.appendChild(updatePrompt);

  document.getElementById('updateBtn').addEventListener('click', () => {
    window.location.reload();
  });
}

/**
 * Check if app is running as PWA
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone ||
         document.referrer.includes('android-app://');
}

/**
 * Initialize PWA functionality
 */
export function initPWA() {
  registerServiceWorker();
  setupInstallPrompt();

  // Track PWA usage
  if (isPWA()) {
    console.log('Running as PWA');
    // You can track analytics here
  }
}