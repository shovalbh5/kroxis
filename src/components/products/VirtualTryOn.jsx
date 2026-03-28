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
const LEFT_EYE_INNER = 362;
const RIGHT_EYE_INNER = 263;
const FOREHEAD = 10;
const CHIN = 152;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

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
  }, []);

  const initThree = useCallback((width, height) => {
    const scene = new THREE.Scene();

    // Use PerspectiveCamera for realistic 3D depth
    // We position camera so that at z=0, the visible area matches the video pixel dimensions
    const fov = 50;
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 1, 5000);
    // Calculate camera distance so that visible height at z=0 = video height
    const camDist = (height / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    camera.position.set(width / 2, height / 2, camDist);
    camera.lookAt(width / 2, height / 2, 0);

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

    threeRef.current = { scene, camera, renderer, camDist };
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
    const lc = landmarks[LEFT_CHEEK];
    const rc = landmarks[RIGHT_CHEEK];

    // Mirror X (video is mirrored via canvas transform)
    const lx = (1 - lo.x) * vw, ly = lo.y * vh;
    const rx = (1 - ro.x) * vw, ry = ro.y * vh;
    const nx = (1 - nb.x) * vw, ny = nb.y * vh;
    const fhy = fh.y * vh;
    const chy = ch.y * vh;

    // Use Z depth from landmarks for 3D positioning
    const loZ = lo.z || 0;
    const roZ = ro.z || 0;
    const nbZ = nb.z || 0;

    // Eye distance in pixels
    const eyeDist = Math.hypot(lx - rx, ly - ry);

    // Scale: make the model's width match ~1.5x the eye distance
    const targetWidth = eyeDist * 1.5;
    const scaleF = targetWidth / size.x;
    group.scale.set(scaleF, scaleF, scaleF);

    // Position: center between eyes horizontally, blend vertically
    const eyeMidX = (lx + rx) / 2;
    const eyeMidY = (ly + ry) / 2;

    // Blend: 60% eye level + 40% nose bridge for natural glasses position
    const cx = eyeMidX;
    const cy = eyeMidY * 0.6 + ny * 0.4;

    // Z position: use average Z of eye landmarks to push glasses into the face depth
    // MediaPipe Z is relative to face, negative = closer to camera
    const avgZ = ((loZ + roZ) / 2) * vw; // scale Z by viewport width
    const zPos = avgZ * 0.5; // modulate so glasses sit slightly in front

    group.position.set(cx, cy, zPos);

    // Rotation: roll (tilt head left/right)
    const roll = Math.atan2(ly - ry, lx - rx);

    // Yaw: use face width ratio (left cheek to nose vs right cheek to nose)
    // This gives a much more accurate yaw than nose offset alone
    const lcx = (1 - lc.x) * vw;
    const rcx = (1 - rc.x) * vw;
    const leftDist = Math.abs(cx - lcx);
    const rightDist = Math.abs(cx - rcx);
    const faceWidthRatio = (leftDist - rightDist) / (leftDist + rightDist);
    const yaw = faceWidthRatio * 1.8; // strong yaw response

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
      const glbUrl = modelUrl || 'https://raw.githubusercontent.com/shovalbh5/kroxis/main/uploads_files_2246107_gafasobj%20(5).glb';
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
              const fov = 50;
              const camDist = (h / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
              c.position.set(w / 2, h / 2, camDist);
              c.lookAt(w / 2, h / 2, 0);
              c.updateProjectionMatrix();
              threeRef.current.camDist = camDist;
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
        <canvas ref={canvasRef} style={canvasStyle} />

        {/* Three.js canvas (glasses overlay) */}
        <canvas ref={threeCanvasRef} style={canvasStyle} className="pointer-events-none" />

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