import React from 'react';
import { Users, Shield, Truck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

const statIcons = [Users, Shield, Truck, Clock];

export default function TrustBar() {
  const { t } = useLanguage();
  const stats = t('trust.items');
  return (
    <section className="py-16 border-y border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {stats.map((stat, i) => {
            const Icon = statIcons[i];
            return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <Icon className="w-7 h-7 text-primary mx-auto mb-4" />
              <div className="font-heading text-3xl sm:text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</div>
            </motion.div>
          );
          })}
        </div>
      </div>
    </section>
  );
}