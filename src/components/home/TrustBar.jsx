import React from 'react';
import { Users, Shield, Truck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { icon: Users, value: '50,000+', label: 'Workers Protected' },
  { icon: Shield, value: 'Lifetime', label: 'Frame Warranty' },
  { icon: Truck, value: 'Global', label: 'Shipping Available' },
  { icon: Clock, value: '24/7', label: 'Customer Support' },
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
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-4" />
              <div className="font-heading text-2xl sm:text-3xl font-bold mb-2">{stat.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}