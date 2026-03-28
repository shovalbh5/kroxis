import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';

// Face landmark indices
const LEFT_EYE_OUTER = 263;
const RIGHT_EYE_OUTER = 33;
const LEFT_EAR = 234;
const RIGHT_EAR = 454;

// Load MediaPipe script via <script> tag (more reliable than dynamic import)
let mediaPipePromise = null;
function loadMediaPipeScript() {
  if (mediaPipePromise) return mediaPipePromise;
  mediaPipePromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.FilesetResolver && window.FaceLandmarker) {
      resolve({ FilesetResolver: window.FilesetResolver, FaceLandmarker: window.FaceLandmarker });
      return;
    }
    const script = document.createElement('script');
    script.src = `${MEDIAPIPE_CDN}/vision_bundle.js`;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      // The script exposes globals through the vision module
      const checkInterval = setInterval(() => {
        if (window.FilesetResolver && window.FaceLandmarker) {
          clearInterval(checkInterval);
          resolve({ FilesetResolver: window.FilesetResolver, FaceLandmarker: window.FaceLandmarker });
        }
      }, 100);
      // Timeout after 10s
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('MediaPipe globals not found after script load'));
      }, 10000);
    };
    script.onerror = () => {
      mediaPipePromise = null;
      reject(new Error('Failed to load MediaPipe script'));
    };
    document.head.appendChild(script);
  });
  return mediaPipePromise;
}

