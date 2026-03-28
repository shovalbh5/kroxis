import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';
const MEDIAPIPE_WASM = `${MEDIAPIPE_CDN}/wasm`;

// Face landmark indices
const NOSE_BRIDGE = 6;
const LEFT_EYE_OUTER = 263;
const RIGHT_EYE_OUTER = 33;
const FOREHEAD = 10;
const CHIN = 152;

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

export default function VirtualTryOn({ isOpen, onClose, modelUrl }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const threeCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const threeRef = useRef(null);
  const glassesModelRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);

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
  }, []);

  const initThree = useCallback((width, height) => {
    const scene = new THREE.Scene();

    // Orthographic camera: left=0, right=width, top=0, bottom=height
    // Y is inverted: 0 at top, height at bottom (like canvas)
    const camera = new THREE.OrthographicCamera(0, width, 0, height, -2000, 2000);
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);

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
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 1, 2);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(0, -1, -1);
    scene.add(backLight);

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

    const lo = landmarks[LEFT_EYE_OUTER];
    const ro = landmarks[RIGHT_EYE_OUTER];
    const nb = landmarks[NOSE_BRIDGE];
    const fh = landmarks[FOREHEAD];
    const ch = landmarks[CHIN];

    // Mirror X (video is mirrored via CSS/canvas transform)
    const lx = (1 - lo.x) * vw, ly = lo.y * vh;
    const rx = (1 - ro.x) * vw, ry = ro.y * vh;
    const nx = (1 - nb.x) * vw, ny = nb.y * vh;
    const fhy = fh.y * vh;
    const chy = ch.y * vh;

    // Eye distance in pixels
    const eyeDist = Math.hypot(lx - rx, ly - ry);

    // Scale: make the model's width match ~1.4x the eye distance
    const targetWidth = eyeDist * 1.4;
    const scaleF = targetWidth / size.x;
    group.scale.set(scaleF, scaleF, scaleF);

    // Position: use midpoint between outer eye corners for horizontal,
    // and blend nose bridge with eye level for vertical
    const eyeMidX = (lx + rx) / 2;
    const eyeMidY = (ly + ry) / 2;

    // Blend: 70% eye level + 30% nose bridge for natural glasses position
    const cx = eyeMidX;
    const cy = eyeMidY * 0.7 + ny * 0.3;

    group.position.set(cx, cy, 0);

    // Rotation: roll (tilt head left/right)
    const roll = Math.atan2(ly - ry, lx - rx);

    // Yaw: estimate from nose bridge horizontal offset
    const eyeMidNormX = (lo.x + ro.x) / 2;
    const noseOffsetX = nb.x - eyeMidNormX;
    const yaw = noseOffsetX * 4;

    // Pitch: based on nose position relative to forehead-chin span
    const faceHeight = chy - fhy;
    const noseRatio = (ny - fhy) / faceHeight;
    const pitch = (noseRatio - 0.35) * 1.5;

    group.rotation.set(pitch, yaw, roll);
    group.visible = true;
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
      const glbUrl = modelUrl || 'https://raw.githubusercontent.com/shovalbh5/kroxis/main/uploads_files_2246107_gafasobj%20(2).glb';
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

          // Keep Three.js canvas in sync with video dimensions
          if (threeRef.current) {
            const r = threeRef.current.renderer;
            const c = threeRef.current.camera;
            if (r.domElement.width !== w || r.domElement.height !== h) {
              r.setSize(w, h);
              c.right = w;
              c.bottom = h;
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
        {/* Close */}
        <div className="absolute top-4 right-4 z-20">
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

        {/* Video canvas (background) */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />

        {/* Three.js canvas (glasses overlay) */}
        <canvas ref={threeCanvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />

        {/* Bottom UI */}
        {status === 'running' && (
          <>
            <div className="absolute bottom-8 left-0 right-0 z-10 text-center pointer-events-none">
              <p className="text-white/90 text-sm bg-black/60 inline-block px-6 py-3 rounded-full backdrop-blur-md border border-white/10 font-medium" dir="rtl">
                {faceDetected
                  ? 'הזז את הראש כדי לראות את המשקפיים מכל הכיוונים'
                  : 'מחפש פנים... כוון את הפנים למצלמה'}
              </p>
            </div>
            <div className="absolute top-4 left-4 z-10">
              <span className="text-white/60 font-heading text-sm tracking-widest">KROXIS TRY-ON</span>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}