import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import AccessibilityMenu from '../accessibility/AccessibilityMenu';

export default function SiteLayout() {
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