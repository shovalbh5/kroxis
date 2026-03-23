import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    nav: {
      home: 'Home',
      shop: 'Shop',
      allProducts: 'All Products',
      cart: 'Cart',
      blog: 'Blog',
      wholesale: 'Wholesale',
      byUse: 'By Use',
      byTech: 'By Technology',
    },
    topBar: 'Free Shipping Over ₪500 · Tactical Sunglasses for Field & Work',
    search: 'Search sunglasses...',
    hero: {
      badge: 'Tactical Sunglasses',
      title_1: 'Vision On',
      title_2: 'Another Level',
      description: 'Tactical sunglasses for field operators, military & fighters. Polarized lenses, impact-resistant, and comfortable for extended use in all field conditions.',
      shopBtn: 'Shop Now',
      videoBtn: 'Watch Product Video',
    },
    featured: {
      badge: 'Our Selection',
      title: 'Popular Products',
    },
    industry: {
      badge: 'Choose Your Battlefield',
      title_1: 'Ready For',
      title_2: 'Any',
      title_3: 'Environment',
      discover: 'Discover Now',
      items: [
        { label: 'Military & Combat', desc: 'Tactical sunglasses for combat and training conditions' },
        { label: 'Field & Operations', desc: 'Polarized lenses for extended fieldwork in the open' },
        { label: 'Work & Industry', desc: 'Durable sunglasses for challenging work environments' },
        { label: 'Tactical Fashion', desc: 'Aggressive style for everyday wear with full sun protection' },
      ],
    },
    trust: {
      items: [
        { value: '50,000+', label: 'Happy Customers' },
        { value: 'Lifetime', label: 'Frame Warranty' },
        { value: 'Free', label: 'Shipping Over ₪500' },
        { value: '24/7', label: 'Customer Service' },
      ],
    },
    product: {
      addToCart: 'Add to Cart',
      quickView: 'Quick View',
      bestSeller: 'Best Seller',
      bulkOrder: 'units → discount',
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
      newsletter: 'Subscribe to Newsletter',
      newsletterDesc: 'Get 10% off your first order and updates on new products',
      subscribe: 'Subscribe',
      enterEmail: 'Enter email',
      shopTitle: 'Shop',
      supportTitle: 'Support',
      qualityTitle: 'Quality',
      military: 'Military & Combat',
      field: 'Field & Operations',
      work: 'Work & Industry',
      allProducts: 'All Products',
      warranty: 'Warranty Registration',
      b2b: 'Business Portal',
      contact: 'Contact Us',
      faq: 'FAQ',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      returns: 'Return Policy',
      brandDesc: 'Tactical sunglasses for field operators, military & fighters. Protection, style and durability without compromise.',
      freeShipping: 'Free Shipping Over ₪500',
      navigateWaze: 'Navigate with Waze',
    },
    megaMenu: {
      industry: [
        { label: 'Military & Combat' },
        { label: 'Field & Operations' },
        { label: 'Work & Industry' },
      ],
      tech: [
        { label: 'Polarized Lenses' },
        { label: 'Photochromic' },
        { label: 'Blue Light Filter' },
        { label: 'Prescription Ready' },
      ],
    },
  },
  he: {
    nav: {
      home: 'בית',
      shop: 'חנות',
      allProducts: 'כל המוצרים',
      cart: 'עגלה',
      blog: 'בלוג',
      wholesale: 'סיטונאות',
      byUse: 'לפי שימוש',
      byTech: 'לפי טכנולוגיה',
    },
    topBar: 'משלוח חינם מעל ₪500 · משקפי שמש טקטיות לשטח ועבודה',
    search: 'חיפוש משקפי שמש...',
    hero: {
      badge: 'משקפי שמש טקטיות',
      title_1: 'ראייה ברמה',
      title_2: 'אחרת לגמרי',
      description: 'משקפי שמש טקטיות לאנשי שטח, צבא ולוחמים. עדשות מקוטבות, עמידות בפגיעות ונוחות לשימוש ממושך בכל תנאי שטח.',
      shopBtn: 'לחנות',
      videoBtn: 'סרטון המוצר',
    },
    featured: {
      badge: 'הנבחרת שלנו',
      title: 'המוצרים הפופולריים',
    },
    industry: {
      badge: 'בחר את שדה הקרב שלך',
      title_1: 'מוכן',
      title_2: 'לכל',
      title_3: 'סביבה',
      discover: 'גלה עכשיו',
      items: [
        { label: 'צבא ולוחמים', desc: 'משקפי שמש טקטיות לתנאי לחימה ואימונים' },
        { label: 'שטח ותפעול', desc: 'עדשות מקוטבות לעבודה ממושכת בשטח פתוח' },
        { label: 'עבודה ותעשייה', desc: 'משקפי שמש עמידות לסביבות עבודה מאתגרות' },
        { label: 'אופנה טקטית', desc: 'סטייל אגרסיבי ליומיום עם הגנה מלאה מהשמש' },
      ],
    },
    trust: {
      items: [
        { value: '50,000+', label: 'לקוחות מרוצים' },
        { value: 'לכל החיים', label: 'אחריות על המסגרת' },
        { value: 'חינם', label: 'משלוח מעל ₪500' },
        { value: '24/7', label: 'שירות לקוחות' },
      ],
    },
    product: {
      addToCart: 'הוסף לעגלה',
      quickView: 'צפייה מהירה',
      bestSeller: 'רב מכר',
      bulkOrder: 'יחידות → הנחה',
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
      newsletter: 'הירשמו לניוזלטר',
      newsletterDesc: 'קבלו 10% הנחה על ההזמנה הראשונה ועדכונים על מוצרים חדשים',
      subscribe: 'הרשמה',
      enterEmail: 'הזן אימייל',
      shopTitle: 'חנות',
      supportTitle: 'תמיכה',
      qualityTitle: 'איכות',
      military: 'צבא ולוחמים',
      field: 'שטח ותפעול',
      work: 'עבודה ותעשייה',
      allProducts: 'כל המוצרים',
      warranty: 'רישום אחריות',
      b2b: 'פורטל עסקי',
      contact: 'יצירת קשר',
      faq: 'שאלות נפוצות',
      terms: 'תקנון האתר',
      privacy: 'מדיניות פרטיות',
      returns: 'מדיניות החזרות',
      brandDesc: 'משקפי שמש טקטיות לאנשי שטח, צבא ולוחמים. הגנה, סטייל ועמידות ללא פשרות.',
      freeShipping: 'משלוח חינם מעל ₪500',
      navigateWaze: 'נווט עם Waze',
    },
    megaMenu: {
      industry: [
        { label: 'צבא ולוחמים' },
        { label: 'שטח ותפעול' },
        { label: 'עבודה ותעשייה' },
      ],
      tech: [
        { label: 'עדשות מקוטבות' },
        { label: 'פוטוכרומטיות' },
        { label: 'סינון אור כחול' },
        { label: 'מתאים למשקפי ראייה' },
      ],
    },
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

  const isRTL = direction === 'rtl';

  const switchLanguage = (newLocale) => {
    const currentPath = window.location.pathname;
    let newPath;
    
    if (newLocale === 'en') {
      newPath = currentPath.startsWith('/en') ? currentPath : `/en${currentPath === '/' ? '' : currentPath}`;
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
    <LanguageContext.Provider value={{ locale, direction, isRTL, t, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);