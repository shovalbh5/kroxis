import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VirtualTryOn({ isOpen, onClose, modelUrl }) {
  if (!isOpen) return null;

  // We use the MindAR glasses model as a fallback if modelUrl is not provided
  const finalModelUrl = modelUrl || 'https://raw.githubusercontent.com/hiukim/mind-ar-js/master/examples/face-tracking/assets/glasses/scene.gltf';

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-face-three.prod.js"></script>
    <style>
      body { margin: 0; overflow: hidden; background: #000; font-family: system-ui, -apple-system, sans-serif; }
      #container { width: 100vw; height: 100vh; }
      #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; text-align: center; z-index: 10; }
      .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid #fff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px auto; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div id="loading">
      <div class="spinner"></div>
      <div style="font-weight: 600; letter-spacing: 0.5px; font-size: 16px;">טוען מצלמה ומודל תלת-ממד...</div>
      <div style="font-size: 13px; margin-top: 8px; opacity: 0.7;">נא לאשר גישה למצלמה בדפדפן</div>
    </div>
    <div id="container"></div>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const start = async () => {
          try {
            const {MindARThree} = window.MINDAR.FACE;
            const mindarThree = new MindARThree({
              container: document.querySelector("#container"),
            });
            const {renderer, scene, camera} = mindarThree;
            
            const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
            scene.add(light);
            const dirLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
            dirLight.position.set( 0, 10, 10 );
            scene.add(dirLight);

            const anchor = mindarThree.addAnchor(168); // Nose bridge

            const loader = new THREE.GLTFLoader();
            loader.load('${finalModelUrl}', (gltf) => {
              const model = gltf.scene;
              // Adjust scale and position. For the demo model, scale is 0.01.
              // For custom GLB, you might need to change these values.
              model.scale.set(0.01, 0.01, 0.01); 
              model.position.set(0, 0, 0); 
              anchor.group.add(model);
            });

            await mindarThree.start();
            document.getElementById('loading').style.display = 'none';

            renderer.setAnimationLoop(() => {
              renderer.render(scene, camera);
            });
          } catch (err) {
            console.error(err);
            document.getElementById('loading').innerHTML = '<div style="color: #ff4444; font-weight: bold;">שגיאה בטעינת המצלמה. ודא שאישרת גישה.</div>';
          }
        };
        start();
      });
    </script>
  </body>
</html>
  `;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        <div className="absolute top-4 right-4 z-10 flex gap-4">
          <button onClick={onClose} className="bg-black/50 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/80 transition-colors border border-white/20">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="absolute bottom-8 left-0 right-0 z-10 text-center pointer-events-none">
          <p className="text-white/90 text-sm bg-black/60 inline-block px-6 py-3 rounded-full backdrop-blur-md border border-white/10 font-medium tracking-wide" dir="rtl">
            הזז את הראש כדי לראות את המשקפיים מכל הכיוונים
          </p>
        </div>
        <iframe
          srcDoc={htmlContent}
          allow="camera *; autoplay *; encrypted-media *; fullscreen *"
          className="w-full h-full border-0"
          title="Virtual Try On"
        />
      </motion.div>
    </AnimatePresence>
  );
}