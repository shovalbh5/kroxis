import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, AlertCircle, RotateCcw, Loader2, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import TryOnProductPanel from './TryOnProductPanel';
import TryOnBottomBar from './TryOnBottomBar';
import TryOnCaptureButton from './TryOnCaptureButton';

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';
const MEDIAPIPE_WASM = `${MEDIAPIPE_CDN}/wasm`;

let mediaPipePromise = null;
function loadMediaPipe() {
  if (mediaPipePromise) return mediaPipePromise;
  mediaPipePromise = (async () => {
    try {
      const vision = await import(
        /* @vite-ignore */
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs'
      );
      return { FilesetResolver: vision.FilesetResolver, FaceLandmarker: vision.FaceLandmarker };
    } catch (e1) {
      console.warn('[VirtualTryOn] ESM import failed, trying script tag fallback...', e1.message);
      return new Promise((resolve, reject) => {
        if (window.FilesetResolver && window.FaceLandmarker) {
          resolve({ FilesetResolver: window.FilesetResolver, FaceLandmarker: window.FaceLandmarker });
          return;
        }
        const script = document.createElement('script');
        script.src = `${MEDIAPIPE_CDN}/vision_bundle.js`;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          const check = setInterval(() => {
            if (window.FilesetResolver && window.FaceLandmarker) {
              clearInterval(check);
              resolve({ FilesetResolver: window.FilesetResolver, FaceLandmarker: window.FaceLandmarker });
            }
          }, 100);
          setTimeout(() => { clearInterval(check); reject(new Error('MediaPipe globals timeout')); }, 15000);
        };
        script.onerror = () => reject(new Error('Failed to load MediaPipe'));
        document.head.appendChild(script);
      });
    }
  })();
  mediaPipePromise.catch(() => { mediaPipePromise = null; });
  return mediaPipePromise;
}

