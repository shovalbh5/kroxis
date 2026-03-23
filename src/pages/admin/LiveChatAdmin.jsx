import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Send, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

function ChatList({ sessions, activeSession, onSelect }) {
  return (
    <div className="w-full md:w-72 border-l border-border bg-card overflow-y-auto" dir="rtl">
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-lg">צ'אטים</h2>
      </div>
      {sessions.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">אין צ'אטים עדיין</p>
      )}
      {sessions.map((s) => (
        <button
          key={s.session_id}
          onClick={() => onSelect(s.session_id)}
          className={`w-full p-3 border-b border-border text-right hover:bg-muted transition-colors ${
            activeSession === s.session_id ? 'bg-muted' : ''
          }`}
        >
          <p className="font-semibold text-sm">{s.visitor_name || 'אורח'}</p>
          <p className="text-xs text-muted-foreground truncate">{s.last_message}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {new Date(s.last_date).toLocaleString('he-IL')}
          </p>
          {s.unread > 0 && (
            <span className="inline-block mt-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              {s.unread} חדשות
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function ChatView({ sessionId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    loadMessages();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.session_id === sessionId && event.type === 'create') {
        setMessages(prev => {
          if (prev.some(m => m.id === event.data.id)) return prev;
          return [...prev, event.data];
        });
      }
    });
    return unsub;
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    const msgs = await base44.entities.ChatMessage.filter({ session_id: sessionId }, 'created_date', 200);
    setMessages(msgs);
  }

  async function handleSend() {
    if (!reply.trim() || sending) return;
    setSending(true);
    const visitorName = messages.find(m => m.visitor_name)?.visitor_name || 'אורח';
    await base44.entities.ChatMessage.create({
      session_id: sessionId,
      visitor_name: visitorName,
      sender: 'admin',
      text: reply.trim(),
    });
    setReply('');
    setSending(false);
  }

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground" dir="rtl">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>בחר צ'אט מהרשימה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="md:hidden p-1">
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="font-bold">{messages[0]?.visitor_name || 'אורח'}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[75%] p-2.5 px-3 rounded-lg text-sm ${
              msg.sender === 'admin'
                ? 'bg-green-100 mr-0 ml-auto rounded-tl-none'
                : 'bg-white ml-0 mr-auto rounded-tr-none shadow-sm'
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.text}</p>
            <p className="text-[10px] text-muted-foreground mt-1 text-left">
              {new Date(msg.created_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply Input */}
      <div className="p-3 border-t border-border flex items-center gap-2">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="כתוב תשובה..."
          className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm outline-none text-right"
          autoFocus
        />
        <button
          onClick={handleSend}
          disabled={!reply.trim() || sending}
          className="w-10 h-10 bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-full flex items-center justify-center text-white transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function LiveChatAdmin() {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);

  const { data: allMessages = [] } = useQuery({
    queryKey: ['chatMessages'],
    queryFn: () => base44.entities.ChatMessage.list('-created_date', 500),
    refetchInterval: 10000,
  });

  useEffect(() => {
    // Group messages by session
    const map = {};
    for (const msg of allMessages) {
      if (!map[msg.session_id]) {
        map[msg.session_id] = {
          session_id: msg.session_id,
          visitor_name: msg.visitor_name || 'אורח',
          last_message: msg.text,
          last_date: msg.created_date,
          unread: 0,
        };
      }
      if (new Date(msg.created_date) > new Date(map[msg.session_id].last_date)) {
        map[msg.session_id].last_message = msg.text;
        map[msg.session_id].last_date = msg.created_date;
      }
      if (msg.visitor_name) map[msg.session_id].visitor_name = msg.visitor_name;
      if (msg.sender === 'visitor' && !msg.is_read) map[msg.session_id].unread++;
    }
    const sorted = Object.values(map).sort((a, b) => new Date(b.last_date) - new Date(a.last_date));
    setSessions(sorted);
  }, [allMessages]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-card" dir="rtl">
        <h1 className="font-heading text-xl font-bold">צ'אט לייב</h1>
        <Link to="/admin">
          <Button variant="ghost" size="sm">חזרה לניהול</Button>
        </Link>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* On mobile: show list or chat */}
        <div className={`${activeSession ? 'hidden md:block' : 'block'} w-full md:w-auto`}>
          <ChatList sessions={sessions} activeSession={activeSession} onSelect={setActiveSession} />
        </div>
        <div className={`${activeSession ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          <ChatView sessionId={activeSession} onBack={() => setActiveSession(null)} />
        </div>
      </div>
    </div>
  );
}