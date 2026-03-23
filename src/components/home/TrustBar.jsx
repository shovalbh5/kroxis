import React from 'react';
import { Users, Shield, Truck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { icon: Users, value: '50,000+', label: 'לקוחות מרוצים' },
  { icon: Shield, value: 'לכל החיים', label: 'אחריות על המסגרת' },
  { icon: Truck, value: 'חינם', label: 'משלוח מעל ₪500' },
  { icon: Clock, value: '24/7', label: 'שירות לקוחות' },
];

export default function TrustBar() {
  return (
    <section className="py-16 border-y border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <stat.icon className="w-7 h-7 text-primary mx-auto mb-4" />
              <div className="font-heading text-3xl sm:text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}