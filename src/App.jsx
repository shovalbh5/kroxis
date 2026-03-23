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
import { LanguageProvider } from '@/context/LanguageContext';

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
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <ExitIntentPopup />
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