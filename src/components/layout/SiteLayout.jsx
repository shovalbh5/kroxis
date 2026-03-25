import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import AccessibilityMenu from '../accessibility/AccessibilityMenu';

export default function SiteLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CartDrawer />
      <main id="main-content" className="flex-1 pt-[88px]" role="main">
        <Outlet />
      </main>
      <Footer />
      <AccessibilityMenu />
    </div>
  );
}