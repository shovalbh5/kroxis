import React, { useRef, useEffect, useState } from 'react';

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
    } catch (e) {
      console.warn('[FaceMeshDebugger] ESM import failed, trying script tag...', e.message);
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

export default function FaceMeshDebugger() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const requestRef = useRef(null);
  const [status, setStatus] = useState('טוען מודל זיהוי פנים...');

  useEffect(() => {
    let stream = null;

    const startCameraAndDetection = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              resolve();
            };
          });
        }

        const mp = await loadMediaPipe();
        const fileset = await mp.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
        faceLandmarkerRef.current = await mp.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1
        });

        setStatus('פעיל - מזהה פנים');
        detectAndDraw();

      } catch (err) {
        console.error(err);
        setStatus('שגיאה בגישה למצלמה או בטעינת המודל.');
      }
    };

    const detectAndDraw = () => {
      if (!videoRef.current || !canvasRef.current || !faceLandmarkerRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];

        // Draw all 468 points in semi-transparent white
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        landmarks.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 1, 0, 2 * Math.PI);
          ctx.fill();
        });

        const drawHighlight = (index, color, size = 4) => {
          const pt = landmarks[index];
          if (!pt) return;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, size, 0, 2 * Math.PI);
          ctx.fill();
        };

        // Anchor points for glasses:
        drawHighlight(168, 'red', 6);    // Nose bridge (glasses center)
        drawHighlight(33, 'green', 5);   // Left eye outer
        drawHighlight(263, 'green', 5);  // Right eye outer
        drawHighlight(127, 'blue', 5);   // Left temple
        drawHighlight(356, 'blue', 5);   // Right temple
      }

      requestRef.current = requestAnimationFrame(detectAndDraw);
    };

    startCameraAndDetection();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-4 z-50 bg-black/50 text-white px-4 py-2 rounded-lg font-mono text-sm">
        {status}
      </div>

      <div className="relative max-w-4xl w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>
    </div>
  );
}