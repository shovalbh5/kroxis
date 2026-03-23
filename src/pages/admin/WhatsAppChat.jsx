import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Send, MessageCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function WhatsAppChat() {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const loadMessages = async () => {
    setLoading(true);
    const all = await base44.entities.WhatsAppMessage.list('-created_date', 500);
    setMessages(all);

    // Group by contact number (only incoming to get unique contacts)
    const contactMap = {};
    for (const msg of all) {
      const key = msg.direction === 'outgoing' ? msg.from_number : msg.from_number;
      if (!contactMap[key]) {
        contactMap[key] = {
          number: key,
          name: msg.direction === 'incoming' ? msg.from_name : contactMap[key]?.name || key,
          lastMessage: msg.message_text,
          lastDate: msg.created_date,
          unread: 0
        };
      }
      if (msg.direction === 'incoming') {
        contactMap[key].name = msg.from_name || key;
      }
    }
    setConversations(Object.values(contactMap).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate)));
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
    const unsub = base44.entities.WhatsAppMessage.subscribe((event) => {
      if (event.type === 'create') {
        setMessages(prev => [event.data, ...prev]);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContact, messages]);

  const contactMessages = selectedContact
    ? messages.filter(m => m.from_number === selectedContact).sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

  const selectedConv = conversations.find(c => c.number === selectedContact);

  const handleSend = async () => {
    if (!replyText.trim() || !selectedContact) return;
    setSending(true);
    const res = await base44.functions.invoke('sendWhatsApp', {
      to: selectedContact,
      message: replyText.trim()
    });
    if (res.data?.success) {
      toast({ title: 'הודעה נשלחה!' });
      setReplyText('');
      await loadMessages();
    } else {
      toast({ title: 'שגיאה', description: res.data?.error || 'לא ניתן לשלוח', variant: 'destructive' });
    }
    setSending(false);
  };

  return (
    <div className="h-screen flex flex-col bg-background" dir="rtl">
      {/* Top bar */}
      <div className="bg-secondary text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-1 hover:bg-white/10 rounded">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <MessageCircle className="w-5 h-5 text-green-400" />
          <span className="font-heading text-lg font-bold tracking-wide">WhatsApp Chat</span>
        </div>
        <Button variant="ghost" size="icon" onClick={loadMessages} className="text-white hover:bg-white/10">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Contacts sidebar */}
        <div className="w-80 border-l border-border bg-card overflow-y-auto shrink-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">טוען...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>אין הודעות עדיין</p>
              <p className="text-xs mt-1">הודעות נכנסות יופיעו כאן</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.number}
                onClick={() => setSelectedContact(conv.number)}
                className={`w-full text-right p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                  selectedContact === conv.number ? 'bg-primary/10 border-r-2 border-r-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {(conv.name || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate">{conv.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {moment(conv.lastDate).fromNow()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">בחר שיחה כדי להתחיל</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 bg-card border-b border-border flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center font-bold text-sm">
                  {(selectedConv?.name || '?')[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{selectedConv?.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedContact}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
                {contactMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outgoing' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                        msg.direction === 'outgoing'
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-white text-foreground shadow-sm rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message_text}</p>
                      <p className={`text-[10px] mt-1 ${
                        msg.direction === 'outgoing' ? 'text-white/60' : 'text-muted-foreground'
                      }`}>
                        {moment(msg.created_date).format('HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              <div className="p-3 bg-card border-t border-border flex gap-2 shrink-0">
                <Input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="כתוב תשובה..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button onClick={handleSend} disabled={sending || !replyText.trim()} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}