import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    nav: {
      home: 'Home',
      shop: 'Shop',
      allProducts: 'All Products',
      cart: 'Cart',
    },
    home: {
      hero_title: 'Built for',
      hero_subtitle: 'the Grind',
      hero_description: 'Engineered for the toughest environments. ANSI Z87.1+ certified impact protection meets industrial luxury.',
      shop_btn: 'Shop the Collection',
      watch_btn: 'Watch Stress Test',
      featured_title: 'The Heavy Hitters',
      industry_title: 'Shop by Industry',
    },
    product: {
      addToCart: 'Add to Cart',
      quantity: 'Quantity',
      lensOption: 'Lens Option',
      color: 'Color',
      buyBulk: 'Contractor Pricing',
      freeShipping: 'Free Shipping',
      lifetimeWarranty: 'Lifetime Warranty',
      returns: '30-Day Returns',
    },
    checkout: {
      title: 'Checkout',
      contactInfo: 'Contact Information',
      shippingAddress: 'Shipping Address',
      orderSummary: 'Order Summary',
      placeOrder: 'Place Order',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      total: 'Total',
    },
    footer: {
      newsletter: 'Join the Crew',
      newsletterDesc: 'Get 10% off your first order and early access to new drops.',
      subscribe: 'Subscribe',
    }
  },
  he: {
    nav: {
      home: 'בית',
      shop: 'חנות',
      allProducts: 'כל המוצרים',
      cart: 'עגלה',
    },
    home: {
      hero_title: 'בנוי עבור',
      hero_subtitle: 'העבודה הקשה',
      hero_description: 'מהונדס עבור הסביבות הקשות ביותר. הגנת פגיעה מאושרת ANSI Z87.1+ פוגשת יוקרה תעשייתית.',
      shop_btn: 'קנה את האוסף',
      watch_btn: 'צפה במבחן עומס',
      featured_title: 'המכות הכבדות',
      industry_title: 'קנה לפי תעשייה',
    },
    product: {
      addToCart: 'הוסף לעגלה',
      quantity: 'כמות',
      lensOption: 'אפשרות עדשה',
      color: 'צבע',
      buyBulk: 'תמחור קבלני',
      freeShipping: 'משלוח חינם',
      lifetimeWarranty: 'אחריות לכל החיים',
      returns: 'החזרות 30 יום',
    },
    checkout: {
      title: 'תשלום',
      contactInfo: 'מידע ליצירת קשר',
      shippingAddress: 'כתובת למשלוח',
      orderSummary: 'סיכום הזמנה',
      placeOrder: 'בצע הזמנה',
      subtotal: 'סכום ביניים',
      shipping: 'משלוח',
      total: 'סה"כ',
    },
    footer: {
      newsletter: 'הצטרף לצוות',
      newsletterDesc: 'קבל 10% הנחה בהזמנה הראשונה וגישה מוקדמת לשחרורים חדשים.',
      subscribe: 'הירשם',
    }
  }
};

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('he');
  const [direction, setDirection] = useState('rtl');

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/en')) {
      setLocale('en');
      setDirection('ltr');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    } else {
      setLocale('he');
      setDirection('rtl');
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'he';
    }
  }, []);

  const t = (path) => {
    const keys = path.split('.');
    let value = translations[locale];
    for (const key of keys) {
      value = value?.[key];
    }
    return value || path;
  };

  const switchLanguage = (newLocale) => {
    const currentPath = window.location.pathname;
    let newPath;
    
    if (newLocale === 'en') {
      newPath = currentPath.startsWith('/en') ? currentPath : `/en${currentPath}`;
      setDirection('ltr');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    } else {
      newPath = currentPath.replace(/^\/en/, '') || '/';
      setDirection('rtl');
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'he';
    }
    
    setLocale(newLocale);
    window.history.pushState({}, '', newPath);
    window.location.reload();
  };

  return (
    <LanguageContext.Provider value={{ locale, direction, t, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);