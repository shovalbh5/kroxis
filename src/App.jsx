import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { CartProvider } from '@/context/CartContext';

import SiteLayout from '@/components/layout/SiteLayout';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Checkout from '@/pages/Checkout';
import Blog from '@/pages/Blog';
import BlogPost from '@/pages/BlogPost';
import Wholesale from '@/pages/Wholesale';
import ExitIntentPopup from '@/components/marketing/ExitIntentPopup';
import SalesPopup from '@/components/marketing/SalesPopup';
import { LanguageProvider } from '@/context/LanguageContext';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminCustomers from '@/pages/admin/AdminCustomers';
import AdminCoupons from '@/pages/admin/AdminCoupons';
import AdminBlog from '@/pages/admin/AdminBlog';
import AdminSettings from '@/pages/admin/AdminSettings';
import WhatsAppChat from '@/pages/admin/WhatsAppChat';
import LiveChatAdmin from '@/pages/admin/LiveChatAdmin';
import Warranty from '@/pages/Warranty';
import B2BPortal from '@/pages/B2BPortal';
import Contact from '@/pages/Contact';
import FAQ from '@/pages/FAQ';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import ReturnPolicy from '@/pages/ReturnPolicy';
import MyAccount from '@/pages/MyAccount';
import WhatsAppButton from '@/components/WhatsAppButton';
import FacebookPixel from '@/components/seo/FacebookPixel';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-secondary">
        <div className="text-center">
          <span className="font-heading text-2xl text-white tracking-widest">KROXIS</span>
          <div className="w-8 h-8 border-4 border-secondary-foreground/20 border-t-primary rounded-full animate-spin mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/wholesale" element={<Wholesale />} />
          
          {/* English language routes */}
          <Route path="/en" element={<Home />} />
          <Route path="/en/shop" element={<Shop />} />
          <Route path="/en/product/:id" element={<ProductDetail />} />
          <Route path="/en/checkout" element={<Checkout />} />
          <Route path="/en/blog" element={<Blog />} />
          <Route path="/en/blog/:slug" element={<BlogPost />} />
          <Route path="/en/wholesale" element={<Wholesale />} />
          <Route path="/warranty" element={<Warranty />} />
          <Route path="/b2b" element={<B2BPortal />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/returns" element={<ReturnPolicy />} />
          <Route path="/account" element={<MyAccount />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="whatsapp" element={<WhatsAppChat />} />
          <Route path="livechat" element={<LiveChatAdmin />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <ExitIntentPopup />
      <SalesPopup />
      <WhatsAppButton />
      <FacebookPixel />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <LanguageProvider>
          <CartProvider>
            <Router>
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </CartProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App