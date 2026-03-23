import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

function getSessionId() {
  let id = localStorage.getItem('chat_session_id');
  if (!id) {
    id = 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('chat_session_id', id);
  }
  return id;
}

export default function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => localStorage.getItem('chat_visitor_name') || '');
  const [nameSet, setNameSet] = useState(() => !!localStorage.getItem('chat_visitor_name'));
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const sessionId = useRef(getSessionId()).current;

  // Load messages on open
  useEffect(() => {
    if (!open) return;
    loadMessages();
  }, [open]);

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.session_id === sessionId) {
        if (event.type === 'create') {
          setMessages(prev => {
            if (prev.some(m => m.id === event.data.id)) return prev;
            return [...prev, event.data];
          });
          if (!open && event.data.sender === 'admin') {
            setUnread(prev => prev + 1);
          }
        }
      }
    });
    return unsub;
  }, [open, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    const msgs = await base44.entities.ChatMessage.filter({ session_id: sessionId }, 'created_date', 100);
    setMessages(msgs);
    setUnread(0);
  }

  async function handleSetName() {
    if (!name.trim()) return;
    localStorage.setItem('chat_visitor_name', name.trim());
    setNameSet(true);
  }

  async function handleSend() {
    if (!message.trim() || sending) return;
    setSending(true);
    const text = message.trim();
    setMessage('');

    await base44.entities.ChatMessage.create({
      session_id: sessionId,
      visitor_name: name.trim() || 'אורח',
      sender: 'visitor',
      text,
    });

    // Notify owner via WhatsApp (fire and forget)
    base44.functions.invoke('sendChatNotification', {
      visitorName: name.trim() || 'אורח',
      message: text,
      sessionId,
    }).catch(() => {});

    setSending(false);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[70vh] rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col"
          >
            {/* Header */}
            <div className="bg-green-600 p-4 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">KROXIS</p>
                <p className="text-green-100 text-xs">צ'אט לייב — נחזור אליכם מהר!</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!nameSet ? (
              /* Name Entry */
              <div className="flex-1 bg-[#e5ddd5] flex flex-col items-center justify-center p-6 gap-4" dir="rtl">
                <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                  <p className="text-sm text-gray-800 mb-3">היי! 👋 איך קוראים לך?</p>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetName()}
                    placeholder="השם שלך"
                    className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm outline-none text-right mb-3"
                    autoFocus
                  />
                  <button
                    onClick={handleSetName}
                    disabled={!name.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-full py-2 text-sm font-bold transition-colors"
                  >
                    התחל צ'אט
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 bg-[#e5ddd5] overflow-y-auto p-3 space-y-2" dir="rtl">
                  {messages.length === 0 && (
                    <div className="bg-white rounded-lg rounded-tr-none p-3 shadow-sm max-w-[85%] mr-auto">
                      <p className="text-sm text-gray-800">היי {name}! 👋 איך נוכל לעזור לך?</p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[80%] p-2.5 px-3 rounded-lg shadow-sm text-sm ${
                        msg.sender === 'visitor'
                          ? 'bg-green-100 mr-0 ml-auto rounded-tl-none'
                          : 'bg-white ml-0 mr-auto rounded-tr-none'
                      }`}
                    >
                      {msg.sender === 'admin' && (
                        <p className="text-xs font-bold text-green-700 mb-0.5">KROXIS</p>
                      )}
                      <p className="text-gray-800 whitespace-pre-wrap">{msg.text}</p>
                      <p className="text-[10px] text-gray-400 mt-1 text-left">
                        {new Date(msg.created_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="bg-[#f0f0f0] p-3 shrink-0" dir="rtl">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="כתוב הודעה..."
                      className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm border-none outline-none text-right"
                      autoFocus
                    />
                    <button
                      onClick={handleSend}
                      disabled={!message.trim() || sending}
                      className="w-10 h-10 bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-full flex items-center justify-center text-white transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={() => { setOpen(!open); if (!open) setUnread(0); }}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        {open ? <X className="w-6 h-6" /> : (
          <>
            <MessageCircle className="w-6 h-6 fill-white" />
            <span className="text-sm font-bold hidden sm:inline">דברו איתנו</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}