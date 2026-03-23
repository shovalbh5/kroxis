import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Type, 
  Contrast, 
  MousePointer2, 
  Pause, 
  ZoomIn, 
  ZoomOut,
  RotateCcw,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 100,
    lineHeight: 'normal',
    contrast: 'normal',
    grayscale: false,
    highlightLinks: false,
    readableFont: false,
    cursorSize: 'normal',
    stopAnimations: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applySettings();
  }, [settings]);

  const applySettings = () => {
    const root = document.documentElement;
    
    // Font size
    root.style.fontSize = `${settings.fontSize}%`;
    
    // Line height
    if (settings.lineHeight === 'increased') {
      root.style.lineHeight = '1.8';
    } else {
      root.style.lineHeight = '';
    }
    
    // Contrast
    if (settings.contrast === 'high') {
      root.classList.add('high-contrast');
      root.classList.remove('inverted');
    } else if (settings.contrast === 'inverted') {
      root.classList.add('inverted');
      root.classList.remove('high-contrast');
    } else {
      root.classList.remove('high-contrast', 'inverted');
    }
    
    // Grayscale
    if (settings.grayscale) {
      root.classList.add('grayscale-mode');
    } else {
      root.classList.remove('grayscale-mode');
    }
    
    // Highlight links
    if (settings.highlightLinks) {
      root.classList.add('highlight-links');
    } else {
      root.classList.remove('highlight-links');
    }
    
    // Readable font
    if (settings.readableFont) {
      root.classList.add('readable-font');
    } else {
      root.classList.remove('readable-font');
    }
    
    // Cursor size
    if (settings.cursorSize === 'large') {
      root.classList.add('large-cursor');
      root.classList.remove('extra-large-cursor');
    } else if (settings.cursorSize === 'extra-large') {
      root.classList.add('extra-large-cursor');
      root.classList.remove('large-cursor');
    } else {
      root.classList.remove('large-cursor', 'extra-large-cursor');
    }
    
    // Stop animations
    if (settings.stopAnimations) {
      root.classList.add('stop-animations');
    } else {
      root.classList.remove('stop-animations');
    }
  };

  const resetSettings = () => {
    const defaultSettings = {
      fontSize: 100,
      lineHeight: 'normal',
      contrast: 'normal',
      grayscale: false,
      highlightLinks: false,
      readableFont: false,
      cursorSize: 'normal',
      stopAnimations: false,
    };
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility-settings');
  };

  const increaseFontSize = () => {
    setSettings(prev => ({ ...prev, fontSize: Math.min(prev.fontSize + 10, 200) }));
  };

  const decreaseFontSize = () => {
    setSettings(prev => ({ ...prev, fontSize: Math.max(prev.fontSize - 10, 80) }));
  };

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 font-medium"
        aria-label="תפריט נגישות"
        title="תפריט נגישות"
      >
        <Eye className="w-6 h-6" />
        <span className="text-sm">נגישות</span>
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 bg-white border-2 border-secondary rounded-xl shadow-2xl w-80 max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-secondary text-white p-4 flex items-center justify-between rounded-t-xl">
            <h2 className="font-heading text-xl">הצהרת נגישות</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition-colors"
              aria-label="סגור תפריט נגישות"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Font Size */}
            <div className="space-y-2">
              <label className="font-medium text-sm flex items-center gap-2">
                <Type className="w-4 h-4" />
                גודל טקסט ({settings.fontSize}%)
              </label>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={decreaseFontSize}
                  disabled={settings.fontSize <= 80}
                  aria-label="הקטן טקסט"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(settings.fontSize - 80) / 1.2}%` }}
                  />
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={increaseFontSize}
                  disabled={settings.fontSize >= 200}
                  aria-label="הגדל טקסט"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <label className="font-medium text-sm">ריווח שורות</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={settings.lineHeight === 'normal' ? 'default' : 'outline'}
                  onClick={() => setSettings(prev => ({ ...prev, lineHeight: 'normal' }))}
                >
                  רגיל
                </Button>
                <Button
                  size="sm"
                  variant={settings.lineHeight === 'increased' ? 'default' : 'outline'}
                  onClick={() => setSettings(prev => ({ ...prev, lineHeight: 'increased' }))}
                >
                  מוגדל
                </Button>
              </div>
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <label className="font-medium text-sm flex items-center gap-2">
                <Contrast className="w-4 h-4" />
                ניגודיות
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={settings.contrast === 'normal' ? 'default' : 'outline'}
                  onClick={() => setSettings(prev => ({ ...prev, contrast: 'normal' }))}
                >
                  רגיל
                </Button>
                <Button
                  size="sm"
                  variant={settings.contrast === 'high' ? 'default' : 'outline'}
                  onClick={() => setSettings(prev => ({ ...prev, contrast: 'high' }))}
                >
                  גבוה
                </Button>
                <Button
                  size="sm"
                  variant={settings.contrast === 'inverted' ? 'default' : 'outline'}
                  onClick={() => setSettings(prev => ({ ...prev, contrast: 'inverted' }))}
                >
                  הפוך
                </Button>
              </div>
            </div>

            {/* Cursor Size */}
            <div className="space-y-2">
              <label className="font-medium text-sm flex items-center gap-2">
                <MousePointer2 className="w-4 h-4" />
                גודל סמן
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={settings.cursorSize === 'normal' ? 'default' : 'outline'}
                  onClick={() => setSettings(prev => ({ ...prev, cursorSize: 'normal' }))}
                >
                  רגיל
                </Button>
                <Button
                  size="sm"
                  variant={settings.cursorSize === 'large' ? 'default' : 'outline'}
                  onClick={() => setSettings(prev => ({ ...prev, cursorSize: 'large' }))}
                >
                  גדול
                </Button>
                <Button
                  size="sm"
                  variant={settings.cursorSize === 'extra-large' ? 'default' : 'outline'}
                  onClick={() => setSettings(prev => ({ ...prev, cursorSize: 'extra-large' }))}
                >
                  ענק
                </Button>
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-2 border-t pt-4">
              <Button
                size="sm"
                variant={settings.grayscale ? 'default' : 'outline'}
                onClick={() => setSettings(prev => ({ ...prev, grayscale: !prev.grayscale }))}
                className="w-full justify-start"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                גווני אפור
              </Button>

              <Button
                size="sm"
                variant={settings.highlightLinks ? 'default' : 'outline'}
                onClick={() => setSettings(prev => ({ ...prev, highlightLinks: !prev.highlightLinks }))}
                className="w-full justify-start"
              >
                <Eye className="w-4 h-4 mr-2" />
                הדגש קישורים
              </Button>

              <Button
                size="sm"
                variant={settings.readableFont ? 'default' : 'outline'}
                onClick={() => setSettings(prev => ({ ...prev, readableFont: !prev.readableFont }))}
                className="w-full justify-start"
              >
                <Type className="w-4 h-4 mr-2" />
                גופן קריא
              </Button>

              <Button
                size="sm"
                variant={settings.stopAnimations ? 'default' : 'outline'}
                onClick={() => setSettings(prev => ({ ...prev, stopAnimations: !prev.stopAnimations }))}
                className="w-full justify-start"
              >
                <Pause className="w-4 h-4 mr-2" />
                עצור אנימציות
              </Button>
            </div>

            {/* Reset */}
            <Button
              size="sm"
              variant="destructive"
              onClick={resetSettings}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              איפוס הגדרות
            </Button>

            {/* Accessibility Statement */}
            <div className="text-xs text-muted-foreground border-t pt-4">
              <p className="font-medium mb-1">תאימות לתקן ישראלי 5568</p>
              <p>אתר זה עומד בדרישות תקינה ישראלית (ת״י 5568) ברמת AA של WCAG 2.1</p>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Styles */}
      <style jsx global>{`
        .high-contrast {
          filter: contrast(1.5);
        }
        
        .inverted {
          filter: invert(1) hue-rotate(180deg);
        }
        
        .grayscale-mode {
          filter: grayscale(1);
        }
        
        .highlight-links a {
          background: yellow !important;
          color: black !important;
          padding: 2px 4px !important;
          text-decoration: underline !important;
        }
        
        .readable-font * {
          font-family: Arial, sans-serif !important;
        }
        
        .large-cursor * {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M2 2 L2 28 L12 20 L18 30 L22 28 L16 18 L28 18 Z" fill="black" stroke="white" stroke-width="2"/></svg>') 0 0, auto !important;
        }
        
        .extra-large-cursor * {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 32 32"><path d="M2 2 L2 28 L12 20 L18 30 L22 28 L16 18 L28 18 Z" fill="black" stroke="white" stroke-width="2"/></svg>') 0 0, auto !important;
        }
        
        .stop-animations * {
          animation: none !important;
          transition: none !important;
        }
      `}</style>
    </>
  );
}