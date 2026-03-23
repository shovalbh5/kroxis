import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initPWA } from '@/utils/pwaSetup'
import { lazyLoadImages } from '@/utils/imageOptimization'

// Initialize PWA functionality
initPWA();

// Setup lazy loading for images
document.addEventListener('DOMContentLoaded', () => {
  lazyLoadImages();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)