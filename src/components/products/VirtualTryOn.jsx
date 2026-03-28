import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// MediaPipe face landmark indices for glasses placement
const NOSE_BRIDGE = 6;
const LEFT_EYE_OUTER = 263;
const RIGHT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 362;
const RIGHT_EYE_INNER = 133;
const LEFT_EAR = 234;
const RIGHT_EAR = 454;

export default function VirtualTryOn({ isOpen, onClose, modelUrl }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const stopAll = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const drawGlasses = useCallback((ctx, landmarks, videoW, videoH) => {
    const leftOuter = landmarks[LEFT_EYE_OUTER];
    const rightOuter = landmarks[RIGHT_EYE_OUTER];
    const noseBridge = landmarks[NOSE_BRIDGE];
    const leftEar = landmarks[LEFT_EAR];
    const rightEar = landmarks[RIGHT_EAR];

    // Convert normalized coords to pixel coords
    const lx = leftOuter.x * videoW;
    const ly = leftOuter.y * videoH;
    const rx = rightOuter.x * videoW;
    const ry = rightOuter.y * videoH;
    const nx = noseBridge.x * videoW;
    const ny = noseBridge.y * videoH;
    const lex = leftEar.x * videoW;
    const ley = leftEar.y * videoH;
    const rex = rightEar.x * videoW;
    const rey = rightEar.y * videoH;

    // Calculate glasses dimensions
    const eyeDistance = Math.sqrt((lx - rx) ** 2 + (ly - ry) ** 2);
    const glassesWidth = eyeDistance * 1.65;
    const glassesHeight = glassesWidth * 0.42;
    const angle = Math.atan2(ly - ry, lx - rx);

    const centerX = (lx + rx) / 2;
    const centerY = (ly + ry) / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    const lensW = glassesWidth * 0.38;
    const lensH = glassesHeight * 0.75;
    const lensY = -lensH * 0.35;
    const lensGap = glassesWidth * 0.04;

    // Frame shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // Left lens
    ctx.beginPath();
    const leftLensX = -lensGap / 2 - lensW;
    roundedRect(ctx, leftLensX, lensY, lensW, lensH, lensH * 0.15);
    ctx.fillStyle = 'rgba(30, 30, 30, 0.45)';
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = glassesWidth * 0.025;
    ctx.stroke();

    // Right lens
    ctx.beginPath();
    const rightLensX = lensGap / 2;
    roundedRect(ctx, rightLensX, lensY, lensW, lensH, lensH * 0.15);
    ctx.fillStyle = 'rgba(30, 30, 30, 0.45)';
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = glassesWidth * 0.025;
    ctx.stroke();

    // Lens shine
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Left lens shine
    ctx.beginPath();
    ctx.ellipse(leftLensX + lensW * 0.3, lensY + lensH * 0.3, lensW * 0.15, lensH * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();

    // Right lens shine
    ctx.beginPath();
    ctx.ellipse(rightLensX + lensW * 0.3, lensY + lensH * 0.3, lensW * 0.15, lensH * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();

    // Bridge
    ctx.beginPath();
    ctx.moveTo(-lensGap / 2, lensY + lensH * 0.35);
    ctx.quadraticCurveTo(0, lensY + lensH * 0.15, lensGap / 2, lensY + lensH * 0.35);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = glassesWidth * 0.022;
    ctx.stroke();

    // Temple arms (stems)
    const armY = lensY + lensH * 0.3;
    // Left arm
    ctx.beginPath();
    ctx.moveTo(leftLensX, armY);
    ctx.lineTo(leftLensX - glassesWidth * 0.22, armY + glassesHeight * 0.15);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = glassesWidth * 0.02;
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(rightLensX + lensW, armY);
    ctx.lineTo(rightLensX + lensW + glassesWidth * 0.22, armY + glassesHeight * 0.15);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = glassesWidth * 0.02;
    ctx.stroke();

    // Top frame bar (tactical look)
    ctx.beginPath();
    ctx.moveTo(leftLensX - glassesWidth * 0.02, lensY);
    ctx.lineTo(rightLensX + lensW + glassesWidth * 0.02, lensY);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = glassesWidth * 0.03;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
  }, []);

  const startDetection = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setErrorMsg('הדפדפן לא תומך בגישה למצלמה. נסה לפתוח בטאב חדש.');
      return;
    }

    try {
      // Start camera
      setStatus('camera');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      // Load MediaPipe
      setStatus('model');
      const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
      const { FaceLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      faceLandmarkerRef.current = faceLandmarker;
      setStatus('running');

      // Detection loop
      let lastTime = -1;
      const detect = () => {
        if (!videoRef.current || !canvasRef.current || !faceLandmarkerRef.current) return;
        
        const vid = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (vid.videoWidth > 0 && vid.videoHeight > 0) {
          canvas.width = vid.videoWidth;
          canvas.height = vid.videoHeight;

          // Draw mirrored video
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          ctx.restore();

          const now = performance.now();
          if (now !== lastTime) {
            lastTime = now;
            const result = faceLandmarkerRef.current.detectForVideo(vid, now);
            
            if (result.faceLandmarks?.length > 0) {
              const landmarks = result.faceLandmarks[0];
              // Mirror the x coordinates since we mirror the canvas
              const mirrored = landmarks.map(l => ({ ...l, x: 1 - l.x }));
              drawGlasses(ctx, mirrored, canvas.width, canvas.height);
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(detect);
      };

      detect();

    } catch (err) {
      console.error('VirtualTryOn error:', err);
      setStatus('error');
      if (err.name === 'NotAllowedError') {
        setErrorMsg('גישה למצלמה נדחתה. אנא אשר גישה למצלמה בהגדרות הדפדפן.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('לא נמצאה מצלמה במכשיר.');
      } else {
        setErrorMsg(`שגיאה: ${err.message}`);
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
    };
  }, [isOpen, startDetection, stopAll]);

  const handleClose = () => {
    stopAll();
    onClose();
  };

  if (!isOpen) return null;

  const statusMessages = {
    loading: 'מאתחל...',
    camera: 'מפעיל מצלמה... נא לאשר גישה',
    model: 'טוען מודל זיהוי פנים (עלול לקחת מספר שניות)...',
    running: null,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
      >
        {/* Close */}
        <div className="absolute top-4 right-4 z-20">
          <button onClick={handleClose} className="bg-black/50 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/80 transition-colors border border-white/20">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Loading states */}
        {statusMessages[status] && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80">
            <div className="text-center text-white">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-heading text-lg font-semibold">{statusMessages[status]}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="text-center text-white z-10 px-6 max-w-md">
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
        )}

        {/* Hidden video element for MediaPipe input */}
        <video ref={videoRef} playsInline muted className="hidden" />

        {/* Canvas with glasses overlay */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />

        {/* Bottom hint */}
        {status === 'running' && (
          <>
            <div className="absolute bottom-8 left-0 right-0 z-10 text-center pointer-events-none">
              <p className="text-white/90 text-sm bg-black/60 inline-block px-6 py-3 rounded-full backdrop-blur-md border border-white/10 font-medium" dir="rtl">
                הזז את הראש כדי לראות את המשקפיים מכל הכיוונים
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