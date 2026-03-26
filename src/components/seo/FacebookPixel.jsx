import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function FacebookPixel() {
  const { data: pixelId } = useQuery({
    queryKey: ['facebook-pixel'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getPixelId', {});
      return res.data.pixelId;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!pixelId) return;

    // Don't inject if already exists
    if (document.getElementById('facebook-pixel-script')) return;

    const script = document.createElement('script');
    script.id = 'facebook-pixel-script';
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement('noscript');
    noscript.id = 'facebook-pixel-noscript';
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
    document.head.appendChild(noscript);

    return () => {
      // Cleanup if component unmounts (rare for this component)
    };
  }, [pixelId]);

  return null;
}