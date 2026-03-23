import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CartDrawer />
      <main className="flex-1 pt-[88px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}