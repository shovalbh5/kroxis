import React, { useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !phone.trim()) return;
    setSending(true);
    const response = await base44.functions.invoke('sendCustomerWhatsApp', {
      name: name.trim(),
      phone: phone.trim(),
      message: message.trim()
    });
    setSending(false);
    if (response.data?.success) {
      setSent(true);
      setMessage('');
      setTimeout(() => setSent(false), 3000);
    }
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
            className="fixed bottom-24 left-6 z-50 w-80 max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl overflow-hidden border border-border"
          >
            {/* Header */}
            <div className="bg-green-600 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">KROXIS</p>
                <p className="text-green-100 text-xs">בד״כ עונים תוך דקות</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="bg-[#e5ddd5] p-4 min-h-[160px]" dir="rtl">
              <div className="bg-white rounded-lg rounded-tr-none p-3 shadow-sm max-w-[85%] mr-auto">
                <p className="text-sm text-gray-800 leading-relaxed">
                  היי! 👋 ברוכים הבאים ל-KROXIS.
                  <br />
                  השאירו פרטים ונחזור אליכם בוואטסאפ!
                </p>
              </div>
              {sent && (
                <div className="bg-green-100 rounded-lg rounded-tl-none p-3 shadow-sm max-w-[85%] ml-auto mt-3">
                  <p className="text-sm text-green-800">✅ ההודעה נשלחה! נחזור אליך בהקדם.</p>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="bg-[#f0f0f0] p-3 space-y-2" dir="rtl">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="השם שלך"
                className="w-full bg-white rounded-full px-4 py-2 text-sm border-none outline-none text-right"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="מספר טלפון *"
                className="w-full bg-white rounded-full px-4 py-2 text-sm border-none outline-none text-right"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="כתוב הודעה... *"
                  className="flex-1 bg-white rounded-full px-4 py-2 text-sm border-none outline-none text-right"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim() || !phone.trim()}
                  className="w-9 h-9 bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-full flex items-center justify-center text-white transition-colors shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        {open ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7 fill-white" />}
      </button>
    </>
  );
}