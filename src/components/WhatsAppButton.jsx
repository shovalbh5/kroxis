import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WHATSAPP_NUMBER = '972525568069';

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    const text = name.trim()
      ? `היי, אני ${name.trim()}. ${message.trim()}`
      : message.trim();
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setMessage('');
    setName('');
    setOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl overflow-hidden border border-border"
          >
            {/* Header */}
            <div className="bg-green-600 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">KROXIS</p>
                <p className="text-green-100 text-xs">לחצו שלח ותועברו ישירות לוואטסאפ</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="bg-[#e5ddd5] p-4 min-h-[120px]" dir="rtl">
              <div className="bg-white rounded-lg rounded-tr-none p-3 shadow-sm max-w-[85%] mr-auto">
                <p className="text-sm text-gray-800 leading-relaxed">
                  היי! 👋 ברוכים הבאים ל-KROXIS.
                  <br />
                  כתבו הודעה ותועברו ישירות לוואטסאפ שלנו!
                </p>
              </div>
            </div>

            {/* Input Form */}
            <div className="bg-[#f0f0f0] p-3 space-y-2" dir="rtl">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="השם שלך (אופציונלי)"
                className="w-full bg-white rounded-full px-4 py-2 text-sm border-none outline-none text-right"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="כתוב הודעה..."
                  className="flex-1 bg-white rounded-full px-4 py-2 text-sm border-none outline-none text-right"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="w-9 h-9 bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-full flex items-center justify-center text-white transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
        aria-label="Chat on WhatsApp"
      >
        {open ? <X className="w-6 h-6" /> : (
          <>
            <MessageCircle className="w-6 h-6 fill-white" />
            <span className="text-sm font-bold hidden sm:inline">דברו איתנו</span>
          </>
        )}
      </button>
    </>
  );
}