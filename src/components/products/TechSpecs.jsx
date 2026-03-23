import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Zap, Scale, Layers } from 'lucide-react';

export default function TechSpecs({ product }) {
  const specs = [
    { icon: Zap, label: 'Impact Resistance', value: product.impact_resistance || 'High Velocity (ANSI Z87.1+)' },
    { icon: Shield, label: 'UV Protection', value: product.uv_protection || '99.9% UV400' },
    { icon: Scale, label: 'Weight', value: product.weight_grams ? `${product.weight_grams}g` : '28g' },
    { icon: Layers, label: 'Frame Material', value: product.frame_material || 'TR90 Swiss Tech' },
  ];

  const certLabels = {
    ANSI_Z87: 'ANSI Z87.1+ (High Velocity Impact)',
    CE_EN166: 'CE EN166 (European Standard)',
    OSHA: 'OSHA Compliant',
    MIL_PRF: 'MIL-PRF-31013 (Military Grade)',
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="specs">
        <AccordionTrigger className="font-heading text-sm uppercase tracking-wider">
          Technical Specifications
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-4 py-2">
            {specs.map(spec => (
              <div key={spec.label} className="flex items-start gap-2">
                <spec.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{spec.label}</p>
                  <p className="text-sm font-medium">{spec.value}</p>
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="certs">
        <AccordionTrigger className="font-heading text-sm uppercase tracking-wider">
          Safety Certifications
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 py-2">
            {product.safety_certs?.map(cert => (
              <div key={cert} className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm">{certLabels[cert] || cert}</span>
              </div>
            )) || (
              <p className="text-sm text-muted-foreground">Contact us for certification details.</p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="shipping">
        <AccordionTrigger className="font-heading text-sm uppercase tracking-wider">
          Shipping & Warranty
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 py-2 text-sm">
            <p>• Free shipping on orders over $150</p>
            <p>• Lifetime frame warranty</p>
            <p>• 30-day satisfaction guarantee</p>
            <p>• International shipping available</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}