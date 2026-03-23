import React from 'react';
import { MessageCircle, Facebook, Twitter, Mail, Link2, Check } from 'lucide-react';
import { useState } from 'react';

export default function ShareButtons({ url, title, size = 'sm' }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;
  const shareTitle = title || document.title;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  const buttons = [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`,
      color: 'hover:bg-green-500/10 hover:text-green-500',
    },
    {
      label: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-blue-600/10 hover:text-blue-600',
    },
    {
      label: 'Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-sky-500/10 hover:text-sky-500',
    },
    {
      label: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-primary/10 hover:text-primary',
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {buttons.map(btn => (
        <a
          key={btn.label}
          href={btn.href}
          target="_blank"
          rel="noopener noreferrer"
          title={btn.label}
          className={`${btnSize} rounded-full border border-border flex items-center justify-center text-muted-foreground transition-all ${btn.color}`}
        >
          <btn.icon className={iconSize} />
        </a>
      ))}
      <button
        onClick={handleCopy}
        title="העתק קישור"
        className={`${btnSize} rounded-full border border-border flex items-center justify-center text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary`}
      >
        {copied ? <Check className={iconSize} /> : <Link2 className={iconSize} />}
      </button>
    </div>
  );
}