export default function VirtualTryOn({ isOpen, onClose, modelUrl, products = [], currentProduct, onAddToCart }) {
  const [selectedProduct, setSelectedProduct] = useState(currentProduct);
  const [showPanel, setShowPanel] = useState(true);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const threeCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const threeRef = useRef(null);
  const glassesModelRef = useRef(null);

  const smoothRef = useRef({
    pos: new THREE.Vector3(),
    scale: 1,
    roll: 0,
    initialized: false,
  });

  const stopAll = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (threeRef.current) {
      threeRef.current.renderer.dispose();
      threeRef.current = null;
    }
    glassesModelRef.current = null;
    smoothRef.current.initialized = false;
  }, []);

  const initThree = (width, height) => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(width / 2, -height / 2, 0);
    const zDist = (height / 2) / Math.tan((45 * Math.PI) / 360);
    camera.position.z = zDist;
    camera.lookAt(width / 2, -height / 2, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: threeCanvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 5, 10);
    scene.add(dirLight);

    threeRef.current = { scene, camera, renderer };
    return { scene, camera, renderer };
  };

  const loadModel = async (scene, url) => {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          model.position.sub(center);

          const group = new THREE.Group();
          group.add(model);
          group.visible = false;
          scene.add(group);
          glassesModelRef.current = { group, size };
          resolve(group);
        },
        undefined,
        (err) => {
          console.error('[VirtualTryOn] GLB load error:', err);
          reject(err);
        }
      );
    });
  };

  const updatePosition = (landmarks, vw, vh) => {
    if (!glassesModelRef.current || !threeRef.current) return;

    const { group, size } = glassesModelRef.current;

    const nose = landmarks[168];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    const targetX = (1 - nose.x) * vw;
    const targetY = -nose.y * vh;
    const targetZ = nose.z * vw;

    const eyeDist = Math.sqrt(
      Math.pow((rightEye.x - leftEye.x) * vw, 2) +
      Math.pow((rightEye.y - leftEye.y) * vh, 2)
    );
    const targetScale = (eyeDist / size.x) * 2.15;

    const targetRoll = Math.atan2(
      (rightEye.y - leftEye.y) * vh,
      (rightEye.x - leftEye.x) * vw
    );

    const s = smoothRef.current;
    const LERP = 0.22;

    if (!s.initialized) {
      s.pos.set(targetX, targetY, targetZ);
      s.scale = targetScale;
      s.roll = targetRoll;
      s.initialized = true;
    } else {
      s.pos.x += (targetX - s.pos.x) * LERP;
      s.pos.y += (targetY - s.pos.y) * LERP;
      s.pos.z += (targetZ - s.pos.z) * LERP;
      s.scale += (targetScale - s.scale) * LERP;
      s.roll += (targetRoll - s.roll) * LERP;
    }

    group.position.set(s.pos.x, s.pos.y, s.pos.z);
    group.scale.set(s.scale, s.scale, s.scale);
    group.rotation.set(0, Math.PI, s.roll);
    group.visible = true;
  };

  const start = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    setFaceDetected(false);
    smoothRef.current.initialized = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Video element not found');
      video.srcObject = stream;
      await video.play();

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      initThree(vw, vh);

      const activeModelUrl = selectedProduct?.model_url || modelUrl || 'https://raw.githubusercontent.com/shovalbh5/kroxis/main/uploads_files_2246107_gafasobj%20(5).glb';

      const [mp] = await Promise.all([
        loadMediaPipe(),
        loadModel(threeRef.current.scene, activeModelUrl).catch(err => {
          console.error('[VirtualTryOn] GLB LOAD FAILED:', err);
        })
      ]);

      const fileset = await mp.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
      faceLandmarkerRef.current = await mp.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      setStatus('running');

      const render = () => {
        const vid = videoRef.current;
        const landmarker = faceLandmarkerRef.current;
        if (!vid || !landmarker || vid.paused) return;

        const now = performance.now();
        const result = landmarker.detectForVideo(vid, now);
        
        if (result.faceLandmarks?.[0]) {
          setFaceDetected(true);
          updatePosition(result.faceLandmarks[0], vw, vh);
        } else {
          setFaceDetected(false);
          if (glassesModelRef.current) {
            glassesModelRef.current.group.visible = false;
          }
        }

        if (threeRef.current) {
          threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
        }

        animFrameRef.current = requestAnimationFrame(render);
      };
      render();

    } catch (err) {
      console.error('[VirtualTryOn] Error:', err);
      setStatus('error');
      if (err.name === 'NotAllowedError') {
        setErrorMsg('גישה למצלמה נדחתה. אנא אשר גישה למצלמה בהגדרות הדפדפן.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('לא נמצאה מצלמה במכשיר.');
      } else {
        setErrorMsg(err.message || 'לא ניתן לגשת למצלמה או לטעון את המודל.');
      }
    }
  }, [modelUrl, selectedProduct]);

  useEffect(() => {
    if (isOpen) {
      start();
    }
    return () => {
      stopAll();
      setStatus('idle');
      setFaceDetected(false);
    };
  }, [isOpen, start, stopAll]);

  const handleSelectProduct = useCallback(async (product) => {
    setSelectedProduct(product);
    smoothRef.current.initialized = false;
    if (!threeRef.current || !product?.model_url) return;
    if (glassesModelRef.current) {
      threeRef.current.scene.remove(glassesModelRef.current.group);
      glassesModelRef.current = null;
    }
    try {
      await loadModel(threeRef.current.scene, product.model_url);
    } catch (err) {
      console.error('[VirtualTryOn] Failed to switch model:', err);
    }
  }, []);

  const handleClose = () => {
    stopAll();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
        ref={containerRef}
      >
        {/* Video background — mirrored via CSS */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />

        {/* Three.js glasses overlay — mirrored to match video */}
        <canvas
          ref={threeCanvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Top bar */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <TryOnCaptureButton videoCanvasRef={videoRef} threeCanvasRef={threeCanvasRef} />
          {products.length > 0 && (
            <button
              onClick={() => setShowPanel(p => !p)}
              className="bg-black/50 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/80 transition-colors border border-white/20 lg:hidden"
            >
              {showPanel ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
          )}
          <button onClick={handleClose} className="bg-black/50 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/80 transition-colors border border-white/20">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
            <div className="text-center text-white px-6">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-heading text-lg font-semibold">מכין את חדר המדידה...</p>
              <p className="text-white/50 text-sm mt-2">עלול לקחת מספר שניות בפעם הראשונה</p>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/90">
            <div className="text-center text-white px-6 max-w-md">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="font-heading text-lg font-semibold mb-3">שגיאה</p>
              <p className="text-white/80 text-sm leading-relaxed mb-6" dir="rtl">{errorMsg}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={start} variant="outline" className="text-white border-white/30 hover:bg-white/10">
                  <RotateCcw className="w-4 h-4 mr-2" /> נסה שוב
                </Button>
                <Button onClick={handleClose} variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">סגור</Button>
              </div>
            </div>
          </div>
        )}

        {/* Left product panel */}
        {products.length > 0 && showPanel && (
          <div className="absolute top-0 left-0 bottom-0 z-30 w-64 lg:w-72">
            <TryOnProductPanel
              products={products}
              selectedId={selectedProduct?.id}
              onSelect={handleSelectProduct}
            />
          </div>
        )}

        {/* Bottom bar with product info + add to cart */}
        {status === 'running' && selectedProduct && onAddToCart && (
          <TryOnBottomBar product={selectedProduct} onAddToCart={onAddToCart} />
        )}

        {/* Status text */}
        {status === 'running' && !selectedProduct && (
          <div className="absolute bottom-8 left-0 right-0 z-10 text-center pointer-events-none">
            <p className="text-white/90 text-sm bg-black/60 inline-block px-6 py-3 rounded-full backdrop-blur-md border border-white/10 font-medium" dir="rtl">
              {faceDetected
                ? 'הזז את הראש כדי לראות את המשקפיים מכל הכיוונים'
                : 'מחפש פנים... כוון את הפנים למצלמה'}
            </p>
          </div>
        )}

        {status === 'running' && (
          <div className="absolute top-4 left-4 z-10">
            <span className="text-white/60 font-heading text-sm tracking-widest">KROXIS TRY-ON</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}