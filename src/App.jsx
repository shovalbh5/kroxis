import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { CartProvider } from '@/context/CartContext';
import { LanguageProvider } from '@/context/LanguageContext';

// kroxis.com now serves the Portolan landing page.
// The KROXIS store pages are still in src/pages but no longer routed;
// its admin stays at /admin so past orders and customers remain reachable.
import PortolanLanding from '@/pages/portolan/Landing';
import PortolanTerms from '@/pages/portolan/Terms';
import PortolanPrivacy from '@/pages/portolan/Privacy';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0B151A' }}>
        <div className="text-center">
          <span className="text-2xl tracking-widest" style={{ color: '#E2EBE8', fontFamily: 'Georgia, serif' }}>KROXIS · PORTOLAN</span>
          <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto mt-4" style={{ borderColor: 'rgba(226,235,232,.2)', borderTopColor: '#52C0A2' }}></div>
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
    <Routes>
      <Route path="/" element={<PortolanLanding />} />
      <Route path="/terms" element={<PortolanTerms />} />
      <Route path="/privacy" element={<PortolanPrivacy />} />
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
