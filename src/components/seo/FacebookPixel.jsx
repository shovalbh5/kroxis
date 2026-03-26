import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';

export default function FacebookPixel() {
  const location = useLocation();

  useEffect(() => {
    const initPixel = async () => {
      try {
        const response = await base44.functions.invoke('getPixelId', {});
        const pixelId = response.data.pixelId;
        
        if (pixelId && !window.fbq) {
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          
          window.fbq('init', pixelId);
          window.fbq('track', 'PageView');
        }
      } catch (error) {
        console.error('Failed to initialize Facebook Pixel:', error);
      }
    };
    
    initPixel();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);

  return null;
}