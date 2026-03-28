import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Camera, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function VirtualTryOn({ isOpen, onClose, modelUrl }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle, requesting, streaming, error
  const [errorMsg, setErrorMsg] = useState('');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setStatus('requesting');
    setErrorMsg('');

    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('error');
      setErrorMsg('הדפדפן לא תומך בגישה למצלמה. נסה לפתוח את האתר בטאב חדש (לא בתצוגה מקדימה).');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('streaming');
    } catch (err) {
      console.error('Camera error:', err);
      setStatus('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('גישה למצלמה נדחתה. נא לאשר גישה למצלמה בהגדרות הדפדפן ולנסות שוב.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('לא נמצאה מצלמה במכשיר.');
      } else if (err.name === 'NotReadableError') {
        setErrorMsg('המצלמה בשימוש על ידי אפליקציה אחרת.');
      } else {
        setErrorMsg(`שגיאה בהפעלת המצלמה: ${err.message}`);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
      setStatus('idle');
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
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
          <button 
            onClick={handleClose} 
            className="bg-black/50 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/80 transition-colors border border-white/20"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera requesting state */}
        {status === 'requesting' && (
          <div className="text-center text-white z-10">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="font-heading text-lg font-semibold tracking-wide">מפעיל מצלמה...</p>
            <p className="text-white/70 text-sm mt-2">נא לאשר גישה למצלמה כשהדפדפן מבקש</p>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="text-center text-white z-10 px-6 max-w-md">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="font-heading text-lg font-semibold mb-3">לא ניתן להפעיל את המצלמה</p>
            <p className="text-white/80 text-sm leading-relaxed mb-6" dir="rtl">{errorMsg}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={startCamera} variant="outline" className="text-white border-white/30 hover:bg-white/10">
                <RotateCcw className="w-4 h-4 mr-2" />
                נסה שוב
              </Button>
              <Button onClick={handleClose} variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                סגור
              </Button>
            </div>
          </div>
        )}

        {/* Camera feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${status === 'streaming' ? 'block' : 'hidden'}`}
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Glasses overlay guide */}
        {status === 'streaming' && (
          <>
            {/* Face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-64 h-80 sm:w-72 sm:h-96 border-2 border-white/20 rounded-[50%] relative">
                {/* Glasses position indicator */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[85%]">
                  <svg viewBox="0 0 200 60" className="w-full opacity-40">
                    {/* Left lens */}
                    <ellipse cx="55" cy="30" rx="42" ry="24" fill="none" stroke="white" strokeWidth="2.5" />
                    {/* Right lens */}
                    <ellipse cx="145" cy="30" rx="42" ry="24" fill="none" stroke="white" strokeWidth="2.5" />
                    {/* Bridge */}
                    <path d="M 97 30 Q 100 22 103 30" fill="none" stroke="white" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom instructions */}
            <div className="absolute bottom-8 left-0 right-0 z-10 text-center pointer-events-none">
              <p className="text-white/90 text-sm bg-black/60 inline-block px-6 py-3 rounded-full backdrop-blur-md border border-white/10 font-medium tracking-wide" dir="rtl">
                מרכז את הפנים בתוך המסגרת
              </p>
            </div>

            {/* KROXIS branding */}
            <div className="absolute top-4 left-4 z-10">
              <span className="text-white/60 font-heading text-sm tracking-widest">KROXIS TRY-ON</span>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}