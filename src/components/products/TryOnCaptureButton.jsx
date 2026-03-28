import React, { useState } from 'react';
import { Camera, Download, Share2, Check } from 'lucide-react';

export default function TryOnCaptureButton({ videoCanvasRef, threeCanvasRef }) {
  const [captured, setCaptured] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleCapture = () => {
    const videoCanvas = videoCanvasRef.current;
    const threeCanvas = threeCanvasRef.current;
    if (!videoCanvas || !threeCanvas) return;

    // Combine both canvases into one
    const w = videoCanvas.width;
    const h = videoCanvas.height;
    const mergeCanvas = document.createElement('canvas');
    mergeCanvas.width = w;
    mergeCanvas.height = h;
    const ctx = mergeCanvas.getContext('2d');
    ctx.drawImage(videoCanvas, 0, 0, w, h);
    ctx.drawImage(threeCanvas, 0, 0, w, h);

    const dataUrl = mergeCanvas.toDataURL('image/png');
    setCaptured(dataUrl);
    setSaved(false);
  };

  const handleDownload = () => {
    if (!captured) return;
    const a = document.createElement('a');
    a.href = captured;
    a.download = `kroxis-tryon-${Date.now()}.png`;
    a.click();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleShare = async () => {
    if (!captured) return;
    try {
      const blob = await (await fetch(captured)).blob();
      const file = new File([blob], 'kroxis-tryon.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({ files: [file], title: 'KROXIS Virtual Try-On' });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  const handleClose = () => setCaptured(null);

  return (
    <>
      {/* Capture button */}
      <button
        onClick={handleCapture}
        className="bg-white/15 hover:bg-white/25 backdrop-blur-md p-3 rounded-full text-white transition-colors border border-white/20"
        title="צלם תמונה"
      >
        <Camera className="w-5 h-5" />
      </button>

      {/* Preview overlay */}
      {captured && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={handleClose}>
          <div className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={captured} alt="Try-On Capture" className="w-full rounded-lg border border-white/20" />
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
              >
                {saved ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                {saved ? 'נשמר!' : 'שמור'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                שתף
              </button>
              <button
                onClick={handleClose}
                className="text-white/50 hover:text-white px-4 py-2.5 text-sm transition-colors"
              >
                חזור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}