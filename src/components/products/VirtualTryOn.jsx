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

// Face landmark indices
const NOSE_BRIDGE = 6;
const LEFT_EYE_OUTER = 263;
const RIGHT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 362;
const RIGHT_EYE_INNER = 263;
const FOREHEAD = 10;
const CHIN = 152;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
const LEFT_EAR = 234;
const RIGHT_EAR = 454;
const LEFT_TEMPLE = 127;
const RIGHT_TEMPLE = 356;

// Face mesh triangulation indices for occlusion
// Subset of MediaPipe's FACEMESH_TESSELATION covering the key occlusion areas:
// nose, cheeks, forehead — areas that should hide glasses behind them
const FACE_TRIANGLES = [
  // Nose bridge & sides
  6, 122, 168, 6, 168, 351, 168, 122, 196, 168, 351, 419,
  122, 196, 197, 351, 419, 420,
  196, 197, 3, 419, 420, 248,
  197, 3, 51, 420, 248, 281,
  3, 51, 196, 248, 281, 419,
  // Left cheek / temple area  
  234, 127, 162, 234, 162, 21, 234, 21, 54,
  127, 162, 34, 162, 21, 54, 21, 54, 103,
  234, 127, 93, 93, 127, 132, 132, 127, 34,
  234, 93, 137, 137, 93, 177, 177, 93, 132,
  // Right cheek / temple area
  454, 356, 389, 454, 389, 251, 454, 251, 284,
  356, 389, 264, 389, 251, 284, 251, 284, 332,
  454, 356, 323, 323, 356, 361, 361, 356, 264,
  454, 323, 366, 366, 323, 401, 401, 323, 361,
  // Forehead
  10, 67, 109, 10, 109, 338, 10, 338, 297,
  67, 109, 108, 338, 297, 337,
  109, 108, 151, 338, 337, 151,
  10, 67, 21, 10, 297, 251,
  // Under-eye to cheek (critical for side occlusion)
  33, 133, 173, 33, 173, 157,
  263, 362, 398, 263, 398, 384,
  133, 173, 155, 362, 398, 382,
  173, 155, 154, 398, 382, 381,
];

