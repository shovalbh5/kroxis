import React, { useState } from 'react';
import { Phone, Mail, MapPin, Navigation, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    // Simulate send
    await new Promise(r => setTimeout(r, 1000));
    toast({ title: 'ההודעה נשלחה!', description: 'נחזור אליך תוך 24 שעות.' });
    setForm({ name: '', email: '', phone: '', message: '' });
    setSending(false);
  };

  const contactInfo = [
    { icon: Phone, label: 'טלפון', value: '054-717-2301', href: 'tel:054-717-2301' },
    { icon: Mail, label: 'אימייל', value: 'support@kroxis.com', href: 'mailto:support@kroxis.com' },
    { icon: MapPin, label: 'כתובת', value: 'א.ת נוף הארץ, ראש העין, כפר קאסם' },
    { icon: Clock, label: 'שעות פעילות', value: 'א׳–ה׳ 08:00–17:00, ו׳ 08:00–13:00' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight font-bold mb-4">יצירת קשר</h1>
          <p className="text-lg text-muted-foreground">נשמח לענות על כל שאלה – שלחו הודעה או התקשרו ישירות.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Info */}
          <div className="space-y-6">
            {contactInfo.map((c, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{c.label}</p>
                  {c.href ? (
                    <a href={c.href} className="text-base font-medium hover:text-primary transition-colors">{c.value}</a>
                  ) : (
                    <p className="text-base font-medium">{c.value}</p>
                  )}
                </div>
              </div>
            ))}

            <a
              href="https://waze.com/ul?q=א.ת נוף הארץ, ראש העין, כפר קאסם, 4810001&navigate=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#33ccff] hover:bg-[#2eb8e6] text-white rounded-xl font-medium transition-colors"
            >
              <Navigation className="w-5 h-5" />
              נווט אלינו עם Waze
            </a>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8 space-y-5">
            <h2 className="font-heading text-xl uppercase tracking-wide font-bold mb-2">שלחו לנו הודעה</h2>
            <div>
              <Label htmlFor="name">שם מלא</Label>
              <Input id="name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">אימייל</Label>
                <Input id="email" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="phone">טלפון</Label>
                <Input id="phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="message">הודעה</Label>
              <Textarea id="message" rows={4} required value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="ספרו לנו איך נוכל לעזור..." />
            </div>
            <Button type="submit" className="w-full font-heading uppercase tracking-wider font-bold" disabled={sending}>
              <Send className="w-4 h-4 ml-2" />
              {sending ? 'שולח...' : 'שליחה'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}