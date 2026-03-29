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

// Face tesselation subset for occlusion (nose, cheeks, temples)
const FACE_TESSELATION = [
  6, 122, 168, 6, 168, 351, 168, 122, 196, 168, 351, 419, 122, 196, 197, 351, 419, 420,
  196, 197, 3, 419, 420, 248, 197, 3, 51, 420, 248, 281, 3, 51, 196, 248, 281, 419,
  234, 127, 162, 234, 162, 21, 234, 21, 54, 127, 162, 34, 162, 21, 54, 21, 54, 103,
  454, 356, 389, 454, 389, 251, 454, 251, 284, 356, 389, 264, 389, 251, 284, 251, 284, 332
];

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

// Temp vectors for matrix decomposition (avoid alloc per frame)
const _tempPos = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();
const _tempScale = new THREE.Vector3();

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
  const occluderMeshRef = useRef(null);

  const smoothRef = useRef({
    pos: new THREE.Vector3(),
    matrix: new THREE.Matrix4(),
    scale: 1,
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
    occluderMeshRef.current = null;
    smoothRef.current.initialized = false;
  }, []);

  const initThree = (width, height) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    const zDist = (height / 2) / Math.tan((45 * Math.PI) / 360);
    camera.position.set(width / 2, -height / 2, zDist);
    camera.lookAt(width / 2, -height / 2, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: threeCanvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // PBR lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 5, 10);
    scene.add(dirLight);

    // Occluder mesh (invisible head that writes depth only)
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array(468 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(FACE_TESSELATION);
    const mat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, side: THREE.DoubleSide });
    const occluder = new THREE.Mesh(geo, mat);
    occluder.renderOrder = 0;
    occluder.visible = false;
    scene.add(occluder);
    occluderMeshRef.current = occluder;

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
          const center = new THREE.Vector3();
          box.getCenter(center);

          // Center model so pivot is at origin
          model.position.sub(center);

          model.traverse((child) => {
            if (child.isMesh) {
              child.material.depthTest = true;
              child.material.depthWrite = true;
              child.renderOrder = 1;
            }
          });

          const group = new THREE.Group();
          group.add(model);
          group.visible = false;
          scene.add(group);
          glassesModelRef.current = { group };
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

    const { group } = glassesModelRef.current;
    const cam = threeRef.current.camera;

    // Key landmarks
    const nose = landmarks[168];
    const leftEyeInner = landmarks[133];
    const rightEyeInner = landmarks[362];

    // 1. Base position (nose bridge)
    const rawX = nose.x * vw;
    const rawY = -nose.y * vh;
    const rawZ = -cam.position.z + nose.z * vw;

    // 2. Full 3D pose (Pitch, Yaw, Roll) via orthogonal basis
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().subVectors(
      new THREE.Vector3(rightEyeInner.x * vw, -rightEyeInner.y * vh, rightEyeInner.z * vw),
      new THREE.Vector3(leftEyeInner.x * vw, -leftEyeInner.y * vh, leftEyeInner.z * vw)
    ).normalize();
    const forward = new THREE.Vector3().crossVectors(right, up).normalize();

    // 3. Transformation matrix
    const basis = new THREE.Matrix4().makeBasis(right, up, forward);
    basis.setPosition(rawX, rawY, rawZ);

    // 4. Scale from eye distance
    const detectedEyeDist = Math.sqrt(
      Math.pow((landmarks[33].x - landmarks[263].x) * vw, 2) +
      Math.pow((landmarks[33].y - landmarks[263].y) * vh, 2)
    );
    const targetScale = detectedEyeDist / 140 * 2.3;

    // 5. Smoothing
    const s = smoothRef.current;
    const LERP = 0.25;

    if (!s.initialized) {
      s.pos.set(rawX, rawY, rawZ);
      s.matrix.copy(basis);
      s.scale = targetScale;
      s.initialized = true;
    } else {
      s.pos.lerp(new THREE.Vector3(rawX, rawY, rawZ), LERP);
      for (let i = 0; i < 16; i++) {
        s.matrix.elements[i] += (basis.elements[i] - s.matrix.elements[i]) * LERP;
      }
      s.scale += (targetScale - s.scale) * LERP;
    }

    // 6. Apply to model — decompose matrix for quaternion, then set pos/scale separately
    s.matrix.decompose(_tempPos, _tempQuat, _tempScale);
    group.quaternion.copy(_tempQuat);
    group.position.copy(s.pos);
    group.scale.set(s.scale, s.scale, s.scale);
    group.visible = true;

    // 7. Update occluder mesh
    if (occluderMeshRef.current) {
      const occluder = occluderMeshRef.current;
      const attr = occluder.geometry.getAttribute('position');
      for (let i = 0; i < 468 && i < landmarks.length; i++) {
        const lm = landmarks[i];
        attr.setXYZ(i, lm.x * vw, -(lm.y * vh), -cam.position.z + lm.z * vw);
      }
      attr.needsUpdate = true;
      occluder.geometry.computeVertexNormals();
      occluder.visible = true;
    }
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
          if (glassesModelRef.current) glassesModelRef.current.group.visible = false;
          if (occluderMeshRef.current) occluderMeshRef.current.visible = false;
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
              <p className="font-heading text-lg font-semibold">מכין את חדר המדידה של Kroxis...</p>
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
        {status === 'running' && (
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