// Load MediaPipe via dynamic ESM import (works in sandboxed iframes)
let mediaPipePromise = null;
function loadMediaPipe() {
  if (mediaPipePromise) return mediaPipePromise;
  mediaPipePromise = (async () => {
    try {
      console.log('[VirtualTryOn] Loading MediaPipe via dynamic import...');
      const vision = await import(
        /* @vite-ignore */
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs'
      );
      console.log('[VirtualTryOn] MediaPipe module keys:', Object.keys(vision));
      const FilesetResolver = vision.FilesetResolver;
      const FaceLandmarker = vision.FaceLandmarker;
      if (!FilesetResolver || !FaceLandmarker) {
        throw new Error('FilesetResolver or FaceLandmarker not found in module');
      }
      return { FilesetResolver, FaceLandmarker };
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
        script.onerror = () => reject(new Error('Both ESM import and script tag failed to load MediaPipe'));
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
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const threeCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const threeRef = useRef(null);
  const glassesModelRef = useRef(null);
  const occlusionMeshRef = useRef(null);
  const shadowPlaneRef = useRef(null);
  // Smoothing state for lerp interpolation
  const smoothRef = useRef({
    pos: new THREE.Vector3(),
    rot: new THREE.Euler(),
    scale: 1,
    initialized: false,
    baselineEyeDist: 0, // calibrated on first detection for depth scaling
  });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [canvasStyle, setCanvasStyle] = useState({});

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
    occlusionMeshRef.current = null;
    shadowPlaneRef.current = null;
    smoothRef.current.initialized = false;
    smoothRef.current.baselineEyeDist = 0;
  }, []);

  const initThree = useCallback((width, height) => {
    const scene = new THREE.Scene();

    // Camera setup matching proven Benson Ruan approach:
    // Y is negated, Z is negative, camera looks at negative-Y center
    const fov = 45;
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 2000);
    camera.position.x = width / 2;
    camera.position.y = -height / 2;
    camera.position.z = -(height / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    camera.lookAt(width / 2, -height / 2, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: threeCanvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);
    const frontLight = new THREE.SpotLight(0xffffff, 0.5);
    frontLight.position.set(10, 10, 10);
    scene.add(frontLight);
    const backLight = new THREE.SpotLight(0xffffff, 0.3);
    backLight.position.set(10, 10, -10);
    scene.add(backLight);
    camera.add(new THREE.PointLight(0xffffff, 0.8));
    scene.add(camera);

    // Face occlusion mesh — writes to depth buffer only
    const occGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(468 * 3);
    occGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    occGeo.setIndex(FACE_TRIANGLES);
    const occMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    const occMesh = new THREE.Mesh(occGeo, occMat);
    occMesh.renderOrder = 0;
    occMesh.visible = false;
    scene.add(occMesh);
    occlusionMeshRef.current = occMesh;

    // Shadow plane
    const shadowGeo = new THREE.PlaneGeometry(1, 1);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.renderOrder = 2;
    shadowPlane.visible = false;
    scene.add(shadowPlane);
    shadowPlaneRef.current = shadowPlane;

    threeRef.current = { scene, camera, renderer };
    return { scene, camera, renderer };
  }, []);

  const loadGLBModel = useCallback(async (scene, url) => {
    console.log('[VirtualTryOn] Loading GLB model from:', url);
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          // Compute bounding box to normalize scale later
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);
          const min = new THREE.Vector3();
          const max = new THREE.Vector3();
          box.min.clone();
          box.max.clone();
          console.log('[VirtualTryOn] GLB bounding box CENTER:', center.x, center.y, center.z);
          console.log('[VirtualTryOn] GLB bounding box MIN:', box.min.x, box.min.y, box.min.z);
          console.log('[VirtualTryOn] GLB bounding box MAX:', box.max.x, box.max.y, box.max.z);
          console.log('[VirtualTryOn] GLB bounding box SIZE:', size.x, size.y, size.z);
          // Center the model at origin
          model.position.sub(center);
          console.log('[VirtualTryOn] Model re-centered. New position after sub(center):', model.position.x, model.position.y, model.position.z);
          // Wrap in a group for positioning
          const group = new THREE.Group();
          group.add(model);
          group.visible = false;
          group.renderOrder = 1; // Render AFTER occlusion mesh
          // Ensure glasses materials respect depth test
          model.traverse((child) => {
            if (child.isMesh) {
              child.material.depthTest = true;
              child.material.depthWrite = true;
              child.renderOrder = 1;
              // Add subtle environment reflection to lens-like materials
              if (child.material.transparent || child.material.opacity < 1 ||
                  (child.material.name && child.material.name.toLowerCase().includes('lens'))) {
                child.material.envMapIntensity = 0.4;
                child.material.roughness = Math.min(child.material.roughness || 0.5, 0.3);
                child.material.metalness = Math.max(child.material.metalness || 0, 0.15);
              }
            }
          });
          scene.add(group);
          glassesModelRef.current = { group, size };
          console.log('[VirtualTryOn] GLB model loaded! Size:', size);
          resolve(group);
        },
        undefined,
        (err) => {
          console.error('[VirtualTryOn] GLB load error:', err);
          reject(err);
        }
      );
    });
  }, []);

  const updateGlassesPosition = useCallback((landmarks, vw, vh) => {
    if (!glassesModelRef.current || !threeRef.current) return;

    const { group, size } = glassesModelRef.current;
    const cam = threeRef.current.camera;

    // Key landmark indices (MediaPipe 468)
    const midEye = landmarks[168];  // between eyes
    const leftEye = landmarks[143]; // left eye outer
    const rightEye = landmarks[372]; // right eye outer
    const noseBottom = landmarks[2]; // bottom of nose

    // Convert normalized coords to pixel coords (MediaPipe gives 0-1 range)
    // Mirror X because video is mirrored
    const midX = (1 - midEye.x) * vw;
    const midY = midEye.y * vh;
    const midZ = (midEye.z || 0) * vw;

    const lx = (1 - leftEye.x) * vw, ly = leftEye.y * vh, lz = (leftEye.z || 0) * vw;
    const rx = (1 - rightEye.x) * vw, ry = rightEye.y * vh, rz = (rightEye.z || 0) * vw;
    const nbx = (1 - noseBottom.x) * vw, nby = noseBottom.y * vh, nbz = (noseBottom.z || 0) * vw;

    // Position: following Benson Ruan's proven approach — negate Y, offset Z from camera
    const rawX = midX;
    const rawY = -midY;  // negate Y for Three.js
    const rawZ = -cam.position.z + midZ;

    // Scale based on eye distance in 3D
    const eyeDist = Math.sqrt(
      (lx - rx) ** 2 + (ly - ry) ** 2 + (lz - rz) ** 2
    );
    const rawScale = (eyeDist / size.x) * 1.45;

    // Up vector: midEye to noseBottom (for head tilt)
    let upX = midX - nbx;
    let upY = -(midY - nby); // negate Y
    let upZ = midZ - nbz;
    const upLen = Math.sqrt(upX ** 2 + upY ** 2 + upZ ** 2);
    if (upLen > 0) { upX /= upLen; upY /= upLen; upZ /= upLen; }

    // Roll angle from up vector
    const rawRoll = Math.PI / 2 - Math.acos(Math.max(-1, Math.min(1, upX)));

    // Yaw from eye Z difference
    const rawYaw = Math.PI + Math.atan2(lz - rz, lx - rx) * 0.5;

    // Smoothing
    const s = smoothRef.current;
    const LERP = 0.4;

    if (!s.initialized) {
      s.pos.set(rawX, rawY, rawZ);
      s.rot.set(0, rawYaw, rawRoll);
      s.scale = rawScale;
      s.initialized = true;
    } else {
      s.pos.x += (rawX - s.pos.x) * LERP;
      s.pos.y += (rawY - s.pos.y) * LERP;
      s.pos.z += (rawZ - s.pos.z) * LERP;
      s.rot.y += (rawYaw - s.rot.y) * LERP;
      s.rot.z += (rawRoll - s.rot.z) * LERP;
      s.scale += (rawScale - s.scale) * LERP;
    }

    group.position.set(s.pos.x, s.pos.y, s.pos.z);
    group.scale.set(s.scale, s.scale, s.scale);
    group.rotation.y = s.rot.y;
    group.rotation.z = s.rot.z;
    group.visible = true;

    // Shadow
    if (shadowPlaneRef.current) {
      const shadow = shadowPlaneRef.current;
      shadow.scale.set(eyeDist * 1.1, eyeDist * 0.25, 1);
      shadow.position.set(s.pos.x, s.pos.y - eyeDist * 0.15, s.pos.z - 2);
      shadow.rotation.y = s.rot.y;
      shadow.rotation.z = s.rot.z;
      shadow.visible = true;
    }

    // Face occlusion mesh
    if (occlusionMeshRef.current) {
      const occ = occlusionMeshRef.current;
      const posAttr = occ.geometry.getAttribute('position');
      for (let i = 0; i < landmarks.length && i < 468; i++) {
        const lm = landmarks[i];
        const px = (1 - lm.x) * vw;
        const py = -(lm.y * vh);
        const pz = -cam.position.z + (lm.z || 0) * vw;
        posAttr.setXYZ(i, px, py, pz);
      }
      posAttr.needsUpdate = true;
      occ.geometry.computeVertexNormals();
      occ.visible = true;
    }
  }, []);

  const startDetection = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    setFaceDetected(false);

    try {
      // 1. Camera
      setStatus('camera');
      console.log('[VirtualTryOn] Requesting camera...');
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
      console.log('[VirtualTryOn] Camera:', vw, 'x', vh);

      // 2. Init Three.js
      const { scene, camera, renderer } = initThree(vw, vh);

      // 3. Load GLB model
      const activeModelUrl = selectedProduct?.model_url || modelUrl || 'https://raw.githubusercontent.com/shovalbh5/kroxis/main/uploads_files_2246107_gafasobj%20(5).glb';
      const glbUrl = activeModelUrl;
      console.log('[VirtualTryOn] Using GLB URL:', glbUrl);
      setStatus('model');
      
      // Load MediaPipe and GLB in parallel
      const [mp] = await Promise.all([
        loadMediaPipe(),
        loadGLBModel(scene, glbUrl).catch(err => {
          console.error('[VirtualTryOn] GLB LOAD FAILED:', err);
        })
      ]);
      console.log('[VirtualTryOn] GLB model loaded?', !!glassesModelRef.current);
      if (glassesModelRef.current) {
        console.log('[VirtualTryOn] Model size:', glassesModelRef.current.size);
      }

      const { FilesetResolver, FaceLandmarker } = mp;
      console.log('[VirtualTryOn] Creating FaceLandmarker...');

      const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
      const fl = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      faceLandmarkerRef.current = fl;
      console.log('[VirtualTryOn] Ready!');
      setStatus('running');

      // 4. Render loop
      let lastTime = -1;
      const detect = () => {
        const vid = videoRef.current;
        const canvas = canvasRef.current;
        const landmarker = faceLandmarkerRef.current;
        if (!vid || !canvas || !landmarker || vid.paused) return;

        const ctx = canvas.getContext('2d');
        const w = vid.videoWidth;
        const h = vid.videoHeight;

        if (w > 0 && h > 0) {
          canvas.width = w;
          canvas.height = h;

          // Compute letterbox rect to position canvases exactly over the video
          const container = containerRef.current;
          if (container) {
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            const videoAspect = w / h;
            const containerAspect = cw / ch;
            let displayW, displayH, offsetX, offsetY;
            if (videoAspect > containerAspect) {
              displayW = cw;
              displayH = cw / videoAspect;
              offsetX = 0;
              offsetY = (ch - displayH) / 2;
            } else {
              displayH = ch;
              displayW = ch * videoAspect;
              offsetX = (cw - displayW) / 2;
              offsetY = 0;
            }
            setCanvasStyle({
              position: 'absolute',
              left: `${offsetX}px`,
              top: `${offsetY}px`,
              width: `${displayW}px`,
              height: `${displayH}px`,
            });
          }

          // Keep Three.js canvas in sync with video dimensions
          if (threeRef.current) {
            const r = threeRef.current.renderer;
            const c = threeRef.current.camera;
            if (r.domElement.width !== w || r.domElement.height !== h) {
              r.setSize(w, h);
              c.aspect = w / h;
              const fov = 45;
              c.position.x = w / 2;
              c.position.y = -h / 2;
              c.position.z = -(h / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
              c.lookAt(w / 2, -h / 2, 0);
              c.updateProjectionMatrix();
            }
          }

          // Draw mirrored video on 2D canvas
          ctx.save();
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(vid, 0, 0, w, h);
          ctx.restore();

          const now = performance.now();
          if (now > lastTime) {
            lastTime = now;
            const result = landmarker.detectForVideo(vid, now);
            if (result.faceLandmarks?.length > 0) {
              setFaceDetected(true);
              updateGlassesPosition(result.faceLandmarks[0], w, h);
              if (!glassesModelRef.current) {
                console.warn('[VirtualTryOn] Face found but no GLB model loaded!');
              }
            } else {
              setFaceDetected(false);
              if (glassesModelRef.current) {
                glassesModelRef.current.group.visible = false;
              }
              if (occlusionMeshRef.current) {
                occlusionMeshRef.current.visible = false;
              }
              if (shadowPlaneRef.current) {
                shadowPlaneRef.current.visible = false;
              }
            }
          }

          // Render Three.js overlay
          if (threeRef.current) {
            threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
          }
        }

        animFrameRef.current = requestAnimationFrame(detect);
      };
      detect();

    } catch (err) {
      console.error('[VirtualTryOn] Error:', err);
      setStatus('error');
      if (err.name === 'NotAllowedError') {
        setErrorMsg('גישה למצלמה נדחתה. אנא אשר גישה למצלמה בהגדרות הדפדפן.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('לא נמצאה מצלמה במכשיר.');
      } else {
        setErrorMsg(err.message || 'שגיאה לא ידועה');
      }
    }
  }, [initThree, loadGLBModel, updateGlassesPosition, modelUrl]);

  useEffect(() => {
    if (isOpen) {
      startDetection();
    }
    return () => {
      stopAll();
      setStatus('idle');
      setFaceDetected(false);
    };
  }, [isOpen, startDetection, stopAll]);

  // Switch model when selectedProduct changes
  const handleSelectProduct = useCallback(async (product) => {
    setSelectedProduct(product);
    if (!threeRef.current || !product?.model_url) return;
    // Remove old model
    if (glassesModelRef.current) {
      threeRef.current.scene.remove(glassesModelRef.current.group);
      glassesModelRef.current = null;
    }
    // Load new model
    try {
      await loadGLBModel(threeRef.current.scene, product.model_url);
    } catch (err) {
      console.error('[VirtualTryOn] Failed to switch model:', err);
    }
  }, [loadGLBModel]);

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
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        ref={containerRef}
      >
        {/* Top bar */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <TryOnCaptureButton videoCanvasRef={canvasRef} threeCanvasRef={threeCanvasRef} />
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
        {(status === 'loading' || status === 'camera' || status === 'model') && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
            <div className="text-center text-white px-6">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-heading text-lg font-semibold">
                {status === 'camera' && 'מפעיל מצלמה — אנא אשר גישה'}
                {status === 'model' && 'טוען מודל משקפיים וזיהוי פנים...'}
                {status === 'loading' && 'מאתחל...'}
              </p>
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
                <Button onClick={startDetection} variant="outline" className="text-white border-white/30 hover:bg-white/10">
                  <RotateCcw className="w-4 h-4 mr-2" /> נסה שוב
                </Button>
                <Button onClick={handleClose} variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">סגור</Button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden video */}
        <video ref={videoRef} playsInline muted className="absolute opacity-0 pointer-events-none w-0 h-0" />

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

        {/* Video canvas (background) */}
        <canvas ref={canvasRef} style={canvasStyle} />

        {/* Three.js canvas (glasses overlay) */}
        <canvas ref={threeCanvasRef} style={canvasStyle} className="pointer-events-none" />

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