export default function VirtualTryOn({ isOpen, onClose, modelUrl }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const drawGlasses = useCallback((ctx, landmarks, w, h) => {
    const lo = landmarks[LEFT_EYE_OUTER];
    const ro = landmarks[RIGHT_EYE_OUTER];
    const le = landmarks[LEFT_EAR];
    const re = landmarks[RIGHT_EAR];

    // Pixel coords (already mirrored)
    const lx = lo.x * w, ly = lo.y * h;
    const rx = ro.x * w, ry = ro.y * h;
    const lex = le.x * w, ley = le.y * h;
    const rex = re.x * w, rey = re.y * h;

    const eyeDist = Math.hypot(lx - rx, ly - ry);
    const angle = Math.atan2(ly - ry, lx - rx);
    const cx = (lx + rx) / 2;
    const cy = (ly + ry) / 2;

    const gW = eyeDist * 1.7;
    const gH = gW * 0.42;
    const lensW = gW * 0.38;
    const lensH = gH * 0.78;
    const lensY = -lensH * 0.38;
    const gap = gW * 0.04;
    const frameW = gW * 0.028;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Top bar (tactical thick bar across top)
    ctx.beginPath();
    ctx.moveTo(-gW * 0.52, lensY - frameW * 0.5);
    ctx.lineTo(gW * 0.52, lensY - frameW * 0.5);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = frameW * 1.3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Left lens
    const llx = -gap / 2 - lensW;
    ctx.beginPath();
    roundedRect(ctx, llx, lensY, lensW, lensH, lensH * 0.18);
    ctx.fillStyle = 'rgba(20, 20, 20, 0.5)';
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = frameW;
    ctx.stroke();

    // Right lens
    const rlx = gap / 2;
    ctx.beginPath();
    roundedRect(ctx, rlx, lensY, lensW, lensH, lensH * 0.18);
    ctx.fillStyle = 'rgba(20, 20, 20, 0.5)';
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = frameW;
    ctx.stroke();

    // Remove shadow for details
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Bridge
    ctx.beginPath();
    ctx.moveTo(-gap / 2, lensY + lensH * 0.4);
    ctx.quadraticCurveTo(0, lensY + lensH * 0.15, gap / 2, lensY + lensH * 0.4);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = frameW * 0.8;
    ctx.stroke();

    // Lens reflections
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.ellipse(llx + lensW * 0.32, lensY + lensH * 0.28, lensW * 0.18, lensH * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rlx + lensW * 0.32, lensY + lensH * 0.28, lensW * 0.18, lensH * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Temple arms
    const armY = lensY + lensH * 0.32;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = frameW * 0.75;
    ctx.lineCap = 'round';
    // Left arm
    ctx.beginPath();
    ctx.moveTo(llx, armY);
    ctx.lineTo(llx - gW * 0.24, armY + gH * 0.2);
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.moveTo(rlx + lensW, armY);
    ctx.lineTo(rlx + lensW + gW * 0.24, armY + gH * 0.2);
    ctx.stroke();

    ctx.restore();
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
      console.log('[VirtualTryOn] Camera started:', video.videoWidth, 'x', video.videoHeight);

      // 2. Load MediaPipe via script tag
      setStatus('model');
      console.log('[VirtualTryOn] Loading MediaPipe...');
      const { FilesetResolver, FaceLandmarker } = await loadMediaPipeScript();
      console.log('[VirtualTryOn] MediaPipe loaded, creating FaceLandmarker...');

      const filesetResolver = await FilesetResolver.forVisionTasks(
        `${MEDIAPIPE_CDN}/wasm`
      );

      const fl = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      faceLandmarkerRef.current = fl;
      console.log('[VirtualTryOn] FaceLandmarker ready!');
      setStatus('running');

      // 3. Detection loop
      let lastTime = -1;
      const detect = () => {
        const vid = videoRef.current;
        const canvas = canvasRef.current;
        const landmarker = faceLandmarkerRef.current;
        if (!vid || !canvas || !landmarker || vid.paused || vid.ended) return;

        const ctx = canvas.getContext('2d');
        const vw = vid.videoWidth;
        const vh = vid.videoHeight;

        if (vw > 0 && vh > 0) {
          canvas.width = vw;
          canvas.height = vh;

          // Draw mirrored video
          ctx.save();
          ctx.translate(vw, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(vid, 0, 0, vw, vh);
          ctx.restore();

          const now = performance.now();
          if (now > lastTime) {
            lastTime = now;
            const result = landmarker.detectForVideo(vid, now);
            if (result.faceLandmarks && result.faceLandmarks.length > 0) {
              setFaceDetected(true);
              const lm = result.faceLandmarks[0];
              // Mirror X to match the mirrored canvas
              const mirrored = lm.map(p => ({ x: 1 - p.x, y: p.y, z: p.z }));
              drawGlasses(ctx, mirrored, vw, vh);
            } else {
              setFaceDetected(false);
            }
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
  }, [drawGlasses]);

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
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
      >
        {/* Close button */}
        <div className="absolute top-4 right-4 z-20">
          <button onClick={handleClose} className="bg-black/50 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/80 transition-colors border border-white/20">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Loading overlay */}
        {(status === 'loading' || status === 'camera' || status === 'model') && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80">
            <div className="text-center text-white px-6">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-heading text-lg font-semibold">
                {status === 'loading' && 'מאתחל...'}
                {status === 'camera' && 'מפעיל מצלמה — אנא אשר גישה'}
                {status === 'model' && 'טוען מודל זיהוי פנים...'}
              </p>
              <p className="text-white/50 text-sm mt-2">עלול לקחת מספר שניות בפעם הראשונה</p>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/90">
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

        {/* Hidden video for MediaPipe */}
        <video ref={videoRef} playsInline muted className="absolute opacity-0 pointer-events-none w-0 h-0" />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />

        {/* Bottom UI */}
        {status === 'running' && (
          <>
            <div className="absolute bottom-8 left-0 right-0 z-10 text-center pointer-events-none">
              <p className="text-white/90 text-sm bg-black/60 inline-block px-6 py-3 rounded-full backdrop-blur-md border border-white/10 font-medium" dir="rtl">
                {faceDetected
                  ? 'הזז את הראש כדי לראות את המשקפיים מכל הכיוונים'
                  : 'מחפש פנים... כוון את הפנים למצלמה'
                }
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

function roundedRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}